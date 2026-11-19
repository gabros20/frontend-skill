# Solid Glass

Purpose: Adopt the Solid Glass theme on a shadcn/ui project: its Base UI requirement, registry
install, how its material attaches to stock components, its deltas from shadcn, its agent-run
components, and the accessibility and performance gaps to close on import.

Read when:
- The request names Solid Glass, or adopts a thick-glass material on a shadcn/ui web app.
- Wiring its agent components (`turn-status`, `tool-steps`, `ask-card`, `composer`, …) to run events.
- Debugging why a shadcn component looks or behaves differently under the theme.

Skip when:
- Plain shadcn/ui CLI, composition or library choice (`shadcn.md`).
- Generic glass or `backdrop-filter` craft (`css-craft.md` "Paint and texture craft").
- Whether to choose the language, and its values (`design`).

Inputs: the project's shadcn flavour (Base UI or Radix), whether AI Elements is in use, the run's
event contract, and the light/dark decision.

Produces: an installed, pinned theme on the right base, overrides that keep focus rings, agent
components bound to real run states, and forced-colours and reduced-transparency fallbacks.

## Contents
- Base conflict first
- Install
- How it themes
- Deltas from stock shadcn
- Agent-run mapping
- Fix on import
- Performance
- Reduced transparency and forced colours

The packaged thick-glass look for AI/agent web apps: one MIT stylesheet (`deeplethe/solid-glass`)
that re-skins stock shadcn/ui as smoky glass, plus agent components. When to choose it, its rules
and values are `design`'s (`surface-webapp.md` "Solid Glass (AI and agent apps)";
`imagery-depth-decoration.md` "Materials"); this reference is adoption. Current items and props live
in its docs (deeplethe.github.io/solid-glass).

## Base conflict first

It needs React 19, Tailwind 4 and the Base UI flavour (`base-nova`), and finds parts by `data-slot`
plus Base UI state attributes (`data-popup-open`, `data-checked`). Radix reports those states as
`data-state` (`open`, `checked`), so most will not light on a Radix project (one held-open rule also
reads `data-state="open"`), and AI Elements needs Radix (`shadcn.md` "Setup and CLI"). Pick one
agent-UI stack: Solid Glass's components on Base UI, or AI Elements on Radix.

## Install

