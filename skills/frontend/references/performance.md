# Performance

Purpose: canonical home for Core Web Vitals thresholds and fixes, resource-loading strategy (images,
fonts, hints, caching), layout-thrashing avoidance, virtualization, and bundle-size discipline: the
CWV/perf-engineering half of "frontend performance" in the charter.

Read when:
- Diagnosing or fixing LCP/INP/CLS, choosing a resource hint, loading images/fonts, or deciding a
  caching strategy.
- Reviewing code for layout thrashing, unbounded lists, or bundle bloat.
- A neighboring reference needs a CWV threshold, the responsive-images pattern, or the
  layout-thrashing rule and should cite this file.

Skip when:
- Rendering-perf specific to React (memo-defeat, hydration mismatches): use
  `react-rendering-and-rsc.md`.
- Bundle/build tool configuration (Turborepo, tsdown, Next config): use `nextjs.md` or a
  build-tooling reference.
- Accessibility implications of virtualization or motion: use `accessibility.md`.

Inputs: the surface being optimized and its current CWV/bundle measurements if available.

Produces: a fix ladder against measured or expected regressions, and code that meets the stated
thresholds.

## Contents
- Core Web Vitals
- Critical rendering path and resource hints (responsive preload, Early Hints floors, modulepreload, scanner)
- Image loading and responsive images (decoding, LQIP CLS, x vs w, EXIF)
- Font loading
- Layout thrashing and compositor-safe animation (will-change layers, shadow/SVG paint)
- Virtualization and content-visibility
- Third-party facades and adaptive loading (dual-video bandwidth, WebGL hero lifecycle)
- Bundle size, code-splitting, and resource budgets
- Caching strategy
- Measurement (RUM and CI budgets)

## Core Web Vitals

| Metric | Good | Needs improvement | Poor |
|---|---|---|---|
| LCP | <2.5s | 2.5 to 4.0s | >4.0s |
| INP | <200ms | 200 to 500ms | >500ms |
| CLS | <0.1 | 0.1 to 0.25 | >0.25 |

Supporting: TTFB <800ms, FCP <1.8s, TBT <200ms, long-task/main-thread-blocking budget around 50ms
per chunk. INP replaced FID as the interactivity Core Web Vital (March 2024) and reports the worst
interaction on a page, not the average.

Fix ladder per metric:
- **LCP:** optimize the hero asset, inline critical CSS, `<link rel="preload" as="image">` on the
  LCP element, `fetchpriority="high"` and never `loading="lazy"` on it, and stream above-fold HTML
  instead of buffering for the slowest query (a TTFB consistently above roughly 600ms is the signal
  streaming is not in use).
- **INP:** break up long tasks, `scheduler.yield()`/`requestIdleCallback` between chunks, defer
  non-critical JS, move heavy work to a worker; batch DOM reads then writes (see Layout thrashing
  below).
- **CLS:** explicit `width`/`height` or `aspect-ratio` on every media element, `font-display:
  optional` for zero-CLS fonts (or `swap` paired with `size-adjust`/`ascent-override`/
  `descent-override`/`line-gap-override` metric-matching), `contain: layout` for independent
  regions, and never inject content above existing content without reserving its space.

## Critical rendering path and resource hints

A `<script>` without `async`/`defer` halts DOM parsing; CSS blocks render but not parsing. `defer`
downloads in parallel and executes after DOM parse completes, in document order; `async` downloads
in parallel and executes immediately with no order guarantee; module scripts are deferred by
default.

