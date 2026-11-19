# UI motion

Purpose: implementation of interface and component motion — micro-interactions, enter and exit,
height and layout animation, springs, gestures and drag, in-code choreography — and the traps that
make motion janky, stuck, or inaccessible. Consumes design's motion spec; never invents its values.

Read when:
- Animating a state change, a popover, dialog, drawer, toast, or menu entering or leaving, an
  accordion or list height, a layout change, an icon swap, or a rolling number.
- Implementing drag, swipe, sheets, pointer followers, or any pointer-driven gesture.
- Porting spring values between libraries, or diagnosing jank, a stuck drag, or a hover flicker.
- Removing, auditing, or verifying motion in an existing codebase.

Skip when:
- Choosing durations, curves, spring feel, choreography, or whether to animate at all: `design`
  `motion.md`.
- Scroll-linked motion, scroll reveals and entrances, page transitions, smooth scroll:
  `scroll-animation`.
- The reduced-motion floor and pause-control rule themselves: `accessibility.md` (Reduced motion).
- React Native / Expo motion: `react-native.md` (Gesture and animation threading). View Transitions
  API wiring: `web-platform-runtime.md`.

Inputs: design's motion spec or the project's motion tokens, the stack and any installed motion
library, the target devices.

Produces: interruptible, compositor-friendly motion code with a complete reduced-motion path,
verified frame by frame.

## Contents
- Pick the cheapest driver
- Enter and exit
- Height and layout changes
- Springs and interruption
- Gestures and drag
- Hover and press
- Motion performance traps
- Animated text and numbers
- Scripted loops and demos
- SVG motion
- Removing and importing motion
- Verify motion

## Pick the cheapest driver

Durations, curves, and spring parameters come from `design` `motion.md` ("Canonical scale",
"Springs and gestures") or the project's motion tokens. Wire them as tokens; five near-identical
hand-typed `cubic-bezier()`s are a consolidation finding. Climb only as far as the motion needs:

| Need | Driver |
|---|---|
| State toggle (hover, open, selected) | CSS transition |
| A just-inserted or just-shown element | `@starting-style` |
| Predetermined loop or sequence | CSS `@keyframes` |
| Programmatic, interruptible, no dependency | WAAPI `element.animate()` |
| Velocity springs, shared layout, unmount exits, gestures | a motion library |

