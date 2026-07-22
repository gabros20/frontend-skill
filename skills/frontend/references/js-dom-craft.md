# JS DOM craft

Purpose: vanilla JavaScript/DOM mechanics — event handling, cleanup, timing, measurement, and
cross-tab state — the browser-API layer beneath any framework's abstraction over it.

Read when:
- Wiring event delegation, universal cleanup for listeners/observers/fetch, or timing-sensitive
  DOM work (microtask/macrotask/rAF ordering).
- Comparing `structuredClone` against JSON or a hand-rolled clone, or debugging a `ResizeObserver`/
  `IntersectionObserver` wrapper that tears itself down incorrectly.
- Building clipboard, `FormData`, or cross-tab sync without a library, or choosing between
  `textContent`/`innerText`, `input`/`change`/`beforeinput`, or `key`/`code`.

Skip when:
- React's hook-wrapping of an observer (dependency-array/ref-churn correctness):
  `react-components-and-state.md`; this file owns the raw browser API.
- Layout-thrashing batching and virtualization: `performance.md`.
- Focus trap, `inert`, the Popover API: `accessibility.md`.
- `sendBeacon`/RUM reporting: `performance.md`. WebSocket/SSE selection:
  `web-platform-runtime.md`. IME composition and grapheme-safe truncation: `i18n.md`.

Inputs: the DOM/browser-API mechanic needed and any cleanup or timing constraint around it.

Produces: correct, leak-free vanilla JS against the DOM and browser APIs.

## Contents
- Event delegation, AbortController cleanup, passive listeners
- Timing: microtask vs. macrotask vs. rAF
- `structuredClone` vs. alternatives
- Observers: Resize/Intersection/Mutation
- `WeakMap` and `EventTarget` patterns
- FormData, URL, clipboard
- `textContent` vs. `innerText`; DOM measurement
- Scrolling, input, and key events
- Cross-tab sync; lifecycle flush
- Misc idioms and foot-guns

## Event delegation, AbortController cleanup, passive listeners

Attach one listener on a common ancestor; use `event.target.closest(selector)` to walk up to the
actual delegate target, robust against a click landing on an inner span or icon. Pair with a
declarative action map: read `element.dataset.action`/`.dataset.id` inside the handler and
dispatch via a lookup object, instead of one handler per element.

One `AbortController`/signal pair is a single cancellation token across everything that accepts a
signal, not just `fetch`: `addEventListener(type, fn, { signal })` auto-detaches on abort,
`fetch(url, { signal })` cancels the request, custom async logic checks `signal.aborted`.
`AbortSignal.timeout(ms)` self-aborts after `ms`, no manual `setTimeout` wiring;
`AbortSignal.any([sig1, sig2])` combines multiple abort sources into one. Prefer one shared signal
over separate manual teardown per resource — what must be undone on unmount is
`state-and-data.md`'s principle; this is the mechanism it wires to.

`{ passive: true }` on a listener that never calls `preventDefault()` lets the browser start
scrolling immediately instead of blocking on the handler first — a real perf fix, not a lint
suggestion. Never set it on a listener that does call `preventDefault()`. Touch-specific
`touch-action` scoping lives in `web-platform-runtime.md`'s Gesture section — the same rule
applies there to `touchstart`/`wheel`.

## Timing: microtask vs. macrotask vs. rAF

Worked ordering: sync code always finishes before any scheduled async callback runs. The
microtask queue (Promise reactions, `queueMicrotask`) drains completely before the next macrotask
(`setTimeout`, DOM events) — a `setTimeout(fn, 0)` before a `.then()` chain still logs after it,
since the drain happens between every macrotask, not once overall. `requestAnimationFrame` runs
after the microtask queue drains and before that frame paints — the right spot for layout work
synced to paint. Pick by intent: `queueMicrotask` to defer until sync code finishes but before
rendering/the next macrotask; `requestAnimationFrame` for layout reads/writes; `setTimeout(fn, 0)`
only to yield past rendering and pending microtasks. A self-re-queuing microtask chain can starve
rendering entirely, since it never yields to a macrotask.

