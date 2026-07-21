# CSS craft

Purpose: defensive and boilerplate CSS patterns — scrollbars, overscroll containment, grid
single-cell stacking, aspect-ratio fallbacks, and numeric alignment — the "keep this from breaking"
layer that sits below `web-platform-css.md`'s core layout doctrine.

Read when:
- Hiding, styling, or reserving space for a scrollbar.
- Locking scroll for a modal, drawer, or chat pane without it chaining into page scroll.
- Stacking elements in one grid cell (crossfades, image-plus-badge overlays) instead of absolute
  positioning.
- A `position: sticky` element inside CSS Grid silently refuses to stick.
- Choosing between the legacy padding-top intrinsic-ratio hack and `aspect-ratio`, or hitting its
  min/max sizing conflict.
- Aligning numeric columns, counters, or timers so digits don't jitter width as they update.

Skip when:
- Breakpoints, subgrid, container queries, `:has()`, the z-index scale, cascade layers, or
  containment: `web-platform-css.md`.
- Text truncation (`line-clamp`, `min-width: 0`) or specificity discipline: `web-platform-css.md`'s
  CSS craft baseline.
- Tailwind's `text-balance`/`text-pretty`/`tabular-nums` utility classes: `tailwind.md`.
- Dynamic viewport units (`svh`/`dvh`/`lvh`) and the 16px input-zoom floor: `web-platform-runtime.md`.

Inputs: the layout bug or defensive requirement being solved.

Produces: CSS that degrades safely against unexpected content, viewport, or interaction state.

## Contents
- Scrollbars
- Overscroll containment
- Grid single-cell stacking
- Sticky-in-grid failure
- `aspect-ratio`: legacy fallback and the min/max gotcha
- Tabular numerals
- One-line modern layouts
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
`overflow: hidden` removing the page scrollbar.

## Overscroll containment

`overscroll-behavior-y: contain` (or the shorthand `overscroll-behavior: contain`) on any
independently scrollable region — a modal body, a drawer, a chat pane — stops that region's scroll
from chaining into page scroll once it hits its own boundary. `overscroll-behavior: none` also
suppresses the pull-to-refresh/rubber-band bounce where that's undesirable. The property has no
effect until scroll actually reaches the boundary, so it's safe to apply broadly: pair it with
`overflow-y: auto` on the same element, and default to it on any `overflow: auto | scroll`
container. Distinguish from Tailwind's utility name `overscroll-x-contain`, which maps to the raw
`overscroll-behavior-x: contain` longhand — don't copy the utility class name into raw CSS.

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

## Micro-patterns

- `pointer-events: none` on a `:disabled` control reinforces the disabled treatment visually, but
  has no semantic meaning to assistive tech on its own — pair it with the real `disabled` attribute
  or `aria-disabled` styling (`accessibility.md`), never rely on it alone.
- `user-select: none` breaks copy and can interfere with screen-reader text navigation; scope it
  narrowly to drag handles and icon-only controls, never to general text content.
- `currentColor`: set `color` once and reuse it in `border`/`background-image`/anywhere else on the
  same element or a descendant, instead of repeating a literal color value.
- `color-scheme: light dark` (or the equivalent meta tag) matches native UI chrome — scrollbar,
  form-control, and canvas defaults — to the active theme; it's a mechanism only, not a palette
  decision.
- Dynamic viewport units (`svh`/`dvh`/`lvh`) and the safe-unit choice per use case are already homed
  in `web-platform-runtime.md`'s Mobile Safari section — cite it rather than re-deriving the table.

<!-- sources: AllThingsSmitty/css-protips (CC0-1.0, verbatim-safe) - aspect-ratio + padding-top
legacy fallback, pointer-events:disabled, currentColor reuse; yuschick/stylelint-plugin-defensive-css
(MIT) - scrollbar-gutter and overscroll-behavior per-axis rules, user-select:none scoping;
defensivecss.dev (Ahmad Shadeed, no license, re-expressed) - scrollbar native-overlay default,
position:sticky-in-grid align-self:stretch failure; phuocng/csslayout (MIT) - masonry/grid pattern
corroboration (not carried verbatim here, see near-misses in scout-css-github.md); MDN Web Docs
(font-variant-numeric, scrollbar-color, color-scheme, aspect-ratio) - spec citations, facts only;
web.dev (Una Kravets, "Ten modern layouts in one line of CSS") - RAM card-wall / place-content
citation, not reproduced verbatim; scout-css-x.md (X/Twitter posts, proprietary platform content,
re-expressed) - overscroll-behavior:contain convergence and overscroll-x-contain Tailwind-vs-CSS
naming caveat, tabular-nums multi-year convergence corroboration. -->