As its docs give it (the shadcn CLI's `<owner>/<repo>/<item>` GitHub-registry form, June 2026):

```bash
npx shadcn@latest add deeplethe/solid-glass/solid-glass   # the stylesheet
npx shadcn@latest add deeplethe/solid-glass/turn-status   # any of its components
```

Pin with `#<tag-or-commit>`; an older CLI reads the same items from
`https://deeplethe.github.io/solid-glass/r/<item>.json`. Import it after `tailwindcss`,
`tw-animate-css` and `shadcn/tailwind.css`, and delete the `:root`/`.dark` colour variables `shadcn
init` wrote (it defines the same names). Dark is the designed theme (the `dark` class on `<html>`).
The live registry holds the stylesheet, twelve components and an `agent-workspace` block (checked
2026-11-19).

## How it themes

It keeps shadcn's variable names and hangs the material on
the colour utilities themselves: `bg-card`, `bg-popover`, `bg-sidebar` (and a `glass-panel` class)
get blur, rim, hairline and shadow, so stock components need no edits. Those rules are unlayered on
purpose, so no Tailwind utility can switch them off; override through its variables or an unlayered
rule. Panes drop their border and draw every line as `box-shadow` (rim and inner line inset, the
hairline as a 1px spread, the shadow beneath); a part that must keep a border (a grouped button, a
tab, a switch) uses it as the hairline, since a border between the inset lines and the outer
hairline shows as a second ring. Any `box-shadow` you write on a focusable control ends with
`var(--tw-ring-shadow, 0 0 #0000)` or its focus ring disappears. Re-brand with `--brand`,
`--brand-foreground` and `--brand-muted` once per theme; corners derive from `--radius` (0.875rem),
controls from `--radius-control` (0.7rem). A handoff's tokens map onto these names
(`design-handoff-and-tokens.md`), never a parallel set.

## Deltas from stock shadcn

So a diff against shadcn is not mistaken for a bug: `Button` gains `variant="glass"`, its one
documented API change (variants and helper classes: its docs); the rest is CSS.
Controls asking for `rounded-lg` get the control radius (no 32px pills); the 3px half-strength focus
ring becomes `0 0 0 1px var(--background), 0 0 0 3px var(--focus-line)`, and fields swap the ring for
a brighter border; hover, chosen and held-open share one pane (menu rows and sidebar items light
from Base UI attributes, other parts from its state classes);
tooltips are popover glass without an arrow; the default chat bubble is clear glass, not ink; menus
lose their `::before` blur sheet; hover greys become `--hover` behind `@media (hover: hover)`.

## Agent-run mapping

The components render state; the event contract, replay and approval rules
in `state-and-data.md` "Agent-run streaming client" still govern.

| Component | States it covers | Bind to |
|---|---|---|
| `turn-status` + `status-glyph` | thinking / searching / running / writing / compacting; elapsed from 1s; tokens; opens to the current step's calls | status events; removed on done, error or cancel; `thinking` beats a wrong specific activity |
| `tool-steps` (+ `diff-view`) | each call running / done / error, with detail, output, error or patch | tool-call events keyed by ID, so a replay updates, never duplicates |
| `reasoning` | thinking (shimmering header) or folded thought | provisional reasoning deltas |
| `ask-card` | awaiting a decision; without `onAnswer`, a record | a question with options, not an approval: it shows model text, so approvals still render the server's action preview and expiry |
| `task-notice` | background work ended: completed / failed / stopped | completion and error events of background runs |
| `composer` | idle or running (send becomes stop); tags; footer picks | start and cancel as API calls with an idempotency key |
| `context-ring` | context fill: blue, amber from 70%, failure from 90% | the run's usage figures |
| `dot-loader`, `tag` | still running; attachment upload progress or error | — |

## Fix on import

Read from its sources, 2026-11. `TurnStatus` puts `role="status"` on a line
holding a once-a-second clock and a rolling token count, so the polite live region re-announces
constantly, and when it opens the role lands on a `<button>`, replacing its button role: keep one
`role="status"` carrying only the activity label, the clock and count outside it, the button a plain
button. `TaskNotice` gives the outcome only as an `aria-hidden` dot: add it in text. `DotLoader` has
no name: hide it beside a word. Text faded to `/70` (either theme) or `/80` (light theme) and
light-theme status hues as text miss 4.5:1: keep full tokens. Reduced motion is already handled (the glyph holds a pose and pauses
offscreen; the CSS loops stop).

## Performance

Every `bg-card`, `bg-popover`, `bg-sidebar` and `glass-panel` carries
`backdrop-filter: blur(26px)` (light adds `saturate(180%)`), so a thread of cards is one backdrop
pass per card at a radius past the budget in `css-craft.md` "Paint and texture craft". Over the dark
theme's even, unlit page the blur samples flat colour and buys little: mark long scrolling regions
`data-glass="opaque"` and verify scroll on a mid-range phone. That attribute drops only the blur;
for a truly solid region also set the reduced-transparency block's opaque `--panel`, `--card`,
`--popover` and `--sidebar` on it.
`backdrop-filter` is unprefixed in Chrome 76, Firefox 103 and Safari 18 (`-webkit-` from Safari 9;
MDN, checked 2026-11-19); the stylesheet ships both and no `@supports` fallback, which holds because
every pane has a fill.

## Reduced transparency and forced colours

Floors and mechanism: `accessibility.md` "Forced colors, prefers-contrast, reduced transparency". Its `prefers-reduced-transparency` block (opaque fills, no blur, edges kept)
fires only in Chromium 118+; Firefox has it behind a flag and Safari not at all (MDN, 2026-11-19), so
macOS and iOS Reduce Transparency users still get glass: offer an in-app "solid surfaces" setting
applying the same values. Forced colours force `box-shadow` to `none` (MDN), and these panes have no
border, so every pane edge, menu outline and focus ring vanishes. Add, unlayered so it beats
`outline-none`:

```css
@media (forced-colors: active) {
  .bg-card, .bg-popover, .bg-sidebar, .glass-panel, .glass-control { border: 1px solid CanvasText; }
  :focus-visible { outline: 2px solid Highlight; outline-offset: 2px; }
}
```

<!-- sources: deeplethe/solid-glass (MIT, © 2026 DeepLethe) README, content/docs, content/solid, src/solid-glass.css, registry.json and component sources, read 2026-11-19; live registry and shadcn GitHub-registry docs checked the same day; support claims against MDN browser-compat data; Radix and Base UI state attributes against their docs -->
