# Kotlin and Compose state

Purpose: Model and render UI state correctly in Jetpack Compose: state authoring and hoisting,
recomposition-safe deferred reads, side-effect selection, structured concurrency for UI
lifecycles, Flow/StateFlow/SharedFlow/Channel event modeling, value classes for UI domain types,
and exhaustive `when` for state rendering. This is not a general Kotlin language guide; Kotlin
doctrine here is scoped to what serves client UI code.

Read when:
- Writing or reviewing a Compose state holder, ViewModel, or the Kotlin async code backing
  Android UI state or one-shot UI events (navigation, snackbar, toast).
- Diagnosing a recomposition-performance or state-loss bug in Compose.

Skip when:
- The question is M3 visual/component conformance or a platform-integration API: read
  `compose.md`.
- The question is general-purpose Kotlin (backend services, non-UI concurrency, language style
  unrelated to rendering UI state), out of this file's scope entirely.
- The question is iOS/Swift concurrency: read `swift-concurrency-and-testing.md`.

Inputs: the UI state shape, the events/side effects the screen needs to emit or observe, the async
data sources feeding that state.

Produces: a state-holder architecture, correctly-keyed side effects, a Flow-based state/event
stream, and recomposition-safe (non-back-writing) Compose code.

## Contents
- State authoring and hoisting
- Deferred reads and recomposition correctness
- Recomposition performance and stability
- Side effects
- Structured concurrency for UI lifecycles
- Flow, StateFlow, SharedFlow, Channel: UI state and event modeling
- Value classes for UI domain types
- Exhaustive `when` for state rendering

## State authoring and hoisting

A bare `var` inside a `@Composable` function body (or a content lambda, for example inside
`Column { }`) resets on every recomposition and its writes are invisible. It must be
`var x by remember { mutableStateOf(...) }`: `remember { }` survives recomposition,
`mutableStateOf` triggers it. For collections, use `mutableStateListOf`/`mutableStateMapOf`, not
`remember { mutableStateOf(mutableListOf<X>()) }` plus `.add()`; mutating through `.add()` bypasses
the `State` setter and will not recompose.

`@ReadOnlyComposable` is bidirectional: add it only when the function body makes zero
non-read-only composable calls (no `Text`, `Box`, `remember`, or effects), and it cannot be added
to an `override` if the base declaration is not itself annotated.

Decision ladder for where UI state should live:
1. Local `remember`/`rememberSaveable` inside a single composable.
2. Hoisted to the lowest common ancestor, once sibling composables need it.
3. A plain `@Stable` state-holder class with a `remember...State()` factory, once multiple
   coordinated `remember` values or named operations (clear, submit, jumpToTop) are involved.
4. A screen-level ViewModel or component, once repository calls, persistence, or business rules
   are involved.

Do not extract a state-holder class for a single boolean or a trivial show/hide flag.

A state-holder class owns Compose-lifecycle UI objects (`LazyListState`, `FocusRequester`,
`PagerState`, `DrawerState`, `TextFieldState`). A suspend UI operation that needs a frame clock
(scroll or drawer animation) stays in a composition-scoped coroutine
(`rememberCoroutineScope()`/`LaunchedEffect`), never `viewModelScope`. Only serializable, minimal
values belong in `rememberSaveable` or a custom `Saver`, never runtime objects.

State-holder/UI split: a small state-holder composable collects ViewModel/component state and
effects and wires callbacks; a plain UI composable takes only an immutable `UiState` plus lambdas
and renders. This split is what makes a screen previewable and testable across
Android/Desktop/TV/KMP targets without constructing the state holder.

## Deferred reads and recomposition correctness

"Back-writing": writing snapshot-backed state in a phase that invalidates an earlier phase.
Composition-to-composition: mutating a remembered map or list inside the composable body on every
pass. Layout-to-composition: a sibling reading an `onSizeChanged`-captured height back through
`Modifier.height(state.dp)` inside its own composition. Fix by computing read-only merges with
`remember(keys) { derivedSnapshot }`, or by capturing the value in a layout callback and applying
it through a custom `Modifier.layout { }` constraint-decoration helper, so only layout is
invalidated, never composition.

Frame-rate state (scroll offset, animation value, gesture/drag position) read inside a composable
body invalidates composition on every frame. Read it instead inside a layout- or draw-phase,
block-form modifier: `Modifier.offset { IntOffset(...) }`, not `.offset(x = value)`;
`Modifier.graphicsLayer { translationY = ... }`, not the property-argument form; or `drawBehind`.
When a fast-changing value must cross a composable boundary, pass a provider lambda (for example
`scrollOffsetProvider: () -> Int`) instead of a snapshot value; the naming convention is a
`Provider` suffix.

## Recomposition performance and stability

Confirm the Kotlin/Compose-compiler version and whether strong skipping is enabled (default since
Kotlin 2.0.20+): restartable composables become skippable even with unstable parameters unless
explicitly opted out. Stable parameters compare by `equals`, unstable parameters by `===`.
Generate compiler reports with `composeCompiler { reportsDestination = ...; metricsDestination =
... }` gated behind a Gradle property, then build with `-PcomposeReports=true` on a
release/non-debuggable variant; report files are `<module>-classes.txt`, `-composables.txt`,
`-composables.csv`, `-module.json`.

Stability fix ladder: prefer `kotlinx.collections.immutable` (`ImmutableList`/`ImmutableSet`) over
raw collection interfaces at UI-state boundaries, then `@Immutable`/`@Stable` only when truthful,
then a `stabilityConfigurationFiles` list naming specific third-party types you can actually
promise are immutable (for example `java.time.*`, never `java.util.Date`); for lazy-item churn,
hoist or `remember(item.id) { ... }` per-item lambdas and derived booleans rather than blindly
annotating the model.

