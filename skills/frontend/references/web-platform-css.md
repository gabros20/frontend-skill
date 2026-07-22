# Web platform CSS

Purpose: canonical home for modern CSS layout mechanisms, the perishable-support authoring rule, and
the content-driven breakpoint doctrine every web stack inherits.

Read when:
- Choosing a breakpoint set, a fluid-sizing formula, or a modern CSS layout mechanism (grid,
  subgrid, container queries, `:has()`).
- Debugging margin collapse, stacking contexts / z-index locality, or dark-mode CSS mechanism
  (`light-dark()` vs dual token blocks, `color-scheme` meta/CSS match).
- Authoring OKLCH / Display-P3 tokens, gamut gates, or a consistent image color-management pipeline.
- Writing a browser-support claim in any reference or code comment.
- A neighboring reference needs the rem-breakpoint doctrine or a CSS-layout mechanism and should
  cite this file.

Skip when:
- Tailwind's px breakpoint scale or its `@theme` token wiring: use `tailwind.md`.
- Responsive-image markup (`srcset`/`sizes`/`picture`) and CWV-driven image rules: use
  `performance.md` (color-management for tagged rasters stays here).
- CSS logical properties' full mapping table and RTL specifics: use `i18n.md`.
- SPA routing, service workers, safe-area, View Transitions wiring: use `web-platform-runtime.md`.
- Safari compositor / glass / grain paint craft: use `css-craft.md`.

Inputs: the layout or breakpoint problem being solved and the project's actual browser-support bar.

Produces: working modern CSS with a stated fallback where support is uncertain.

## Contents
- Perishable browser-support rule
- Breakpoints and fluid CSS
- Modern layout (grid, subgrid, container queries, `:has()`, `@property`, containment, cascade
  layers)
- Margin collapse
- Stacking contexts and z-index
- Dark mode (CSS mechanism)
- Color (OKLCH, gamut, color-management)
- CSS craft baseline

## Perishable browser-support rule

Never hard-code a browser version as a settled fact; support tables move fast and go stale inside a
reference's shelf life. State the feature, its progressive-enhancement fallback, and "verify current
support (caniuse/MDN) before relying on it." This applies to every claim below that names a modern
CSS feature, and pack-wide to any other browser-version claim.

## Breakpoints and fluid CSS

Core doctrine: content-driven rem breakpoints, not device gospel: `30rem` / `48rem` / `64rem` /
`80rem` (roughly 480/768/1024/1280px at the default 16px root). `rem` respects browser zoom and a
user's root font-size setting, which a fixed px breakpoint does not; that is a real accessibility
property, not just convention. Tailwind's own px scale (`640`/`768`/`1024`/`1280`/`1536`) is that
stack's separate mapping; see `tailwind.md`, and do not mix the two doctrines in one project.
Ultra-wide containment: cap page-width content around 1200 to 1600px on web (Material's equivalent
is roughly 1040dp) rather than letting text or layout stretch to the full viewport on very wide
screens.

Fluid values via `clamp(MIN, PREFERRED, MAX)`, for example `clamp(1.75rem, 1.2rem + 2vw, 3rem)`. The
preferred term must mix a `vw` unit with a `rem` unit: a `vw`-only preferred value breaks
browser-zoom accessibility (fails WCAG 1.4.4, Resize Text) because it never grows past the viewport
regardless of the user's zoom or root font-size. Always keep a `rem` anchor in the preferred term
and set a sane `MIN` so mobile stays readable. Container queries (`container-type: inline-size` plus
`@container (min-width: ...)`) solve the case media queries structurally cannot: a component's
appearance needs to depend on its own available space, not the viewport. A sidebar-embedded card and
a full-width one need different internal layout at the same viewport width.

## Modern layout

- **Subgrid** lets a nested grid item inherit its parent's grid tracks, solving cross-card
  title/content/footer misalignment natively and replacing JS height-matching or
  `display: contents` hacks. It requires the child to actually be a grid item of the named-line
  parent; names do not pass through an intermediate non-grid wrapper.
- **Full-bleed breakout grid:** `grid-template-columns: 1fr min(42rem, 100%) 1fr`; content defaults
  to the center column (`grid-column: 2`), breakout elements span all (`grid-column: 1 / -1`,
  count-from-end and future-proof against added columns). Avoid `100vw` for full-bleed sections: it
  ignores scrollbar width and causes horizontal scroll; the breakout grid sidesteps the problem
  entirely. A multi-tier variant uses named grid lines with concentric zones (`full`/`feature`/
  `popout`/`content`) and `clamp()`/`minmax()` gutters for graduated widths from one grid.
