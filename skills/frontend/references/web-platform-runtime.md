# Web Platform Runtime

Purpose: Browser-runtime mechanics that sit outside CSS layout — SPA routing and History API
behavior, storage, service workers/PWA installability, gesture and pointer handling, mobile
Safari/viewport hardening, background video, and View Transitions wiring. Framework-agnostic;
sharpen with a stack overlay (e.g. `nextjs.md`) when one applies.

Read when:
- Building client-side routing/navigation in a single-page app.
- Implementing drag, swipe, or other pointer-driven gestures.
- Fixing mobile browser-chrome, viewport, or safe-area bugs (especially iOS Safari).
- Adding an installable PWA, offline caching, or a background/hero video.
- Wiring `document.startViewTransition()` for a route or state change.

Skip when:
- The question is CSS layout, breakpoints, or container queries — read `web-platform-css.md`.
- The question is touch-target sizing or reduced-motion itself — read `accessibility.md` (this
  file cites it, never restates the numbers).
- The question is scroll-driven choreography, easing, or spring values — that is animation's
  domain; this file keeps only the reduced-motion no-op and mechanism wiring.

Inputs:
- Whether the app is a full SPA (client router) or uses framework-native navigation.
- Target platforms (iOS Safari needs the most hardening).

Produces:
- Correct SPA navigation behavior (URL, title, focus, scroll), gesture-handling code, viewport/
  safe-area fixes, and a working offline/installable shell where relevant.

## Contents
- SPA routing and the History API
- Client storage
- Service workers and PWA installability
- Real-time transport
- Gesture and pointer handling
- Mobile Safari and viewport hardening
- Background and transparent video
- View Transitions wiring

## SPA routing and the History API

Every meaningful view needs its own URL — build it with `URLSearchParams` and
`history.pushState`/`replaceState`, and handle `popstate` for back/forward restoration. On every
route change: update `document.title` and relevant meta; move focus to the new view's `<h1>` or
`<main>` (`document.querySelector('h1')?.focus()`) so screen-reader and keyboard users land
somewhere meaningful instead of staying wherever focus was on the old page. Browsers disable their
native scroll restoration once a SPA takes over navigation — set
`history.scrollRestoration = 'manual'` and save/restore scroll position yourself, keyed by route
(e.g. in `sessionStorage`), restoring on back/forward and resetting on forward navigation to a new
route. Mark the active nav item with `aria-current="page"`, and give breadcrumb navigation its own
labeled landmark (`<nav aria-label="Breadcrumb">`).

## Client storage

Version-prefix every `localStorage`/`sessionStorage` key (`"userConfig:v2"`) so a future shape
change can detect and discard stale data instead of crashing on it, and store only the minimal
fields actually needed — never full user objects, PII, or auth tokens (see `client-security.md`
for why tokens specifically must never live here). Always wrap reads/writes in try/catch: private
browsing in Safari/Firefox and quota-exceeded conditions throw synchronously. For hot-path reads
(`localStorage`, `sessionStorage`, `document.cookie`), cache the value in an in-memory `Map` and
invalidate on the `storage` event and on `visibilitychange`-to-visible, since raw storage reads are
synchronous and comparatively expensive to repeat.

## Service workers and PWA installability

Installability requires all of: HTTPS, a manifest with `name`, `icons` (192×192 and 512×512 PNG
minimum, plus a maskable variant for Android), `start_url`, and `display`; and a service worker
whose `fetch` handler actually responds (registration alone is not sufficient). Choose `display`
deliberately — `standalone` is the default for an installed-app feel, `fullscreen` suits
games/media, avoid `browser` if the point is to hide browser chrome.

For the service worker's caching lifecycle (install/activate handlers, per-resource-type strategy,
repeat-visit gains), see `performance.md`'s Caching strategy section — this file owns only the
installability facts above.

## Real-time transport

Pick by direction and payload. Server-sent events (`EventSource`) for one-way server-to-client
streams (notifications, live feeds, token streaming): they auto-reconnect, ride plain HTTP, and
resume missed events when the server honors the `Last-Event-ID` header the client replays on
reconnect. WebSocket only for bidirectional or binary traffic (chat, presence, collaborative
editing); it opens a separate TCP connection outside HTTP/2 multiplexing, so it neither shares nor
benefits from the page's connection. Long-polling is the compatibility fallback. Any persistent
connection needs an app-level heartbeat (a ping the server echoes) to detect dead sockets TCP has
not surfaced, plus reconnect with exponential backoff and jitter so a server restart does not
trigger a synchronized reconnect stampede. Behind a load balancer, WebSocket and long-polling need
sticky sessions (or a shared pub/sub backend) so a connection's messages reach the node holding it.