Recomposition triage runs on three axes: parameter stability/skipping, which phase reads
frame-rate `State`, and back-writing across phases. Investigation order: reproduce one transition,
check back-writing first if lazy items spike unchanged, check deferred reads if counts climb every
frame during scroll/animation, check stability/compiler reports last. A named false lead:
`remember(index) { isFirstRow(index) }` gives no skipping benefit if the inputs are unchanged.

## Side effects

Effect-API selection: publish state to non-Compose code after every successful recomposition with
`SideEffect`; register/unregister a listener with `DisposableEffect(keys)`; run suspending,
deferred one-shot work with `LaunchedEffect(keys)`; run suspending work triggered by a user event
with `rememberCoroutineScope()`; convert a snapshot read into a `Flow` with `snapshotFlow { }`
inside a `LaunchedEffect`.

`LaunchedEffect(Unit)` hides a changing input; key the effect by the value whose lifecycle it
should follow (`userId`, not `Unit`, not the whole `viewModel`/`state` object).
`rememberUpdatedState` keeps a callback fresh inside a long-lived, non-restarting effect; it is not
a substitute for correct keys, and reading its delegate eagerly inside a `remember { }` block only
snapshots the value once and never refreshes it, so key the `remember` on the changing value
instead.

Every `DisposableEffect` registration needs a matching `onDispose` cleanup. Avoid "event flag"
state (`shouldShowSnackbar = true`) purely to trigger a `LaunchedEffect`; call
`rememberCoroutineScope()` directly in the click callback instead.

## Structured concurrency for UI lifecycles

A stored `CoroutineScope` held as a class property is a hard anti-pattern: once that scope is
cancelled, every future `.launch` on it silently completes as cancelled, with no exception and no
log. The fix is almost always to make the API `suspend` and let the caller own the scope. The one
exception is a UI state-holder (ViewModel or component) absorbing a non-suspending UI event
(`onClick`) onto a lifecycle-bound scope (`viewModelScope`), and it must satisfy all three
conditions at once: it is a state-holder for UI, the scope is lifecycle-bound, and the caller is
literally a UI event.

`runBlocking` inside suspend-capable app code blocks the thread and breaks structured concurrency.
It is legitimate only at `main`, at a Java-interop synchronous boundary, and, uniquely, inside
`android.content.ContentProvider` member functions where no suspending alternative exists. In
tests, use `runTest` (virtual time), not `runBlocking`.

Catching `CancellationException` (directly, or via a broad `Exception`/`Throwable` catch) without
rethrowing silently un-cancels the coroutine. Always rethrow it, or guard with `ensureActive()` or
an explicit `is CancellationException` check.

## Flow, StateFlow, SharedFlow, Channel: UI state and event modeling

`StateFlow`: state that both async collectors and synchronous `.value` readers need. Pair with
`SharingStarted.Eagerly` when `.value` freshness matters; `WhileSubscribed` can serve a stale or
initial `.value` while disconnected.

`SharedFlow`: hot, multi-subscriber broadcast with no synchronous `.value` need.

Single-consumer, exactly-once events (navigation, snackbar): prefer
`Channel(BUFFERED).receiveAsFlow()` over a no-replay `MutableSharedFlow`, which silently drops an
emission if no collector is active. A `Channel`'s `receiveAsFlow()` is fan-out (each event reaches
exactly one collector), not broadcast.

Never invent a fake sentinel default (`NoUser`, `EmptyUser`) to give a `MutableStateFlow` a forced
initial value. Model absence explicitly, or defer exposing the flow until real data exists
("phasing").

Mutate with `.update { current -> current.copy(...) }`, never `.value = .value.copy(...)`; the
read/modify/write form loses concurrent updates. Keep the update lambda pure and fast, since it
can retry; build expensive or derivation-independent values outside it.

## Value classes for UI domain types

Use `@JvmInline value class` for a single-field, domain-meaningful wrapper (`UserId`,
`EmailAddress`, `Percentage`) instead of a single-field `data class` or a bare primitive/type
alias. Exceptions: custom equality is needed (a value class's equality delegates to the wrapped
value's `equals`, so, for example, a case-insensitive string wrapper is wrong as a value class), or
the type is used as a generic type argument or is nullable in a proven hot path (boxing).
Serialization differs by shape: `@Serializable data class A(val value: String)` encodes as an
object; a value class encodes as the bare wrapped value.

## Exhaustive `when` for state rendering

Name the single subject value first. Use a guard condition (`is Event.Message if
event.isUnread -> ...`, Kotlin 2.x+) only when a branch's primary match needs one branch-local
extra predicate, and only when the `when` has a subject and remains exhaustive; a guard branch must
precede its unguarded fallback for the same primary condition. Never add `else` to a closed-domain
`when` (an enum, a sealed hierarchy, a `Boolean`) purely to silence the compiler; reserve `else`
for genuinely open domains, such as a server-provided string or status code.

<!-- sources: chrisbanes/skills (compose-state-authoring, compose-state-hoisting,
compose-state-holder-ui-split, compose-state-deferred-reads, compose-modifier-and-layout-style §7,
compose-side-effects, compose-recomposition-performance, compose-stability-diagnostics,
kotlin-coroutines-structured-concurrency, kotlin-flow-state-event-modeling,
kotlin-types-value-class, kotlin-control-flow; Apache-2.0) via scout-github -->
