# Tailwind

Purpose: The v4 CSS-first `@theme` model, the container-token collision it creates, Tailwind's own
breakpoint scale, and the `cn()`/`clsx`/`tailwind-merge`/CVA class-composition toolchain a Tailwind
project is built on.

Read when:
- A project uses Tailwind and needs DESIGN.md or handoff tokens wired into `@theme`.
- Choosing between the v4 CSS-first config and a v3 `tailwind.config.js` project.
- Merging conditional or variant classes on a component.
- A build is green but spacing/max-width utilities silently stopped resolving.

Skip when:
- The project has no Tailwind dependency.
- The question is shadcn's component composition or CLI (`shadcn.md`).
- The question is the core content-driven breakpoint doctrine itself, not Tailwind's mapping of it
  (`web-platform-css.md`).

Inputs: the Tailwind major version installed, the DESIGN.md/token export in hand, existing
`className` conventions in the codebase.

Produces: a theme configuration with full utility coverage and no collisions, consistent
class-merge usage, and a breakpoint choice consistent with the rest of the codebase.

## Contents
- v4 vs v3: which config surface
- `@theme` namespaces and full coverage
- The container-token collision (and other build traps)
- Breakpoints: Tailwind's px scale
- `cn()`, `clsx`, `tailwind-merge`, CVA
- Utility conventions worth defaulting to
- Cross-references

## v4 vs v3: which config surface

Detect what the project already uses before touching config; do not migrate a working v3 project
to v4 mid-task unless asked. Tailwind v4 is CSS-first: theme variables live in an `@theme { }`
block in a stylesheet, each variable in a namespace (`--color-*`, `--spacing-*`, and so on) that
generates a family of utilities. This is the canonical path for new work. Tailwind v3's
`tailwind.config.js` JS-object config (`theme.extend`) is the compat/legacy path: still fully
supported, document it as legacy rather than converting it uninvited.

The v4 postcss trap: do not use the `tailwindcss` package itself as a PostCSS plugin under v4, that
was v3's wiring. Use `@tailwindcss/postcss` in PostCSS-based projects, or the dedicated
`@tailwindcss/vite` plugin in Vite projects. Passing the old plugin name is a silent build trap, not
a hard error in every setup, so a broken build isn't guaranteed to point at the cause.

## `@theme` namespaces and full coverage

Each theme variable lives in a namespace that powers one utility family: `--color-*` powers
`bg-*`/`text-*`/`border-*`/`ring-*`; `--font-*` powers `font-<name>` families; `--text-*` (paired
with `--text-*--line-height`) powers `text-<size>`; `--font-weight-*` powers `font-<weight>`;
`--tracking-*`/`--leading-*` power `tracking-*`/`leading-*`; `--radius-*` powers `rounded-*`;
`--spacing-*` powers spacing *and* sizing (`p-*`, `m-*`, `gap-*`, `w-*`, `h-*`, `max-w-*`,
`max-h-*`, `inset-*`, see the collision below); `--container-*` powers `max-w-*`/`min-w-*` t-shirt
sizes and `@container` query sizes; `--shadow-*`/`--inset-shadow-*`/`--drop-shadow-*`/
`--text-shadow-*`; `--ease-*`/`--animate-*`; `--aspect-*`; `--breakpoint-*` (responsive variants,
also feeds `@container` sizes).

