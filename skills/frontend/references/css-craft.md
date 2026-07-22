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
- Budgeting glass/`backdrop-filter`, grain overlays, soft masks, or multi-layer shadows without
  jank; promoting layers with `will-change` without exploding GPU memory.

Skip when:
- Breakpoints, subgrid, container queries, `:has()`, the z-index scale, cascade layers, or
  containment: `web-platform-css.md`.
- Text truncation (`line-clamp`, `min-width: 0`) or specificity discipline: `web-platform-css.md`'s
  CSS craft baseline.
- Color scheme / wide-gamut / P3 pipelines: `web-platform-css.md` Color section.
- Tailwind's `text-balance`/`text-pretty`/`tabular-nums` utility classes: `tailwind.md`.
- Dynamic viewport units (`svh`/`dvh`/`lvh`) and the 16px input-zoom floor: `web-platform-runtime.md`.
- Long-task paint budgets for box-shadow / SVG filter hangs / image decode: `performance.md`.

Inputs: the layout bug or defensive requirement being solved.

Produces: CSS that degrades safely against unexpected content, viewport, or interaction state.

## Contents
- Scrollbars
- Overscroll containment
- Flex and gap defaults
- Hover-capable media
- Grid single-cell stacking
- Sticky-in-grid failure
- `aspect-ratio`: legacy fallback and the min/max gotcha
- Tabular numerals
- One-line modern layouts
- Safari compositor traps
- Inline SVG Safari paint traps
- Paint and texture craft
- Reset micro-patterns
- Micro-patterns

## Scrollbars

Hide the scrollbar, keep the scroll, cross-browser triad: `scrollbar-width: none;`
(Firefox/modern Chromium) plus `&::-webkit-scrollbar { display: none; }` (Safari/older Chromium)
plus `-ms-overflow-style: none;` (legacy Edge). Caveat: hiding the scrollbar removes an affordance
sighted pointer users rely on to notice more content exists — hide it only where another visual cue
(fade edge, arrows, snap dots) already signals scrollability.

Styled thin scrollbars, standards-based: `scrollbar-color: <thumb> <track> | auto;` plus
`scrollbar-width: auto | thin | none;`. Verify current Safari support before relying on it and treat
it as progressive enhancement, not the only scrollbar affordance; in forced-colors mode the browser
overrides to `scrollbar-color: auto` regardless of author styles. Contrast the thumb against the
track at least 3:1 when hand-picking colors (WCAG G183). No verified custom hover-reveal
overlay-scrollbar pattern exists in current sources — the honest default is the browser's native
overlay behavior (e.g. macOS "show scrollbars only on scroll"); don't ship an unverified emulation
of it.

`scrollbar-gutter: stable` (also `stable both-edges`) reserves scrollbar space in advance so a
later-appearing scrollbar doesn't shift layout or re-wrap text. Apply it to any container styled
`overflow: auto | scroll`; skip it on `overflow: hidden`, which has nothing to reserve. Use
`both-edges` when a scrollbar might appear on either edge (RTL layouts) and centering must stay
symmetric. This also fixes the classic modal-open sideways content shift caused by body
`overflow: hidden` removing the page scrollbar. When `scrollbar-gutter` is unavailable or
insufficient, measure scrollbar width *before* locking overflow and compensate with margin/padding
— order of ops in `web-platform-runtime.md` (Modal body-lock scrollbar compensation).

## Overscroll containment

`overscroll-behavior-y: contain` (or the shorthand `overscroll-behavior: contain`) on any
independently scrollable region — a modal body, a drawer, a chat pane — stops that region's scroll
from chaining into page scroll once it hits its own boundary. `overscroll-behavior: none` also
suppresses the pull-to-refresh/rubber-band bounce where that's undesirable. The property has no
effect until scroll actually reaches the boundary, so it's safe to apply broadly: pair it with
`overflow-y: auto` on the same element, and default to it on any `overflow: auto | scroll`
container. Distinguish from Tailwind's utility name `overscroll-x-contain`, which maps to the raw
`overscroll-behavior-x: contain` longhand — don't copy the utility class name into raw CSS.

## Flex and gap defaults