## `structuredClone` vs. alternatives

| | `structuredClone` | `JSON.parse(JSON.stringify())` | shallow spread / hand-rolled |
|---|---|---|---|
| Functions | throws `DataCloneError` | silently dropped | copies the reference, not a clone |
| `Date`/`Map`/`Set`/`RegExp` | preserved correctly | `Date`→string, others→`{}` | often `{}` |
| DOM nodes | throws `DataCloneError` | not cloneable | not cloneable |
| Circular refs | handled natively | throws `TypeError` | throws `RangeError` (stack overflow) |
| Prototype chain | not preserved | not preserved | preserved only if truly shallow |
| Getters/setters, Symbols, private fields | not preserved | not preserved | varies |

Default to `structuredClone` unless the object is confirmed JSON-safe and hot-path perf is
measured; the JSON round-trip is faster but fails silently above.

## Observers: Resize/Intersection/Mutation

Same lifecycle shape across all three: construct with a callback (`new ResizeObserver(cb)` /
`new IntersectionObserver(([entry]) => {...}, options)` / `new MutationObserver(cb)`),
`.observe(target[, options])`, then `.disconnect()` or `.unobserve(target)` on teardown.
`IntersectionObserver`'s callback always receives an array of entries, even for one target —
destructure `[entry]`. Two gotchas recur in every framework wrapper, not only React's: (1) a
fresh options object literal on every render/call recreates the observer whenever it sits in a
dependency check — hoist it to a stable reference; (2) cleanup reading the observed node from a
ref that may have changed since `observe()` was called unobserves the wrong node — capture it in
a local const at observe-time instead. Restrain `MutationObserver` to the narrowest
`subtree`/`childList`/`attributes` combination needed; over-broad becomes its own perf problem.

**IntersectionObserver for media.** `threshold: 1` rarely fires for tall videos that never reach
100% visibility — use ~0.25–0.5 for play. Separate load vs play policies: positive `rootMargin`
(~200–400px, e.g. `200px 0px` for images) starts the fetch before the element enters the
viewport; pause when `intersectionRatio === 0`. One options bag for both "prefetch early" and
"must be fully visible to play" causes half-visible autoplay confusion — split observers or gate
on ratio explicitly. The initial callback batch reports current state (often
`isIntersecting: false`), not only later changes — handle already-visible targets on mount, and
gate work on `entry.isIntersecting` / ratio so observe-time fire does not start loads as if
"entered." Multiple thresholds fire multiple times per element; unobserve after a successful
one-shot load; keep a small state machine (`idle → loading → loaded`). Rapid scroll can
double-fire enter/exit; debounce teardown (~100–120ms), re-check still out of view, then
pause/reset, and clear the pending timer if the target re-intersects.

**Abort in-flight asset loads on leave.** IO can trigger a fetch that continues after the user
scrolls away; the response still arrives, decodes, and may assign `src` → bandwidth/memory burn
and late layout work. Native `loading=lazy` cancels less aggressively than a custom path you
control. Pair IO with `AbortController`: on exit before settle, `abort()` and do not assign
`src`; re-observe (or re-arm a fresh controller) when the element returns.

**ResizeObserver loop.** `ResizeObserver loop completed with undelivered notifications` means the
callback caused another size change in the same frame. Often benign (extensions such as LastPass
also trigger it; Chrome grew stricter around 132+), but real loops thrash layout and must be
fixed. Do not write width/height/styles that re-trigger the observed element's size in the same
callback turn; batch DOM writes via `requestAnimationFrame`. When measuring layout that must not
self-mutate (tables, self-sizing hosts), observing a 0-height sentinel child is sometimes safer
than observing the element whose size you rewrite.

## `WeakMap` and `EventTarget` patterns