- **`minmax(0, 1fr)` vs. bare `1fr`:** bare `1fr` will not shrink below its content's min-size, so
  long content or an oversized image blows out the track. Always use `minmax(0, 1fr)` in a
  12-column or bento-style grid.
- **Bento/masonry-style grids:** `grid-auto-flow: dense` backfills gaps left by mixed-size cards but
  can reorder tiles away from DOM order; never rely on visual order for tab order or reading order.
  `grid-auto-rows: 1fr` on mobile creates large empty gaps, so restrict equal-height rows to desktop
  via a min-width query. Native `grid-template-rows: masonry` is not universally shipped (per the
  perishable rule above); feature-detect with `@supports` and fall back to an `aspect-ratio`-driven
  row-span trick (`grid-auto-rows: 8px` plus `grid-row: span var(--span)`). Masonry's visual reflow
  can scramble keyboard and screen-reader order, so keep DOM order logical regardless.
- **`:has()`** replaces JS class-toggling on a parent based on a child's state, moving that coupling
  back into the stylesheet. Flag complex `:has()` selectors in hot reflow paths for a performance
  check.
- **`@property`** turns a custom property from an untyped string macro into an animatable,
  type-checked value; required for smoothly interpolating a custom-property-driven gradient or
  animation (unregistered custom properties transition as discrete string swaps, never smoothly).
  `inherits: false` scopes a token so it does not cascade to children, useful for component-local
  design tokens.
- **Cascade layers** (`@layer reset, base, components, utilities;`) give explicit, order-independent
  specificity control: an un-layered style always beats a layered one regardless of specificity, and
  layer declaration order, not source order within a layer, decides ties between layers.
- **Containment:** `contain: layout style paint` (or `strict`) tells the browser a component is
  render-isolated, so its internal changes cannot force a layout recalculation outside it;
  `content-visibility: auto` goes further and skips the whole rendering pipeline for off-screen
  content (see `performance.md` for the virtualization use case this enables).
- **Defensive multi-column grid:** never ship a bare fixed-track split like
  `grid-template-columns: 250px 1fr` without a min-width media/container query. On narrow viewports
  the fixed track plus content forces horizontal scroll. Gate the multi-column template behind a
  min-width breakpoint (or use `minmax(0, 1fr)` / auto-fit RAM patterns from `css-craft.md`) so
  single-column is the default under the gate.

## Margin collapse

Vertical margins collapse under block layout; horizontal never do. Collapse is a common source of
"why is my section not flush?" and "why is this gap half what I set?" bugs.

Rules of thumb (Comeau):
1. **Vertical only** — left/right margins never collapse.
2. **Adjacent in the box tree** — intervening content (even an empty `<br>`) blocks collapse.
3. **Bigger wins** when both are positive; not additive. More than two margins can share one gap
   (parent bottom + child bottom + next parent top + next child top); the largest positive wins.
4. **Nesting does not prevent collapse** — a child's margin can "escape" through its parent. Margins
   control sibling distance, not parent padding. Classic trap: parent `margin-top: 0` still collapses
   with the first child's top margin (0 is a collapsible margin), so the child's top margin pulls
   the parent down.
5. **Barriers that stop collapse:** padding or border between the two margins; a fixed height that
   creates empty space; any `overflow` other than `visible` (scroll containers).
6. **Negative margins:** most significant positive + most significant negative (signed sum); mixed
   signs cancel rather than "bigger absolute wins."
7. **Flex, grid, and out-of-flow: margins never collapse.** Prefer `gap` for spacing in flex/grid
   instead of vertical margins between items.

When you need a guaranteed non-collapsing gap between a parent and its first/last child, use padding
on the parent (or a border/overflow barrier), not a margin you hope will "hold."

## Stacking contexts and z-index

Maintain one named z-index token scale for the whole project rather than ad hoc numbers per
component. Prefer `position: sticky` over `position: fixed` when the element should still
participate in document flow until it needs to pin; compensate a sticky header's height with top
padding on the content below it, and combine top and left sticky on a single cell for sticky table
headers.