## Gesture and pointer handling

Momentum-based dismissal: don't gate on a fixed drag distance. Compute
`velocity = |dragDistance| / elapsedTime` and dismiss once velocity crosses a threshold
(roughly `0.11` in practice) regardless of distance travelled — a quick flick should be enough on
its own. At a drag's natural boundary, apply progressive resistance rather than a hard stop
(rubber-banding): `resistance(overshoot, dimension, constant=0.55) = overshoot·dimension·constant /
(dimension + constant·|overshoot|)`.

Call `setPointerCapture(pointerId)` once a drag begins so tracking continues even if the pointer
leaves the element's bounds. Ignore additional touch points once a drag has started — switching
fingers mid-drag without this guard jumps the element. Track a short history of recent
`pointermove` events and timestamps (not just the current point) so release velocity can actually
be computed. Add roughly 10px of hysteresis before committing a tap to a drag, or a drag to a
direction; detect all plausible gestures in parallel from the first move and cancel losers once
intent is clear, rather than using a recognizer that only reports a final state like `swipeleft`.
Respond to input on pointer-down and track continuously during the gesture — feedback that only
appears on release reads as laggy, not just less "juicy."

Scope touch behavior with `touch-action`: `pan-y` for vertical-scroll areas, `pan-x` for
carousels, `none` for canvas/map surfaces that fully own the gesture. `{ passive: true }` on
`touchstart`/`wheel` listeners that never call `preventDefault()` removes the browser's forced wait
before scrolling — never set it on a listener that does call `preventDefault()` (breaks
custom-gesture handling). `-webkit-tap-highlight-color: transparent` plus an explicit custom
`:active` state replaces the default tap flash. Touch-target sizing itself is `accessibility.md`'s
table — cite it, don't restate the numbers here.

## Mobile Safari and viewport hardening

**Dynamic viewport units** — pick by what should happen while the URL bar animates: `svh` (small
viewport, bar expanded) is the default choice for a stable full-height app shell, since it never
jumps and the footer stays reachable; `lvh` (large viewport, bar collapsed) is rarely what's
wanted, since content can end up hidden behind the bar; `dvh` (dynamic, tracks live) only when a
live-resizing layout during scroll is actually the goal, since it causes reflow while scrolling;
legacy `vh` behaves like `lvh` on iOS and should be avoided for full-height sections. The classic
`100vh` jump happens because percentage/`vh` heights resolve against the viewport's initial
containing block, which includes the area behind the URL bar. A common app-shell bug: an
`h-full`-chained shell (`html.h-full` → `body.h-full.overflow-hidden` → `main.h-full`) resolves
against the *large* viewport, so with `overflow-hidden` the footer sits behind the URL bar — fix
by sizing the shell with the small-viewport unit instead.

**Safe area**: `env(safe-area-inset-{top,bottom,left,right})` pads content away from the notch,
home indicator, and browser chrome — it does not tint the chrome itself (a common conflation with
the fix below). Requires `viewport-fit: cover` in the viewport meta tag to be non-zero at all.

**iOS 26 "Liquid Glass" chrome tinting**: this release ignores `<meta name="theme-color">` for
browser-chrome tinting entirely; instead WebKit samples the background color of `position:fixed`/
`sticky` elements near the viewport edges (the sampled element must be effectively full-width and
at least ~6px tall), falling back to `<body>`'s background if nothing qualifies. Fixing this needs
three cooperating layers: (a) two invisible fixed strips (~12px tall, `aria-hidden="true"`,
`pointer-events: none`) pinned to the top and bottom of `<body>`, painted the exact intended chrome
color; (b) a matching `<body>`/`<html>` background as the fallback for older iOS and other
browsers; (c) the legacy `theme-color` meta tag for pre-26 iOS and Chrome Android. Skipping (a)
leaves iOS 26 untinted; skipping (b)/(c) breaks tinting everywhere else. `viewport-fit: cover` is
required for the page to paint under the translucent chrome at all. For a per-route chrome color,
drive the strips and body background from one CSS variable and flip it via
`html:has([data-chrome="..."])`, which "hoists" a page-level signal up to `<html>` so
body-level strips can read it. `apple-mobile-web-app-status-bar-style: black-translucent` produces
a solid top bar on iOS 26 PWAs — use `default` instead. Chrome UI treatment evolves with each OS
release; verify current behavior against a real device or the current-year simulator before
relying on any of the above — Chrome DevTools device emulation cannot reproduce it.

