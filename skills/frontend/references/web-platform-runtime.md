# Web Platform Runtime

Purpose: Browser-runtime mechanics that sit outside CSS layout — SPA routing and History API
behavior, storage, service workers/PWA installability, gesture and pointer handling, mobile
Safari/viewport hardening, background/transparent video, scroll-scrub media traps, and View
Transitions wiring. Framework-agnostic; sharpen with a stack overlay (e.g. `nextjs.md`) when one
applies.

Read when:
- Building client-side routing/navigation in a single-page app.
- Implementing drag, swipe, or other pointer-driven gestures.
- Fixing mobile browser-chrome, viewport, or safe-area bugs (especially iOS Safari).
- Adding an installable PWA, offline caching, or a background/hero video.
- Wiring scroll-scrubbed or seek-driven media (client traps only — not choreography).
- Wiring `document.startViewTransition()` or React `<ViewTransition>` for a route or state change.

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
  safe-area fixes, video/scrub media contracts, and a working offline/installable shell where
  relevant.

## Contents
- SPA routing and the History API
- Client storage
- Service workers and PWA installability
- Real-time transport
- Gesture and pointer handling
- Mobile Safari and viewport hardening
- Desktop vs iOS Safari divergences
- Modal body-lock scrollbar compensation
- Background and transparent video
- Scroll-scrubbed and media playback runtime traps
- Popover API and CSS Anchor Positioning
- View Transitions wiring (browser + React layer)

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
Rendering an agent run over this transport (resume cursor, provisional text, approve/cancel) is
`state-and-data.md`'s Agent-run streaming client.

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
containing block, which includes the area behind the URL bar. `svh`/`dvh`/`lvh` ship on iOS 15.4+
and all modern browsers; the per-route `:has()` chrome-variable pattern needs the same floor.

**App-shell `h-full` chain:** `html.h-full` → `body.h-full.overflow-hidden` → `main.h-full` resolves
against the *large* viewport, so with `overflow-hidden` the footer sits behind the URL bar. **Fix
order:** size the shell with the small-viewport unit — `body` as `flex h-svh flex-col
overflow-hidden` (or `height: 100svh`), not a percentage chain. Pair `body { min-height:
-webkit-fill-available; }` behind `svh` for older visual-viewport edge cases. Paint `html`/`body`
the chrome color so URL-bar collapse reveal matches.

**Full-height hero clamps:** prefer `height: 100svh` with `min-height` (~640px) and `max-height`
(~1100 desktop / ~900 md) so tall tablets don't open empty caverns and short phones keep the CTA
reachable. Prefer `svh` over `dvh` unless live resize during scroll is intentional (reflow cost).

**Virtual keyboard vs `position: fixed` bottom chrome:** on iOS Safari (and WebKit-on-iOS browsers),
the **layout viewport** often stays put while the **visual viewport** shrinks under the OSK —
`position: fixed; bottom: 0` stays anchored to the layout viewport and can sit **under the
keyboard**. Android Chrome more often resizes layout. **Order of ops for chat/composer CTAs:**
1. Prefer CSS where available: `interactive-widget=resizes-content` in the viewport meta (Chromium)
   and/or `dvh`/`svh` shells that actually track keyboard when the engine supports it.
2. When fixed chrome still overlaps: listen to `window.visualViewport` `resize` + `scroll`; offset
   the bar with `transform: translateY(...)` (compositor-friendly) from
   `visualViewport.offsetTop` / height delta — simulate "device-fixed" relative to the visible
   screen.
3. **Silent lag:** when Safari chrome UI is expanded, `visualViewport` height may update only at the
   **end** of the keyboard animation (WebKit bug class) — don't assume frame-perfect follow.
4. `env(keyboard-inset-height)` / VirtualKeyboard API when present; feature-detect, don't require.
5. Verify real iPhone Safari + Android Chrome with a bottom composer focused; DevTools device mode
   is not enough.

**Safe area**: `env(safe-area-inset-{top,bottom,left,right})` pads content away from the notch,
home indicator, and browser chrome — it does not tint the chrome itself (a common conflation with
the fix below). Requires `viewport-fit: cover` in the viewport meta tag to be non-zero at all.

**iOS 26 "Liquid Glass" chrome tinting**: this release ignores `<meta name="theme-color">` for
browser-chrome tinting entirely; instead WebKit samples the background color of `position:fixed`/
`sticky` elements near the viewport edges (the sampled element must be effectively full-width and
at least ~6px tall), falling back to `<body>`'s background if nothing qualifies. Fixing this needs
three cooperating layers: (a) two invisible fixed strips (~12px tall, first children of `<body>`,
`left:0;right:0`, `z-index:0`, `aria-hidden="true"`, `pointer-events: none`) pinned to the top and
bottom of `<body>`, painted the exact intended chrome color; (b) a matching `<body>`/`<html>`
background as the fallback for older iOS and other browsers — also paint the **overscroll/rubber-
band** area; pair with `overflow-x: hidden` on body when horizontal bleed is a risk; (c) the legacy
`theme-color` meta for pre-26 iOS and Chrome Android. Skipping (a) leaves iOS 26 untinted; skipping
(b)/(c) breaks tinting everywhere else. `viewport-fit: cover` is required for the page to paint
under the translucent chrome at all.

