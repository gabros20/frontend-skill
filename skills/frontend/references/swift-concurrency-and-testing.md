# Swift concurrency and testing

Purpose: Swift concurrency correctness (async/await, actors, structured concurrency, Swift 6
strict-concurrency diagnostics) and Swift Testing's modern test-writing APIs for iOS-native code.

Read when:
- Writing or reviewing async/await, actor, `Task`, or `AsyncStream` code in Swift.
- Writing new tests, or migrating XCTest tests, in a Swift codebase.
- Diagnosing a Swift 6 strict-concurrency compiler error.

Skip when:
- The code is SwiftUI view/state/navigation-specific — see `swiftui.md`.
- The platform is not iOS/Swift.
- The test target is UI tests — Swift Testing does not cover UI tests, XCTest is still required.

Inputs: Swift/SwiftUI code using concurrency, or an existing test suite to write or migrate.
Produces: concurrency-safe async code (no actor-reentrancy bugs, no continuation leaks, correct
cancellation) and Swift Testing test code using current APIs.

## Contents
- Actor reentrancy · Isolation and @MainActor
- Structured/unstructured concurrency · Cancellation
- AsyncStream, continuations, and GCD migration
- Swift 6.2 changes
- Diagnostic → fix map and review hotspots
- Swift Testing: core rules, async, and traits
- XCTest migration map · Testing doctrine

## Actor reentrancy

The single most common concurrency bug in LLM-generated Swift: after any `await` inside an actor,
every prior assumption about that actor's state is invalid — another call may have run during the
suspension.

Canonical bug:
```swift
if items[key] == nil { items[key] = try await download(key) }
return items[key]!
```
Two concurrent callers can both see `nil`, both download, and the force-unwrap can crash if a third
caller clears the key mid-flight.

Fix: capture the awaited result into a local before writing state; never re-read shared state after
an `await` assuming it's unchanged. To de-duplicate concurrent callers of the same key, store
in-flight `Task` handles in a dictionary and have late callers `await` the existing task.

## Isolation and @MainActor