`flex-wrap` defaults to `nowrap`. `display: flex` alone does not wrap: when space is tight, items
overflow or force scroll instead of wrapping. Whenever wrap is the intended behavior, set
`flex-wrap: wrap` explicitly (or the Tailwind `flex-wrap` utility).

Prefer `gap` over `justify-content: space-between` for rows with a **variable item count**.
`space-between` looks fine with a fixed, full row; with two items on one breakpoint and five on
another (or a last row with a single leftover), it creates awkward end-to-end stretches and
inconsistent inter-item spacing. `gap` keeps spacing stable regardless of count; use space-between
only when "push extremes apart" is the actual design intent for a known fixed set of children.

## Hover-capable media

Gate hover-only affordances with `@media (hover: hover)` (optionally combined with
`(pointer: fine)`). On touch devices, a half-tap while scrolling can leave `:hover` sticky until
the next tap elsewhere, so hover-revealed controls, underline-on-hover links as the only affordance,
or hover-dependent opacity can stick in a half-state. Apply hover styles only when the primary input
can hover; for touch, use always-visible affordances or `:active`/`focus-visible` instead. Do not
confuse this with `@media (pointer: coarse)` alone — some devices report coarse pointer but still
synthesize sticky hover.

## Grid single-cell stacking

Replace `position: absolute; inset: 0` boilerplate on every overlay layer: put `display: grid` on
the parent, then give every child `grid-area: 1 / 1` (end lines default to `auto`, so all children
land in the same cell). Paint order follows DOM order — later children sit on top by default.
Tailwind form: `col-start-1 row-start-1` per child, or the arbitrary-child-variant shorthand
`*:col-start-1 *:row-start-1` on the parent. Grid-stacking only controls layout position, not paint
order — if a child must guarantee it sits on top regardless of DOM order (a badge over a
crossfading image), add `z-index` inside an `isolation: isolate` stacking context (see
`web-platform-css.md`), or reorder with `order` rather than moving markup.

## Sticky-in-grid failure

`position: sticky` silently doing nothing has two distinct causes, and only one is well known: an
ancestor with `overflow: hidden | auto | scroll` clips the scroll container the sticky element would
stick within (the classic cause). Less known: inside CSS Grid, a grid item's default
`align-self: stretch` stretches the sticky element to fill its grid area's full height, leaving it
nothing to stick relative to inside its own box. Fix: `align-self: start` alongside
`position: sticky; top: ...`. Check both causes before concluding sticky "just doesn't work" on a
grid layout.

## `aspect-ratio`: legacy fallback and the min/max gotcha

Modern: `aspect-ratio: 16 / 9` paired with `object-fit: cover` on the media so intrinsic content
doesn't distort the box. Legacy padding-percentage fallback, still needed for pre-`aspect-ratio`
rendering contexts (email, AMP, some CMS embeds):

```css
.container { height: 0; padding-bottom: 20%; position: relative; }
.container > * { position: absolute; inset: 0; }
```

Percentage `padding` (including `padding-bottom`) resolves against the containing block's *width*,
not its height — that's what makes a 20% bottom-padding hold a 5:1 ratio at any viewport width.

Gotcha: `aspect-ratio` only applies to whichever dimension is `auto`-sized. If both dimensions (or
an explicit `min-height`/`max-height`) are set, the explicit values win and the ratio is silently
overridden on that axis — a box with `aspect-ratio` plus a `min-height` clamp does not automatically
satisfy both at once. The existence of this conflict is settled; verify the precise resolution
order against the CSS Sizing spec before hardening a specific case into a rule.

## Tabular numerals

`font-variant-numeric: tabular-nums` fixes every digit glyph to the same advance width — apply it
to any numeric display that updates in place (timers, counters, prices, live scores, table columns)
so digits don't jitter the layout as they change. It only works if the loaded font ships the
OpenType `tnum` feature; if it doesn't, the declaration is a silent no-op with no CSS-level fallback
or detection, so verify per font or fall back to a monospace font for that element. Tailwind
projects get the same effect from the `tabular-nums` utility class (`tailwind.md`).

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
`will-change` on a card grid.

## Inline SVG Safari paint traps

