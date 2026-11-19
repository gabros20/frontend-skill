# shadcn/ui

Purpose: shadcn/ui's CLI and composition mechanics, which component or primitive to reach for by
task, the icon-library default, which official component-library package to reach for instead
when the brief signals an established design system, and adopting the Solid Glass theme.

Read when:
- Installing or configuring shadcn/ui, or adding a component to an existing shadcn project.
- Choosing which primitive fits a piece of interactive UI (overlay, table, confirm, notification).
- Picking an icon library, or a component-library stack for a project that signals an enterprise,
  government, or platform-specific design system rather than a from-scratch build.
- Adopting Solid Glass (thick-glass shadcn theme with agent components) or debugging it.

Skip when:
- The task is Tailwind theme/class mechanics with no shadcn involved (`tailwind.md`).
- The question is the component's visual direction or aesthetic pick, not its implementation
  (`design`).

Inputs: whether shadcn is already installed, the project's existing icon-library dependency (if
any), and the brief/brand signal (enterprise, government, Shopify, indie SaaS, no signal at all).

Produces: the correct CLI sequence, a component/primitive choice consistent with the task, one
consistently used icon library, and working dark-mode wiring.

## Contents
- Setup and CLI
- Composition mechanics
- Reach for this first: component selection
- One gotcha worth checking before shipping
- Dark mode wiring
- Icon libraries
- Choosing a component-library stack for non-shadcn projects
- Solid Glass theme
- Dataviz: pick the library, ship the fallback
- Cross-references

## Setup and CLI

Order is load-bearing: initialize (`init`) before adding a component (`add <component>`); stay on
the Radix base rather than the Base UI base if the project uses, or may ever use, AI Elements, which
has type errors against Base UI. Beyond that ordering call, CLI flags, registry-type names, prompt
behavior, and `components.json` shape rotate release to release faster than a static reference can
track — this is the fastest-rotting content in the whole pack.

> **External library — shadcn/ui CLI.** This pack carries composition doctrine only; the current
> CLI surface lives with the CLI itself. To load it: check `node_modules/shadcn/skills/` first
> (packaged skill, if installed); else `npx skills add <owner/repo@skill>`; else run `npx shadcn
> docs <component>` / `view` (returns current code, API, and examples inline) or WebFetch
> https://ui.shadcn.com/docs. Match whatever CLI version the project has installed, never a
> version-pinned flag from memory.

The same rule covers the CLI's `migrate radix` (unifies per-package `@radix-ui/react-*` imports onto
the `radix-ui` package) and `migrate rtl` (directional-to-logical utility class conversion) commands:
run the CLI's own migration rather than hand-authoring it.

## Composition mechanics

The compound-component pattern is mandatory shape, not a styling preference: `Dialog` +
`DialogContent` + `DialogHeader` + `DialogTitle` + `DialogDescription`; `Form` + `FormField` +
`FormItem` + `FormLabel` + `FormControl` + `FormMessage`, wired to `react-hook-form` and
`zodResolver`; `Card` + `CardHeader` + `CardContent`, never one prop-driven monolith.

Overlay components need controlled state, not `defaultOpen` alone:
`<Dialog open={open} onOpenChange={setOpen}>`. Provider components wrap at the scope they actually
govern: `TooltipProvider` at the app root, `SidebarProvider` at the layout level, never per
instance.

Extend variants via `cva` (`buttonVariants`) rather than layering conditional classes onto a
component; use `asChild` plus Radix `Slot` for composition (`<Button asChild><Link/></Button>`)
instead of a wrapper div. `Avatar` has no `size` prop, size it with Tailwind classes
(`className="h-12 w-12"`), and the same convention (Tailwind classes for sizing, not a variant prop)
generalizes to most other shadcn components.

Accessibility comes largely free from the underlying Radix primitives: built-in ARIA roles,
automatic focus trap in `Dialog`/`Sheet` (focus returns to the trigger on close, `Escape` closes),
and a standard dropdown/menu keyboard map (`Space`/`Enter` opens, arrow keys navigate, `Escape`
closes, `Tab` closes and moves focus on). The anti-pattern is re-implementing focus or keyboard
handling on top of a primitive that already ships it.

