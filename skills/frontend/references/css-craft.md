# CSS craft

Purpose: defensive and boilerplate CSS patterns — scrollbars, overscroll containment, grid
single-cell stacking, aspect-ratio fallbacks, numeric alignment, Safari compositor traps, and
paint/texture budgets — the "keep this from breaking" layer that sits below
`web-platform-css.md`'s core layout doctrine.

Read when:
- Hiding, styling, or reserving space for a scrollbar.
- Locking scroll for a modal, drawer, or chat pane without it chaining into page scroll.
- Defensive flex wrap/gap defaults, hover-only affordances, Safari `filter` / blur paint failures, or
  inline SVG that lays out but never draws in Safari.
- Stacking elements in one grid cell (crossfades, image-plus-badge overlays) instead of absolute
  positioning.
- A `position: sticky` element inside CSS Grid silently refuses to stick.
- Choosing between the legacy padding-top intrinsic-ratio hack and `aspect-ratio`, or hitting its
  min/max sizing conflict.
- Aligning numeric columns, counters, or timers so digits don't jitter width as they update.
- Applying form/media reset micro-patterns or avoiding `transition: all`.
- Budgeting glass/`backdrop-filter`, grain overlays, soft masks, gradient borders, banding, or
  multi-layer shadows without jank; promoting layers with `will-change` without exploding GPU memory.
- Theming browser-drawn surfaces, or hardening a component against worst-case content.

Skip when:
- Breakpoints, subgrid, container queries, `:has()`, the z-index scale, cascade layers, or
  containment: `web-platform-css.md`.
- Text truncation (`line-clamp`, `min-width: 0`) or specificity discipline: `web-platform-css.md`'s
  CSS craft baseline.
- Color scheme / wide-gamut / P3 pipelines: `web-platform-css.md` Color section.
- Tailwind's `text-balance`/`text-pretty`/`tabular-nums` utility classes: `tailwind.md`.
- Type rendering (units, OpenType features, trimming, wrapping): `typography-css.md`.
- Animating anything: `ui-motion.md`.
- Dynamic viewport units (`svh`/`dvh`/`lvh`) and the 16px input-zoom floor: `web-platform-runtime.md`.
- Long-task paint budgets for box-shadow / SVG filter hangs / image decode: `performance.md`.

Inputs: the layout bug or defensive requirement being solved.

Produces: CSS that degrades safely against unexpected content, viewport, or interaction state.

## Contents
- Scrollbars
- Browser-drawn surfaces
- Overscroll containment
- Flex and gap defaults
- Hover-capable media
- Grid single-cell stacking
- Sticky-in-grid failure
- `aspect-ratio`: legacy fallback and the min/max gotcha
- Tabular numerals
- Worst-case content
- One-line modern layouts
- Safari compositor traps
- Inline SVG paint traps and SVG as an image
- Paint and texture craft
- Reset micro-patterns
- Micro-patterns

## Scrollbars

Hide the scrollbar, keep the scroll: `scrollbar-width: none;` plus `&::-webkit-scrollbar { display:
none; }` (plus `-ms-overflow-style: none;` for legacy Edge) — only where another cue (fade edge,
arrows, snap dots) signals more content. Thin styled scrollbars: `scrollbar-color: <thumb> <track>`
plus `scrollbar-width: thin`, as progressive enhancement (verify Safari); forced colors resets them
to `auto`; hand-picked thumbs contrast ≥3:1 with the track. Don't emulate a hover-reveal overlay
scrollbar — the browser's native overlay behavior is the honest default.

`scrollbar-gutter: stable` (`stable both-edges` for RTL or symmetric centring) reserves space so a
late scrollbar doesn't shift layout; apply it to `overflow: auto | scroll` containers (not
`hidden`). It also fixes the modal-open sideways shift from body `overflow: hidden`; without it,
measure scrollbar width *before* locking and compensate (`web-platform-runtime.md`, Modal body-lock
scrollbar compensation).

## Browser-drawn surfaces

Wire what the browser draws to tokens — defaults are the tell of an assembled page: `::selection`,
`caret-color`, `accent-color` on native checkboxes, radios, and ranges, `scrollbar-color`, the
focus ring, link `text-underline-offset`, `tabular-nums` in data, and `<meta name="theme-color">`.
Give native `<select>` an explicit background and text color, or Windows dark mode can render it
unreadable.

