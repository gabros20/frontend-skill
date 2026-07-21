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
- Label-in-Name
- Contrast (implementation reference)
- Touch targets
- Reduced motion
- Forced colors and prefers-contrast
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
- **Live regions:** `aria-live="polite"` for non-urgent updates (waits for a pause); `role="alert"`
  or `aria-live="assertive"` for time-sensitive updates; `role="status"` for status updates. To
  re-announce the identical message twice, clear the container's `textContent` then set it inside
  `requestAnimationFrame`; without a real DOM mutation nothing is announced.
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

## Focus management

- **`:focus-visible` is the canonical fix** for "never `outline: none` without a replacement": hide
  the ring on `:focus` (mouse), show it on `:focus-visible` (keyboard). Ring at least 3:1 contrast
  against every adjacent background, 2 to 3px thick, `outline-offset` 2 to 4px (not inset; inset
  clips on rounded corners). Safe default recipe: `outline: 2px solid currentColor;
  outline-offset: 2px` (inherits text color, already contrast-checked).
- Focus order follows visual/reading order. No positive `tabindex`, ever.
- **Focus not obscured** (WCAG 2.4.11/2.4.12): a focused element must not sit fully behind a sticky
  header or footer. Size `scroll-margin-top`/`scroll-margin-bottom` to the sticky element's height
  so `:focus`/`:target` scrolls clear of it.
- Overlays: trap focus inside, set initial focus inside on open, restore focus to the trigger on
  close, and let Escape close it.

SPA route-change focus (updating `document.title`, moving focus to the new `<h1>`/`<main>`, scroll
restoration) is runtime/routing mechanics, not accessibility implementation per se; see
`web-platform-runtime.md`.

## Label-in-Name (WCAG SC 2.5.3)

When visible text exists, the accessible name must contain it verbatim. Voice-control users (Dragon,
macOS Voice Control) speak the visible label, and an `aria-label` that diverges from it breaks the
command. `aria-label` is for icon-only controls with no visible text; never add it alongside
existing visible text.

## Contrast (implementation reference)

The floors below are design's decision (see design-skill's `accessibility.md`); this table is for
verifying an implementation against them.

| Content | WCAG 2 ratio |
|---|---|
| Normal text (<18px / <14px bold) | 4.5:1 AA, 7:1 AAA |
| Large text (≥18px / ≥14px bold) | 3:1 AA, 4.5:1 AAA |
| UI components, graphical objects, focus rings | 3:1 AA |

Error and success colors must themselves clear 4.5:1. Re-verify contrast separately in dark mode; it
commonly fails on secondary text and disabled states even when light mode passes.

## Touch targets

| Surface | Minimum interactive target | Source |
|---|---|---|
| Web | 24×24 CSS px, ≥24px spacing between adjacent targets (comfortable/AAA: 44×44) | WCAG 2.2 SC 2.5.8 AA |
| iOS / iPadOS | 44×44 pt | Apple HIG |
| Android | 48×48 dp | Material 3 |

The target is the interactive area, not the visual glyph. Expand hit area with padding or
`::after { inset: -10px }`, never by enlarging the visible icon. Keep at least 8px/8dp between
adjacent targets.

## Reduced motion

The single highest-convergence fact in the corpus this file draws from. `prefers-reduced-motion` is
a required, complete state, not an add-on:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

This is a default kill-switch, not the only valid response. Design may author a calmer-but-not-zero
variant for motion that carries meaning (see design-skill's `motion.md` for the duration/easing
scale); absent that decision, ship the kill-switch. The same principle expressed per platform:
SwiftUI's `accessibilityReduceMotion` environment value swapping to an opacity crossfade instead of
parallax/large motion (`swiftui.md`); an equivalent state swap in Compose/Android. No content
flashes above 3Hz (WCAG 2.3.1, seizure risk) regardless of the reduced-motion setting.

## Forced colors and prefers-contrast

`prefers-contrast: more` is macOS/iOS "Increase Contrast"; `forced-colors: active` is Windows High
Contrast Mode. It overrides your colors, so respect it with system color keywords (`ButtonText`,
`ButtonFace`, `ButtonBorder`) rather than fighting it. Declare `color-scheme: light dark` so native
form controls and scrollbars match the active theme (the CSS mechanism for dark-mode theming lives
in `web-platform-css.md`).

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

<!-- sources: ehmo_platform-design-skills (MIT) - semantic HTML table, ARIA quick-reference, forms/touch/dark-mode sections; cuellarfr_design-skills (MIT) - modal focus-trap, roving-tabindex, ARIA live-region roles; dembrandt_dembrandt-skills (no license, facts re-expressed; MDN/WCAG/web.dev cited) - modal/overlay hierarchy, tabs ARIA spec, focus-ring CSS; pbakaus_impeccable (Apache-2.0, NOTICE credits ehmo) - :focus-visible rule, inert attribute, Popover API, native <dialog> vs manual trap; millionco/react-doctor (Modified MIT, recommendation strings re-expressed) - aria-hidden-and-focusability family, disabled-but-explained pattern, data-table a11y; accessibility skill (MIT, web-quality-skills) - WCAG 2.2 new criteria (focus-not-obscured), visually-hidden CSS, live-region re-trigger recipe; saadeghi/daisyui (MIT) - native <dialog> vs Popover-API modal decision; swiftui-pro/twostraws (MIT) - reduced-motion opacity-crossfade pattern; WCAG 2.2 (W3C), MDN cited for numeric floors and API references, no verbatim prose copied. -->
