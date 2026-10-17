# Site rebuild and migration

Purpose: Rebuild an existing, owner-authorized website faithfully on a new stack (`design`'s
"reproduce" mode, `quality`'s "fidelity"): capture its render, harvest every real asset, port
structure and measured tokens, and accept the port on an objective visual-diff gate, not taste.

Read when:
- Migrating a site the client owns (WordPress, Wix, Squarespace, Webflow, a legacy custom build)
  onto a clean codebase that must look and behave the same.
- Shipping a faithful "current site on the new stack" baseline before a redesign starts from it.
- A rebuild shipped a wrong hero, a text logo, a flattened slider, or a shifted brand color.

Skip when:
- The site is being redesigned, not reproduced — visual direction is `design`'s; implement its
  handoff via `design-handoff-and-tokens.md`.
- The source is a third party's site: that is reference material for `design`, never a source to
  copy.
- The question is the general screenshot self-check on your own build → `testing.md`.
- An independent fidelity or release verdict on the rebuild → `quality`; this gate is the build's
  own acceptance check.

Inputs: the source URLs and the owner's authorization; any owner export (CMS content export, media
library, brand files); the target stack; the fidelity threshold per viewport, agreed with the
owner before the first run.

Produces: a reference capture (snapshot + per-viewport screenshots), an asset identity map, a port
on the target stack, and a parity report (score + diff heatmap per page and viewport) with every
unresolved gap listed.

## Contents
- Scope and licensing
- Port and measure, don't re-author
- Capture: render, then inventory
- Asset harvest and the identity map
- No substitution
- Porting structure, tokens, and routes
- The fidelity gate

## Scope and licensing