**Symptom class (macOS/iOS Safari, including Safari 26):** SVG box is in the DOM with correct
geometry (`getBBox` / layout size OK); neighboring text paints; **paths never draw** (looks like
color/`currentColor`/black-on-black). Neighboring **flat** icon SVGs may still work. Chromium often
tolerates every trap below — **QA real Safari**, not headless Chrome alone. Bugs stack: fixing one
can unmask the next.

| Trap | WebKit failure | Do this |
|---|---|---|
| Ancestor `content-visibility: auto` | After skip → relevant, HTML repaints; **inline SVG paint not invalidated** — empty box | Do **not** put `content-visibility` / `contain-intrinsic-size` on sections that hold inline SVG (footer/hero logos). Perf win is tiny; paint is zero. Depth in `performance.md` |
| SVG `width`/`height` (or `fill`) **presentation attributes** + Tailwind v4 utilities | WebKit treats attrs as **unlayered** author CSS; unlayered beats `@layer utilities` → utilities lose (huge intrinsic size / wrong fill). Spec: attrs sort below author styles; Chrome/FF mostly do | **No** `width`/`height`/`fill` attrs on SVGs you size/color with utilities. Size with **CSS** `aspect-ratio` + `h-*`/`w-*`; color with CSS `fill` utilities |
| `<g transform="…">` wrappers (scale/translate lockups) | Correct bbox; **group contents never paint** | Flatten transforms into path coordinates (bake absolute coords). Prefer flat `<svg><path/>…` like working social icons — no transform groups on critical logos |
| Shared `clip-path="url(#id)"` / `url(#…)` across multiple inlined SVGs | Duplicate IDs (header+footer svgr); WebKit resolves to **first** id in document (often wrong root) → **empty clip** | Unique IDs per instance, or drop redundant full-viewBox clip groups |
| SVGO/svgr `removeViewBox` while attrs present | viewBox dropped → paths unscaled/clipped | Keep **`removeViewBox: false`** in SVGO defaults (Next: Turbopack **and** webpack svgr rules — Next 16 build is Turbopack-first). See `nextjs.md` |

**Hardened logo shape:** static flat inline SVG (or one hardened component): no `content-visibility`
ancestor, no transform groups, no width/height attrs, stable viewBox, explicit fills when
`currentColor` is not required. Verify **macOS Safari + iOS Safari** after any logo/SVGO change.

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
the solid `@supports not (backdrop-filter: …)` fallback. Verify 60fps scroll on a mid-range phone
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

**`clip-path` vs `mask-image` for soft edges:** `clip-path` = hard edge, GPU-friendly, morphable
when command counts match — good for geometric crops and inset reveals. Soft/organic alpha edges
need `mask-image` (partial alpha); `clip-path` aliases on curves. Pair either with
`object-fit: cover` and per-breakpoint `object-position` for focal framing. Prefer compositing
`clip-path: inset()` over animating mask rect width/height when the motion is a simple reveal.

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
  theme — full trap list (including invalid `only dark`) is in `web-platform-css.md` Color / Dark
  mode sections; this file only points.
- Dynamic viewport units (`svh`/`dvh`/`lvh`) and the safe-unit choice per use case are already homed
  in `web-platform-runtime.md`'s Mobile Safari section — cite it rather than re-deriving the table.
- **`:empty` whitespace trap:** `:empty { display: none }` is useful for empty error slots, but
  whitespace-only nodes are *not* empty (`<p> </p>` still matches as non-empty and stays visible).
  Keep error containers truly empty in the DOM, or use `:blank` where supported with a fallback.
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
research-sweep-2 local-specialists C-25–C-26, C-28–C-30, C-33 (grid max-w + w-full, button nowrap,
glass budget thresholds, grain opacity band, clip-path vs mask-image, layered shadow animation
tax); Graffino/WebDong Safari filter:blur force-GPU; SiteLint blur stay-within-container;
Josh Comeau backdrop-filter. -->
; fold-wave-2b: Josh Comeau backdrop-filter frosted-glass near-edge mask craft + Firefox sticky glass bugs;
Safari 26 / macOS 26 footer logo postmortem (production): content-visibility + inline SVG paint
invalidation; Tailwind v4 @layer vs SVG presentation attributes; <g transform> paint-no-draw;
duplicate url(#clip) ids; SVGO removeViewBox — folded as Inline SVG Safari paint traps -->
