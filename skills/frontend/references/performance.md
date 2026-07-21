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
- Critical rendering path and resource hints
- Image loading and responsive images
- Font loading
- Layout thrashing and compositor-safe animation
- Virtualization and content-visibility
- Bundle size and code-splitting
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
navigation). The Speculation Rules API (`<script type="speculationrules">`) prerenders a
next-likely navigation for sub-100ms perceived nav; prefer CSS-selector-scoped document rules over
static URL lists on dynamic sites, and review for over-eager rules that would prerender unrelated or
authenticated pages.

Keep the HTML plus inline-critical-CSS payload under roughly 14KB where first-paint latency matters.
That is the size of the initial TCP congestion window on a fresh connection, so anything larger
costs an extra round trip before the browser can start rendering. Domain sharding, file
concatenation, CSS sprites, and data-URI inlining are HTTP/1.1-era workarounds that are actively
counterproductive once a site is served over HTTP/2, which already multiplexes requests over one
connection. `103 Early Hints` is the modern replacement for the now-removed HTTP/2 Server Push.

## Image loading and responsive images

Format order AVIF, then WebP, then JPEG/PNG (verify current browser support before assuming
AVIF-only; pair with WebP as the `<picture>` fallback). Target roughly 80% quality on photos, size
ceilings around 200KB for photos and 50KB for graphics.

`srcset` width descriptors (`400w`/`800w`/`1200w`...) must be paired with `sizes`; without it the
browser assumes `100vw` and always fetches the largest candidate regardless of actual rendered
width. Density descriptors (`1x`/`2x`) are for fixed-size elements (avatars, icons) only, not
general responsive imagery. Use `<picture>` + `<source media>` only when the crop must change per
viewport (art direction); for plain resolution switching, `srcset`/`sizes` alone is the right tool.
`loading="lazy"` below the fold; never pair it with `fetchpriority="high"` on the same image, since
that is a contradictory LCP signal. Reserve `fetchpriority="high"` for the LCP candidate itself, and
always set explicit `width`/`height` (or `aspect-ratio`) to reserve layout space before the image
decodes.

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
Batch all reads into an array first, then batch all writes. Animate only `transform`/`opacity` (the
GPU compositor thread); animating `left`/`width`/`top`/`height`/`margin` forces layout recalculation
on the main thread and is CPU-bound. Apply `will-change` only to an element about to animate, remove
it immediately after, and never apply it blanket or leave it permanently; it costs a new compositor
layer and memory for as long as it is set. Budget 16ms per frame for 60fps; use
`requestAnimationFrame` for JS-driven animation, not `setTimeout`. `IntersectionObserver` is the
efficient pattern for viewport-entry detection (lazy loading, scroll-triggered work) over
scroll-event polling.

## Virtualization and content-visibility

Virtualize lists once they run past a few hundred items: render only the visible range plus a small
overscan buffer. `content-visibility: auto` skips the entire rendering pipeline for off-screen
content and is the single biggest lever for long off-screen lists; `contain: layout style paint` (or
`strict`) isolates a component so its internal changes cannot force layout recalculation outside it.
Virtualization has an accessibility contract, not just a DOM-count one: it must preserve item sizing,
keyboard access, and screen-reader semantics (see `accessibility.md`). Windowing that breaks Tab
order or drops off-screen items from the accessibility tree is a regression, not just an
optimization detail.

## Bundle size and code-splitting

Barrel imports (`import { x } from './index'`) pull in the whole module graph even when consuming
one export; prefer direct subpath imports. A full-library import can dwarf a subpath import (a full
lodash import is roughly 70KB versus single-digit KB for the functions actually used); check for a
subpath or a smaller alternative before reaching for the whole package. `import()` for
route/interaction-based code-splitting needs a static string path for the bundler to split on; a
dynamically computed import path cannot be split. Render-blocking third-party scripts need an
explicit `defer`/lazy-load strategy, not a bare synchronous `<script src>`.

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

<!-- sources: wondelai_skills high-perf-browser (MIT) - network fundamentals, resource hints, caching strategies, Core Web Vitals depth, streaming SSR; wondelai_skills web-typography (MIT) - font-loading mechanics; thedaviddias/Front-End-Checklist (no license, re-expressed; MDN/web.dev cited instead) - CWV thresholds, resource-hint ordering, bfcache, virtualization a11y contract, service-worker lifecycle; dembrandt_dembrandt-skills (MIT) - CLS/LCP fix specifics, font-display table; ehmo_platform-design-skills (MIT) - layout-thrashing, will-change scoping, compositor-friendly animation, virtualize-long-lists; pbakaus_impeccable (Apache-2.0) - layout-thrashing, content-visibility, responsive-images cookbook; millionco/react-doctor (Modified MIT, re-expressed) - bundle-size import-shape rules, srcset/fetchpriority perf rules; miner-webdesign (MIT, ours) - CLS/object-fit mechanics referenced from web-platform-css.md. -->