**Chrome color workflow:** one color drives strips + body/html + theme-color and **must match the
page's top and bottom edges** (inspect the real mobile surface first). Light apps use a light
chrome color — nothing dark-specific. When a single surface color: set `theme-color` for **both**
`prefers-color-scheme: light` and `dark` to that same value so the meta never flips to a mismatched
scheme default. Do **not** set `maximum-scale=1` / `user-scalable=no` as part of chrome tinting —
that is a separate input-zoom trade-off (below).

**Edge sampling stolen by stacking (silent failure):** if any stacking context with a *lighter*
background paints the top/bottom edge sample band (0–12px), WebKit samples **that** → white or
mismatched chrome with no console error. Keep page chrome/header from covering the sample band with
a conflicting bg, or match colors. Do not confuse with `env(safe-area-inset-*)` (pads content,
never tints). Verify: temporary `height:40px;background:red` on strips → red chrome on real iOS 26
/ simulator; revert. Chrome DevTools device emulation cannot prove this.

**Per-edge and per-route chrome:** different header/footer colors → top strip = header edge color,
bottom strip = footer edge color; body bg = whichever edge matters for overscroll. Multi-route: one
pair of strips; drive `--chrome` via `html:has([data-chrome="…"])` (0,1,1 beats `:root` 0,1,0).
Page signal must be on an in-DOM element matching the selector exactly — wrong attr/class →
**silent no-op**. Legacy `theme-color` for that route: server `viewport` export in the route layout
(client pages cannot export it).

**iOS 26 PWA status bar + install meta:** `apple-mobile-web-app-capable: yes` (or framework
equivalent) with `apple-mobile-web-app-status-bar-style: default` — not `black-translucent`, which
produces a solid top bar regression on iOS 26 PWAs. `viewport-fit: cover` required so the page
paints under translucent chrome. Strips are plain DOM (not Next-specific); only the
`viewport`/`generateMetadata` export syntax is framework-shaped.

**Verify path (real device / iOS 26 Simulator only — Chrome DevTools cannot prove Liquid Glass):**
1. Portrait Safari: top status + bottom URL/tab bar blend; no white bands; check each route's color.
2. Scroll: tint holds as URL bar collapses; full-height sections do not jump (`svh` shell).
3. Add to Home Screen → open as PWA: clean top bar, not a solid slab.
4. Older iOS (≤25) / Chrome Android: `theme-color` fallback tints.
5. Mechanism proof: temporarily `height:40px;background:red` on strips → red in chrome → revert.
6. Strips invisible in normal use; do not intercept edge taps.

**iOS 26 fixed-modal clip (inner viewport):** distinct from chrome *tinting* above. On iOS 26
Safari, `position: fixed` (including negative insets) clips to the *inner* viewport, not the
visual viewport that extends under translucent status/address chrome. Classic full-viewport fixed
modal backdrops therefore leave unpainted gaps behind the chrome. **Fix order of ops:** (1)
backdrop uses `position: absolute` sized to the full page height (or put `position: relative` on
`body` and size the backdrop against it), not `position: fixed` covering `100vh`/`inset: 0`; (2)
keep the dialog itself in view while the page scrolls by wrapping it in `position: sticky` (or
making the dialog sticky) so it stays centered in the visible viewport even when the user scrolls
the document under the absolute backdrop. Agents that only wire the classic fixed-overlay recipe
ship broken modals on iOS 26 while older iOS still looks fine. Library confirmation: React Aria
and similar overlay systems have shipped this absolute+sticky pattern for the same clip model.