Anything rAF-driven (GSAP, a library's layout animation, a motion value read each frame) shares
the main thread; CSS and WAAPI animations of `transform` and `opacity` can run on the compositor.
Motion that plays during navigation, fetching, or hydration belongs in CSS or WAAPI: that is
exactly when a rAF-driven indicator drops frames. Whether a library's `x`/`y`/`scale` shorthands
are accelerated depends on its version (Motion accelerates time-based shorthands from 14.2;
per-frame motion-value bindings never are), so check the installed version before rewriting
working code. Library APIs live in the library's own docs or packaged skill.

## Enter and exit

```css
dialog {
  opacity: 0;
  transition: opacity var(--dur-exit), display var(--dur-exit) allow-discrete,
              overlay var(--dur-exit) allow-discrete;
}
dialog[open] { opacity: 1; transition-duration: var(--dur-enter); }
@starting-style { dialog[open] { opacity: 0; } }
```

- **`@starting-style`** gives a just-inserted or just-shown element its from-values, replacing the
  mount-flag effect (keep the flag only as the fallback). **Exit to `display: none`:** list
  `display` with `allow-discrete` (and `overlay` for `[popover]`/`<dialog>`, which leave the top
  layer) so the element stays rendered until the exit ends. The open state's transition runs on
  enter, the closed state's on exit. Engines without `overlay` snap the exit, an acceptable
  fallback. Fade `::backdrop` with the surface.
- **Hidden start states fail safe.** An element at `opacity: 0` that only script reveals ships
  blank when a script errors or loads late. Scope the hidden state under a class an inline head
  script sets before first paint (`.js [data-reveal]`; in React add `suppressHydrationWarning` to
  `<html>`), or animate from visible, and let a timeout release anything still hidden. Scroll
  reveals: `scroll-animation`.
- **Presence wrappers** (a library's exit-for-unmount): never animate persistent content's first
  mount through one (turn initial animation off; verify on a full reload). An effect wrapper that
  must play an exit stays mounted and toggles state; unmounting skips the exit.
- **Leaving layout at once:** pin the exiting element `position: absolute` at its current offset
  (parent `relative`) so siblings close the gap (FLIP them) while it fades.
- **CSS stagger:** the hidden state lives in the `from` keyframe with `animation-fill-mode: both`
  and per-item `animation-delay`, so an item whose animation never runs stays visible. Reduced
  motion keeps only the opacity keyframe.
- **Icon swaps:** stack both icons in one grid cell (`css-craft.md` Grid single-cell stacking) and
  cross-fade; enter and exit both animate with no library.

## Height and layout changes

- **Height to `auto`:** `interpolate-size: allow-keywords` on `:root` (opt-in) or
  `height: calc-size(auto, size)` where supported; everywhere else a grid wrapper
  `grid-template-rows: 0fr` → `1fr` with the child `min-height: 0; overflow: hidden`. No JS
  measuring. Height lays out every frame, so keep it short. A script-free exclusive accordion is
  `<details name="…">` (find-in-page can open it).
- **FLIP without a library:** batch-read rects, apply the change, invert with a `transform`, play
  to identity with `element.animate()`. Scaling a box distorts its text: counter-scale children or
  animate position only.
- Offset by the element's own size with percentage translates (`translateY(100%)` hides a drawer of
  any height), never a measured pixel value. A sidebar slides with `translateX`; animating its
  `width` or `margin` re-lays out the page beside it.

## Springs and interruption

- Libraries take physics-form springs; design specifies damping ratio ζ and response. Convert
  before porting or judging: **ζ = damping / (2·√(stiffness·mass))** (ζ ≥ 1 no overshoot, ζ < 1
  overshoots: 300/20/1 → ζ ≈ 0.58, visible bounce; 1000/10/1 → ζ ≈ 0.16, very springy). From
  design's values: stiffness = mass·(2π/response)², damping = 2ζ·√(stiffness·mass).
- Re-triggerable UI (toggles, toasts, expand/collapse) animates with transitions or springs, which
  retarget from the current value; keyframes restart from zero. An interrupted animation starts
  from the element's live value, never the target. Drive 2D motion with independent X and Y springs
  (one spring on a 2D distance desyncs when the axes' velocities differ). Never lock input during a
  transition.

## Gestures and drag

- **Track, then release.** While the pointer is down, write position directly (style or a motion
  value) at 1:1 from the grab offset: no transition, no spring, no React state per move. Grab from
  the current on-screen value so a mid-animation grab doesn't teleport. On release, hand the
  release velocity to a spring (disable the library's own momentum when you do); clamp overshoot
  on dismiss, or the sheet springs past its edge and flashes a gap. Derive linked values (backdrop
  opacity, page scale) from the one drag value, never a parallel animation.
- **Dismissal and edges:** dismiss once `velocity = |dragDistance| / elapsedTime` crosses roughly
  `0.11`, regardless of distance, so a flick suffices; at a natural boundary apply
  `resistance(overshoot, dimension, c=0.55) = overshoot·dimension·c / (dimension + c·|overshoot|)`
  instead of a hard stop. Thresholds and feel are design's ("Springs and gestures").
- **Pointer mechanics:** `setPointerCapture(pointerId)` once a drag begins; ignore extra touch
  points mid-drag; keep a short `pointermove` history for release velocity; ~10px of hysteresis
  before committing a tap to a drag or a drag to an axis, detecting candidate gestures in parallel
  and cancelling losers. Respond on pointer-down. Children that must stay clickable (buttons in a
  sheet) opt out of starting a drag.
- **Cleanup:** on `pointercancel` (the browser took the gesture to scroll), `lostpointercapture`,
  release outside the control, and window `blur`, clear drag state and release capture; the next
  drag must work without a reload.
- **Touch scoping:** `touch-action: pan-y` for vertical-scroll areas, `pan-x` for horizontal
  strips, `none` for surfaces that own the gesture, `manipulation` on plain tappables.
  `{ passive: true }` on `touchstart`/`wheel` listeners that never `preventDefault()`, and never on
  one that does. `-webkit-tap-highlight-color: transparent` plus an explicit `:active` state.
- **Native first:** a swipeable strip is `overflow-x` plus `scroll-snap` before it is a JS
  gesture; drag and inertia layer on top, keyboard-reachable and reduced-motion complete.
- **Pointer followers** (cursor, magnetic, tilt): motion values with smoothing, never state per
  `pointermove`; gate behind `(hover: hover) and (pointer: fine)`; damp by elapsed time
  (`damp(current, target, λ, dt)`), since a fixed per-frame lerp runs twice as fast at 120 Hz.
- Every drag ships a single-pointer alternative (`accessibility.md` Touch targets). Under reduced
  motion tracking stays (the user makes it); drop flings and bounce, settle with a short change.
- **Evidence:** per custom drag control, tap; complete a drag; swipe across it along the page's
  scroll axis (the page scrolls, the control stays); drag along its own axis. Name what produced the
  evidence (synthetic touch, which engine, physical device): a screenshot never proves a gesture.
  Each confirmed gesture fix gets a behavioural regression test.

## Hover and press

- **Never hover the thing that moves.** A lifted, scaled, or sliding element leaves a still
  pointer, unhovers, falls back, and re-hovers: a flicker loop. Put `:hover` and listeners on a
  stable parent or hit layer and animate an inner child (`.card:hover .card-surface`). Canvas and
  SVG figures hit-test the rest pose; logic reads a spring's target, not its position.
- A hover preview puts its `transition-delay` on the `:hover` rule only, so leaving is instant.
- Press feedback (values: `design` `motion.md` "Physical correctness and press feedback") fires on
  `:active` / `pointerdown`, never `click`; scope it to enabled controls (`:not(:disabled):active`),
  transition the exact property (`scale` or `transform`), and give the component an opt-out variant.

## Motion performance traps

Compositor-safe properties, `will-change`, and paint traps: `performance.md` and `css-craft.md`.

- Budget **8.3ms per frame at 120 Hz** (16.7ms at 60): design against the smaller.
- Diagnose in order: the animated property → jank that coincides with a busy main thread (move it to
  CSS/WAAPI) → per-frame React state → cost growing with content → blur radius → `will-change`, last,
  and only after a seen 1px shift or measured drops.
- Never drive a per-frame transform through a custom property on a parent: every descendant
  restyles each frame (a drawer lagged past ~20 items). Write `transform` on the moving element.
- Animated `box-shadow` → fade a pre-blurred pseudo-element, or `filter: drop-shadow()` (composited
  in Chromium; measure elsewhere). `display`/`visibility` toggles → fade opacity, then set
  `visibility: hidden` at the end so the element stops taking clicks.
- CPU throttling models a slow CPU, not a weak GPU or little memory: profile a real mid-range phone.

## Animated text and numbers

- Rolling numbers, scrambles, split text, and typewriters expose the final value once
  (`aria-label` on the wrapper or an `sr-only` copy) and `aria-hidden` the moving pieces; ten spans
  per digit otherwise read "0123456789".
- Digit reel: one `1ch` `tabular-nums` column per digit, clipped vertically, taking the shortest
  way round 0–9; roll on a value change, never on mount; the currency sign sits outside the rolling
  digits. Split by grapheme (`Intl.Segmenter`), never `split('')`.
- DOM-rewriting effects touch only text the client never re-renders (server-rendered or static);
  never remove a React-owned node imperatively — hide it or render it from state.

## Scripted loops and demos

- **Live figure loop:** one rAF loop per figure; `dt` from the rAF timestamp, clamped after a pause;
  write attributes and `textContent` through refs, never re-render the framework per frame; stop
  when every value and velocity is within epsilon of its target, and while offscreen or
  `document.hidden`; re-append nodes for depth only when the order changed; budget ~1ms of script.
- **Clock-driven demos:** compute every frame from one time value `t`, so the demo scrubs, freezes
  for screenshots, and renders its end frame under reduced motion; transitions only smooth between
  `t`-derived states. Draw at a fixed stage size scaled by one `transform`, and prefix every class
  and `@keyframes` per instance (keyframe names are global).
- Background tabs throttle timers and pause rAF: a preloader or progress counter carries a hard
  time cap that always reveals the page.

## SVG motion

- `transform-box: fill-box` so `transform-origin: center` means the shape's own box.
- Draw-ons: `pathLength="1"` normalises length; `stroke-dashoffset` draws strokes only; split a
  compound path (several `M`) to draw its parts in order.
- Morph only paths with identical command structure; otherwise move separate parts.
- Keep SVGO from renaming IDs, merging paths, or converting shapes you animate. An SVG loaded as
  `<img>` runs its own CSS animations but page CSS and JS can't reach it — inline it to drive it.

## Removing and importing motion

- **Removing:** delete the hidden start state with the animation (initial `opacity: 0`,
  `fill-mode: forwards` from 0, a reveal class waiting on an observer) or the element stays
  invisible; delete every wait on it (`transitionend`, exit callbacks, duration-sized timeouts) and
  move post-exit work to the close; move focus immediately; if a layout jump appears, the animation
  was hiding it — keep it and report; update tests and clean orphaned keyframes, wrappers, and
  variants. Propose, don't perform, dropping the dependency.
- **Importing** animated components from a registry: audit reduced-motion handling on each — most
  have none. A root library setting (`reducedMotion="user"`) gates only the library's own
  transform and layout animations; `style`-bound values, CSS keyframes, canvas, and `filter` blurs
  need their own gate (`scroll-animation` `motion.md` "Reduced motion, live").

## Verify motion

- Add a dev-only freeze: `?t=N` seeks a paused animation (negative `animation-delay` plus
  `animation-play-state: paused`; WAAPI `currentTime`; a loop renders frame N); `?state=open` pins
  an interaction. Screenshot start, middle, and end on both the normal and the reduced-motion path.
- Replay at 10% in the DevTools Animations panel while walking each state; coordinated properties
  must stay in sync. The Performance panel shows no per-frame Layout or Paint for the moving element.
- Judge gestures and feel on a real 120 Hz phone; a desktop trackpad and a 60 Hz monitor hide both.

<!-- sources: emilkowalski/skills (MIT) — animate (tool ladder), animation-performance (diagnosis
order, 120 Hz budget, inherited-variable trap, drop-shadow, visibility-after-fade, throttling caveat),
gestures (track/release, linked values, overshoot clamp), remove-animations (removal hazards),
emil-design-eng (@starting-style, transitions vs keyframes, percentage translate), mobile-native
(touch-action manipulation, native snap); iart-ai/web-animation-skills (MIT) — micro-interaction +
css-recipes (@starting-style, allow-discrete, overlay), 60fps-animation (height auto, FLIP),
svg-animation (fill-box, pathLength, morph structure, SVGO), accessible-animation (registry gating),
scripts/README (freeze-and-seek verification); ibelick/motion-primitives (MIT) — spring presets
tallied for the ζ examples, sliding-number reel, text-effect a11y; ui-layouts/uilayouts (MIT) —
spring tallies, per-frame lerp anti-pattern; jakubkrehel/skills (MIT) — enter-exit, press scoping,
icon cross-fade grid stack, CSS stagger fill-mode, presence-wrapper first mount; pbakaus/impeccable
(Apache-2.0) — interrupted-gesture cleanup and gesture evidence, hover moves a child; Nutlope/hallmark
+ Leonxlnx/taste-skill (MIT) — content visible without script; juliobsz/skills (MIT) — pre-paint
reveal class, DOM-mutating text effects; MengTo/skills (MIT) — clock-driven demos;
wheresryan22/anatomy + lucasmarkes/hairline (MIT) — hover flicker loop; anatomy — live figure loop; gcomartins/myfskills (MIT) —
background-tab preloader cap; motion CHANGELOG 14.2.0 (accelerated shorthands); MDN @starting-style,
transition-behavior, interpolate-size. Gesture pointer mechanics moved here from
web-platform-runtime.md (emilkowalski emil-design-eng + apple-design, ibelick baseline-ui). -->