Two override mechanics matter: adding a variable inside `@theme` extends the default scale (the
same effect v3's `extend` had). Setting `--namespace-*: initial` (for example `--color-*: initial`)
wipes that entire namespace so only the authored values exist, and any default utility that
namespace powered goes with it.

Colors accept any CSS color syntax; author in OKLCH when perceptual control matters (vary
lightness, hold chroma and hue for a ramp). Check contrast on both surfaces of anything that flips
with a light/dark theme, not just the default surface.

## The container-token collision (and other build traps)

The single highest-value trap in this file: named `--spacing-<key>` tokens (not the bare
`--spacing` base multiplier) feed sizing utilities too, including `max-w-*`. A `--spacing-2xl: 4rem`
token shadows `--container-2xl` even when a container scale is separately defined, collapsing every
`max-w-2xl` reading-width container to 4rem across the whole site. The fix is to never emit named
t-shirt `--spacing-<key>` tokens at all (rely on the bare `--spacing` base and numeric utilities:
`p-24` computes to `6rem`), or, if custom spacing steps are unavoidable, give them non-reserved
names, never `xs`/`sm`/`md`/`lg`/`xl`/`2xl` through `7xl`, which collide with `--container-*` and
`--text-*`. Always define `--container-*` explicitly so `max-w-*` resolves to real widths instead of
falling back to a magic-number arbitrary value.

A related naming trap, not the same bug: v4's spacing-scale utility generator specifically expects
`--spacing-*` (with "ing"). A project using semantically-named `--space-*` tokens needs both the
semantic name and a mirrored `--spacing-*` declaration before utilities like `p-sm`/`gap-lg` will
generate at all. `--text-*`, `--font-*`, and `--ease-*` map through by name with no such trap.

Two more build-time traps to check for proactively, not just after a bug report: a `shadcn init` run
on Tailwind v4 plus Next.js can inject a circular `--font-sans: var(--font-sans)` inside
`@theme inline`, because `@theme inline` resolves custom properties at parse time while Next injects
the actual font variable at runtime via a layout `className`; fix with literal font-family names in
`@theme inline` and move the font-variable classNames from `<body>` to `<html>` in the root layout.
And a literal `*` inside a CSS comment near a `@theme` block can make some minifiers/parsers drop the
entire token block while only printing a soft warning; treat any such parser warning as a hard
failure and verify computed styles directly rather than trusting a green build.

## Breakpoints: Tailwind's px scale

Tailwind's default breakpoints are px-based, not the content-driven rem scale: `sm 640px`,
`md 768px`, `lg 1024px`, `xl 1280px`, `2xl 1536px`. This is Tailwind's own mapping of the core
doctrine; the framework-agnostic breakpoint principle (content-driven, not device-gospel) lives in
`web-platform-css.md`, cite it rather than re-deriving it here. Override via `--breakpoint-*` in
`@theme` only when the brief genuinely needs a non-default scale.

## `cn()`, `clsx`, `tailwind-merge`, CVA

`cn()` combines `clsx` (conditional class composition) with `tailwind-merge` (`twMerge`, which
resolves same-property class conflicts by keeping the last one and understands Tailwind's modifier
system, `hover:`/`focus:`/etc.). Use `cn()` for any conditional or merged class logic instead of
concatenating class strings by hand. Class-ordering convention: base classes, then variant classes,
then conditional/state classes, then the caller's `className` prop last, so a caller's override
always wins.

Class Variance Authority (`cva`, package `class-variance-authority`) is the declarative variant API.
Define the `cva()` call at module scope, outside the component body, so it isn't recreated on every
render. Extend an existing component's variants by adding to its `cva` config rather than layering
ad hoc conditional classes on top of it.

## Utility conventions worth defaulting to

Default to Tailwind's built-in scale (spacing, color, radius, shadow) unless the project's own
tokens or an explicit request says otherwise. `text-balance` on headings and `text-pretty` on
body/paragraph text prevent ragged or orphaned line wraps. `tabular-nums` on any numeric or
frequently-updating display value keeps digit-width changes from shifting layout.
`truncate`/`line-clamp-*` handle dense single- or multi-line overflow instead of hand-rolled
`overflow: hidden` plus ellipsis CSS. `size-*` replaces separate `w-*`/`h-*` pairs on square
elements. Never modify `tracking-*` (letter-spacing) unless explicitly requested. Keep one small,
fixed `z-*` scale for the project rather than arbitrary large values like `z-[9999]`, which invite
stacking-context conflicts that are a distinct failure mode from ordering alone.

Lean on Tailwind's automatic unused-class purging (JIT scanning of source files) rather than
fighting it: avoid dynamically constructed class name strings assembled by concatenation or
interpolation (`` `text-${color}-500` ``), since the scanner cannot statically find them and they
get purged from the build. Use a lookup map of complete class strings instead.

## Cross-references

Component composition mechanics that consume these classes (compound components, `asChild`/`Slot`,
`data-state`/`data-slot` attributes) live in `react-components-and-state.md`. shadcn/ui's own
component-level Tailwind wiring, including its CSS-variable shape and dark-mode toggle, lives in
`shadcn.md`. The content-driven rem breakpoint doctrine this file's px scale maps onto lives in
`web-platform-css.md`. Consuming DESIGN.md/handoff.yaml tokens into this theme is
`design-handoff-and-tokens.md`.

<!-- sources: webdesign tailwind-v4-theme.md (Tamás Gábor, MIT, wholesale import) — miner-webdesign.md;
nextlevelbuilder ui-ux-pro-max-skill ui-styling/references/{tailwind-customization,tailwind-responsive}.md
(MIT) — miner-ext-a.md; ibelick baseline-ui SKILL.md (MIT) — miner-ext-b.md; Vercel shadcn skill
(claude-plugins-official/vercel, Apache-2.0, attribution required) — miner-vercel.md; building-components
(no license, re-expressed) — miner-local.md; Leonxlnx taste-skill SKILL.md postcss trap, Nutlope/hallmark
export-formats.md spacing-key trap (both MIT) — miner-ext-c.md -->
