# Accessibility implementation

Purpose: canonical home for accessibility implementation mechanics: ARIA patterns, semantic HTML,
focus management, and the numeric floors (contrast, touch target, reduced motion, focus ring) as
implemented in code. Cites design-skill's `accessibility.md` as the decision-owner of these same
floors; this file owns the wiring, not the decision of which floor to target.

Read when:
- Implementing ARIA patterns (modal, tabs, combobox, live regions), semantic markup, or focus
  management.
- Wiring contrast, touch-target, reduced-motion, or focus-visible code against an already-decided
  floor.
- A neighboring reference needs an a11y floor and should cite this file instead of restating it.

Skip when:
- Deciding which floor to target, which state must be announced, or a11y priority order: use
  design-skill's `accessibility.md`.
- Running an automated tool (Axe/Lighthouse/WAVE), a manual screen-reader pass, or a WCAG audit as
  conformance evidence: use quality-skill.
- Loading/empty/error state taxonomy or notification patterns: use `state-completeness.md`.
- Form validation timing, submit-button state: use `forms.md`.
- SPA focus-on-route-change, scroll restoration, History API: use `web-platform-runtime.md`.

Inputs: the component or flow being implemented and its target contrast/target-size/motion floor
(design-decided).

Produces: ARIA-correct markup, working keyboard/focus behavior, and code that measurably passes the
cited floors.

## Contents
- Semantic HTML
- ARIA patterns
- Focus management
- Default anchor offset (sticky chrome)
- Label-in-Name
- CSS generated content — accessible name
- Container-query art direction and `alt`
- Contrast (implementation reference)
- Touch targets
- Reduced motion
- Text spacing and reflow
- Forced colors, prefers-contrast, reduced transparency
- Boundary and routing

## Semantic HTML

Use the element the content actually is (`<button>`, `<a href>`, `<nav>`, `<main>`, `<search>`,
`<output>`, `<meter>`) over `<div onclick>` or a generic wrapper: a wrong semantic element is worse
than an honest `<div>`. Interactive elements need real keyboard support. Native controls get
Tab/Enter/Space for free; a custom `role="button"` needs `tabindex="0"` plus a keydown handler for
both Enter and Space, never just one. Never add that same keydown handler to a native `<button>`;
Enter/Space already fire `click`, so it double-triggers. Never set `tabindex` above 0.

Progressive enhancement holds structure to three layers: HTML content, links, and forms must work
with JS off, then CSS, then JS. Each layer degrades to the one below it, not to nothing.

