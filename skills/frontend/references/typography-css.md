# Typography CSS

Purpose: implementing type correctly in CSS — units and inheritance, synthesis, OpenType features,
cap-height trimming, case and tracking, wrapping and hyphenation, decoration, and icon or colour
fonts. Design decides the faces, scale, and measure; this file makes them render as decided.

Read when:
- Wiring a type scale, a variable font, or OpenType features into CSS.
- Text sits low in a button or badge, a heading has mystery space above it, hover bolding shifts a
  nav, or features vanish on a child element.
- Setting wrapping, hyphenation, underlines, drop caps, or small caps; choosing icon or colour fonts.

Skip when:
- Choosing faces, scale, measure, or pairing: `design` `typography.md`.
- Font loading, subsetting, `font-display`, fallback metrics, and CLS: `performance.md` (Font loading).
- Script-specific stacks, Arabic-script correctness, and `lang`: `i18n.md`.
- Tailwind's `text-balance`/`tabular-nums` utilities: `tailwind.md`.

Inputs: design's type tokens (ideally composite typography tokens) and the loaded font files.

Produces: type CSS that inherits safely, never fakes a face, and renders the same across sizes.

## Contents
- Units and inheritance
- Faces and synthesis
- OpenType features
- Trimming and optical alignment
- Case, tracking, and weight changes
- Wrapping and hyphenation
- Decoration, selection, and drop caps
- Icon and colour fonts

## Units and inheritance

- `line-height` is unitless everywhere. A length (px, em, rem) inherits as a fixed value, so a
  larger child gets a line box smaller than its text, and a `rem` leading on fluid type inverts the
  ratio as the type grows.
- `letter-spacing` in `em` (px is right at one size only); `font-size` in `rem`.
- Font smoothing (`-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale`) is set
  once on the root, never per component. It is not a fix for light-on-dark text that reads heavy —
  that rationale died with macOS subpixel antialiasing; correct reversed type with weight or grade
  and check it rendered.

## Faces and synthesis

- Browsers fake any weight or style you style but didn't load (smeared faux bold, slanted faux
  italic): load every face the design uses, including the real italic.
- Where a fake would be wrong (brand faces, Arabic, CJK), disable synthesis on the elements set in
  that face, by longhand where only one axis matters (`font-synthesis-weight: none`). Never
  `font-synthesis: none` on `body`: it also stops the fallback stack from synthesizing.
- Leave `font-optical-sizing: auto`.

## OpenType features

`font-feature-settings` and `font-variation-settings` replace the whole list and bypass the
cascade: a child that sets `"tnum"` silently loses the parent's `"ss01"`. Use the standard
properties, which compose:

| Need | Property |
|---|---|
| Figures | `font-variant-numeric` (`tabular-nums`, `lining-nums`, `slashed-zero`) |
| Caps, ligatures, alternates, super/subscript | `font-variant-caps`, `-ligatures`, `-alternates`, `-position` |
| `wght`, `wdth`, `opsz`, `ital`/`slnt` axes | `font-weight`, `font-stretch`, `font-optical-sizing`, `font-style` |

Raw tags only for custom axes (`"GRAD"`) and features with no property (`"ss01"`, whose meaning
varies per font). Raw `"opsz"`/`"wght"` tags also no-op on static fallback fonts.

## Trimming and optical alignment

- Text sitting low in a button, badge, pill, or initial disc: `text-box: trim-both cap alphabetic`
  trims the line box to cap height and baseline. Name both edges (`trim-start cap` alone is
  dropped). Put it on the label element as a block (`<span>` with `display: block`), not on an
  `inline-flex` button, whose text is an anonymous flex item trim never reaches. Progressive
  enhancement: engines without it keep default leading (fallback: a measured negative margin).
  Centred caps still read low on lowercase labels, which sit in the x-height — judge the rendered
  label at every shipped size.
- The fallback face matches with `size-adjust` = web-font cap height ÷ fallback cap height;
  `ascent-`/`descent-`/`line-gap-override` change only what trim removes.

## Case, tracking, and weight changes

- Store copy in natural case; caps come from `text-transform: uppercase`, so assistive tech,
  translation, and search get the real string.
- A tracked caps run sets `font-variant-ligatures: no-common-ligatures`.
- `font-variant-caps: small-caps` needs the font's `smcp` feature; without it the browser
  synthesizes thin, light caps — verify.
- Weight-on-hover widens the label and shifts its siblings. In order: a `GRAD` axis or a
  multiplexed face; reserve the bold width with a hidden bold copy
  (`::after { content: attr(data-text); font-weight: 700; visibility: hidden; height: 0 }`, or a
  `min-width`); or signal with color or underline instead.

## Wrapping and hyphenation

- `text-wrap: balance` is for headings and short blocks: engines cap it (Chromium ~6 lines) and it
  silently does nothing on paragraphs. `text-wrap: pretty` is the paragraph tool; never patch
  orphans with inserted `&nbsp;`.
- `hyphens: auto` uses the `lang` dictionary: with a missing or wrong `lang` it does nothing or
  breaks words wrongly. Justify only with hyphenation and at ≥~50 characters per line.
- Bind number and unit with `&nbsp;`, offer URL break points with `<wbr>`, and use `&shy;` only for
  dictionary misses. Emails and URLs break with `overflow-wrap: anywhere`, never
  `word-break: break-all`, which breaks every word.

## Decoration, selection, and drop caps

- Underlines take metrics from the font (`text-underline-position: from-font`,
  `text-decoration-thickness: from-font`) or a tuned `text-underline-offset`; never
  `text-decoration-skip-ink: none`. Only `text-decoration-color` animates reliably.
- `-webkit-text-stroke` draws internal lines on variable fonts with overlapping contours: use a
  static cut for outlined display type.
- `::target-text` and the Custom Highlight API style ranges without wrapper markup. Decorative
  text stays in CSS or DOM, never baked into images.
- Drop cap: `::first-letter` with `initial-letter`, so the word stays one text node for assistive
  tech (a float fallback only approximates). Hanging quotes: `hanging-punctuation: first last`
  where supported; a negative `text-indent` on pull quotes otherwise.

## Icon and colour fonts

- Never an icon font for UI icons: Private Use Area codepoints read as noise to assistive tech, and
  one failed font load erases every icon. Use SVG (`shadcn.md` Icon libraries).
- Colour display fonts: COLRv1, with a designed flat fallback (some engines render one colour);
  re-theme one file for dark mode with `font-palette` and `@font-palette-values`; never OT-SVG
  (unsupported in Chromium). Layered fonts duplicate text nodes: `aria-hidden` all but one layer.

<!-- sources: jakubkrehel/skills better-typography (MIT) — units, smoothing once, synthesis by
longhand, properties over raw tags, text-box trim edges, underline/stroke/highlight details;
jpoindexter/typography-skills (MIT; principles from Lupton, Rutter, Brown, Hochuli, Elam, Coles,
Stocks, Santa Maria, Latin, Kupferschmid, re-expressed, no book text) — feature-list override and
property mapping, unitless line-height, em tracking, ligatures on tracked caps, small-caps smcp,
weight-on-hover fixes, balance line cap, hyphens and lang, drop caps and hanging punctuation, icon
and colour fonts, stale smoothing rationale; pbakaus/impeccable (Apache-2.0) — trim on a block
label, cap-height size-adjust; emilkowalski/skills break-ui (MIT) — overflow-wrap anywhere vs
break-all; benjitaylor/skills stageshow (MIT) — centring labels on cap height; MDN text-box,
font-synthesis, font-feature-settings, initial-letter. -->