## Overscroll containment

`overscroll-behavior: contain` (or `-y: contain`) on any independently scrollable region — modal
body, drawer, chat pane — stops its scroll chaining into the page at its boundary; `none` also
suppresses pull-to-refresh and rubber-band bounce. It does nothing until scroll hits the boundary,
so default it onto every `overflow: auto | scroll` container. Tailwind's `overscroll-x-contain` is
a utility name; the raw longhand is `overscroll-behavior-x: contain`.

## Flex and gap defaults

`display: flex` doesn't wrap (`flex-wrap` defaults to `nowrap`): set `flex-wrap: wrap` whenever
wrapping is intended. For rows with a variable item count use `gap`, not `justify-content:
space-between`, which stretches a two-item or leftover row end to end; keep `space-between` for a
known fixed set whose intent is "push extremes apart".

## Hover-capable media

Gate hover-only affordances with `@media (hover: hover)` (optionally `and (pointer: fine)`): on
touch, a half-tap while scrolling leaves `:hover` stuck, so hover-revealed controls or
hover-only underlines stick half-on. Touch gets always-visible affordances or `:active` /
`:focus-visible`. `(pointer: coarse)` alone is not the gate — some coarse devices still synthesize
sticky hover.

## Grid single-cell stacking

Instead of `position: absolute; inset: 0` on every overlay layer, put `display: grid` on the parent
and `grid-area: 1 / 1` on every child (Tailwind: `*:col-start-1 *:row-start-1`). Later children
paint on top; to pin one on top regardless of DOM order (a badge over a crossfading image), use
`z-index` inside an `isolation: isolate` context (`web-platform-css.md`).

## Sticky-in-grid failure