**Input auto-zoom vs. pinch-zoom** is a real trade-off, not a bug to blindly suppress: iOS
auto-zooms on focusing an input with `font-size` under 16px. `maximum-scale=1` stops the auto-zoom
but also disables user pinch-zoom entirely — an accessibility regression (WCAG 1.4.4, Resize
Text). Setting input `font-size` to at least 16px (and form controls `font: inherit` so they do not
fall back to the UA's ~13.3px — `css-craft.md`) stops the auto-zoom at the source *and* preserves
pinch-zoom, and is the preferred fix wherever feasible. **Do not silently flip an existing
`maximumScale` / `maximum-scale` choice** — it is often deliberate for a locked app UI; note the
trade-off rather than removing it blind. Content sites should prefer the 16px floor.

## Desktop vs iOS Safari divergences

Do not equate "Safari" QA with one platform — test macOS Safari and iOS Safari separately for
filter/video/`position:fixed`. Beyond the `100vh`/`svh` split already above:

- Gate hover styles with `@media (hover: hover) and (pointer: fine)` — iPadOS "desktop" sites can
  get hover without durable hover; sticky `:hover` states are a desktop-class trap.
- Full-page video and `backdrop-filter` memory budgets differ desktop vs phone; FPS on one is not
  proof on the other.
- Extension/content blockers are stronger on desktop Safari.
- Fixed + visualViewport keyboard issues are mostly mobile; rubber-banding / overscroll behavior
  still diverges both ways.

## Modal body-lock scrollbar compensation

When locking page scroll for a modal (`document.body` / root → `overflow: hidden`), the
disappearing scrollbar shifts layout sideways unless space was already reserved. Prefer
`scrollbar-gutter: stable` on the scrolling root when support is acceptable (`css-craft.md`). When
you must compensate in JS instead: **measure scrollbar width before applying `overflow: hidden`**
(`scrollBarWidth = window.innerWidth - document.documentElement.clientWidth`, or compare
`document.body.offsetWidth` before vs after the hide), apply that width as `margin-right` or
`padding-right` on the locked element, then reverse both the overflow lock and the compensation on
close. Measuring after hide reports zero width and leaves the shift unfixed. Pair with
`overscroll-behavior: contain` on the modal body (`css-craft.md`) so wheel/touch does not chain
into the locked page.

**Never use `position: fixed` body lock around a playing `<video>`** — Safari freezes the paint
layer while `currentTime` still advances. See Scroll-scrubbed and media playback runtime traps for
the overflow-only + `translateZ(0)` contract.

## Background and transparent video

Safari/iOS cannot reliably decode VP9/WebM alpha; Chrome/Firefox cannot decode HEVC `.mov` — true
alpha video needs two encodes of every asset, or a technique that avoids alpha entirely. All iOS
browsers (Chrome and Firefox included) run on WebKit, so any browser-detection logic must key off
`OS === "iOS" || browser === "Safari"`, never a bare check for `"Safari"` in the user-agent string
(Chrome's UA also contains that substring).

### Pattern matrix (decision order)

**Backdrop + need gate first — pick the pattern from the page and the asset, not habit:**

| Situation | Pattern | Notes |
|---|---|---|
| No transparency needed | **Plain MP4** (H.264, prefer **bt709-tagged**) + responsive sources + poster | Single codec; size tiers. Production heroes often **migrated here** from dual-codec after HEVC brightness/over-sat issues |
| Bright/glowing on dark (or inverse) over **gradient/image/changing** bg | **C** (`mix-blend-mode`) | One file; tonal-range gate. Production sites often use this on a **footer still image**, not only video |
| True alpha / baked look, page bg is **one known solid hex**, simplest markup | **B** stacked `<source type>` | SSR-safe, zero JS; bake page hex into Safari MOV (or dual true-alpha) |
| True alpha **and** one-file download guarantee / layout branches per engine | **A** JS detect (`bowser`) — **production dual-codec path** | SSR null; conditional mount; see Pattern A card below |
| Native alpha containers unavailable | **D** dual-track H.264 + canvas/WebGL recombine | Last resort — see below |

**Production migration signal:** when motion no longer needs real transparency (scrims
and solid bg suffice), **prefer a single H.264 `.mp4`** over dual WebM/HEVC. In-repo hero comments:
untagged dual exports **over-saturated in Safari**; HEVC `.mov` often **renders brighter** than
WebM → visible light/dark seam across engines. Fix: re-export H.264 with explicit **bt709** color,
or abandon dual-codec for that asset. Dual-codec Pattern A remains correct when true transparent
(or baked seamless) motion is still required.

**Tonal-range gate for C:** encode on pure black + `mix-blend-mode: lighten` (or pure white +
`darken`/`multiply`). Content must be **strictly brighter (or darker) than the backdrop** —
mid-tones get eaten/ghosted. Production heroes that fail this gate migrate C → A/B over a solid
hex, not the reverse. Soft integration: `opacity` ~0.8 on the video with mix-blend is production-
proven; the same blend modes work on **still images** (footer waves, glows), not only `<video>`.

**Bake rule is A/B only:** composite over the page CSS hex **exactly** (`0xRRGGBB` without `#` in
the encode filter); one digit off → visible box (most common failure mode). Pattern C flattens to
black/white encode — **do not** bake page hex into C assets.

Decision order: assess tonal range + backdrop + whether transparency is needed → pick pattern →
encode → serve → **real Safari and Chrome**. Never invert the matrix (mix-blend is not the
solid-bg default; bake is not for C).

### Pattern B — stacked `<source>` (default when solid bg, SSR-safe)

Zero JS. HEVC `<source>` **first** with **`type="video/quicktime"`**, then WebM with
**`type="video/webm"`**. Explicit `type` is the skip signal — omitting it makes Chrome fetch the
`.mov` before failing (wrong-codec download / wasted bytes). Non-negotiable Safari HEVC triad:
`-tag:v hvc1`, `.mov` extension, and `type="video/quicktime"` — missing any one shows nothing.
**Order still matters when Safari can play WebM:** recent Safari may decode WebM, but without the
HEVC/baked advantages — put `.mov` first so Safari takes the file encoded for it.

### Pattern A — JS browser detection (one-file guarantee / layout branch)

**Production-proven default for true dual-codec transparent video.** Use when you must guarantee only one format downloads, or the layout
already branches per engine (desktop vs mobile crop). Prefer **B** when zero-JS and a single
container are enough.

**Package:** `bowser` (npm; production used `^2.13` / lock `2.14.x`) — a real UA/OS parser. **Never**
`navigator.userAgent.includes("Safari")` (Chrome's UA contains that substring).

**SSR null browser state (critical):**
```ts
type BrowserType = "safari" | "other" | null;
const [browserType, setBrowserType] = useState<BrowserType>(null);

useEffect(() => {
  const b = Bowser.getParser(window.navigator.userAgent);
  const isIOS = b.getOSName() === "iOS";
  const isSafari = b.getBrowserName() === "Safari";
  setBrowserType(isIOS || isSafari ? "safari" : "other");
}, []);
// Mount video ONLY when browserType !== null
```

Until the effect runs, render **no** `<video>` — avoids wrong-codec flash and hydration mismatch.
Blank frame mitigation: solid page/card hex under the slot (match your page bg), and/or a
`poster` image. Cost if JS never runs: video never appears (no Pattern B fallback) — accept that
or add a noscript/stacked-source fallback.

**Mount shape (one codec family only):**
```tsx
{browserType === "safari" && (
  <video autoPlay loop muted playsInline preload="none" className="w-full h-full object-cover block">
    {mobileSafari && (
      <source src={mobileSafari} type="video/quicktime" media="(max-width: 767px)" />
    )}
    <source src={safari} type="video/quicktime" />
  </video>
)}
{browserType === "other" && (
  <video autoPlay loop muted playsInline preload="none" className="w-full h-full object-cover block">
    {mobileWebm && (
      <source src={mobileWebm} type="video/webm" media="(max-width: 767px)" />
    )}
    <source src={webm} type="video/webm" />
  </video>
)}
```

**Data shape:** `{ webm, safari, mobileWebm?, mobileSafari? }` — keep URLs in config, not inline.

**Layout branch (production pattern):** desktop container `hidden md:block` vs mobile absolute band
`md:hidden` with different `object-position` crops — both may mount the same codec family after
detect; keep `preload="none"` so hidden trees do not eagerly pull both size tiers. CSS gradient
scrims matching the solid hex handle text legibility (edge alpha optional).

**Capability ladder (optional upgrade if UA parser lies):** after the Safari-class engine gate,
`canPlayType('video/mp4; codecs="hvc1"')` / `canPlayType('video/webm; codecs="vp9"')` then
`load()` + `play().catch`. Production **did not** ship `canPlayType` — bowser alone was
enough. Do not conflate capability strings with Pattern B's `type="video/quicktime"`.

### Pattern D — dual-track H.264 escape hatch (last resort)

When native alpha containers are unavailable and A/B/C all fail (e.g. progressive H.264-only CDN),
some pipelines ship **two H.264 tracks** (color + grayscale alpha via encode-time alpha extract) and
recombine client-side (canvas/WebGL/shader). **Not automatic in `<video>`.** Prefer true alpha A/B
or mix-blend C first. Verify codec smoke matrix (HEVC/VP9/H.264 dual-track) on a solid green page;
note VP8 dual-track paths are historically flaky.

### Pattern C — mix-blend over non-solid backdrops

`mix-blend-mode: lighten` (black encode) or `darken`/`multiply` (white encode). Creates a stacking
context — scope with section `isolation: isolate` (`css-craft.md`). Color shifts on non-black
backdrops (per-channel max mixes video chroma with bg). Soft AA edges usually good; watch for halo.
**Safari historically flaky with blend-on-video** — always real-Safari desktop+iOS check even when
Chrome looks perfect (freeze, mid-tone ghosting, stack leak into next section). **Long-page trap:**
some Safari builds stop applying `mix-blend-mode` past a tall threshold (~2k px into the document
reported in the wild) — if blend "dies" mid-scroll, test on a shorter page or switch to A/B bake.

### Responsive source selection and dual-container traps

- **`<source media>` is load-time only** (re-added ~2023; ignore obsolete "media ignored" docs).
  Mobile source **first** with `media="(max-width: 767px)"`, desktop after as fallback (same `type`
  family). Choice is made at load, not on resize — no live swap. Pattern B can stack
  mobile/desktop × quicktime/webm only when each branch is type-gated correctly; safer with Pattern
  A if layout also branches.
- **Safari can mishandle `<source media>` on video:** a production hero swaps
  sources with **JS** instead: `matchMedia('(max-width: 768px)')`, set `video.src` (or replace
  source), call `video.load()`, then `video.play().catch(...)`. Listen for `change` on the media
  query if resize must re-pick. Prefer this when a single plain-MP4 tree must change file by
  viewport and Safari ignores media attributes in your target versions.
- **Dual hidden video containers double-fetch:** `hidden sm:block` + `sm:hidden` two `<video>`s
  with `src`/`source` both may download under default preload. Mitigate (pick one): Pattern A
  conditional mount (one tree), both `preload="none"` + play only the visible one, or single
  `<video>` + `media` sources when crop is identical. Bandwidth angle: `performance.md`.
- **Size-tier plain MP4 (no transparency):** stack breakpoints largest→smallest or mobile-first
  with explicit media, e.g. `(min-width: 1024px)` / `(min-width: 768px)` / `(max-width: 767px)`,
  each with a matching poster when the LCP candidate differs by viewport. Config shape for dual-
  codec assets: `{ webm, safari, mobileWebm?, mobileSafari? }` (or plain `{ xl, lg, sm }` + posters)
  — keep URLs in data/config, not inline per section.

### CSS edge fades as alpha substitute

When only edges need to "disappear" into the page, skip dual alpha encodes: directional scrim
(absolute `linear-gradient` to page hex over the video edge, `pointer-events: none`); or
`mask-image` / `-webkit-mask-image` on the `<video>`; or inset `box-shadow` vignette matching page
bg. Verify edge pixels match page bg in Safari and Chrome — no hard rectangle at bounds.

### Universal attribute + delivery checklist

`autoPlay muted playsInline loop` always for background motion (muted + `playsInline` are the iOS
autoplay gate); `preload="none"` below the fold, a **poster image** above the fold — without
`poster`, iOS often shows an empty box (not the first frame); `#t=0.001` media fragment can force a
frame but downloads media bytes (costlier than a static poster). Strip audio at encode time —
required for autoplay reliability and saves bytes. Guard against silent autoplay refusal
(low-power mode, data saver) by calling `.play()` in an effect and handling the rejected promise.

**Decorative background video contract:** no `controls`; overlays that sit on top use
`pointer-events: none` so they don't steal taps; treat as decorative for a11y (not a second
content track — empty/`aria-hidden` on pure decoration, cite `accessibility.md`). Prefer
`object-fit: cover` + `display: block` on the video box (`css-craft.md` media-as-block) so
intrinsic gaps and letterboxing don't break layout.

### Encode implications agents must not skip (client half)

Full ffmpeg matrix lives in the optional `transparent-web-video` skill / encode scripts; this pack
keeps only **delivery-breaking** encode rules:

| Rule | Why it bites clients |
|---|---|
| Safari HEVC: `-tag:v hvc1` + `.mov` + HTML `type="video/quicktime"` | Missing any → Safari shows nothing |
| Bake hex exact match (`0xRRGGBB`, no `#`) | One digit off → visible rectangle |
| Strip audio (`-an`) | Autoplay gate reliability |
| Pattern C: pure black/white + H.264 + `-movflags +faststart` | Moov late → slow start / seek issues |
| True WebM **alpha** (Chrome/FF only): `yuva420p` + **`-auto-alt-ref 0`** | Default `yuv420p` drops alpha; VP9 alpha needs the flag — still **does not** fix Safari |
| macOS: `hevc_videotoolbox`; Linux/CI: `libx265` + same `-tag:v hvc1` | Encode fails or wrong codec on CI |
| Starting size/bitrate bands (tune per asset) | Desktop ~1080² / 1920×1080 @ ~3–4 Mbps; mobile ~540² / 640×360 @ ~1.5–2 Mbps |
| Symptom → fix | Black box = bake≠CSS; Safari empty = triad; Chrome fetches .mov = missing `type`; mid-tone ghost = leave C |

Optional full encode walkthrough: local `transparent-web-video` skill when the task is "encode
this ProRes for web" rather than "wire the player."

**Production dual-codec checklist (agents copying the working pattern):**
- [ ] `bowser` (or equivalent parser) — not bare UA `"Safari"`
- [ ] State starts `null`; no video in SSR HTML
- [ ] iOS → safari path even if the browser UI says Chrome
- [ ] Explicit MIME on every `<source>`; one codec family per mount
- [ ] Config shape `{ webm, safari, mobileWebm?, mobileSafari? }` under solid hex matching bake
- [ ] `autoPlay muted playsInline loop` + `preload="none"` below fold; strip audio at encode
- [ ] Dual layout: `preload="none"` or mount only the visible tree
- [ ] Verify Safari desktop + real iOS + Chrome network (one codec each)
- [ ] If alpha not needed: single bt709 H.264 + scrims beats dual-codec color fights
- [ ] Bake color === live CSS (don't copy an old skill example hex when the page is different)

**More silent autoplay / first-frame traps (web-verified):**
- **`prefers-reduced-motion` / iOS Reduce Motion:** OS accessibility can block autoplay even with
  muted+playsInline — treat as refused `play()`; show poster / static fallback (pairs with
  `accessibility.md` reduced-motion doctrine, don't restate the media query).
- **`preload` ladder for intentional video:** `none` below fold; `metadata` when UI needs duration
  / dimensions without full download; `auto` only for known-to-play heroes (bandwidth tax). Don't
  default everything to `auto`.
- **Never re-compress video with Gzip/Brotli** on the server — H.264/WebM are already compressed;
  double-compress burns CPU and can break ranges.
- Prefer a real **`poster` JPG/WebP** over `#t=0.001` for LCP-adjacent heroes (fragment forces early
  media bytes).

**Progressive vs MSE (thin):** short hero loops → progressive MP4 with moov early
(`-movflags +faststart`) + server `Accept-Ranges` (missing ranges break seek on Safari).
Long/adaptive → HLS (portable adaptive path; iOS historically constrained MSE vs desktop). Verify
CDN range support before relying on scrub.

**WebKit offscreen autopause:** muted autoplay may pause when scrolled out / webview hidden —
treat `pause`/`play` as racy; on re-enter call `play()` and handle rejection; don't assume
`autoplay` means still playing after scroll. Pair with IntersectionObserver play thresholds in the
scrub/media section below.

## Scroll-scrubbed and media playback runtime traps

Client traps only — seek/decode/lock/playback contracts. Choreography, easing, and scroll progress
mapping values live with animation; reduced-motion bypass → plain in-view autoplay loop (cite
`accessibility.md`, don't restate).

### Encode and delivery for scrub

- Scrub needs **short-GOP H.264 MP4**, not a normal long-GOP web encode (decoder walks from previous
  keyframe → seek jank). Recipe: `-g 2` or `-g 3` @ 30fps, `-movflags +faststart`, `-an`,
  `yuv420p`. Don't go `-g 1` unless required (~3× size).
- **WebM/VP9 fine for background loops, bad for scrubbing.**
- `fps` in any frame math must match encode fps. Probe source for CSS `aspect-ratio` before layout.
- Progressive file still needs ranges + faststart (see progressive vs MSE above).

### Body lock around playing video (Safari freeze)

**Silent failure:** classic `body { position: fixed; top: -y }` lock freezes Safari video paint
while `currentTime` advances (sometimes restarts at 0 with `loop`) — Safari only. Cause: fixed
reparent into containing block drops WebKit's video compositing layer.

**Chosen lock order of ops:** (1) `html/body { overflow: hidden }` — not `position: fixed`; (2)
measure scrollbar **before** hide → `padding-right` compensate (same as modal section); (3)
non-passive `touchmove` `preventDefault` on iOS (overflow alone still drags); (4) promote video
`transform: translateZ(0)` so the overflow toggle does not demote the GPU layer.

Alternatives that fail: wheel-only `preventDefault` (coasts past); reactive `scroll` → `scrollTo`
(violent stutter).

**Lock verification trap:** `window.scrollTo`/`scrollBy` is programmatic and **bypasses** overflow
lock — not a proxy for user lock. Assert via computed `overflow: hidden` (+ padding compensation)
or real wheel/touch. Safari freeze/momentum traps do **not** reproduce in headless Chromium —
manual Safari matrix required.

### Safari fling resume (momentum absorber)

Safari **suspends** fling during `overflow: hidden`, **resumes** on unlock → section lurches out →
IO "exit" → reset pauses video. After unlock: pin `scrollY` for **`momentumAbsorbMs ≈ 250–400`** by
clamping scroll events. **Yield to live input:** cancel absorber on `wheel` / `touchstart` / scroll
`keydown` immediately — fixed-duration pin alone fights active scrolling (bounce/stutter).
Complement (not replace) with `html { overscroll-behavior: none; }` — Safari support limited.

### Intersection / exit / play thresholds

- **Debounced exit reset ~120ms:** don't reset on first "not intersecting." Wait ~120ms, re-check
  `getBoundingClientRect()` still out of view, then reset (pause + seek scrubStart). Clear pending
  exit timer if section re-intersects — 1–2 frame overshoot otherwise tears down playback.
- **IO play threshold:** videos play at threshold ~0.25–0.5; pause when `intersectionRatio === 0`.
  `threshold: 1` rarely fires for tall videos. Separate observers for load vs play if needed
  (`js-dom-craft.md` for observer lifecycle depth). Positive `rootMargin` for prefetch; don't reuse
  play options for load.
- **Offscreen autopause:** engine + IO both pause — on re-enter always re-`play()` with rejection
  handling.

### Seek / play / prime races

- **Seek-then-play same frame:** Safari drops `play()` if issued while seeking. On handoff frame:
  do **not** scrub-seek; only hand off. `startPlayback`: if `video.seeking`, wait for `seeked`
  (once) then `play()`; **~150ms timeout** fallback if `seeked` never fires. While scrubbing: one
  seek in flight (`if (!video.seeking)`); skip seeks under ~half-frame epsilon (`1/60`s).
- **Playback watchdog:** Safari can demote GPU layer and pause without a reliable `pause` event.
  In playing/locked phases each rAF: if `!video.ended && video.paused &&
  document.visibilityState === 'visible'` → `video.play().catch(...)`. Guard `!ended` so
  `loop:false` holds last frame. Belt against dropped play — not a substitute for correct handoff.
- **iOS prime before seeks paint:** iOS won't paint `currentTime` seeks until the pipeline is primed
  by a real `play()`. On first scrub entry: muted `play()` then `pause()` once (`prime()`) —
  allowed without gesture when muted + `playsInline`.
- **`loadedmetadata` race → duration 0:** fast/local files can load metadata before React attaches
  `onLoadedMetadata` → state stuck 0, slider max=1, seeks no-op. On mount: read `video.duration` if
  `readyState` already sufficient; also listen `loadedmetadata` **and** `durationchange`.

### Geometry and scrollTo contract

- Drive progress from `getBoundingClientRect()` vs viewport center — **not** scroll deltas (iOS
  momentum, anchors, resize). Entry direction from geometry: section center below viewport center ⇒
  entered scrolling down.
- `measureRef` wrapper must have **no entrance `translateY`/transform** — distorts progress.
- Single rAF loop gated by IntersectionObserver (run only while intersecting).
- Snap-to-center / restore inside the machine must pass `behavior: 'instant'` under site
  `scroll-behavior: smooth` — `'auto'` may still animate; lock **after** snap so pin is at centered
  Y.

### Frame-accurate seek math (debug / custom scrubbers)

- Display frame N: seek to `(N + 0.5) / fps` (land mid-frame).
- Read frame from time: `Math.floor(currentTime * fps)` — **not** `round` (round of +0.5 nudge →
  N+1; one direction jumps by 2, other sticks).

### Scrub video component attrs contract

| Piece | Contract |
|---|---|
| Wrapper | `ref={measureRef}`, no entrance transform |
| Video | `ref={videoRef}`, `muted`, `playsInline`, `preload="auto"`, **no** `autoPlay`/`loop` attrs (JS owns play) |
| Layer | `style={{ transform: 'translateZ(0)' }}` on video for lock paint survival |
| Global CSS | `html { overscroll-behavior: none; }` complements momentum absorber |
| Asset | H.264 short-GOP for the scrubbed file (background loops can stay dual-codec elsewhere) |

Verify Safari gesture matrix: slow in, fast in, up-entry, scroll during unlock, leave both
directions — headless is insufficient.

## Popover API and CSS Anchor Positioning

**Silent failures:** `popover` attribute without invoker / `showPopover()` does nothing visible.
Unsupported browsers ignore `position-anchor` / `anchor()` → element positions per normal flow or
absolute containing block (misplaced UI, no error). Mixing popover top-layer with old absolute menus
double-manages focus/escape.

**Order of ops:** progressive enhance — popover for top-layer / light-dismiss; CSS anchor where
supported; fallback `@supports (anchor-name: --a)` or JS position. Don't assume top-layer z-index
fights old modals the same way. Verify Chromium vs Safari/Firefox; light dismiss and focus return.

## View Transitions wiring (browser + React layer)

### Browser API

`document.startViewTransition(updateCallback)` for same-document (SPA) transitions;
`@view-transition { navigation: auto }` for cross-document (MPA) transitions. Assign
`view-transition-name` to elements that should morph between states — names must be unique per
active snapshot, a duplicate breaks the transition. Wrap the trigger in a
`prefers-reduced-motion` check so reduced-motion becomes a no-op swap, not a suppressed animation
attempt (cite `accessibility.md`'s reduced-motion doctrine — don't restate the media query here).
The keyframes/easing/duration values applied inside `::view-transition-*` pseudo-elements are
motion values and route to the animation skill; this file owns only the mechanism.

Browser floor (verify current support before relying): Chromium 111+, Firefox 144+, Safari 18.2+;
**graceful no-op elsewhere** — never polyfill. Unsupported engines simply apply the DOM update
without a transition. Same-document landed earlier than cross-document; Level 2 types /
`:active-view-transition-type` / object-form `startViewTransition({update, types})` lag on some
engines — don't rely on types without fallback CSS. Safari 18 has reported canvas/WebGL VT bugs;
feature-detect and progressive enhance.

### React `<ViewTransition>` layer

React's `<ViewTransition>` auto-assigns `view-transition-name` and calls `startViewTransition` for
you. **Never call `document.startViewTransition` yourself when using the component** — double-start
races cancel or corrupt the transition. Without Next: needs `react@canary` / `react-dom@canary`
(not in stable React). **With Next App Router: do not install canary-react** — Next already ships
canary-react; `npm ls react` can report a stable-looking version while VT still works. Agents that
force-install canary on Next fight the framework's dependency tree.

Placement and silent-failure modes:
- **`default="none"` liberally.** A bare VT without `default="none"` fires a cross-fade on *every*
  sibling transition. Type-keyed enter/exit maps require a `default` key (TypeScript); missing
  falls back to `"auto"` and surprises you with cross-fades.
- **Nested VT under a layout VT kills page enter/exit.** A parent layout VT wrapping `{children}`
  means nested page-level VTs never fire enter/exit. Agents add both and see "nothing animates."
  Structure so page enter/exit is not nested under an always-mounted layout VT, or isolate names
  deliberately.
- **Only one mounted VT per `name`.** Reusable components rendered in a modal *and* on the page
  break shared morphs. Scope names by ID (`hero-${id}`), never a static component-local string.
- **`share` takes precedence over `enter`/`exit`.** When a pair exists, share wins; when no pair,
  enter/exit fire. Plan fallbacks. Do not fade-out exit on pages that rely on shared morphs (use a
  directional slide recipe in the animation skill).
- **Force re-enter via remounting `key` on Suspense with caution** — remounts the boundary and
  **refetches**.
- **Persistent chrome / floating UI** (header, popover, tooltip): assign a unique
  `view-transition-name` for isolation. CSS default `none` means *no* isolation, so chrome is
  captured in the `root` snapshot and flickers. Isolation names are not the same as shared morph
  names — do not reuse a morph name on chrome.
- **Backdrop-blur freeze workaround:** snapshots of blurred layers corrupt. Prefer
  `::view-transition-old(name) { display: none }` plus `::view-transition-new(name) { animation:
  none }` on the blurred surface (mechanism only; exact blur values stay with animation). Related:
  an ancestor with `opacity < 1`, certain `filter`s, or `will-change: opacity` becomes a **backdrop
  root** — child `backdrop-filter` only samples between root and child (looks like "blur does
  nothing"). Keep opacity/filter/isolation off ancestors of frosted glass; put translucency on the
  frosted element itself (`css-craft.md` owns budget/isolation floors).
- **Shared-element morphs are raster snapshots.** Large text size morphs (`h3` → `h1`) scale a
  bitmap ghost. Prefer a text-morph recipe that hides the old and shows a full-res new, not plain
  share of large type.

Next wiring: `experimental.viewTransition: true` (Next 15+ canary / 16+). `addTransitionType` and
programmatic navigation that participates in VT require Client Components.

For full depth on React/Next View Transitions (placement recipes, TypeScript maps, Next flags),
install optionally: `npx skills add vercel-labs/agent-skills@vercel-react-view-transitions`.

<!-- sources: ehmo_platform-design-skills web/SKILL.md + rules/_sections.md (MIT, attribution
required) - triage-cuellarfr-dembrandt-ehmo.md, triage-pbakaus-ehmo-web.md; dembrandt-skills
(no license, facts re-expressed; MDN/WCAG/web.dev cited) semantic-html-and-seo, sticky-and-fixed-elements - triage-cuellarfr-dembrandt-ehmo.md;
safari-mobile-optimization, transparent-web-video, scroll-driven-video (no license, re-expressed)
- miner-local.md; research-sweep-2 local-specialists C-01–C-24,C-34 (transparent pattern matrix
invert, source media load-time, dual-fetch, edge fades, Pattern A SSR null, type gate, mix-blend
Safari flake, chrome edge sampling/per-route, h-full+fill-available, hero svh clamps, PWA default
status bar, scroll-scrub short-GOP/lock freeze/momentum/seek-play/prime/watchdog/metadata/scrollTo/
attrs contract); research-sweep-2 web-media-perf C-web-30–33,C-web-35,C-web-3 (progressive/MSE,
poster/first-frame, WebKit offscreen autopause, desktop vs iOS Safari, popover+anchor silent
failures, backdrop-root thin cross-ref); emilkowalski/emil-design-eng + apple-design,
ibelick/baseline-ui (MIT) - miner-ext-b.md; x-bookmarks #1 (@devongovett iOS 26 fixed-modal
inner-viewport clip); skills-finder vercel-react-view-transitions (React VT mechanism, Next flag,
canary rule, silent failures); github-relay phuocng/html-dom (modal scrollbar width compensation
order-of-ops) -->
; fold-wave-2b: SiteLint iOS video poster/preload; VisualViewport keyboard (MDN/bram.us/WebKit); mix-blend tall-page Safari reports; fold-wave-2b: SiteLint iOS video poster/preload; VisualViewport keyboard (MDN/bram.us/WebKit); mix-blend tall-page Safari reports -->