## Reach for this first: component selection

Settings screen: `Tabs` + `Card` + `Form`. CRUD table: `Table` + `DropdownMenu` for row actions +
`Sheet` for the edit panel + `AlertDialog` for delete confirmation. Slide-out panel: `Sheet`, not a
restyled `Dialog`. Destructive-action confirm: `AlertDialog` specifically, never a plain `Dialog`.
Notifications: `Sonner`'s `toast()`, not a hand-rolled toast component. A data table with
sort/filter/pagination: `Table` plus TanStack Table (`useReactTable`), not a hand-built grid.

## One gotcha worth checking before shipping

A new shadcn project's post-bootstrap baseline: confirm the shell uses `bg-background`/
`text-foreground` tokens rather than hardcoded colors before starting feature work, and install
components as the feature actually needs them rather than front-loading a fixed list. The
Tailwind-v4-plus-Next `@theme inline` font-circularity trap (relevant whenever the project uses
Geist or another `next/font` variable) is a build-tooling gotcha, not a shadcn one — its mechanics
and fix live in `tailwind.md`. Folder convention worth defaulting to: `components/ui/` holds the
untouched shadcn primitives so upstream re-syncs stay low-friction; `components/custom/` (or
`components/patterns/`) holds wrapper/composed components built from them — see
`client-architecture.md` for the broader ownership-boundary rationale.

## Dark mode wiring

Next.js recipe: the `next-themes` package, a `ThemeProvider` client wrapper, root layout configured
with `attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange`, `<html
suppressHydrationWarning>`, and a `useTheme()` hook driving the toggle. Non-Next fallback:
`document.documentElement.classList.toggle('dark')` plus `localStorage` plus
`matchMedia('(prefers-color-scheme: dark)')`. `disableTransitionOnChange` covers only the library's
own toggle; the OS-level flip needs the same suppression (`web-platform-css.md` Dark mode). Role
collision: shadcn's `accent` is a hover surface and `muted` a quiet background, so a design system's
`--color-accent` (brand signal) or `--color-muted` (muted text) must map onto shadcn roles
explicitly, never share the same `@theme` names. Animated components copied from registries rarely
gate reduced motion — audit each on import (`ui-motion.md` Removing and importing motion). This section is the toggle mechanism only; the token
strategy behind the two modes (which values should and shouldn't change, contrast parity) lives in
`design-handoff-and-tokens.md`.

## Icon libraries

Default: match the project's existing icon-library dependency, don't introduce a second one on top
of it. On a greenfield project, two defensible defaults exist, and sources disagree on which to
lead with: Lucide (the broadest existing baseline adoption) and Phosphor (weight variants). Pick
one and never mix libraries within the same UI. Whichever is chosen: one consistent stroke weight
throughout, `aria-hidden` on every decorative icon, and never hand-roll an SVG for a concept the
chosen library already ships a named icon for. Stroke follows the adjacent text weight as rendered:
a 24-grid icon drawn at 16px thins its stroke by a third unless you use the library's absolute
stroke option or `vector-effect: non-scaling-stroke`. Recolor through `currentColor` and CSS state,
never per-state assets; outline is the resting state, fill the selected one. Never an icon font
(`typography-css.md` Icon and colour fonts).

Resolve a concept to a verified export name before importing it — never guess one. Lucide ships a
name→tags map (`lucide-static`'s `tags.json`) and Tabler a richer manifest (`@tabler/icons`'
`icons.json`: tags plus category); search it, then import the matched name. Tabler's manifest and
Iconify's search API (`/search?query=…&prefixes=…`, set-prefixed names such as `mdi:home`) are
inputs to *choosing* the project's one library by coverage; Iconify adopts a whole set (bundled
from `@iconify-json/<set>` at build time, so a static build makes no runtime icon request, under
that set's license), never single icons from other sets. When the chosen library lacks a symbol,
use its nearest glyph or a custom glyph drawn on its grid, and record that in the handoff.
Phosphor inside a React Server Component imports from its SSR entry (`@phosphor-icons/react/ssr`),
which cannot inherit an ancestor `IconContext`. Brand logos: a file
license (MIT, CC0) is not trademark permission — render marks unaltered, imply no endorsement,
and recolor a mark only where the brand's guidelines permit it (often a single-color variant); a
no-derivatives set cannot be recolored at all. Key country flags by ISO 3166 alpha-2 code
from a tree-shakeable package, never a component that bundles every flag. Anything fetched from
an asset API at build time is vendored into the repo with its name, path, and license in a
manifest, never left as a runtime dependency.

## Choosing a component-library stack for non-shadcn projects

When a brief signals an established design-system expectation rather than a from-scratch build,
reach for the matching official package instead of hand-rolling the look in Tailwind:
Microsoft/enterprise leads with `@fluentui/react-components`; a Google-ish/Material product with
`@material/web` plus Material 3 tokens; IBM/enterprise analytics with `@carbon/react` plus
`@carbon/styles`; Shopify app surfaces with Polaris, near-required for Shopify admin UI rather than
optional styling; Atlassian/Jira-style with `@atlaskit/*` plus `@atlaskit/tokens`; a GitHub-style
devtool or community page with `@primer/css` or `@primer/react-brand`; UK public-sector with
`govuk-frontend`, a regulatory expectation, not a taste choice; US public-sector/trust-first
contexts with `uswds`; a fast local-business MVP with Bootstrap 5.3; a modern accessible React
foundation with no house style with `@radix-ui/themes`; modern SaaS owning its own component code
with shadcn/ui itself; a Tailwind-based indie/small-team SaaS with Tailwind utilities plus the
`dark:` variant directly. Two named anti-patterns to avoid: importing an official system's tokens
and then overriding most of them by hand, and mixing two systems (Fluent plus Carbon) in one tree.

For an aesthetic with no official package (glassmorphism, brutalism, "Apple Liquid Glass," bento
grids), build an honest native-CSS approximation and label it as an approximation in code and
comments, not as the real thing. There is no official web `liquid-glass.css`; Apple documents
Liquid Glass only for native-platform UI. A packaged thick-glass theme for AI/agent web apps does
exist: Solid Glass theme, below.

## Solid Glass theme

A packaged thick-glass look for AI/agent web apps: one MIT stylesheet (`deeplethe/solid-glass`)
that re-skins stock shadcn/ui as smoky glass, plus agent components. When to choose it, its rules
and values are `design`'s (`surface-webapp.md` "Solid Glass (AI and agent apps)";
`imagery-depth-decoration.md` "Materials"); this section is adoption. Current items and props live
in its docs (deeplethe.github.io/solid-glass).

