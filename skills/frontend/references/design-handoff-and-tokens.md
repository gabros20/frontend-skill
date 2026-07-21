# Design handoff and tokens

Purpose: What frontend receives from design (`handoff.yaml`, DESIGN.md, token exports) and how to
turn that contract into a working, two-mode token system in code, without redefining what design
already decided.

Read when:
- Starting implementation from an approved design handoff package.
- Wiring DESIGN.md or handoff tokens into the codebase for the first time on a project.
- Deciding a token file's structure, or checking whether a build still matches its token contract.
- The approved design is missing a state the implementation needs.

Skip when:
- The question is Tailwind's specific `@theme` mechanics (`tailwind.md`) or shadcn's specific
  CSS-variable shape (`shadcn.md`); this file is the stack-agnostic layer underneath both.
- The design is still being explored or isn't approved yet (design owns that stage).

Inputs: the `handoff.yaml` companion, DESIGN.md, its exported token format(s), and the target
codebase's existing stack and conventions.

Produces: an accepted handoff (or a reported stop, if a needed state is missing), a wired token
pipeline with full coverage, and a dark-mode-safe token strategy.

## Contents
- Accepting the handoff.yaml contract
- The token model frontend consumes
- Two export formats, one job each
- Wiring tokens without inventing values
- Dark mode: pick one strategy, not two
- The lint-clean precondition
- Cross-references

## Accepting the handoff.yaml contract

Design ships a compact `handoff.yaml` alongside its human-readable package; treat it as an index,
not a copy of the artifacts themselves. Frontend is a `recommended_next` consumer of this file, not
the owner of any of its fields. `objective` is the only universally required field; every other
field may be absent and must be tolerated absent, not treated as a schema violation.

The fields worth actually reading: `artifacts_created` (paths, type, owner) to locate the DESIGN.md
and token files; `constraints` and `assumptions`, which the implementation must not silently
violate; `unresolved`, which are open questions design left open, not settled decisions frontend
should quietly pick an answer for. If the approved design omits a state the implementation needs (an
error or empty variant that was never designed, for instance), stop and report the missing state
rather than inventing production behavior. That stop condition belongs to design's process, and
frontend's job here is to honor it, not route around it.

## The token model frontend consumes

Three tiers, each changed on a different cadence: primitive/global (a raw value, changed rarely,
for example `--blue-600: #2563eb`), semantic/alias (a purpose mapping that changes on a theme
switch, for example `--color-primary: var(--blue-600)`), and component (per component, references a
semantic token, for example `--button-bg: var(--color-primary)`). Never reference a raw primitive
from component-level code; that direct reference is what breaks the moment the theme changes. This
structure is design's authored decision, not frontend's to redefine; frontend's job is to wire it
correctly, not to reinvent the tiering.

Tokens interchange as W3C DTCG-format JSON: path-based (`color.paper.$value`), with `$type` required
on every token (color, dimension, fontFamily, fontWeight, duration, cubicBezier, shadow, border, and
more). A responsive value, such as a `clamp()` type-scale step, does not belong in the JSON at all;
keep a fixed, portable value in the token and leave the `clamp()` expression in CSS only. `oklch(...)`
is accepted as a raw string by modern tooling (Style Dictionary, Token Studio, Cobalt), but convert
it to hex or `color(oklch ...)` if the target pipeline doesn't support it, and flag that conversion
as lossy at the point it happens.

A Style Dictionary-style pipeline transforms one JSON source into per-platform outputs:
`css/variables.css`, `js/tokens.js`, `ios/Colors.swift`, `android/colors.xml`, and a Figma sync.
Never hand-edit a generated output file directly; edit the source token and regenerate, or the next
regeneration silently reverts the hand-edit and the fix disappears without a visible error.

## Two export formats, one job each