Resource-hint selection, cheapest to most committed: `dns-prefetch` (20 to 120ms save) then
`preconnect` (DNS+TCP+TLS; limit to 2 to 4 critical third-party origins, since each one costs the
client's limited parallel-connection budget upfront; needs `crossorigin` for CORS) then `preload`
(requires `as`, reserve for genuinely critical assets) then `prefetch` (low priority, next-likely
navigation).

The Speculation Rules API (`<script type="speculationrules">`) prerenders a next-likely navigation
for sub-100ms perceived nav. Prefer CSS-selector-scoped document rules over static URL lists on
dynamic sites. Eagerness ladder (cheapest trigger → most aggressive):

| Eagerness | Typical trigger | When |
|---|---|---|
| `conservative` | pointerdown | Safest; lowest wasted prerender |
| `moderate` | ~200ms hover | **Recommended start** for most sites |
| `eager` | link in viewport | High-confidence next nav only |
| `immediate` | on rule load | Rare; homepage→known funnel only |

Exclude logout, checkout, destructive, and authenticated-only URLs from rules. **Side effects fire
at prerender start, not at visible navigation:** gate analytics, ads, and conversion pixels on
`document.prerendering` (skip while true) and resume on `prerenderingchange`, or they double-count
and burn budget on abandoned prerenders.

Keep the HTML plus inline-critical-CSS payload under roughly 14KB where first-paint latency matters.
That is the size of the initial TCP congestion window on a fresh connection, so anything larger
costs an extra round trip before the browser can start rendering. Domain sharding, file
concatenation, CSS sprites, and data-URI inlining are HTTP/1.1-era workarounds that are actively
counterproductive once a site is served over HTTP/2, which already multiplexes requests over one
connection. `103 Early Hints` is the modern replacement for the now-removed HTTP/2 Server Push.

**Responsive image preload.** A bare `<link rel="preload" as="image" href="hero-2000.jpg">` forces
that URL even when the matching `<img srcset>` would pick an 800w candidate — double download or
wasted bytes. Mirror selection exactly: copy `srcset` → `imagesrcset` and `sizes` → `imagesizes` on
the preload link. Image preloads default to **low** priority so they do not starve CSS/JS; LCP needs
`fetchpriority="high"` on **both** the preload and the `<img>`. Cap high-priority preloads at ~1–2
critical assets.

**103 Early Hints limits.** Early Hints only honor a narrow attr allowlist for processing
(`as`/`crossorigin`/`integrity`/`type`). `imagesrcset`, `imagesizes`, and `media` are ignored until
the document exists, so responsive image selection cannot run from 103 alone. Prefer 103 for stable
CSS/JS/font/preconnect; put responsive image preload in HTML `<link>` after viewport meta. **Safari
supports 103 preconnect but not subresource preload via Early Hints** — dual strategy: 103
preconnect critical origins + HTML `link rel=preload` for files Safari still needs cold.

**Unused preload / CORS mismatch.** Console “preloaded but not used within a few seconds” means
wrong `as`, dead URL, late use, or credentials mode mismatch. Fonts require `crossorigin` on the
preload matching the font request (font CORS mode) — without it the font downloads twice and the
preload is wasted. Do not preload stylesheets already discoverable in head; excess preloads compete
with LCP.

**`modulepreload` ≠ `preload as=script`.** For ES modules, `rel=modulepreload` fetches and
parses/compiles into the module map. `preload as=script` misses module-graph semantics and often
yields unused warnings or double work. Modulepreload the entry module plus critical static imports;
do not modulepreload lazy routes.

**Preload scanner vs late LCP.** The scanner finds markup `<img>` early; CSS `background-image` and
JS-injected heroes are late discoveries — LCP regresses unless you preload (with `imagesrcset` when
responsive) or prefer a real `<img>` LCP over a CSS background. Conversely, preloading what the
scanner already finds (common CSS in head) steals bandwidth without helping.

## Image loading and responsive images

Format order AVIF, then WebP, then JPEG/PNG (verify current browser support before assuming
AVIF-only; pair with WebP as the `<picture>` fallback). Target roughly 80% quality on photos, size
ceilings around 200KB for photos and 50KB for graphics.

`srcset` width descriptors (`400w`/`800w`/`1200w`...) must be paired with `sizes`; without it the
browser assumes `100vw` and always fetches the largest candidate regardless of actual rendered
width. Density descriptors (`1x`/`2x`) are for fixed-size elements (avatars, icons) only, not
general responsive imagery — `3x` of a 400 CSS-px slot still downloads a huge file on high-DPR
phones because `x` ignores layout width. **Never mix `x` and `w` in one `srcset`** (invalid). Prefer
`w` + accurate `sizes` for content images; match preload `imagesizes` to img `sizes` exactly (see
resource hints). When fluid CSS makes a static `sizes` string systematically wrong, measure layout
width (or use a library's `data-sizes="auto"` / equivalent) so the browser picks the right `w`
candidate — wrong static `sizes` silently overfetches. Prefer native `loading="lazy"` when sizes
are known; near-view expand of lazy sources only while the network is idle so it does not compete
with LCP. Use `<picture>` + `<source media>` only when the crop must change per viewport
(art direction); for plain resolution switching, `srcset`/`sizes` alone is the right tool.
`loading="lazy"` below the fold; never pair it with `fetchpriority="high"` on the same image, since
that is a contradictory LCP signal. Reserve `fetchpriority="high"` for the LCP candidate itself, and
always set explicit `width`/`height` (or `aspect-ratio`) to reserve layout space before the image
decodes.

**`decoding` is a paint-wait hint, not “faster images.”** It does not unblock following HTML. It
hints whether the next paint waits for decode. Defaults differ (Chrome/Safari often closer to sync
for many cases; Firefox closer to async). Sync decode of huge images can create main-thread Commit
long tasks (~tens of ms) when scrolling into view; async can flash empty when JS inserts images.
LCP/hero: size + `fetchpriority` matter more than `decoding`. JS-swapped images: `await img.decode()`
then insert (avoids flash without paint-blocking the whole page). Offscreen: async is less critical
because decode is deferred anyway.

**LQIP / blur-up CLS.** Swapping low-res → full without reserved `width`/`height` or aspect-ratio
box shifts layout when intrinsic ratios differ (e.g. square LQIP, landscape full). Prefer opacity
fade into the reserved box; do not change layout size on swap. Prefer a tiny encoded thumb with the
same aspect over CSS `filter: blur` on a full-size low-quality JPEG (paint cost trap — see Layout
thrashing). For static decorative haze, prefer **pre-blurred assets** over live large `filter: blur`
on full-viewport layers.

**EXIF orientation.** Browsers generally auto-orient `<img>` from EXIF; canvas / `createImageBitmap`
/ some pixel-buffer paths historically did not — sideways upload previews. `image-orientation: none`
disables correction. For user uploads drawn to canvas, normalize orientation server-side or via
`createImageBitmap` options; do not rely on CSS alone for pixel buffers.

**Pixel art / `image-rendering`:** engine split on `pixelated` vs `crisp-edges` — dual-keyword and
cross-browser notes live in `css-craft.md`; cite there when upscaling sprites.

Responsive-image markup mechanics (`<picture>`/`srcset` syntax, `object-fit`/`object-position` for
CLS-safe crops) are canonically homed here; `web-platform-css.md` cross-references this section
rather than restating it.

## Font loading

`font-display` value choice: `swap` for headings and non-critical text (some CLS risk); `optional`
for body text where zero CLS matters most (cached-only after first load); `block`/`fallback`/`auto`
for narrower cases. Subsetting a font to the characters actually used cuts payload 60 to 80%. Font
preload requires `crossorigin` even for same-origin fonts, since the font spec requires CORS.
Variable fonts: use the `font-weight: 100 900` range syntax and `font-variation-settings` only when
a standard property (`font-weight: 450`) cannot express the value.

## Layout thrashing and compositor-safe animation

Never interleave DOM reads (`el.offsetHeight`, `getBoundingClientRect()`) and writes in a loop.
Batch all reads into an array first, then batch all writes. **rAF dual-queue pattern (fastdom-shaped):**
one app-wide measure queue then mutate queue per frame so libraries do not thrash past each other;
dev-only strict mode that throws on un-batched layout access catches regressions; clear jobs that
race unmount. Animate only `transform`/`opacity` (the GPU compositor thread); animating
`left`/`width`/`top`/`height`/`margin` forces layout recalculation on the main thread and is
CPU-bound. Budget 16ms per frame for 60fps; use `requestAnimationFrame` for JS-driven animation, not
`setTimeout`. `IntersectionObserver` is the efficient pattern for viewport-entry detection (lazy
loading, scroll-triggered work) over scroll-event polling.

**Long tasks / INP chunking:** break main-thread work with `await scheduler.yield()` when present;
`setTimeout(0)` as a fallback **loses task priority** on Safari and can make interactive work worse.
For RUM, use `web-vitals` attribution / `onINP` LoAF script+phase breakdown rather than raw LCP/INP
numbers alone.

**`will-change` and layer explosion.** Promote only elements that will animate transform/opacity
**soon**; remove `will-change` after the animation/`transitionend`. Never blanket-promote
(`* { will-change: transform; transform: translateZ(0) }`) — multiplies GPU textures and management
cost; on low-RAM devices this is **worse** than non-promoted paint, and large overlapping promoted
layers increase overdraw. Hover storms that leave `will-change` on many cards keep layers forever
(scroll memory pressure; promoted layers can change text AA). Aim composite work roughly 4–5ms/frame
under load; verify with Chrome Layers (reason-for-layer) and Performance monitor memory.

**Paint traps: multi-layer shadow and SVG filters.** Soft multi-layer `box-shadow` and SVG
`feGaussianBlur` repaint large dirty regions; animating shadow offset/spread/blur forces paint every
frame (not compositor-only). Static 3–6 layer elevation is fine; do not animate shadow stacks on
large elements or during scroll. Hover elevation: opacity-fade a pre-blurred pseudo/image shadow or
a single transform lift — not blur/offset keyframes on multi-shadow. Prefer one soft shadow over
four stacked softs when cost shows. SVG filters with large/unbounded `filterUnits`/`filterRes` or
full-page blur can spike memory and hang the process (especially mobile Safari) with no useful
console signal: prefer CSS filter for simple blurs; if SVG filter, clamp region to element bounds +
small pad; never filter an entire infinite-scroll surface. Live large `filter: blur` / animated
blur radius on full-viewport layers is the same class of trap — prefer pre-blurred static assets for
decorative haze (see Images).

## Virtualization and content-visibility

Virtualize lists once they run past a few hundred items: render only the visible range plus a small
overscan buffer. In React, `@tanstack/react-virtual` is the current headless default; `react-virtuoso`
is the batteries-included alternative when dynamic-height, sticky-header, or infinite-scroll behavior
should come pre-built rather than hand-wired on top of a headless primitive.

`content-visibility: auto` skips the entire rendering pipeline for off-screen content and is the
single biggest lever for long off-screen sections. **It must be paired with `contain-intrinsic-size`
(or an equivalent size reservation).** Without a reserved height the browser treats off-screen
blocks as ~0px tall: the scrollbar lies, layout jumps when the section finally paints, and **CLS /
scroll position jump** follow. Prefer **`contain-intrinsic-size: auto <estimate>`** (e.g.
`auto 500px`): the estimate holds until first paint, then the browser **remembers the real size**
when the section scrolls away again — better than a bare estimate for infinite scroll and
return-trips. Bare `contain-intrinsic-size: 1000px` without `auto` never learns and can leave the
scrollbar lying if the guess is far off. Too-large estimates "bunch" at the end of a fast scroll and
force a mass layout of deferred sections — use a plausible section height, not a huge placeholder.
`contain: layout style paint` (or `strict`) isolates a component so its internal changes cannot
force layout recalculation outside it.

**WebKit + inline SVG:** after a skipped subtree becomes relevant, Safari may repaint HTML but
**not invalidate inline SVG paint** (layout OK, paths blank). Do not put `content-visibility` on
ancestors of critical inline SVG. Prefer list virtualization for long content; stacked SVG traps in
`css-craft.md`.

Virtualization has an accessibility contract, not just a DOM-count one: it must preserve item sizing,
keyboard access, and screen-reader semantics (see `accessibility.md`). Windowing that breaks Tab
order or drops off-screen items from the accessibility tree is a regression, not just an
optimization detail.

## Third-party facades and adaptive loading

Third-party scripts are often the residual bottleneck after first-party CWV work: unpredictable
main-thread cost, privacy surface, and single points of failure. Prefer `async`/`defer`; self-host
when the vendor origin is slow; remove anything without measured value. Cap critical third-party
`preconnect` origins at 2–4 (same budget as resource hints above).

**Facades / click-to-load:** do not mount heavy embeds (YouTube, maps, chat, social widgets) until
the user interacts. A lite poster + click-to-load iframe (YouTube-lite class) is often **orders of
magnitude cheaper** than an eager embed (web.dev cites ~224× for lite-youtube vs full iframe). Same
pattern for Intercom-class chat, maps, and calendars: render a static shell, load the real widget on
intent.

**Adaptive loading signals** (feature-detect; never assume presence):

| Signal | Use when constrained |
|---|---|
| `navigator.connection.effectiveType` (`'2g'`/`'3g'`) | Lower-res media; skip non-critical fetches |
| `navigator.connection.saveData` | Prefer lite assets; skip autoplay/video |
| `navigator.deviceMemory` (low GB) | Drop non-critical third-parties; thinner routes |
| `navigator.hardwareConcurrency` (low cores) | Defer heavy client work; fewer concurrent jobs |

On low-end / Save-Data paths: serve smaller images, skip non-critical third-parties, and avoid
eager chat/maps/analytics bundles. Measure third-party impact with request blocking, WebPageTest
SPOF (slow-timeout, not only hard block), and Long Task attribution to iframe `containerSrc`.

**Idle-until-urgent + viewport idle prefetch (compose with Speculation Rules):** schedule non-critical
init as idle work that forces on first access (IdleValue-shaped); use an idle queue with
`ensureTasksRun` semantics for work that must not die on a quick bounce. Content-site next-nav:
in-viewport links ∩ idle ∩ `!saveData` ∩ not slow-2g → prefetch; tune delay/threshold/throttle/limit
to avoid link-list stampede; prefer Speculation Rules for prerender when available, with exclusions
for logout/checkout (see CRP table above).

**Dual CSS-hidden video containers double download.** Responsive pattern
`hidden sm:block` + `sm:hidden` with two fully-sourced `<video>` trees can download **both** under
default preload — CSS visibility is not a fetch gate. Mitigate with one tree (conditional mount /
Pattern A), or both `preload="none"` and play only the visible one, or a single `<video>` with
`media`-gated sources when crop is identical. Runtime codec/serving pattern details:
`web-platform-runtime.md`. Verify: Network shows one media request per viewport class, not two
concurrent downloads.

**WebGL / canvas heroes.** Treat GPU canvas like third-party weight. Dynamic-import + IO before
mounting Three/r3f/canvas; pause rAF/`useFrame` when offscreen and resume on enter; cap DPR
(`Math.min(devicePixelRatio, 1.5–2)` or `dpr={[1, 2]}`); scale particle/mesh budget with viewport
and device; `pointer-events: none` on decorative canvas; dispose GL context/resources on unmount.
Static CSS gradient/grain fallback for reduced-motion and no-WebGL. Verify: main-thread idle until
hero intersects; offscreen/tab-background CPU near zero; mobile GPU not pegged.

## Bundle size, code-splitting, and resource budgets

Barrel imports (`import { x } from './index'`) pull in the whole module graph even when consuming
one export; prefer direct subpath imports. Icon/component barrels can cost hundreds of ms of
import/build time when re-export graphs are huge; use direct source imports or the bundler's
`optimizePackageImports` equivalent. A full-library import can dwarf a subpath import (a full
lodash import is roughly 70KB versus single-digit KB for the functions actually used); check for a
subpath or a smaller alternative before reaching for the whole package.

`import()` for route/interaction-based code-splitting needs a static string path for the bundler to
split on; a dynamically computed import path cannot be split. **Intent preload:** kick the dynamic
`import()` on hover/focus (or when a feature flag flips true), not only on click, so the chunk is
warm before the interaction commits — same intent window as Speculation Rules `moderate` hover.
Do not intent-preload authenticated-only or destructive routes. Render-blocking third-party scripts
need an explicit `defer`/lazy-load or facade strategy, not a bare synchronous `<script src>`.

Guidance floors for a typical content/app page (compressed transfer, not decompressed): total
payload **<1.5MB**, JS **<300KB**, CSS **<100KB**, fonts **<100KB**, third-party **<200KB**,
above-fold images **<500KB**. Treat these as CI budget starting points, not absolutes — tighten for
marketing LCP pages, loosen only with measured product need.

## Caching strategy

Cache-Control directives: `max-age` (freshness window), `no-cache` (still caches, always
revalidates; do not confuse with `no-store`, which never caches), `immutable`,
`stale-while-revalidate=N`, `stale-if-error=N`, `s-maxage` (CDN-vs-browser TTL split). `Vary: *` or
`Vary: Cookie` disables CDN caching entirely; set `Vary` deliberately. Cache-bust via a
bundler-generated content hash in the filename (for example `[name].[contenthash].js`), not a query
string.

Service workers: distinct `install` (pre-cache) and `activate` (evict stale caches on version bump)
lifecycle handlers, with an explicit per-resource-type strategy (cache-first, network-first, or
stale-while-revalidate); this cuts repeat-visit load times 50 to 90%. Back/forward cache (bfcache):
the most common blocker is an `unload` event listener. Use `pagehide`/`pageshow` instead, and keep
`beforeunload` attached only when there are genuinely unsaved changes.

## Measurement (RUM and CI budgets)

Real-user monitoring: the `web-vitals` npm library (`onLCP`, `onINP`, `onCLS`) reporting via
`navigator.sendBeacon`. CI budgets are two distinct gates that should both fail a build on
regression: bundle-size budgets (catch an accidentally heavy dependency) and runtime budgets
(Lighthouse CI assertions against the thresholds above). Pair both with production RUM, since CI
budgets alone do not catch field regressions that only show up after deploy on real networks and
devices.

<!-- sources: wondelai_skills high-perf-browser (MIT) - network fundamentals, resource hints, caching strategies, Core Web Vitals depth, streaming SSR; wondelai_skills web-typography (MIT) - font-loading mechanics; thedaviddias/Front-End-Checklist (no license, re-expressed; MDN/web.dev cited instead) - CWV thresholds, resource-hint ordering, bfcache, virtualization a11y contract, service-worker lifecycle; dembrandt_dembrandt-skills (no license, facts re-expressed; MDN/WCAG/web.dev cited) - CLS/LCP fix specifics, font-display table; ehmo_platform-design-skills (MIT) - layout-thrashing, will-change scoping, compositor-friendly animation, virtualize-long-lists; pbakaus_impeccable (Apache-2.0) - layout-thrashing, content-visibility, responsive-images cookbook; millionco/react-doctor (Modified MIT, re-expressed) - bundle-size import-shape rules, srcset/fetchpriority perf rules; miner-webdesign (MIT, ours) - CLS/object-fit mechanics referenced from web-platform-css.md; fold-wave research-extend: X @vponamariov content-visibility+contain-intrinsic-size CLS pair; Addy Osmani / web.dev third-party facades (~224× lite-youtube), adaptive loading (effectiveType/saveData/deviceMemory/hardwareConcurrency); addyosmani/web-quality-skills speculation eagerness ladder + document.prerendering analytics gate + resource size budgets; Vercel react-best-practices intent preload on hover/focus; fold-wave-2 research-sweep-2: web.dev/TuneTheWeb/DebugBear responsive preload imagesrcset+fetchpriority, Early Hints allowlist + Safari 103 preconnect-only, unused preload/CORS font double-fetch, modulepreload vs preload as=script, preload scanner vs CSS/JS LCP; Barry Pollard decoding=async paint-wait; LQIP CLS + pre-blur assets; srcset x vs w overfetch; EXIF/canvas orientation; will-change layer explosion + box-shadow/SVG filter paint hangs; dual CSS-hidden video double-fetch (C-03); WebGL hero lazy/dpr/dispose (C-32). -->
; fold-wave-2b: MDN/web.dev contain-intrinsic-size auto retained size after first paint; fold-wave-2b: MDN/web.dev contain-intrinsic-size auto retained size after first paint -->