**z-index is local to a stacking context, not global.** Children are flattened with their
ancestor: a `z-index: 9999` inside a lower context cannot paint above a sibling context with a
higher ancestor. Giving an element a z-index both lifts it *and* creates a context that traps its
descendants — intentional side effect.

Common context creators agents forget (no exhaustive list; verify current CSS):
- `opacity` less than 1
- `position: fixed` or `sticky` (z-index not required)
- `transform`, `filter`, `clip-path`, `perspective`, `will-change: opacity|transform`
- `mix-blend-mode`, `isolation: isolate`
- Flex or grid *child* with a z-index

**z-index does not require `position` on flex/grid children** — those layout algorithms honor
z-index independently of Positioned layout. Requiring `position: relative` everywhere is a
positioned-layout habit that does not apply inside flex/grid.

**`isolation: isolate` for component airtightness:** seal a reusable component's internal z-index
layers without baking a global `z-index: 1` into the component API. Prefer isolate over inventing
token numbers for every nested chrome piece. Still required (not decorative) to scope
`mix-blend-mode` or `backdrop-filter` to one section; without it, the effect leaks across sibling
sections.

Ship `-webkit-backdrop-filter` alongside the standard property, plus a
`@supports not (backdrop-filter: blur())` solid-background fallback. `background-attachment: fixed`
is broken on iOS Safari; prefer a transform-based or `animation-timeline: scroll()` approach for any
parallax-adjacent effect instead (the parallax effect itself is design/animation's call; this is a
compatibility fact). A full-bleed element inside a transformed or sticky ancestor gets clipped;
isolate the stacking context, or use the breakout-grid method above instead of a raw `100vw` trick.

## Dark mode (CSS mechanism)

Two viable paths; pick one per project and do not mix styles casually.

**Dual custom-property blocks (classic):** `prefers-color-scheme: dark` gates a set of CSS custom
properties redefined per theme; a `data-theme` attribute plus `localStorage` layers a manual
override on top of the OS-preference default. `<picture>` plus
`media="(prefers-color-scheme: dark)"` swaps theme-specific images.

**`light-dark()` + root `color-scheme` (modern path):** declare `color-scheme: light dark` on
`:root` (or `html`) and set colors with `color: light-dark(<light>, <dark>)` (and the same for
backgrounds/borders). The browser owns OS sync, and native form controls/scrollbars follow
`color-scheme`. A manual theme toggle becomes: override `color-scheme` to `light` or `dark` (plus
persist the preference) rather than redefining every token block. Best for palettes that are simple
paired light/dark values; complex multi-brand token graphs still fit the dual-block path better.
Verify current support (caniuse/MDN) per the perishable rule above; progressive-enhance by keeping
a single-theme fallback outside `light-dark()`.

