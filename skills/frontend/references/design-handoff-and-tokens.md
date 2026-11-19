# Design handoff and tokens

Purpose: What frontend receives from design (`handoff.yaml`, DESIGN.md, token exports) and how to
turn that contract into a working, two-mode token system in code, without redefining what design
already decided.

Read when:
- Starting implementation from an approved design handoff package.
- Wiring DESIGN.md or handoff tokens into the codebase for the first time on a project.
- Deciding a token file's structure, or checking whether a build still matches its token contract.
- The approved design is missing a state the implementation needs.
- Building from a Figma file or an approved comp image instead of a handoff package, or deriving
  tokens from an existing codebase.

Skip when:
- The question is Tailwind's specific `@theme` mechanics (`tailwind.md`) or shadcn's specific
  CSS-variable shape (`shadcn.md`); this file is the stack-agnostic layer underneath both.
- The design is still being explored or isn't approved yet (`design` owns that stage).

Inputs: the `handoff.yaml` companion, DESIGN.md, its exported token format(s), and the target
codebase's existing stack and conventions.

Produces: an accepted handoff (or a reported stop, if a needed state is missing), a wired token
pipeline with full coverage, and a dark-mode-safe token strategy.

## Contents
- Accepting the handoff.yaml contract
- The token model frontend consumes
- Two export formats, one job each
- Wiring tokens without inventing values
- Building from a design file or image
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

Typography arrives as composite tokens (`$type: typography`: family, size, weight, line-height,
tracking); emit each as one class or mixin so size and leading never separate, and fail the build on
a raw `font-size` or `line-height` outside the token layer — a token set without enforcement is
documentation. Match the project's colour notation; converting notation (hex to `oklch()`) is a
scoped migration that shifts every value by rounding, never a drive-by.

Reading tokens out of an existing codebase (to write DESIGN.md or a token file), in order: CSS
custom properties → Tailwind theme → CSS-in-JS theme → token files (DTCG, Style Dictionary) →
component-library variants → global stylesheet → computed styles of the rendered `body`, `h1`, `a`,
`button`, and a card (these catch values the tokens miss). Record only reused values; invent no
components, and with one accent record Primary + Neutral, never an invented secondary.

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
live in `tailwind.md`. Where the target is shadcn/ui, match the project's generation by
reading its `globals.css`: current shadcn (Tailwind v4) stores full color values
(`--primary: oklch(0.205 0 0);`) and maps them to utilities in `@theme inline`
(`--color-primary: var(--primary);`); the older v3 setup stored bare HSL channel triples composed
as `hsl(var(--primary) / <alpha>)`. Follow what is there and never mix the two shapes; shadcn's
`accent`/`muted` role collision with a design system's own names is in `shadcn.md`. Canonical shadcn
role names to map an arbitrary token set onto:
`background`/`foreground`, `card`/`card-foreground`, `popover`/`popover-foreground`,
`primary`/`primary-foreground`, `secondary`/`secondary-foreground`, `muted`/`muted-foreground`,
`accent`/`accent-foreground`, `destructive` (a fixed semantic red, independent of the brand accent),
`border`/`input`/`ring` (ring is the focus color), and a single `radius` token, since shadcn uses one
radius value rather than a per-component scale.

## Building from a design file or image

When the source is a Figma file or an approved comp image rather than a handoff package:

- **Read values at the source.** Read a Figma file through Figma's own tooling (its MCP server and
  skill — check installed or deferred tools before declaring it unavailable, and ask the user to
  authenticate when signed out); download assets, since design-tool asset URLs expire. Trust
  variable names over hex, and auto-layout gap and padding over absolute x/y. An image gives ratios
  only: state the assumed scale (a 2880px capture is usually 1440 CSS px at 2×) and ask for the file.
- **Map every value to a token.** Bound variable → the same-named token; a raw value equal to a token
  → that token; no token → the nearest, reported as rounded. Stop and ask when rounding shifts more
  than 2px or lands on another color step. Never add a token, variant, or arbitrary value
  (`w-[343px]`, raw hex) to hit a number. An instance maps to the project's component and variant
  (Code Connect mappings win); with no equivalent, plain markup, a recorded deviation, and a question.
- **Build only what is drawn.** Undrawn frames, breakpoints, and states get the component default
  and are listed missing. Nothing absent from the comp exists — no invented borders, rules,
  containers, or chrome; the only concessions are the closest obtainable font, icon pictograms, and
  genuine comp defects. Copy the comp's words verbatim in the first build. No neighbouring edits: a
  diff wider than the design is the top failure.
- **Comp images: one medium per region.** Painted, photographic, or textured regions become raster
  plates regenerated at ≥1.5× their region (a comp crop is never a shipped pixel); text, controls,
  chrome, countable diagrams, and anything that moves are code.
- **Measure; never grade a recreation from memory** — models believe their rebuild of an image
  succeeded when it didn't. Write a measured spec first (viewport and DPR, container, grid, bands,
  type, color, radii, spacing), then build in passes (block-out, type, spacing, color, details,
  other widths), diffing after each. Fix the highest shifted region first, since it pushes
  everything below; change one thing per round and revert any change that lowers the score; don't
  polish color while structure is off. Judge per region: *missing* needs its material,
  *contradicted* needs its structure re-derived, *drift* is where size and spacing edits belong — a
  high overall score never excuses a missing region. The first viewport must hold across
  1280–1600px desktop widths, not only the comp's. After ~3 failed rounds on a region, escalate.
- **Report** per frame width, element by element: Element · Design · Built · Status (Matches /
  Rounded / Deviates, asked), plus unwired pieces, missing states, and domain conflicts (build as
  designed and report the accessibility conflict). "Gap 12, design 16" is a finding; "feels tight"
  isn't.

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
correct to switch between. Nested themes: a `:not([data-theme="dark"])` rule also matches through a
light page into a dark island inside it — order the dark rule after the light one at equal
specificity, or key on the island's own theme attribute.

## The lint-clean precondition

If the design package includes a DESIGN.md-style spec, treat it lint-clean (no broken token
references) as a precondition for treating it as a source of truth, not an optional nicety. A
broken-reference error means a token the spec cites doesn't resolve, and building against an
unresolved reference means building against a value nobody actually approved. The matching code-side
smell is a literal hardcoded value (`#3B82F6` instead of `var(--color-primary)`) inside the
implementation: it means a token was available and simply wasn't used. Severity: a font family not
declared in DESIGN.md is blocking drift; an off-scale color, radius, or size is a warning that
becomes either a token or a DESIGN.md change.

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
DTCG mechanics (both MIT) — miner-ext-c.md; design-fold 2026-11: ui.shadcn.com/docs/theming (verified
2026-11-19: full oklch() values mapped via @theme inline) + Nutlope/hallmark v2 export-formats (MIT) —
shadcn shape correction; jakubkrehel/skills build-design (MIT) — Figma read-at-source, token mapping
and rounding contract, drawn-only scope, per-element report, notation migration; pbakaus/impeccable
(Apache-2.0) — comp-image medium rule, region verdicts, viewport range, escalation, codebase token
extraction order, lint severities; Aayan15728/majestic-ui-skill design-to-code (MIT) — measured spec,
passes, highest-region-first, one change per round; jpoindexter/typography-skills (MIT) — composite
typography tokens; wheresryan22/anatomy (MIT) — nested-theme trap -->