Keying a plain `Map` by a DOM element keeps that element alive even after removal from the DOM,
since `Map` holds a strong reference — a classic SPA leak. A `WeakMap` keyed the same way holds
the reference weakly: once nothing else references the element, the GC reclaims it with no
manual deregistration. Trade-off: not iterable, no `.size`. Shape:
`const elementData = new WeakMap(); elementData.set(el, { handler, cleanup });`.

`class Signal extends EventTarget` is a dependency-free reactive primitive: store a value in a
private field, `dispatchEvent(new CustomEvent('change', { detail: value }))` on change, consumers
`addEventListener('change', ...)`. Short-circuit redundant dispatches when the next value equals
the current one. `EventTarget` (unlike `HTMLElement`) works identically in Node, so this is
portable without a library. `CustomEvent` needs `bubbles: true` to reach ancestors and
`composed: true` to cross a shadow-DOM boundary — both default `false`, a silent trap when the
signal lives inside a web component.

## FormData, URL, clipboard

`Object.fromEntries(new FormData(formEl))` turns a live form into a plain object in one line.
Trap: it keeps only the *last* value for a repeated `name` — checkboxes/multi-selects sharing a
name silently lose all but one value; use `formData.getAll(name)` instead. Query-string round
trip: `Object.fromEntries(new URLSearchParams(search))` to parse, `new URLSearchParams(obj)` to
serialize.

Clipboard write: guard `navigator?.clipboard?.writeText`, then
`navigator.clipboard.writeText(str)`. Legacy fallback, only where unavailable: create an
off-screen `<textarea>`, set its value, `select()` it, run `document.execCommand('copy')`, remove
it, then restore the user's prior selection (save `getSelection().getRangeAt(0)` beforehand,
`addRange()` back after) so the trick doesn't clobber whatever was selected. Both paths only work
as the direct result of a user gesture (a click handler).

## `textContent` vs. `innerText`; DOM measurement

`Node.textContent` returns the raw text of all descendants including hidden ones
(`display: none`, `<style>`, `<script>`), no whitespace normalization, no `<br>`→newline
conversion, and never triggers layout. `HTMLElement.innerText` approximates what's visually
rendered but **reading or setting it forces a layout reflow**, since it must resolve CSS to know
what's hidden. Default to `textContent`; reserve `innerText` for visual-rendering fidelity, and
cache it if reused.

Three different "height" numbers, pick deliberately: `el.offsetHeight` (border-box, includes
border+padding), `el.clientHeight` (content+padding, excludes border/scrollbar),
`el.getBoundingClientRect().height` (subpixel-accurate, respects transforms). Scrollbar width via
subtraction: `window.innerWidth - document.documentElement.clientWidth`. Document-relative offset
accounting for scroll and root border: `rect.top + window.scrollY -
document.documentElement.clientTop` (same pattern for left/`clientLeft`).

## Scrolling, input, and key events

`el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })` scrolls to an
element without hand-rolled offset math; `block`/`inline` default to `'start'`, which
over-scrolls an element already partly visible, so pass `'nearest'` to just clear an obstruction.
Pair with `scroll-margin-top`/`-bottom` sized to a sticky header/footer — the CSS side of that
pairing, including the focus-not-obscured rule it supports, is `accessibility.md`'s.

`input` fires on every value change (keystroke, paste, dispatched programmatic edit); `change`
fires only on commit (blur for text, immediately for checkboxes/radios/selects). Use `input` for
live validation/character counts, `change` for "the final value was accepted." `beforeinput`
fires before the DOM value updates and is cancelable — the only reliable way to intercept or
reject an edit before it renders, unlike `keydown`, which misses IME composition, paste, and
autocomplete-inserted text.

`event.key` gives the produced character/logical key name, locale/layout-aware (`"a"` vs. `"A"`
vs. `"Enter"`); `event.code` gives the physical key position regardless of layout (`"KeyA"` on an
AZERTY keyboard). Use `key` for layout-respecting text/shortcut logic; `code` for
physical-position logic (WASD-style controls).