Rebuild only what the client owns or holds rights to, within the host platform's terms — some
sites and platforms prohibit scraping or reproduction outright, so check first. Copy and the
owner's own imagery come over under the owner's rights. Theme, template, and plugin code (a hosted
builder's template, a premium theme, a slider plugin) is licensed, not owned: re-implement it from
measurements rather than copying its source. Fonts, stock photos, icon sets, and embedded
third-party code carry their own licenses, which may not follow the site to a new host or domain —
check each before shipping it. Logos stay trademarks regardless of file license (see `shadcn.md`,
Icon libraries).

## Port and measure, don't re-author

Two honest approaches trade off. A **snapshot** (single-file archivers inline every asset into one
HTML file) is 100% faithful but keeps the old markup and scripts — it is the ground-truth reference
and a labeled stopgap, never the deliverable. A **port** re-implements the page as clean components
on the target stack — maintainable, but only as faithful as its feedback loop. Use the snapshot to
verify the port.

Re-authoring the site from a written brief and judging it by eye is what drifts: no step measures
the result against the source, so a wrong hero or a flipped button color becomes a debatable
opinion instead of a visible diff. Measure instead: tokens come from computed styles, structure from
the rendered DOM, acceptance from a pixel diff against the reference.

Capture the **rendered output, not the CMS**. Every platform paints a DOM a real browser can read;
locked hosted builders offer little or no clean export. Where the owner can export content (a CMS
export, a media library), prefer it for copy and originals, and still capture the render for
presentation. Content scrapers that return markdown or JSON carry no CSS or layout — they suit
route discovery, not fidelity capture.

Sequencing: stand up the reference capture and the diff gate **before** porting anything. A gate
that exists from the first page turns every later fix into a measurable delta.

## Capture: render, then inventory

Render each page in a real browser at every target viewport. Scroll the full page in steps so
lazy-loading fires, wait for webfonts to finish loading, then save the snapshot and the reference
screenshots. Read the **raw server HTML** as well as the rendered DOM: a cleaned or markdown-derived
variant can drop slider and video markup that was server-rendered the whole time.

Flag anomalies before accepting a capture: a page whose captured HTML is a small fraction of its
siblings', or whose body is one empty slider, is a degraded capture — retry with a realistic
desktop user agent and a longer settle wait, and mark it low-confidence if it stays thin.

Inventory per page, in rendered order: route, `<title>` and meta, headings, sections, repeated
components, embedded media. Inventory the chrome separately: the header (logo **file**, every nav
level including dropdown groups, CTAs) and the footer (links, contact, legal, social). Record every
**interactive widget** with its behavior — slider or carousel, accordion, tabs, mega-menu, sticky
header, lightbox — as an explicit field; a slider and a static image otherwise look identical to
whoever builds the port. Build the route list from the sitemap plus every nav level, and choose the
captured page set explicitly.

## Asset harvest and the identity map

`<img src>` is not the full asset set. Harvest every `srcset` candidate; lazy-load attributes
(`data-src`, `data-lazy-src`, `data-lazy`, `data-lazyload`, `data-bg`, `data-background`); inline
**and computed** `background-image: url(...)` — read computed backgrounds in the page, since
external-stylesheet backgrounds never appear in the HTML; `<video>`, `<source>`, and `poster`; CSS
background video; webfonts; inline SVG. Some slider plugins render one shared placeholder frame
in every slide's `src` and keep the real per-slide photo in a `data-*` attribute — take the
attribute, drop the placeholder. Exclude map tiles (every pan or zoom is a distinct, unresolvable
URL) and rebuild the map as an embed with a static fallback (`client-architecture.md`).

When an original refuses a plain HTTP fetch (hotlink protection keyed on `Referer`), ask the owner
for the original first; otherwise fetch it inside a browser context on the owner's site. Log every
failure — a dropped fetch is a silent missing asset later. If the site actively blocks automated
access (a bot wall, a CAPTCHA, a login gate), stop: get the originals, an export, or an
allow-listed capture from the owner, and never work around the block.

Keep one **identity map** from every rendered variant (resize-suffixed `srcset` files, CDN query
params) and the original URL to the on-disk file, and resolve every media reference through it:
map lookup → suffix-stripped original → re-fetch → else an explicit gap. Log the unresolved set.
Distinguish a truly absent asset (placeholder plus report) from one present but uncaptured
(recapture). Never place a page screenshot as a content image. A heavy source video is captured,
then web-encoded (`web-platform-runtime.md`, Background and transparent video).

## No substitution

- A captured logo renders as the image, never as a text wordmark.
- A missing asset gets an explicit, labeled placeholder and a reported gap — never a stock or
  generated stand-in passed off as the real thing. The one exception: a generated fill in a
  non-brand, non-hero decorative slot, disclosed as `generated` in provenance and approved by the
  owner. "Fix a broken image" means repairing a corrupt
  file, never swapping in a different one.
- Colors come from computed values, button and CTA states included.
- An inventoried interactive widget ships as working behavior; a static shell of a slider is a
  defect, not a simplification.
- Copy stays verbatim when the rebuild scope says so.

## Porting structure, tokens, and routes

Section boundaries follow the source's rendered layout tree, mapped onto a keyed section registry
(`client-architecture.md`). Extract tokens from computed-style frequency — palette, type scale,
spacing, radii, shadows — and feed them through the normal token pipeline
(`design-handoff-and-tokens.md`); where snapping a measured value to a clean scale shifts it,
record the delta. `@projectwallace/css-analyzer` over the old stylesheets gives the raw
distribution. Preserve each page's head and meta.

Keep routes 1:1. If routes must change, ship a permanent redirect for every old route, generated
from the captured route list rather than recalled.

**Partial rebuilds and previews.** When only some pages are built, never prune kept nav or footer
links (the chrome then reads broken) and never let them 404: route every linked-but-unbuilt internal
path to a placeholder page inside the real chrome, labeled with the link's text. Placeholder
routes carry `noindex`, stay out of the sitemap, and are listed in the gap report; served 200 in a
preview, they may return 404 inside the real chrome once the site is live. Derive the gap from
**every** nav level, dropdown groups included, and use a catch-all route so multi-segment paths
reach it. A genuinely unknown route still 404s; once every page is built the
placeholder is inert.

## The fidelity gate

Render the port and the reference in the same browser, at the same viewports, with the same
emulated media (color scheme, reduced motion) on both sides, in the same environment —
rendering varies with host OS, browser version, and installed fonts, so baselines are per browser
and platform. Diff the screenshots (Playwright's `toHaveScreenshot()` uses pixelmatch;
odiff is a SIMD diff engine that Argos and Lost Pixel use), score parity per page and viewport, and
emit the diff heatmap as the report. A page passes only with no failed asset requests or console
errors on the port.

- Fix the threshold per viewport **before** the first run; a number agreed afterwards gets
  negotiated down.
- Resting state is checked by the diff; behavior by a scripted interaction (open the menu, advance
  the slider, submit the form).
- On a failure, fix the offending region, rebuild, re-diff, for a bounded number of rounds.
- A literal 100% on a clean stack is rare (webfont hinting, sub-pixel rounding, script-driven
  widgets). A section that cannot reach the threshold is flagged in the report; embedding the
  snapshot fragment is allowed only as a labeled stopgap, and only when that fragment's code is the
  owner's or its license permits it.
- The gate is a number: a wrong hero or flipped color is diff pixels, never an acceptable
  stand-in. Taste critique is a separate lens.

Generative URL- or screenshot-to-code tools give approximate scaffolds and never replace the
gate.

<!-- sources: anonymous production site-rebuild runs (2026, re-expressed) — re-authoring drift,
raw-vs-cleaned HTML media loss, thin-page anomaly, lazy/computed-background harvest, slider
placeholder frames, map-tile exclusion, Referer-gated originals, identity map + screenshot-as-media
failure, logo/stock/slider substitution failures, partial-preview placeholder route (nested nav +
catch-all); MDN getComputedStyle; playwright.dev/docs/test-snapshots (pixelmatch, environment-specific
baselines; verified 2026-10-17); github.com/dmtrKovalenko/odiff (MIT; SIMD; used by Argos and Lost
Pixel; verified 2026-10-17); gildas-lormeau/single-file-cli (AGPL-3.0) and Y2Z/monolith (CC0-1.0)
single-file archivers (verified 2026-10-17); projectwallace/css-analyzer (MIT);
JCodesMore/ai-website-cloner-template README (MIT; "rebuild a site you own"; terms-of-service
check; verified 2026-10-17). -->