`position: sticky` silently doing nothing has two causes: an ancestor with `overflow: hidden |
auto | scroll` (the well-known one), and, inside CSS Grid, the item's default `align-self:
stretch`, which fills the grid area and leaves nothing to stick within. Fix the second with
`align-self: start`. Check both before concluding sticky "doesn't work".

## `aspect-ratio`: legacy fallback and the min/max gotcha

Modern: `aspect-ratio: 16 / 9` with `object-fit: cover` on the media. Legacy contexts (email, AMP,
some CMS embeds) keep the padding hack — percentage padding resolves against the containing block's
*width*, so `padding-bottom: 20%` holds 5:1:

```css
.container { height: 0; padding-bottom: 20%; position: relative; }
.container > * { position: absolute; inset: 0; }
```

`aspect-ratio` applies only to the `auto` axis: explicit sizes or a `min-height`/`max-height` clamp
win on their axis and silently override the ratio (verify the exact resolution against CSS Sizing
before hardening a case into a rule).

## Tabular numerals

`font-variant-numeric: tabular-nums` fixes every digit glyph to the same advance width — apply it
to any numeric display that updates in place (timers, counters, prices, live scores, table columns)
so digits don't jitter the layout as they change. It only works if the loaded font ships the
OpenType `tnum` feature; if it doesn't, the declaration is a silent no-op with no CSS-level fallback
or detection, so verify per font or fall back to a monospace font for that element. Columns pair
`tabular-nums lining-nums` (oldstyle tabular figures still jitter vertically), right- or
decimal-aligned, with headers aligned like their column. Tailwind projects get the same effect
from the `tabular-nums` utility class (`tailwind.md`).

## Worst-case content

Feed components plausible worst cases at the data boundary (longest real string, one unbreakable
token, 0/1/many items, emoji, RTL) and fix the signature, not the symptom:

| Signature | Fix |
|---|---|
| Avatar or icon squished beside text | `flex-shrink: 0` on it |
| Text overflows its flex/grid cell | `min-width: 0` (grid `minmax(0, 1fr)`) |
| Email or URL breaks the layout | `overflow-wrap: anywhere` (never `word-break: break-all`) |
| Trailing action pushed off the row | `min-width: 0` on the text, `flex-shrink: 0` on the action |
| Badge wraps | `white-space: nowrap`, then decide what yields |
| Avatar drifts beside wrapped text | `align-items: flex-start` |
| Diacritics clipped | loosen `line-height` or drop the `overflow: hidden` clip |
| Broken avatar image | `onError` → initials (grapheme clusters, skipping Jr/Sr/II/III) |

Ellipsis always pairs with a way to read the full value; file names, paths, and hashes truncate in
the middle; numbers, amounts, and dates never truncate. Buttons and primary nav never wrap at
320–1920px: shorten the label, then `white-space: nowrap`, then collapse the row into a menu.
Keep the worst-case fixture behind a dev-only toggle as the regression test.

## One-line modern layouts

- RAM ("repeat, auto-fit, minmax") card wall: `grid-template-columns: repeat(auto-fit,
  minmax(16rem, 1fr));` — cards wrap and grow with zero media query. See web.dev's "Ten modern
  layouts in one line of CSS" (Una Kravets) and MDN's `repeat()` reference.
- Centering: `place-content: center` (or `place-items: center` for per-item centering) on a grid or
  flex container replaces the `align-items` plus `justify-content` pair for the common case.

## Safari compositor traps

Safari often will not paint an element that has a CSS `filter` unless the element is promoted to its
own compositor layer. The classic promote is `-webkit-transform: translate3d(0, 0, 0)` (or the
unprefixed form). **Vite (and some minifiers) "optimize" pure-zero `translate3d(0,0,0)` into
`translate(0,0)` or strip it**, which does *not* promote and leaves the filter invisible. Use a
non-zero epsilon on one axis: `translate3d(0, 0, 0.01px)` (or `0.01` in the third component) so the
transform survives minification. `will-change: transform` / `backface-visibility: hidden` are the
weekly-hack alternatives; prefer the epsilon translate when you only need a permanent promote for
filtered UI. Pair with the perishable support rule in `web-platform-css.md` — compositor bugs move
with engine releases.

**`filter: blur()` CPU path (Safari):** large live blur can stay on the CPU while Chrome/Firefox
stay smooth. Symptom is **jank near the blur**, not a console error. Force GPU on the **same**
element that carries the filter: pair `filter: blur(R)` with `transform: translate3d(0, 0, 0.01px)`
or a targeted `will-change: transform` on that node — promotion on a parent/sibling does not lift
the filter. Cost scales roughly with **radius × painted area**; prefer the smallest radius that
still reads soft. For large decorative haze (hero wash, full-viewport soft field), prefer a
**static pre-blurred asset** over live CSS blur. Never animate a large blur radius during scroll on
mobile. Backdrop-filter is heavier still (must render the scene behind first). Budget numbers for
glass live under Paint and texture craft below; long-task paint angles live in `performance.md`.

**`backdrop-filter` backdrop root:** an ancestor with `opacity < 1`, certain `filter`s, or
`will-change: opacity` becomes a **backdrop root**. Child `backdrop-filter` only samples content
**between that root and the child** — frosted glass looks broken or samples nothing useful while
DevTools shows the property applied. Keep opacity/filter/`will-change: opacity` off ancestors of
frosted panels; put translucency on the frosted element itself
(`background: color-mix(...)` + `backdrop-filter`), not a wrapping `opacity`. Scope with
`isolation: isolate` on the section when blend/backdrop must not leak (`web-platform-css.md`
stacking). Ship `-webkit-backdrop-filter` + `@supports not` solid fallback there too.

**Blur bleed containment:** `filter: blur` samples outside the box and paints a halo past bounds.
`overflow: hidden` often promotes an extra compositing layer; `overflow: clip` or `clip-path` can
contain the bleed with less layer memory in some engines. Practical pad: enlarge the filtered layer
slightly with compositor-only `transform: scale(1.05)` then clip; ~5% pad covers common radii
≤~30px. Verify edge overflow and Layers panel count for `hidden` vs `clip`.

**`will-change` layer explosion + persistence:** promoting every node
(`* { will-change: transform; transform: translateZ(0) }`) multiplies GPU textures and overdraw; on
low-RAM devices this is **worse** than non-promoted paint. Promote only elements that will animate
`transform`/`opacity` **soon**. **Silent failure after hover:** `will-change: transform` left on
many cards after a hover storm keeps layers forever → scroll memory pressure and grayscale AA text
on promoted layers. Apply `will-change` just before interaction (or on `:hover` of one active item)
and **clear after `transitionend`**. Composite-budget target under load is roughly mid-single-digit
ms per frame; see `performance.md` for paint long-task verification. Never leave permanent
`will-change` on a card grid. `will-change: transform` (or `filter`) also makes the element the
containing block for `position: fixed` descendants — a fixed tooltip inside stops tracking the
viewport — and opens a stacking context: name the exact animated property (`will-change: scale`),
never `all`.

**3D contexts rasterise at layout size (Chromium, verify per engine):** content under
`perspective`, `preserve-3d`, or a 3D matrix can be rasterised at its layout size and stretched, so
`scale()` above 1 on a tilted card goes soft whatever the image resolution. Lay the element out at
its shown size and push it back in Z instead.

## Inline SVG paint traps and SVG as an image

**Symptom (WebKit):** SVG has correct layout/`getBBox`; HTML siblings paint; **paths do not draw**.
Flat icon SVGs may still work. Chromium often fine — verify real Safari, not headless Chrome only.

| Trap | WebKit failure | Rule |
|---|---|---|
| Ancestor `content-visibility: auto` | After skip → relevant, HTML repaints; **inline SVG paint not invalidated** | No `content-visibility` / `contain-intrinsic-size` on ancestors of critical inline SVG. See `performance.md` |
| SVG `width`/`height`/`fill` **presentation attributes** + Tailwind v4 utilities | WebKit treats attrs as **unlayered** author CSS; unlayered beats `@layer utilities` → utilities lose | No sizing/fill presentation attrs when utilities own size/color. Use CSS `aspect-ratio` + `h-*`/`w-*` / `fill-*` |
| `<g transform="…">` (intermittent) | Transformed groups or text can vanish on some loads in WebKit's legacy SVG engine (open WebKit bugs) | Don't flatten pre-emptively; if a group vanishes in Safari, flatten its transform into path data as a workaround |
| Duplicate ids across inlined SVGs (`url(#id)` in clips, gradients, filters, masks, patterns) | Every engine resolves to the **first** in the document → the second SVG gets the first's filter or an empty clip | Prefix every id per instance, or drop redundant full-viewBox clips |
| SVGO/svgr strips `viewBox` | Paths unscaled/clipped | Keep `removeViewBox: false` (Turbopack + webpack svgr). See `nextjs.md` |

**Default inline mark:** flat paths, no transform groups, no width/height attrs, stable viewBox;
explicit fills when `currentColor` is not required. Strokes in a scaled group drift: divide widths
by the scale or use `vector-effect: non-scaling-stroke`. Abutting same-colour fills show hairline
seams at 2×: give each a thin self-coloured stroke. An SVG that must survive a host page's CSS uses
presentation attributes, not `class` or `<style>`. Animating SVG: `ui-motion.md`.

**SVG as `<img>`:** it must be well-formed XML — a valueless attribute or a stray `&` renders
nothing, because the image parser doesn't forgive what HTML does (validate with an XML parser).
Scripts don't run and page CSS can't reach in, but its own CSS animations do: inline styles in a
CDATA `<style>` scoped to the SVG's root id. Give it `width`/`height` plus `viewBox` and an `alt`;
theme with two files behind `<picture><source media="(prefers-color-scheme: dark)">`. In Next,
serve it `unoptimized`.

## Paint and texture craft

Procedural budgets only — not art direction.

**Glass / `backdrop-filter` budget**

| Constraint | Threshold |
|---|---|
| Glass panels per viewport | **Max 2–3** |
| Animate `backdrop-filter` | **Never** (static blur only) |
| Blur radius desktop | **8–15px** |
| Blur radius mobile | **6–8px** |
| Panel bg opacity | ~**8–30%** |

Include `saturate()` plus a 1px low-opacity edge and optional inset top highlight so glass reads as
material, not grey smear. Needs a busy/colorful backdrop or the effect goes dull-flat. Always ship
the `@supports not (backdrop-filter: …)` fallback, with a denser fill than the glass (roughly
0.45 → 0.6 alpha) so text keeps contrast without the blur behind it. A theme that glasses every card
exceeds this budget by design: `shadcn.md` "Solid Glass theme".

**Progressive edge blur:** stack a few `backdrop-filter` layers with stepped radii, each masked to an
overlapping band, `pointer-events: none`. Every layer is a backdrop pass and counts against the
glass budget: cost grows with band count × area, so cut steps on mobile, never animate it, and
verify scroll fps. Verify 60fps scroll on a mid-range phone
with glass in view; re-check the backdrop-root trap above when blur "does nothing."

**Frosted glass: sample content near the edge (Comeau craft).** Default `backdrop-filter: blur`
only blurs pixels *strictly under* the frosted box — content approaching the edge never softens the
glass until it is fully behind it (looks flat/unrealistic). **Order of ops:**
1. Put blur on a **child** layer, not the sticky header itself.
2. Extend that child past the visible edge (`height: 200%` for a bottom-facing sample band) so the
   blur kernel sees nearby content.
3. Trim the excess with **`mask-image` (or `-webkit-mask-image`)**, not `overflow: hidden` /
   `clip-path` — Chrome applies overflow *before* filters, so overflow clipping kills the near-edge
   sample; masks run after filters in all engines.
4. **`pointer-events: none`** on the extended backdrop child — mask is visual only; without this,
   the invisible extension steals clicks/select under the glass.
5. **Top-of-viewport color flicker:** content leaving the top edge can flash unnatural hues in the
   blur; a short solid→transparent gradient using the page bg color at the top of the backdrop
   layer hides it (elements outside the viewport are never sampled by `backdrop-filter`).
6. Readability: raise blur radius *or* semi-opaque header `background` when busy content under
   glass fights nav contrast.

**Firefox glass gotchas:** `backdrop-filter` can stop working on `position: sticky` when an
**ancestor** has both `overflow` and `border-radius` (known FF bug). Some FF builds flicker glass
sharp/blurry — `overscroll-behavior: none` on the scroll root has fixed it in the wild. Verify sticky
headers in Firefox, not only Chromium.

**Grain / noise layer:** SVG `feTurbulence` data-URI overlay at opacity **0.03–0.08** (`>0.1` reads
as broken-TV snow). Use `mix-blend-mode: overlay | soft-light | multiply`, `pointer-events: none`,
section-scoped (not full-document forever). Fine grain: `baseFrequency` ~0.6–0.9 with
`stitchTiles='stitch'`. **Never animate `feTurbulence` every frame** (CPU path); keep grain static
and animate content under it with transform/opacity only.

**Gradient borders:** an opaque fill takes `background: linear-gradient(var(--fill) 0 0)
padding-box, linear-gradient(135deg, …) border-box; border: 1px solid transparent`. A translucent
or glass fill shows that gradient through the whole box, so use a `::before` with `padding: 1px`,
`border-radius: inherit`, and `mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0
0); mask-composite: exclude` (`-webkit-mask-composite: xor`). Remove any leftover `border-color`
(double border) and keep focus on a real outline.

**Banding:** browsers render CSS gradients in 8 bits, so a ramp spanning fewer than ~30 code values
(a dark glow) shows contour rings. Fix with the static grain layer over it, or a baked dithered
plate drawn at full strength — opacity or a blend mode scales the dither away and the bands return.
Interpolate distant colours `in oklab` (the sRGB midpoint goes muddy).

**`clip-path` vs `mask-image` for soft edges:** `clip-path` = hard edge, GPU-friendly, morphable
when command counts match — good for geometric crops and inset reveals. Soft/organic alpha edges
need `mask-image` (partial alpha); `clip-path` aliases on curves. Pair either with
`object-fit: cover` and per-breakpoint `object-position` for focal framing. Prefer compositing
`clip-path: inset()` over animating mask rect width/height when the motion is a simple reveal.
`clip-path` also clips the element's own `outline` and `box-shadow`, so a clipped (chamfered)
control puts its focus ring on an unclipped wrapper or a parent `drop-shadow()`; hit-testing follows
the clip, while a chamfer only painted into the background keeps rectangular hit corners.
`clipPathUnits="objectBoundingBox"` (0–1 coordinates) makes SVG clip shapes responsive.

**Layered shadow animation tax:** 3–6 stacked `box-shadow`s are fine **static**. Animating blur,
offset, or multi-shadow stacks on large elements forces paint every frame (not compositor-only).
Hover elevation: animate a pseudo’s `opacity` or a single transform lift of a **pre-blurred**
shadow layer, not keyframed multi-shadow parameters. Dark themes: soft drop shadows vanish —
prefer inset rim + border for elevation. Cap: one soft shadow beats four stacked softs on hot
hover paths. Paint-flash verification lives in `performance.md`.

**Pixel art / nearest-neighbor upscale:** engines split on keywords — Chromium historically favors
`pixelated`; Firefox/Safari lean `crisp-edges`. **Set both** so one engine is not soft while the
other is sharp:

```css
.pixel-art {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
```

Verify a 16×16 sprite scaled to 128px across Chrome/Safari/Firefox (4×–8× upscale).

## Reset micro-patterns

- **Form controls inherit type:** `input, button, textarea, select { font: inherit; }` (or at least
  `font-size`/`font-family`) so controls do not fall back to the UA's ~13.333px and trigger iOS
  auto-zoom on focus. Pairs with the 16px input floor in `web-platform-runtime.md`.
- **Media as block:** `img, picture, video, canvas, svg { display: block; max-width: 100%; }` kills
  the mysterious ~4px baseline gap under images and stops intrinsic-width overflow.
- **`figure { margin: 0; }`:** the UA's 40px inline margins take 80px off a 390px phone.
- **Never `transition: all`.** List the exact properties you intend to animate
  (`opacity`, `transform`, `color`, …). `all` quietly animates inherited and layout properties
  (including things you did not mean to tween) and is a common source of janky theme toggles and
  unexpected width/height transitions.

## Micro-patterns

- `pointer-events: none` on a `:disabled` control reinforces the disabled treatment visually, but
  has no semantic meaning to assistive tech on its own — pair it with the real `disabled` attribute
  or `aria-disabled` styling (`accessibility.md`), never rely on it alone.
- `user-select: none` breaks copy and can interfere with screen-reader text navigation; scope it
  narrowly to drag handles and icon-only controls, never to general text content.
- `currentColor`: set `color` once and reuse it in `border`/`background-image`/anywhere else on the
  same element or a descendant, instead of repeating a literal color value.
- `color-scheme` meta/CSS must match the painted palette so native controls/scrollbars follow the
  theme — full trap list is in `web-platform-css.md` Color / Dark
  mode sections; this file only points.
- Dynamic viewport units (`svh`/`dvh`/`lvh`) and the safe-unit choice per use case are already homed
  in `web-platform-runtime.md`'s Mobile Safari section — cite it rather than re-deriving the table.
- **`:empty` whitespace trap:** `:empty { display: none }` is useful for empty error slots, but
  whitespace-only nodes are *not* empty (`<p> </p>` still matches as non-empty and stays visible).
  Keep error containers truly empty in the DOM (`:blank` ships in no engine).
- **Broken-image UX:** style failed loads so the box still communicates — e.g. `img::before` with a
  short message and `img::after { content: "(url: " attr(src) ")"; }` (or project-equivalent). Silent
  broken icons are a common CMS/agent failure mode.
- **Grid child `max-width` collapses without full track width:** a child with `max-width` (or
  Tailwind `max-w-*`) inside a `minmax(0, 1fr)` / `1fr` track shrinks to min-content instead of
  filling the track up to the cap — the column hugs text oddly. Fix: add `width: 100%` (`w-full`) or
  explicit stretch on that max-width child so it takes the track, then the max-width clamps.
- **Inline-flex button mid-phrase wrap:** `display: inline-flex` buttons wrap multi-word labels
  mid-phrase (“View / Projects”) under tight widths. Set `white-space: nowrap` on the button or its
  label text in the base component unless the design intentionally multi-lines.
- **`ch`/`em` measure caps belong on the text element:** `ch` resolves against the font of the
  element it is set on, so `max-width: 20ch` on a wrapper measures the wrapper's small body font,
  not the display heading inside it — the heading wraps a word per line and can overflow a
  fixed-height frame. Put the cap on the heading or paragraph itself.
- **Decorative layers over controls** (glow, gradient scrim, sheen, full-bleed pseudo-element) take
  `pointer-events: none` (plus `aria-hidden` on elements), or the control underneath looks live and
  does nothing. A dismissing scrim keeps its events.
- **Whole-card link:** one real link inside the card carries the name and stretches its hit area
  with `::before { position: absolute; inset: 0 }` (card `position: relative`); other controls in
  the card sit above it with their own `position: relative; z-index`. Never `onClick` on the card
  `div`.
- **Image edge:** an inset 1px `outline` (`outline-offset: -1px`) at ~10% black or white — it never
  changes size and follows the radius, unlike a border.
- **Carousels and tab panels:** equal inset at both ends at rest (`scroll-padding-inline` plus
  matching padding); a card flush to one edge with a gutter on the other means the track is wider
  than its clip box. A popover inside an `overflow: hidden` ancestor is clipped: move it to the top
  layer or a portal.
- **A token redefined on a subtree doesn't re-ink it:** `color` inherits as a computed value, so
  text below keeps the ancestor's ink — restate `color: var(--ink)` where the token is restated.
- **`<img>` with `width`/`height` attributes:** override one in CSS and the other resolves to the
  attribute's pixels (`width: 100%` on a 1920×1080 image → 1080px tall); set `height: auto` with it.
- **Phone-only breaks:** a hero grid whose rows fill height (`1fr`) needs `auto` rows on phones or
  tall screens show a hole; a short display word sized in `vw` needs `white-space: nowrap` and a
  size checked at 390px.
- **Narrow tables and print:** rows become labelled cards (`data-label` via `attr()`); a print
  stylesheet expands link URLs, breaks at sections, and hides nav and controls.
- **Fixed header, no hero:** a `position: fixed` header overlaps the first content of every route
  that lacks a full-bleed hero underneath it; give those routes a top offset equal to the header's
  block size (`--header-block-size`, the variable `accessibility.md` uses for `scroll-margin`).

<!-- sources: AllThingsSmitty/css-protips (CC0-1.0, verbatim-safe) - aspect-ratio + padding-top
legacy fallback, pointer-events:disabled, currentColor reuse, :empty whitespace, broken-image UX,
form font inherit / media block defaults; yuschick/stylelint-plugin-defensive-css
(MIT) - scrollbar-gutter and overscroll-behavior per-axis rules, user-select:none scoping;
defensivecss.dev (Ahmad Shadeed, no license, re-expressed) - scrollbar native-overlay default,
position:sticky-in-grid align-self:stretch failure, flex-wrap default, hover:hover media,
gap-over-space-between; phuocng/csslayout (MIT) - masonry/grid pattern
corroboration (not carried verbatim here, see near-misses in scout-css-github.md); MDN Web Docs
(font-variant-numeric, scrollbar-color, color-scheme, aspect-ratio, backdrop-filter,
image-rendering) - spec citations, facts only; web.dev (Una Kravets, "Ten modern layouts in one
line of CSS"; stick-to-compositor-only / layer management) - RAM card-wall / place-content,
will-change promote-only-soon; scout-css-x.md (X/Twitter posts, proprietary platform content,
re-expressed) - overscroll-behavior:contain convergence and overscroll-x-contain Tailwind-vs-CSS
naming caveat, tabular-nums multi-year convergence corroboration; x-bookmarks #2 (@Rich_Harris
Safari filter + translate3d Vite minify trap); authors-architecture Comeau modern reset
(form/media) + backdrop-filter backdrop root; emil-design-eng / skills-finder - never
transition:all; research-sweep-2 web-media-perf C-web-1–6,14 (Safari blur CPU, radius cost,
backdrop root, blur bleed/clip, will-change explosion/persistence, image-rendering dual keywords);
MDN CSS length (`ch` = advance of "0" in the element's font); anonymous production site-rebuild runs
(2026, re-expressed) - wrapper `ch` cap, fixed-header offset on hero-less routes;
research-sweep-2 local-specialists C-25–C-26, C-28–C-30, C-33 (grid max-w + w-full, button nowrap,
glass budget thresholds, grain opacity band, clip-path vs mask-image, layered shadow animation
tax); Graffino/WebDong Safari filter:blur force-GPU; SiteLint blur stay-within-container;
Josh Comeau backdrop-filter.
; fold-wave-2b: Josh Comeau backdrop-filter frosted-glass near-edge mask craft + Firefox sticky glass bugs;
WebKit inline SVG: content-visibility paint invalidation; @layer vs presentation attrs; g transform
paint-no-draw; url(#id) clip collision; SVGO removeViewBox; design-fold 2026-11 (MIT unless noted; detail in SOURCES.md): Nutlope/hallmark, majestic-ui-skill, pbakaus/impeccable (Apache-2.0) - browser surfaces, whole-card link, carousel inset, tables/print; emilkowalski/skills break-ui - worst-case table; jakubkrehel/skills - will-change containing block, decorative layers, image outline; MengTo/skills - gradient borders, progressive blur, clip-path focus/hit, SVG id/stroke/seam traps, denser glass fallback, 3D raster scale (practitioner claim); Leonxlnx/cinetic + wheresryan22/anatomy - banding; teddarific/skills - SVG as img; nateherkai/scroll-craft - subtree ink, img attributes; juliobsz/skills - phone-only breaks -->