## Cross-tab sync; lifecycle flush

`BroadcastChannel` and the `storage` event solve different problems, not interchangeable
defaults. `BroadcastChannel`: any same-origin tab/window/worker on the same named channel posts/
receives structured-clone payloads; pure in-memory, fire-and-forget — a tab not open when the
message sends never receives it. `storage` fires in every *other* same-origin tab when
`localStorage` changes (never the writing tab); a tab opened after the write can still read the
current value on load despite missing the event. Use `BroadcastChannel` for live signals to
already-open tabs; use `storage` (or `BroadcastChannel` plus a `localStorage` read on load) when a
tab opened later must still learn current state.

Flush analytics or unsaved state on tab hide via `visibilitychange`
(`visibilityState === 'hidden'`) and/or `pagehide`, paired with `sendBeacon()` — never
`beforeunload`/`unload`: both unreliable on mobile, and registering either disables the
back/forward cache. See `performance.md`'s Caching strategy section for bfcache mechanics and the
`sendBeacon`/RUM shape this pairs with; this file owns only the event-selection rule.

## Misc idioms and foot-guns

- `object?.a?.[0]?.b?.c ?? 1` — optional chaining composes with bracket access; `??` falls back
  only on null/undefined, not falsy `0`/`''`.
- `arr.at(-1)` reads the last element via negative index; returns `undefined` on an empty array
  rather than throwing.
- `.includes()` uses SameValueZero and finds `NaN`; `indexOf(x) > -1` does not
  (`[NaN].indexOf(NaN) === -1`) — not interchangeable when `NaN` is possible.
- `.sort()` with no comparator sorts by string conversion (`[10, 1, 3].sort()` → `[1, 10, 3]`) —
  always pass `(a, b) => a - b` for numeric sorts. `toSorted()`/`toReversed()` return a new array
  instead of mutating; prefer them where a copy is already intended.
- `parseInt(str)` without a radix stops at the first uninterpretable character
  (`parseInt('42abc')` → `42`) rather than failing — always pass radix 10 for user input.
- `Object.groupBy(array, keyFn)` replaces a manual reduce/lodash `groupBy`; verify current runtime
  support first, no legacy-engine fallback exists.
- `0.1 + 0.2` → `0.30000000000000004` is float precision, not a bug — format user-facing numbers
  through `Intl.NumberFormat`, never raw string concatenation.

<!-- sources: camsong/You-Dont-Need-jQuery (MIT) - measurement, insertion, readyState guard;
you-dont-need/You-Dont-Need-Lodash-Underscore (MIT) - groupBy, optional-chaining deep-get, at/
includes; denysdovhan/wtfjs (WTFPL) - sort() default, parseInt radix; Chalarangelo/
30-seconds-of-code (CC BY 4.0, credit Chalarangelo/30-seconds-of-code) - structuredClone table,
AbortController, clipboard, FormData/URL, textContent-vs-innerText, passive-listener,
Resize/IntersectionObserver lifecycle; lydiahallie/javascript-questions (MIT) - microtask/
macrotask ordering; scout-js-x.md (X posts + re-expressed articles, no verbatim reuse) -
AbortSignal.timeout/any, WeakMap pattern, BroadcastChannel vs storage, visibilitychange/pagehide/
sendBeacon reliability (nicj.net), 0.1+0.2/Intl.NumberFormat; MDN - scrollIntoView, input/change/
beforeinput, key vs code, IntersectionObserver options; web-media-perf C-web-26–29 - media IO
rootMargin/threshold split, AbortController on leave, initial callback / double-fire, ResizeObserver
loop (rAF batch, sentinel); TrackJS/Sentry RO loop reports; local-specialists C-16 debounce exit
~120ms (re-expressed). -->