**`color-scheme` must match the painted palette.** Page CSS can go fully dark while native
controls, scrollbars, and system colors stay light if `color-scheme` / the meta tag is missing or
wrong — unreadable inputs on dark pages. Set `<meta name="color-scheme" content="light dark">`
early in `<head>` and mirror with `:root { color-scheme: light dark; }` (or the single scheme the
page actually paints). Pair `theme-color` media variants with the same scheme. **`only dark` is
invalid** — browsers ignore it and fall back to light. Declare `color-scheme` either path
(mechanism only; `prefers-contrast` / `forced-colors` a11y semantics are `accessibility.md`'s).
Re-verify contrast in the dark palette explicitly; it is not just an inversion of the light one
(see `accessibility.md`'s contrast table).

## Color (OKLCH, gamut, color-management)

**OKLCH tokens:** `oklch(L C H)` is the practical perceptually-uniform color space for a CSS
design-token system: equal steps in `L` look equal to the eye regardless of hue or chroma, unlike
HSL, where the same lightness delta reads very differently per hue. Treat OKLCH as the default
choice for a new token system rather than hex or HSL.

**Wide-gamut gate:** write brand-critical wide colors inside `@media (color-gamut: p3)` as
`color(display-p3 …)` or higher-chroma OKLCH, with **sRGB fallbacks outside** the query. Writing
`color(display-p3 …)` without the gate still "works" on non-P3 displays by mapping/clamping
differently across engines → **Safari-vs-Chrome hue mismatch** when one path is tagged P3 and the
other is sRGB hex. Never assume CSS hex equals a photo's P3 grade. Verify with
`matchMedia('(color-gamut: p3)')` and the same swatch on a P3 Mac Safari vs an sRGB external
monitor.

**Gamut map vs channel clip:** when publishing P3 tokens or design-tool colors down to sRGB
fallbacks, **do not naive-clip** R/G/B channels (hue shifts and neon collapse). Map gamut
(perceptual/colorimetric intent in the design tool or a library) or author dual tokens under the
`color-gamut: p3` query. Prefer an `inGamut()`-style check before shipping a value into a smaller
space; preserve round-trip fidelity in the design export path.

**Raster color-management pipeline — pick one; don't mix naively:**

| Pipeline | Rule |
|---|---|
| **A — strip-to-sRGB** | Untag / convert assets to sRGB; consistent web chrome + photos across engines |
| **B — intentional P3** | Embed Display-P3 profile; serve under P3-aware `<picture>` / CSS only |

Untagged JPEG/PNG are assumed **sRGB**. P3-tagged assets render wider on color-managed
Safari/macOS; Chrome may match or clip depending on format/profile → hero photo "more vivid on
Safari." WebP/AVIF P3 tagging remains flaky on some Safari paths. Do not mix untagged sRGB UI
chrome with P3 photos without an intentional grade. Verify: same file in Preview vs Safari vs
Chrome; strip-profile A/B on the hero.

**Display-P3 SVG as repeating background desaturates (Chrome/Safari):** an SVG that uses
Display-P3 fills, used as a **repeating** CSS `background-image`, is forced to sRGB — colors
silently dull. Non-repeating may still be wide-gamut. Avoid `background-repeat` for P3 SVG; use
inline SVG, a single non-repeat tile, or a raster with an explicit profile. Verify fill in the DOM
vs the same SVG as a repeating background on a P3 display.

## CSS craft baseline

- **Text truncation:** single-line `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`;
  multi-line `-webkit-line-clamp` plus `-webkit-box-orient: vertical` plus `overflow: hidden`; safe
  wrap `overflow-wrap: break-word; hyphens: auto`. `min-width: 0` on a flex/grid child is required
  for any of this to work; without it, the child will not shrink below its content's intrinsic size.
- **Specificity discipline:** classes over IDs, cap selector nesting around 3 levels, `!important`
  as a last resort for utility overrides only, `:where()` to apply a rule at zero specificity when
  needed.
- **A build that lints clean can still have lost its tokens:** some CSS minifiers choke on a literal
  `*` inside a comment near a token block (for example `--spacing-*` in prose near `@theme`) and
  silently drop the whole block while only warning. Treat any such parser warning as a hard failure
  and verify tokens are actually applied via computed styles, not just a green build.
- **Container-token collision:** if a global stylesheet already owns `--container-*`/`--spacing-*`
  custom properties feeding `max-w-*`-based layout, a per-project theme file must not redefine or
  remove that block, or layout collapses site-wide (see `tailwind.md`'s `@theme` mechanics for the
  Tailwind-specific version of this gotcha).

<!-- sources: ehmo_platform-design-skills (MIT) - content-driven breakpoints, fluid CSS/clamp, container queries; pbakaus_impeccable (Apache-2.0) - breakpoint conflict note; thedaviddias/Front-End-Checklist (no license, re-expressed; MDN/web.dev cited) - container-queries, @property, containment, :has(), subgrid, specificity, dark-mode-css, color-oklch; miner-webdesign (MIT, ours) - breakout/bento/subgrid grid mechanisms, stacking-context gotchas (isolation, backdrop-filter fallback, background-attachment:fixed), container-token collision, minifier-comment gotcha, text-truncation cookbook; dembrandt_dembrandt-skills (no license, facts re-expressed; MDN/WCAG/web.dev cited) - z-index scale, sticky/fixed decision rule; wondelai_skills web-typography (MIT) - clamp() fluid-typography formula; authors-architecture Josh Comeau margin-collapse + stacking-context full model; Ahmad Shadeed defensive multi-column grid gate; x-bookmarks #9 light-dark() + color-scheme modern dark-mode path; research-sweep-2 web-media-perf C-web-9–12 (color-scheme meta/CSS match + only-dark invalid, color-gamut:p3 gate, untagged rasters sRGB vs P3-tagged divergence, Display-P3 SVG background-repeat desaturate bug); web.dev color-scheme; MDN meta color-scheme / color-gamut; WebKit wide-gamut P3; Chrome HD color guide; tylergaw.com Display-P3 background-repeat bug (2026). -->