- Global/static mutable state needs explicit isolation: `@MainActor` if it belongs to main-actor code, or `@unchecked Sendable` only if actually protected by locks/queues the compiler can't see.
- `@MainActor` propagates to subclasses, through actor-isolated property-wrapper storage, and to a type conforming to a `@MainActor` protocol (e.g. SwiftUI's `View`) — but **not** into closures passed to non-isolated functions.
- `isolated` parameters accept any actor without hard-coding one: `func updateUI(on actor: isolated MainActor)`. `assertIsolated()` halts debug builds off the expected executor — debugging aid only, compiled out of release.
- Flag custom actors that mostly forward work or own little mutable state — probably unnecessary.

## Structured and unstructured concurrency

- `async let` for a fixed number of independent, differently-typed operations; task groups (`withTaskGroup`/`withThrowingTaskGroup`) for a dynamic number of same-type operations. Never spawn `Task {}` in a loop — no cancellation propagation, no way to collect results, silent leaks on failure.
- `withDiscardingTaskGroup` (5.9+) for fire-and-forget child tasks. To limit concurrency: launch an initial batch of N, `addTask` a replacement each time one completes. For partial-results-on-error, catch inside each child task and return a `Result`.
- `Task {}` inherits the caller's actor isolation; `Task.detached {}` does not and is rarely correct. Code smells: `Task {}` inside `.onAppear()` (use `.task()` instead); wrapping a function in `Task {}` when the caller could just be `async`; ignoring a throwing `Task {}` closure's error.

## Cancellation

- Cooperative — setting cancelled does nothing unless checked. `try Task.checkCancellation()` (throws) vs `Task.isCancelled` (Bool, cleanup contexts). Parent cancellation propagates to structured children automatically; `Task {}`/`Task.detached {}` need explicit `.cancel()` via a stored handle; `.task()` auto-cancels on view disappearance.
- Broken patterns: catching/ignoring `CancellationError` instead of filtering it out before handling real errors; forgetting `.cancel()` on a previous stored task before starting a new one and in `deinit`; CPU-bound loops with no `await` never see cancellation without an explicit check.

## AsyncStream, continuations, and GCD migration

- Prefer `AsyncStream.makeStream(of:)` over the closure-capturing initializer. A continuation must finish **exactly once** — `AsyncStream.Continuation` tolerates a double-finish, `CheckedContinuation` does not; finish inside `onTermination`. Default buffering `.unbounded` — specify `.bufferingNewest(n)`/`.bufferingOldest(n)` for high-throughput producers.
- `withCheckedContinuation`/`withCheckedThrowingContinuation` must resume exactly once on every path. Default to the **checked** variant everywhere, including production; reach for `withUnsafe...` only after profiling proves a bottleneck.
- GCD migration: `DispatchQueue.main.async` → `@MainActor` function + `await`; `DispatchQueue.global().async` → a Swift 6.2 `@concurrent` function (plain `async` alone doesn't offload CPU work) or a task group; a serial `DispatchQueue` protecting state → `actor`. Combine → AsyncSequence: `sink{}`→`for await`; `PassthroughSubject`→`AsyncStream` via `makeStream(of:)`. Don't modernize working completion-handler code unprompted.

## Swift 6.2 changes

Verify these against the active toolchain before relying on them for an older deployment target.

- A module can opt into main-actor-by-default isolation — a missing explicit `@MainActor` may already be implicit.
- `nonisolated` async functions now stay on the caller's actor by default (changed from pre-6.2's automatic hop-off) — old code needing the offload now requires explicit `@concurrent`, reserved for CPU-heavy work, not ordinary async I/O.
- `isolated deinit`: an actor-isolated class's `deinit` is **not** isolated by default (runs off-actor even for `@MainActor` classes) — mark `isolated deinit` to safely touch actor-protected state during teardown.

## Diagnostic → fix map and review hotspots

| Diagnostic | Fix (in order) |
|---|---|
| "Sending 'x' risks causing data races" | region-based isolation → `sending` parameter → `Sendable` type → `nonisolated(nonsending)` → last resort `@unchecked Sendable` |
| "Static property 'x' is not concurrency-safe" | `@MainActor`, or `Sendable` if truly immutable, or `nonisolated(unsafe)` for compiler-unprovable-but-actually-immutable state |
| "Capture of 'x' with non-sendable type in `@Sendable` closure" | make it `Sendable`, restructure to avoid the capture, move work onto the same actor, or `sending` |
| "Conformance of 'X' to 'Y' crosses into main actor-isolated code" | remove incidental type-level isolation, or scope the conformance to MainActor |
| "Expression is 'async' but not marked with 'await'" | add `await`, or wrap in `Task {}` only if the caller can't be made async |

`@unchecked Sendable` legitimate only for types with real internal locking or actor-protected-but-inexpressible state — not a shortcut around region-based isolation.

Grep targets: `DispatchQueue`, `Task.detached`, `Task {}` in a loop (should be a task group), `withCheckedContinuation` (every path resumes once), closure-based `AsyncStream` init, `@unchecked Sendable`, `MainActor.run {}` (often redundant), actors (reentrancy: read→await→write is suspect), force-unwrap after `await` inside an actor.

## Swift Testing: core rules, async, and traits

Swift Testing does **not** cover UI tests — XCTest is still required there.

- Prefer structs over classes for suites. `@Suite` unnecessary unless naming or attaching traits — any type with `@Test` methods is automatically a suite. No `setUp()`/`tearDown()` — use `init()`/`deinit()`; suite initializers take no parameters. Tests run randomly and in parallel by default.
- Parameterized tests take at most two argument collections; two collections form a **Cartesian product**, not a pairwise zip — pass `zip(collection1, collection2)` for pairwise.
- A test with no reached `#expect`/`#require` is assumed passed. Never negate with `!` inside `#expect`/`#require` — write `#expect(x == false)`, not `#expect(!x)`. `withKnownIssue` expects a failure and fails if none occurs; `isIntermittent: true` flips that for flaky tracking.
- `.serialized` only orders a parameterized test's own argument cases — never arbitrary tests. `confirmation(expectedCount:)` requires all tested async work to finish before the closure returns — a fire-and-forget internal `Task {}` makes it finish early and fail the count; make the method `async`, or return the `Task` handle to `await`.
- Time limits use `.timeLimit(.minutes(n))` — `.seconds()` doesn't exist; the shorter of suite/test-level limits wins.
- Legacy callback code: wrap with `withCheckedContinuation` in the test, don't modernize production code without permission. Mock networking via an injected `URLSessionProtocol`-conforming type — never live networking in unit tests. Never `Task.sleep`/fixed delays to "wait for something" — await the real operation instead.

## XCTest migration map

| XCTest | Swift Testing |
|---|---|
| `XCTAssertEqual(a,b)` | `#expect(a == b)` |
| `XCTAssertThrowsError` | `#expect(throws:)` |
| `XCTUnwrap(x)` | `try #require(x)` (also works on any Boolean) |
| `XCTFail("msg")` | `Issue.record("msg")` |
| `XCTAssertIdentical(a,b)` | `#expect(a === b)` |

No built-in floating-point tolerance — use Swift Numerics' `isApproximatelyEqual(to:absoluteTolerance:)` (ask before adding it). Migration: keep type/method names (minus `test` prefix; class→struct), convert assertions, add `#require` preconditions, finish with traits (`.timeLimit()`, `.enabled(if:)`, `.tags()`) replacing skip conventions.

## Testing doctrine

- FIRST bar: Fast, Isolated, Repeatable, Self-verifying, Timely. Generate happy-path + boundary + invalid-input (+ concurrency where relevant) cases per function.
- Never test SwiftUI views directly (unpredictable `@State` behavior) — test view models/`@Observable` classes instead. Expose hidden dependencies (`URLSession`, `UserDefaults`) via injected, default-valued, ideally protocol-typed parameters so tests can substitute mocks.
- `#require` throws and stops the test — use for start-of-test preconditions/unwraps; `#expect` for the actual assertions, always naming the specific expected error type, never a bare `Error.self`.

<!-- sources: swift-concurrency-pro (MIT, Paul Hudson/twostraws); swift-testing-pro (MIT, Paul Hudson/twostraws) -->