Design ships tokens twice: a structured export for tooling (`json-tailwind` for a Tailwind v3
`theme` object, `css-tailwind` for a Tailwind v4 `@theme` CSS block, or `dtcg` for a W3C
`tokens.json`) and a human concrete-values map with no prose, meant for a developer reading it
directly. Match the export format to the target stack; don't hand-transcribe values off the human
map into config when a matching machine export already exists for that exact purpose.

## Wiring tokens without inventing values

Frontend consumes design's token values; the token contract itself (what pages must share, which
roles exist) is design's decision, not frontend's to relitigate mid-implementation. Where the target
is Tailwind, the exact `@theme` namespace mapping and the spacing/container collision it can trigger
live in `tailwind.md`. Where the target is shadcn/ui, its CSS variables have a specific unwrapped
shape: space-separated triples with no `oklch()` wrapper and no commas (`--primary: 58% 0.16 60;`),
because shadcn's component CSS composes them at the point of use as
`oklch(var(--primary) / <alpha>)`; supplying a fully-wrapped `oklch(58% 0.16 60)` breaks that
composition outright. Canonical shadcn role names to map an arbitrary token set onto:
`background`/`foreground`, `card`/`card-foreground`, `popover`/`popover-foreground`,
`primary`/`primary-foreground`, `secondary`/`secondary-foreground`, `muted`/`muted-foreground`,
`accent`/`accent-foreground`, `destructive` (a fixed semantic red, independent of the brand accent),
`border`/`input`/`ring` (ring is the focus color), and a single `radius` token, since shadcn uses one
radius value rather than a per-component scale.

## Dark mode: pick one strategy, not two

Pick one token strategy per project and hold it: Tailwind's `dark:` variant for utility-first
projects, or CSS custom properties swapped under `[data-theme]`/`prefers-color-scheme` for
token-driven or component-library projects. Don't mix both approaches in the same codebase. Never
use pure `#000000`/`#ffffff`; an off-black or off-white keeps elevation and layering legible. Hold
the same visual hierarchy and contrast floor in both modes; "make everything gray" is not a
substitute for a designed dark theme. Respect `prefers-color-scheme` as the default unless the brand
explicitly commits to a single mode. Test both modes before calling a surface done; a screen only
ever viewed in light mode is unverified in dark mode specifically, not verified-by-default. The
CSS-level mechanism behind `prefers-color-scheme`, `color-scheme`, and `forced-colors` lives in
`web-platform-css.md`; this section is the token-side discipline that gives that mechanism something
correct to switch between.

## The lint-clean precondition

If the design package includes a DESIGN.md-style spec, treat it lint-clean (no broken token
references) as a precondition for treating it as a source of truth, not an optional nicety. A
broken-reference error means a token the spec cites doesn't resolve, and building against an
unresolved reference means building against a value nobody actually approved. The matching code-side
smell is a literal hardcoded value (`#3B82F6` instead of `var(--color-primary)`) inside the
implementation: it means a token was available and simply wasn't used.

## Cross-references

Tailwind's `@theme` namespace mapping and its spacing/container collision live in `tailwind.md`.
shadcn's component-level composition, including which primitive to reach for and the CLI, lives in
`shadcn.md`. The `prefers-color-scheme`/`color-scheme`/`forced-colors` CSS mechanism lives in
`web-platform-css.md`. WCAG contrast floors these tokens must clear live in `accessibility.md`. The
design-side authoring of this same token model (procedural tokens, the DESIGN.md contract,
governance) is the sibling design skill's `design-systems.md` and `handoff.md`.

<!-- sources: design-skill handoff.md + design-systems.md contract (Tamás Gábor, MIT, receiving-side
mirror) — miner-webdesign.md; triage-cuellarfr-dembrandt-ehmo.md cuellarfr design-tokens.md 3-tier model +
W3C DTCG format + Style Dictionary pipeline (MIT); Leonxlnx taste-skill SKILL.md dark-mode protocol +
official design-system selection framing, Nutlope/hallmark export-formats.md shadcn CSS-variable shape and
DTCG mechanics (both MIT) — miner-ext-c.md -->