- **Skip link (WCAG 2.4.1):** the first focusable element is a "Skip to content" link to
  `<main id="main">` (add `tabindex="-1"` on `main` if focus doesn't land), off-screen until
  `:focus-visible`, then shown above sticky chrome. The first Tab press must reveal it. One visible
  `<main>`; repeated landmarks get distinguishing labels (`<nav aria-label="Primary">`).
- **`alt` by purpose:** empty for decoration or redundancy; the meaning for information; the action
  or destination for a functional image ("Search", not "magnifying glass"); the exact text for an
  image of text; a short summary plus nearby data for a chart. Never omit `alt` (the filename gets
  read). Meaningful inline SVG: `role="img"` plus a name; decorative: `aria-hidden="true"`.
- **Scrolling tables:** a horizontally scrolling wrapper is `role="region"` with an `aria-label`
  and `tabindex="0"` so keyboard users can scroll it, around a real `<table>` with `<caption>` and
  `scope`. Give the wrapper `position: relative`: visually hidden text in cells is absolutely
  positioned and otherwise escapes the scroller and widens the page on phones.
- **Embedded demos and faux UI** sit inside someone else's outline: their titles are `div`s, never
  `h1`–`h6`; a decorative demo is `aria-hidden` or one `role="img"` with a label.

## ARIA patterns

- **Modal/dialog:** prefer native `<dialog>` + `showModal()`; it gives a built-in focus trap and
  Escape-to-close for free (`prefer-html-dialog`). Manual fallback: query
  `button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])` for focusables, trap
  Tab/Shift+Tab at first/last. Either way: move focus in on open, restore focus to the trigger on
  close, and mark background content `inert` (`<main inert>`) while the modal traps focus.
- **Popover API** (`popovertarget`/`popover` attribute): light-dismiss, top-layer stacking (escapes
  all z-index/overflow clipping) for tooltips, dropdowns, and menus with no portal needed. Choose
  native `<dialog>` when focus trapping is wanted; choose Popover specifically when it is not.
- **Tabs:** `role="tablist"/"tab"/"tabpanel"`, `aria-selected`, active tab `tabindex="0"`, inactive
  tab `tabindex="-1"`. Arrow keys move focus between tabs; Home/End jump to first/last. Persist the
  active tab via a URL query parameter (deep-linkable), not sessionStorage.
- **Roving tabindex** (any composite widget: tabs, menus, radio groups, toolbars): one item
  `tabindex="0"`, the rest `"-1"`. Arrow keys move the `0`; Tab moves past the whole component, not
  into it.
- **Combobox/listbox:** reach for the native `<select>` first. A custom combobox needs
  `role="combobox"` plus `aria-expanded` and `aria-controls` pointing at the listbox, arrow-key
  navigation, and `aria-activedescendant` or roving focus inside the popup.
- **Live regions:** pick the channel by ladder — focus moves there anyway → nothing extra; tied to
  a control → `aria-describedby`; non-urgent → `role="status"` (polite, atomic); urgent →
  `role="alert"`. Never assertive for success, never focus a toast. **Mount the region empty, then
  set its text:** a region rendered together with its message is often silent. Loading: `aria-busy`
  on the region plus a polite "Loading…" then "Loaded, 12 results". To re-announce an identical
  message, clear `textContent`, then set it inside `requestAnimationFrame`.
- **Live figures** (a slider-driven diagram, an animated readout): write `aria-valuetext` when the
  user's choice changes, never from the frame loop (a focused slider announces every change); keep
  the visual readout separate from the accessible value; a hidden polite region carries only phase
  changes, debounced (~700ms of quiet for a continuous control).
- **State attributes are not interchangeable:** `aria-selected` for tabs, options, and grid cells;
  `aria-current` for the current page, step, or date; `aria-pressed` only on toggle buttons. Keep
  widget state in that one attribute and style from it (`[aria-selected="true"]`), never a parallel
  `.is-active` class that can drift.
- **Common defects:** `aria-label` on a generic `div`/`span` (ignored); `role="menu"` on site
  navigation (it promises an app-menu key model — nav is `<nav>` plus a list); redundant roles
  (`<button role="button">`); `aria-labelledby`/`-describedby` pointing at a missing id (silently
  no name); both `disabled` and `aria-disabled`; a tooltip on a natively disabled control (it never
  opens for keyboard or touch — show the reason beside it, or use `aria-disabled`); a navigating
  "button" that isn't a styled `<a>` (loses Cmd/Ctrl/middle-click).
- **`aria-hidden` must agree with focusability:** no focusable descendant inside `aria-hidden`, no
  `aria-hidden` on `<body>`, no `aria-hidden` on a focusable element itself. A focused-but-invisible-
  to-AT state is a real failure mode, not a style nit.
- **Data tables:** every table needs a caption or `aria-labelledby`; every header needs accessible
  text. If a UI ships a charting library, pair it with a data-table fallback for the same data
  (dataviz implementation itself is out of scope; see `shadcn.md`).
- **Disabled controls that must stay explainable:** when a control must stay focusable and announced
  while disabled (for example a submit button showing why it is blocked), use `aria-disabled` plus
  `aria-describedby` instead of the native `disabled` attribute, which removes it from the tab order
  and hides the reason. (The default submit-button behavior, keep it enabled and validate on
  submit, is `forms.md`'s call; this is the wiring for the cases that do need a disabled-but-
  explained state.)
- **Error identification:** `aria-describedby` referencing both helper text and error text, not just
  one, plus `aria-invalid="true"` on the field; move focus to the first invalid field on submit.
  Validation timing itself is `forms.md`'s.

For the ten most common composite patterns (tabs, accordion, modal, combobox, alert, tooltip, menu,
tree, breadcrumb, live region), build from the ARIA Authoring Practices Guide (MDN/W3C) using the
rules above as the cross-cutting constraints; do not invent a bespoke attribute set per component.
Escape closes the most recently opened layer first (tooltip, then menu, then dialog). A menu button
opens on Enter/Space/↓ focusing the first item and on ↑ focusing the last; Escape closes and returns
focus. Enter in a textarea inserts a newline; ⌘/Ctrl+Enter submits only where wired.

## Focus management

- **`:focus-visible` is the canonical fix** for "never `outline: none` without a replacement": hide
  the ring on `:focus` (mouse), show it on `:focus-visible` (keyboard). Ring at least 3:1 contrast
  against every adjacent background, 2 to 3px thick, `outline-offset` 2 to 4px (not inset; inset
  clips on rounded corners). Default: keep the browser's ring and add `outline-offset: 2px` (it
  adapts to the platform and forced colors). A custom ring uses a focus token verified against every
  color it crosses — fills, page, images, hover and selected states. `currentColor` is not
  pre-verified: a white-label button draws a white ring on a white page. Composite fields (an input
  with an icon inside one border) draw the ring on the wrapper with `:focus-within`.
