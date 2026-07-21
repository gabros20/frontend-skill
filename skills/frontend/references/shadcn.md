# shadcn/ui

Purpose: shadcn/ui's CLI and composition mechanics, which component or primitive to reach for by
task, the icon-library default, and which official component-library package to reach for instead
when the brief signals an established design system.

Read when:
- Installing or configuring shadcn/ui, or adding a component to an existing shadcn project.
- Choosing which primitive fits a piece of interactive UI (overlay, table, confirm, notification).
- Picking an icon library, or a component-library stack for a project that signals an enterprise,
  government, or platform-specific design system rather than a from-scratch build.

Skip when:
- The task is Tailwind theme/class mechanics with no shadcn involved (`tailwind.md`).
- The question is the component's visual direction or aesthetic pick, not its implementation
  (design).

Inputs: whether shadcn is already installed, the project's existing icon-library dependency (if
any), and the brief/brand signal (enterprise, government, Shopify, indie SaaS, no signal at all).

Produces: the correct CLI sequence, a component/primitive choice consistent with the task, one
consistently used icon library, and working dark-mode wiring.

## Contents
- Setup and CLI
- Composition mechanics
- Reach for this first: component selection
- Two gotchas worth checking before shipping
- Dark mode wiring
- Icon libraries
- Choosing a component-library stack for non-shadcn projects
- Dataviz: pick the library, ship the fallback
- Cross-references

## Setup and CLI

Order is load-bearing: `npx shadcn@latest init` before `npx shadcn@latest add <component>`.
Non-interactive/CI use needs `-d` (skips every prompt, including the base-primitive choice);
`-y`/`--yes` alone still prompts for that one. `--base radix` (the default) vs `--base base-ui`:
stay on `radix` if the project uses, or may ever use, AI Elements, which has type errors against
Base UI. CLI v4 deprecates several init flags (`--style`, `--base-color`, `--src-dir`,
`--no-base-style`, `--css-variables`, now errors rather than silently no-oping) and renames two
registry types to `registry:base`/`registry:font`.

Command surface beyond init/add: `search`, `build`, `view`, `info`, `docs <component>` (returns
agent-friendly code, API, and examples inline), and `migrate` (below). Custom registries are
namespaced in `components.json` (`registries.<name>.url`, with `Authorization` header support for
private registries). `components.json` also carries `baseColor` (`gray`, `neutral`, `slate`,
`stone`, `zinc`, `mauve`, `olive`, `mist`, `taupe`) and the CLI v4 radius scale, which is
multiplicative (`--radius-sm: calc(var(--radius) * 0.75)`), not additive.

Two CLI migrations worth knowing exist: `npx shadcn@latest migrate radix` moves individual
`@radix-ui/react-*` imports onto the unified `radix-ui` package, then prune the now-unused
per-package dependencies. `npx shadcn@latest migrate rtl` converts directional utility classes
(`ml-4`, `left-2`) to logical properties (`ms-4`, `start-2`) at install time, rather than a manual
authoring pass.

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

## Two gotchas worth checking before shipping

`shadcn init` on Tailwind v4 plus Next.js can inject a circular `--font-sans: var(--font-sans)`
inside `@theme inline`, because `@theme inline` resolves CSS custom properties at parse time while
Next injects the actual font variable at runtime via a layout `className`. This silently breaks the
configured font. Fix with literal font-family names in `@theme inline`, and move the font-variable
classNames from `<body>` to `<html>` in the root layout (full mechanics in `tailwind.md`).

A new shadcn project's post-bootstrap baseline: install a fixed primitive set in one call (`button
card input label textarea select switch tabs dialog alert-dialog sheet dropdown-menu badge
separator skeleton table`) before starting feature work, confirm the shell uses `bg-background`/
`text-foreground` tokens rather than hardcoded colors, and apply the Geist-font fix above if the
project uses Geist.

## Dark mode wiring

Next.js recipe: the `next-themes` package, a `ThemeProvider` client wrapper, root layout configured
with `attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange`, `<html
suppressHydrationWarning>`, and a `useTheme()` hook driving the toggle. Non-Next fallback:
`document.documentElement.classList.toggle('dark')` plus `localStorage` plus
`matchMedia('(prefers-color-scheme: dark)')`. This section is the toggle mechanism only; the token
strategy behind the two modes (which values should and shouldn't change, contrast parity) lives in
`design-handoff-and-tokens.md`.

## Icon libraries

Default: match the project's existing icon-library dependency, don't introduce a second one on top
of it. On a greenfield project, two defensible defaults exist, and sources disagree on which to
lead with: Lucide (the broadest existing baseline adoption) and Phosphor (weight variants). Pick
one and never mix libraries within the same UI. Whichever is chosen: one consistent stroke weight
throughout, `aria-hidden` on every decorative icon, and never hand-roll an SVG for a concept the
chosen library already ships a named icon for.

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
Liquid Glass only for native-platform UI.

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
CSS-variable shape (MIT) — miner-ext-c.md -->