**Input auto-zoom vs. pinch-zoom** is a real trade-off, not a bug to blindly suppress: iOS
auto-zooms on focusing an input with `font-size` under 16px. `maximum-scale=1` stops the auto-zoom
but also disables user pinch-zoom entirely — an accessibility regression (WCAG 1.4.4, Resize
Text). Setting input `font-size` to at least 16px stops the auto-zoom at the source *and* preserves
pinch-zoom, and is the preferred fix wherever feasible.

## Background and transparent video

Safari/iOS cannot reliably decode VP9/WebM alpha; Chrome/Firefox cannot decode HEVC `.mov` — true
alpha video needs two encodes of every asset, or a technique that avoids alpha entirely. All iOS
browsers (Chrome and Firefox included) run on WebKit, so any browser-detection logic must key off
`OS === "iOS" || browser === "Safari"`, never a bare check for `"Safari"` in the user-agent string
(Chrome's UA also contains that substring).

Three serving patterns, in order of preference: (1) stacked `<source>` fall-through — default
choice, SSR-safe, zero JS, works when the page background is one known solid color: the HEVC
`<source>` (with `type="video/quicktime"`) must come first so Chrome/Firefox skip it without
downloading and fall through to the WebM source; (2) `mix-blend-mode: lighten` (or `darken` on
light pages) when content is reliably brighter (or darker) than the backdrop — computes
per-channel `max`/`min` against the backdrop so pure black/white becomes invisible, but fails over
gradients or images and creates a stacking context; (3) JS browser detection only when exactly one
file must download or per-browser layout branching is required. For patterns (1) and (2), bake the
page's exact background hex into the video at encode time (composite over a solid color matching
the page CSS) — one hex digit off from the real background shows a visible box, the most common
failure mode. Non-negotiable Safari HEVC requirements: `-tag:v hvc1`, a `.mov` extension, and
`type="video/quicktime"` on the `<source>` — missing any one shows nothing.

Universal background-video attribute checklist: `autoPlay muted playsInline loop` always (muted +
`playsInline` are the iOS autoplay gate); `preload="none"` below the fold, a poster image above the
fold; strip audio at encode time — required for autoplay reliability and saves bytes. Guard
against silent autoplay refusal (low-power mode, data saver) by calling `.play()` in an effect and
handling the rejected promise.

## View Transitions wiring

`document.startViewTransition(updateCallback)` for same-document (SPA) transitions;
`@view-transition { navigation: auto }` for cross-document (MPA) transitions. Assign
`view-transition-name` to elements that should morph between states — names must be unique per
active snapshot, a duplicate breaks the transition. Wrap the trigger in a
`prefers-reduced-motion` check so reduced-motion becomes a no-op swap, not a suppressed animation
attempt (cite `accessibility.md`'s reduced-motion doctrine — don't restate the media query here).
The keyframes/easing/duration values applied inside `::view-transition-*` pseudo-elements are
motion values and route to the animation skill; this file owns only the mechanism above.

<!-- sources: ehmo_platform-design-skills web/SKILL.md + rules/_sections.md (MIT, attribution
required) — triage-cuellarfr-dembrandt-ehmo.md, triage-pbakaus-ehmo-web.md; dembrandt-skills
(no license, facts re-expressed; MDN/WCAG/web.dev cited) semantic-html-and-seo, sticky-and-fixed-elements — triage-cuellarfr-dembrandt-ehmo.md;
safari-mobile-optimization, transparent-web-video, scroll-driven-video (no license, re-expressed)
— miner-local.md; emilkowalski/emil-design-eng + apple-design, ibelick/baseline-ui (MIT) —
miner-ext-b.md -->