- Focus order follows visual/reading order. No positive `tabindex`, ever.
- **Focus not obscured** (WCAG 2.4.11/2.4.12): a focused element must not sit fully behind a sticky
  header or footer. Size `scroll-margin-top`/`scroll-margin-bottom` to the sticky element's height
  so `:focus`/`:target` scrolls clear of it. Prefer the default anchor-offset recipe below over
  per-id one-offs.
- Overlays: trap focus inside, set initial focus inside on open, restore focus to the trigger on
  close, and let Escape close it.

SPA route-change focus (updating `document.title`, moving focus to the new `<h1>`/`<main>`, scroll
restoration) is runtime/routing mechanics, not accessibility implementation per se; see
`web-platform-runtime.md`.

## Default anchor offset (sticky chrome)

One set-and-forget rule covers in-page targets and keyboard focus so content is not hidden under a
sticky header:

```css
:where([id], :focus) {
  scroll-margin-block-start: var(--header-block-size, 80px);
}
```

Set `--header-block-size` to the real sticky header block size (update when the header resizes). The
`:where()` keeps specificity zero so local overrides win. Apply the equivalent
`scroll-margin-block-end` when a sticky footer can obscure focus. Order of operations: define the
margin before relying on hash navigation or `scrollIntoView` — without it, the browser scrolls the
target flush to the viewport edge under the chrome. Scroller `scroll-padding` and target
`scroll-margin` add up: use one per sticky element, or targets land a header-height too low.

## Label-in-Name (WCAG SC 2.5.3)

When visible text exists, the accessible name must contain it verbatim. Voice-control users (Dragon,
macOS Voice Control) speak the visible label, and an `aria-label` that diverges from it breaks the
command. `aria-label` is for icon-only controls with no visible text; never add it alongside
existing visible text.

## CSS generated content — accessible name

CSS `content:` text is exposed by some assistive tech and ignored by others. Meaningful names come
from real DOM text or the host element (`aria-label`, visually hidden text, `alt`), never from
`content` alone; keep generated content decorative (`content: ""` or ornamental glyphs), and where
the platform supports alternative text for generated content (`content: "★" / ""`), supply it as
well as a DOM-level name. A decorative `::before` icon on an otherwise unlabeled control is a review
fail. Decorative copies of real text (echo, outline, or shadow layers, marquee duplicates, a
letter-roll's second span) sit outside headings and links as `aria-hidden` siblings; a copy inside
`<h1>` reads "Name Name" to search and screen readers.

## Container-query art direction and `alt`

`<picture>` and container queries can swap crops or whole images per size, but `alt` cannot change
with the active source. Keep art-direction variants the same subject (crop, scale, lighting only);
when meaning must change by breakpoint, use separate images with their own `alt`, or change the
surrounding copy. `alt=""` only when every candidate is decorative. Responsive-image performance:
`performance.md`.

## Contrast (implementation reference)

The floors below are design's decision (see design-skill's `accessibility.md`); this table is for
verifying an implementation against them.

