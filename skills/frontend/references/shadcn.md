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

Resolve a concept to a verified export name before importing it — never guess one. Lucide ships a
name→tags map (`lucide-static`'s `tags.json`) and Tabler a richer manifest (`@tabler/icons`'
`icons.json`: tags plus category); search it, then import the matched name. Tabler is the larger
fallback set when Lucide lacks a symbol. For the long tail, Iconify's search API
(`/search?query=…&prefixes=…`) returns set-prefixed names (`mdi:home`); resolve at build time and
bundle from `@iconify-json/<set>` so a static build makes no runtime icon request, honoring each
set's own license. Phosphor inside a React Server Component imports from its SSR entry
(`@phosphor-icons/react/ssr`), which cannot inherit an ancestor `IconContext`. Brand logos: a file
license (MIT, CC0) is not trademark permission — render marks unaltered, imply no endorsement, and
skip no-derivatives sets when a mark must be recolored. Key country flags by ISO 3166 alpha-2 code
from a tree-shakeable package, never a component that bundles every flag. Anything fetched from an asset API at build
time is vendored into the repo with its name, path, and license in a manifest, never left as a
runtime dependency.

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
CSS-variable shape (MIT) — miner-ext-c.md; icon/asset integration verified 2026-10-17 against
unpkg.com/lucide-static/tags.json (ISC), unpkg.com/@tabler/icons/icons.json (MIT),
iconify.design/docs/api/search.html + @iconify-json packages, github.com/phosphor-icons/react
README + package exports (MIT), simple-icons DISCLAIMER.md (project CC0, per-icon licences vary;
follow each brand's guidelines) -->