**Base conflict first.** It needs React 19, Tailwind 4 and the Base UI flavour (`base-nova`), and
finds parts by `data-slot` plus Base UI state attributes (`data-popup-open`, `data-checked`).
Radix reports those states as `data-state` (`open`, `checked`), so they will not light on a Radix
project, and AI Elements needs Radix (above). Pick one agent-UI stack: Solid Glass's components on
Base UI, or AI Elements on Radix.

**Install**, as its docs give it (the CLI's `<owner>/<repo>/<item>` GitHub-registry form, June 2026):

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

**How it themes, and what that costs.** It keeps shadcn's variable names and hangs the material on
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

**Deltas from stock** (so a diff against shadcn is not mistaken for a bug): `Button` gains
`variant="glass"` (`data-strong` lights it a step), its one documented API change; the rest is CSS.
Controls asking for `rounded-lg` get the control radius (no 32px pills); the 3px half-strength focus
ring becomes `0 0 0 1px var(--background), 0 0 0 3px var(--focus-line)`, and fields swap the ring for
a brighter border; hover, chosen and held-open share one pane (`glass-chosen`, `glass-held` on a
trigger, `glass-control`, `glass-armed`; menu rows and sidebar items light from Base UI attributes);
tooltips are popover glass without an arrow; the default chat bubble is clear glass, not ink; menus
lose their `::before` blur sheet; hover greys become `--hover` behind `@media (hover: hover)`.

**Agent-run mapping.** The components render state; the event contract, replay and approval rules
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

**Fix on import** (read from its sources, 2026-11). `TurnStatus` puts `role="status"` on a line
holding a once-a-second clock and a rolling token count, so the polite live region re-announces
constantly, and when it opens the role lands on a `<button>`, replacing its button role: keep one
`role="status"` carrying only the activity label, the clock and count outside it, the button a plain
button. `TaskNotice` gives the outcome only as an `aria-hidden` dot: add it in text. `DotLoader` has
no name: hide it beside a word. Text faded to `/70`–`/80` and light-theme status hues as text miss
4.5:1: keep full tokens. Reduced motion is already handled (the glyph holds a pose and pauses
offscreen; the CSS loops stop).

**Performance.** Every `bg-card`, `bg-popover`, `bg-sidebar` and `glass-panel` carries
`backdrop-filter: blur(26px)` (light adds `saturate(180%)`), so a thread of cards is one backdrop
pass per card at a radius past the budget in `css-craft.md` "Paint and texture craft". Over the dark
theme's even, unlit page the blur samples flat colour and buys little: mark long scrolling regions
`data-glass="opaque"` and verify scroll on a mid-range phone. That attribute drops only the blur;
for a truly solid region also set the reduced-transparency block's opaque `--panel`, `--card`,
`--popover` and `--sidebar` on it.
`backdrop-filter` is unprefixed in Chrome 76, Firefox 103 and Safari 18 (`-webkit-` from Safari 9;
MDN, checked 2026-11-19); the stylesheet ships both and no `@supports` fallback, which holds because
every pane has a fill.

**Reduced transparency and forced colours** (`accessibility.md` "Forced colors, prefers-contrast,
reduced transparency"). Its `prefers-reduced-transparency` block (opaque fills, no blur, edges kept)
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

## Dataviz: pick the library, ship the fallback

Choosing a charting library while building a UI (Chart.js, Recharts, D3, Plotly, by case) is in
scope here; the chart-type-by-data-shape matrix, the rendering-technique-by-datapoint-count
thresholds, and the full accessibility grading of chart types is the dataviz skill's territory.
What stays here: every chart needs an accessible fallback, typically a data-table alternative,
since most chart types (pie charts especially) don't reach an acceptable accessibility grade on
their own.

## Cross-references

The v4 `@theme` mechanics, the container-token collision, and the `cn()`/CVA utilities these
components are built on live in `tailwind.md`. Focus-ring, contrast, and touch-target floors these
components must meet live in `accessibility.md`. Consuming a DESIGN.md/handoff.yaml token export
into shadcn's CSS-variable shape lives in `design-handoff-and-tokens.md`.

<!-- sources: nextlevelbuilder ui-ux-pro-max-skill stacks/shadcn.csv + ui-styling/references/shadcn-theming.md
+ shadcn-accessibility.md (MIT) — miner-ext-a.md; Vercel shadcn/bootstrap skills (claude-plugins-official/
vercel, Apache-2.0, attribution required) — miner-vercel.md; Leonxlnx taste-skill SKILL.md design-system
selection table + dark-mode protocol (MIT) — miner-ext-c.md; Nutlope/hallmark export-formats.md shadcn
CSS-variable shape (MIT) — miner-ext-c.md; icon/asset integration verified 2026-10-17 against
unpkg.com/lucide-static/tags.json (ISC), unpkg.com/@tabler/icons/icons.json (MIT),
iconify.design/docs/api/search.html + @iconify-json packages, github.com/phosphor-icons/react
README + package exports (MIT), simple-icons DISCLAIMER.md (project CC0, per-icon licences vary;
follow each brand's guidelines); deeplethe/solid-glass (MIT, © 2026 DeepLethe) README, content/docs, content/solid, src/solid-glass.css, registry.json and component sources, read 2026-11-19, live registry and shadcn GitHub-registry docs checked the same day, support claims against MDN browser-compat data; design-fold 2026-11: jakubkrehel/skills better-ui icons (MIT) stroke matching and scaled-stroke trap; Nutlope/hallmark export-formats (MIT) accent/muted role collision; ibelick/motion-primitives + ui-layouts/uilayouts (MIT) registry reduced-motion audit -->