| Content | WCAG 2 ratio |
|---|---|
| Normal text (<24px / <18.66px bold) | 4.5:1 AA, 7:1 AAA |
| Large text (≥24px, or ≥18.66px bold — WCAG's 18pt / 14pt) | 3:1 AA, 4.5:1 AAA |
| UI components, graphical objects, focus rings | 3:1 AA |

Error and success colors must themselves clear 4.5:1. Re-verify contrast separately in dark mode; it
commonly fails on secondary text and disabled states even when light mode passes.

## Touch targets

| Surface | Minimum interactive target | Source |
|---|---|---|
| Web | 24×24 CSS px, or the spacing exception below (comfortable/AAA: 44×44) | WCAG 2.2 SC 2.5.8 AA |
| iOS / iPadOS | 44×44 pt | Apple HIG |
| Android | 48×48 dp | Material 3 |

Spacing exception, as tested: an undersized target passes when a 24 CSS px circle centred on its
bounding box intersects no other target and no other undersized target's circle. Inline links,
UA-styled controls, an equivalent control on the same page, and essential sizes are also exempt.

The target is the interactive area, not the visual glyph. Expand hit area with padding or
`::after { inset: -10px }`, never by enlarging the visible icon. Put the expansion on the `<label>`
wrapping an input or on the `<button>` — form controls don't render pseudo-elements reliably, and a
wrapper that isn't the label takes the click and toggles nothing — and shrink any expansion that
would overlap a neighbour's. Keep at least 8px/8dp between adjacent targets. Every drag ships a
single-pointer path to the same result (2.5.7: move buttons on sortable rows, a menu on board
cards), and every multi-point or path gesture a tap alternative (2.5.1).

## Reduced motion

The single highest-convergence fact in the corpus this file draws from. `prefers-reduced-motion` is
a required, complete state, not an add-on. Author motion opt-in, so the base CSS is the finished,
still page: wrap movement, scale, and blur in `@media (prefers-reduced-motion: no-preference)`
(Tailwind `motion-safe:`). Reduced motion targets vestibular triggers, not feedback: drop parallax,
autoplay and loops, large travel, zoom, and spin; swap slides and scales for a short cross-fade;
jump instead of smooth-scrolling; start carousels paused. Keep spinners and progress indicators
running, plus hover color, focus-ring transitions, and brief press feedback. Design may author a
calmer-but-not-zero variant per moment (`design` `motion.md` "Reduced motion").

The blanket kill-switch is a last-resort net for motion you can't scope, not the default:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- It freezes indeterminate spinners, skeleton pulses, and progress bars at one iteration, which
  erases their "busy" meaning: re-declare essential indicators inside the block with `!important`
  at higher specificity, or swap them for an opacity pulse. It also makes meaning-carrying state fades instant; audit for lost feedback.
- `0.01ms`, not `0s`, so code waiting on `transitionend`/`animationend` still runs.
- It does not stop scroll-driven animations (their timeline ignores duration): reset those with
  `animation: none` (`scroll-animation` `accessibility.md` "Per engine and API").

**Pause control (WCAG 2.2.2):** anything that moves on its own for more than five seconds beside
other content — marquee, carousel, ticker, ambient loop, muted background video — ships a visible,
focusable pause control (start CSS loops under the same script-set class as hidden start states,
`ui-motion.md` Enter and exit, so the no-script page is still, and render the control only with
script), pauses on hover and `:focus-within`, runs only while on screen, and stops in CSS, not only
JS, under reduced motion. Auto-updating content gets pause or frequency control. No content flashes
above 3Hz (WCAG 2.3.1, seizure risk) regardless of the reduced-motion setting.

The same principle per platform: SwiftUI's `accessibilityReduceMotion` swapping to an opacity
crossfade instead of parallax or large motion (`swiftui.md`); an equivalent state swap in Compose.
Implementation patterns for motion code (gestures keep tracking, registry components, animated
text): `ui-motion.md`.

## Text spacing and reflow

- **Text spacing (WCAG 1.4.12), runnable:** inject `* { line-height: 1.5 !important;
  letter-spacing: .12em !important; word-spacing: .16em !important } p { margin-bottom: 2em
  !important }` and screenshot. Nothing may clip, overlap, or vanish; fixed `height` with
  `overflow: hidden` and fixed-width buttons fail first — use `min-height` and intrinsic sizing.
  Contrast, 200% zoom, and text spacing fail independently.
- **Reflow:** write breakpoints in `rem`/`em` so enlarged default text triggers the narrow layout
  (px queries don't). Two-dimensional content (tables, maps, code) may scroll inside its own box;
  nothing else scrolls sideways at 320px. A modal is `max-height: 100dvh` with a scrolling body and
  its action row outside the scroll.

## Forced colors, prefers-contrast, reduced transparency

`prefers-contrast: more` is macOS/iOS "Increase Contrast"; `forced-colors: active` is Windows High
Contrast Mode. It overrides your colors, so respect it with system color keywords (`ButtonText`,
`ButtonFace`, `ButtonBorder`, `Highlight`) rather than fighting it; use `forced-color-adjust: none`
only after checking the result. Declare `color-scheme: light dark` so native form controls and
scrollbars match the active theme (the CSS mechanism for dark-mode theming lives in
`web-platform-css.md`).

- Forced colors strips `box-shadow`: an edge or focus ring drawn with a shadow needs a
  `border: 1px solid transparent` (or a real outline) beneath it, which the mode paints.
- Write increased-contrast overrides per appearance (`(prefers-color-scheme: dark) and
  (prefers-contrast: more)` separately); one shared block darkens colors on dark backgrounds too.
- `prefers-reduced-transparency: reduce` turns glass solid: near-opaque background, no
  `backdrop-filter`. Under `prefers-contrast: more`, a near-solid surface with a defined border.

## Boundary and routing

- Which floor to target, a11y priority ranking, which state must be announced: design-skill's
  `accessibility.md` decides (this file must not contradict its numbers).
- Automated tooling, manual screen-reader/keyboard test execution, WCAG audits as conformance
  evidence: quality-skill.
- Loading-by-duration bands, empty/error/success taxonomy, notification patterns:
  `state-completeness.md`.
- Form validation timing, submit-button enabled/disabled default: `forms.md`.
- SPA focus-on-route-change, scroll restoration, History API: `web-platform-runtime.md`.
- Dataviz charting-library selection and its a11y-fallback pairing: `shadcn.md`.

<!-- sources: ehmo_platform-design-skills (MIT) - semantic HTML table, ARIA quick-reference, forms/touch/dark-mode sections; cuellarfr_design-skills (MIT) - modal focus-trap, roving-tabindex, ARIA live-region roles; dembrandt_dembrandt-skills (no license, facts re-expressed; MDN/WCAG/web.dev cited) - modal/overlay hierarchy, tabs ARIA spec, focus-ring CSS; pbakaus_impeccable (Apache-2.0, NOTICE credits ehmo) - :focus-visible rule, inert attribute, Popover API, native <dialog> vs manual trap; millionco/react-doctor (Modified MIT, recommendation strings re-expressed) - aria-hidden-and-focusability family, disabled-but-explained pattern, data-table a11y; accessibility skill (MIT, web-quality-skills) - WCAG 2.2 new criteria (focus-not-obscured), visually-hidden CSS, live-region re-trigger recipe; saadeghi/daisyui (MIT) - native <dialog> vs Popover-API modal decision; swiftui-pro/twostraws (MIT) - reduced-motion opacity-crossfade pattern; design-fold 2026-11 (MIT unless noted; detail in SOURCES.md): jakubkrehel/skills - large-text and 2.5.8 corrections, focus token, hit-area placement, live-region ladder, ARIA defects, skip link, reflow, forced-colors shadows, opt-in reduced motion; emilkowalski/skills + iart-ai/web-animation-skills - kill-switch casualties, reduced transparency; pbakaus/impeccable (Apache-2.0) - circle test; jpoindexter/typography-skills - 1.4.12 check; Nutlope/hallmark + Leonxlnx/taste-skill - pause control; majestic-ui-skill - scroll region; juliobsz/skills, MengTo/skills, wheresryan22/anatomy, benjitaylor/skills - duplicate text, state attributes, live figures, embedded demos; WCAG 2.2 (W3C), MDN cited for numeric floors and API references, no verbatim prose copied; x-bookmarks.md #10 (@tak_dcxi) - :where([id], :focus) scroll-margin-block-start default recipe; Sara Soueidan (X + blog) - CSS generated-content accessible name strategy; Sara Soueidan / authors-architecture - container-query art direction, alt cannot change with active source. -->
