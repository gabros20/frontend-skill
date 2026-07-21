# Client architecture

Purpose: How to shape a client codebase's folders, module boundaries, and import discipline once a
project outgrows an ad hoc structure — feature-vs-type organization, unidirectional import layering,
colocation, the public-API-boundary vs. anti-barrel reconciliation, monorepo package scope, and
design-token file layout.

Read when:
- Structuring a new client codebase, or restructuring one that's outgrown its current shape.
- Deciding feature folders vs. type folders, or where a cross-feature import boundary should sit.
- Setting up a `packages/ui` package's internal shape inside an existing monorepo.
- Laying out a `tokens/` directory or deciding whether a barrel-style `index.ts` is safe to add.

Skip when:
- The question is a component's own composition, hooks, or state/effect craft, not file layout →
  `react-components-and-state.md`.
- The question is token *values* or the primitive/semantic/component tiering decision itself →
  `design-handoff-and-tokens.md`.
- The question is Tailwind's `@theme` mechanics or its shared-`theme.css` import pattern →
  `tailwind.md`.
- The question is Next.js's route/file-convention mechanics → `nextjs.md`.
- The question is which monorepo tool to adopt (Turborepo, Nx, plain pnpm workspaces) or the
  top-level `apps/`+`packages/` split itself — a stack/system decision owned by architecture.

Inputs: the codebase's current size, contributor count, and number of distinct business domains; its
monorepo status, if any; any existing token export needing a file home.

Produces: a feature-vs-type organizing decision matched to the codebase's actual size, an enforced
import direction, a colocation-consistent tree, a barrel policy that distinguishes a bounded
public-API file from a banned directory-wide re-export, and a token-file layout.

## Contents
- Feature folders vs. type folders — the decision
- Unidirectional import layering
- Colocation doctrine
- The public-API-boundary vs. anti-barrel-file reconciliation
- Escalating beyond a flat feature tree
- Monorepo packages/ui — what's still frontend's job
- Design-token file organization
- Structure anti-patterns

## Feature folders vs. type folders — the decision

Past a certain size, type-first organization (`components/`, `hooks/`, `services/`, `store/` each
holding every feature's code together, one folder per concern) scatters a single feature across every
one of those folders — the feature name repeats everywhere but lives nowhere as one unit. Feature-first
organization (`features/<feature>/{api, components, hooks, stores, types, utils}`, including only the
subfolders that feature actually needs) groups by what the code *does* instead of what it *is*, so
"what changes together" stays visible in the tree.

This isn't a universal default, though — a genuine disagreement exists between that convergent
multi-source doctrine and Josh Comeau's function-based model (`components/`, `hooks/`, `helpers/`,
`constants/` at the root, with per-component colocation), which he argues holds up "even to thousands
of components" because feature boundaries blur and drift from the product's real shape over time.
Decision rule: default to type-folders for a small-to-mid app or single-owner codebase — lower
overhead, no premature domain boundary to get wrong. Switch to feature-folders once the codebase has
enough independent business domains, contributors, or size that a type-first tree makes "what changes
together" genuinely hard to see. Treat the switch as a sizing decision, not a taste stance.

## Unidirectional import layering

Once a project is feature-folder shaped, hold one direction: shared → features → app. Root-level
`components/`, `hooks/`, `lib/`, `types/`, `utils/` hold app-wide code with zero feature awareness; a
feature may import from shared but never from another feature or from `app`; `app` may import from
both features and shared. Compose different features at the application layer, not by reaching into
a sibling feature's folder. Enforce it with two ESLint import-restriction rule sets: one blocking
cross-feature imports (a feature may only import itself), one blocking the wrong-direction import
(features/app can't import upward or sideways out of turn) — a real, automatable lint pattern, not
just a convention to remember.

## Colocation doctrine

Place code as close to where it's used as possible; the sharper form is "things that change together
should live near each other." Tests live next to the module they test, not mirrored into a parallel
`test/` tree. A component's styles, types, and sub-components live in its own folder. State lives near
the components that actually consume it — also a performance win, since over-hoisted state causes
needless re-renders far from where it's read. A would-be shared utility stays inline in its one
consuming file until a second real consumer appears; extracting it to a shared `utils/` folder before
that is exactly how that folder becomes an orphaned dumping ground nobody prunes. Two legitimate
exceptions: integration/e2e tests live at the project root since they exercise a cross-module flow,
not one module; a feature-level README covering multiple files in that feature.

## The public-API-boundary vs. anti-barrel-file reconciliation

These aren't the same shape of file, even though both are commonly named `index.ts`. The pack's
anti-barrel rule (`react-rendering-and-rsc.md`, `performance.md`, `react-native.md`) targets an
unbounded, directory-wide re-export file — the kind that makes an entire `components/` or `features/`
tree reachable and defeats tree-shaking at real, measured cost. A thin, per-feature `index.ts` that
re-exports only that feature's actual public API (a handful of named exports, not the whole folder)
is a boundary tool, not that failure mode — it's how the `shared → features → app` layering above
gets enforced in code, and how bulletproof-react's and Feature-Sliced Design's "everything outside a
feature is internal" rule is actually implemented. Judge a barrel by role and size, not filename: a
bounded public-API file is fine; a directory-wide re-export barrel is the thing to avoid. In Next.js
specifically, `optimizePackageImports` mitigates the tree-shaking cost for some barrel shapes
automatically — it doesn't change which shape to write by hand.

## Escalating beyond a flat feature tree

Feature-Sliced Design's layers (`app` → `pages` → `widgets` → `features` → `entities` → `shared`,
each importing only from the layer strictly below, same-layer slices never importing each other) are
the escalation path once a flat feature-folder tree stops making ownership legible on a large,
multi-team codebase — not the default. Its own adoption critique is real: the layer/slice/segment
vocabulary carries a genuine learning-curve cost, and boundaries blur once cross-feature
communication becomes genuinely necessary at scale. Reach for it only when the simpler
shared→features→app model above is demonstrably not enough, and expect to bend its rules for
practicality at real scale rather than treating it as inviolable.

## Monorepo packages/ui — what's still frontend's job

The choice of monorepo tooling (Turborepo, Nx, plain pnpm workspaces) and the top-level
`apps/`+`packages/` split is a stack/system decision owned by architecture, not frontend. What stays
frontend's job once that split exists: a `packages/ui`'s internal shape follows the exact doctrine
above — feature-vs-type folders, the same shared→features→app layering — just scoped to one package
instead of one app.

## Design-token file organization

Distinct from token *values* and the primitive/semantic/component tiering, which
`design-handoff-and-tokens.md` owns — this is the file layout those values live in. Style
Dictionary's project shape: `config.json` at the root, a `tokens/` directory holding token JSON
conventionally split into per-category subdirectories (`color/`, `size/`, and so on), with `source`
a glob (`"tokens/**/*.json"`) that deep-merges every matched file. The directory/file split is purely
an authoring convenience: Style Dictionary merges every token file's contents into one tree regardless
of which file or folder a token came from, so only the token's own path (`color.brand.primary`)
carries meaning, not its file location — split files for human readability only. The W3C DTCG format
(stable since 2025.10) formalizes multi-file token sets as a first-class spec feature, not a tooling
convenience, with `$extensions` as the sanctioned escape hatch for tool-specific data, keyed by
reverse-domain namespacing (`com.company.featureName`) to avoid collisions. Tailwind's shared-
`theme.css`-import pattern for this same file-organization problem lives in `tailwind.md`; this
section is the underlying, stack-agnostic file-layout mechanic it's built on. shadcn's own
`components/ui/` vs. `components/custom/` ownership split is a sibling folder convention, covered in
`shadcn.md`.

## Structure anti-patterns

- **Cyclic feature imports** — a sibling feature reaching into another's internals; prevented by the
  unidirectional-layering ESLint rules above, not by convention alone.
- **A shared/`utils/` dumping ground** — code extracted to "shared" before a second real consumer
  exists; prevented by the colocation doctrine's stay-inline-until-needed rule.
- **Premature abstraction into a fixed taxonomy** — sorting components into atoms/molecules/organisms
  (or an equivalent forced layer) before real usage patterns reveal how they should group; start flat
  and introduce structure only once the flat tree causes felt pain, not upfront.
- **Wrong-granularity barrels** — a directory-wide re-export file built or read as if it were a
  bounded public-API file, or vice versa; see the reconciliation above.
- **Forcing all feature code into route folders** — treating Next.js's route-colocation option as a
  mandate rather than one of its three named, equally-valid organizing strategies; `nextjs.md` owns
  the file-convention mechanics this anti-pattern misapplies.

<!-- sources: alan2207/bulletproof-react docs/project-structure.md (MIT, 35.5k★) — feature-folder
shape, unidirectional import rule, ESLint enforcement pattern; feature-sliced.design docs (MIT,
2.3k★) — layer/slice/segment model, adoption critique; Josh Comeau, joshwcomeau.com/react/
file-structure (personal blog, no license, re-expressed) — function-based counter-case; Kent C.
Dodds, kentcdodds.com/blog/colocation (personal blog, no license, re-expressed) — colocation doctrine
and exceptions; nextjs.org/docs/app/getting-started/project-structure (Vercel official docs) — three
named organizing strategies; styledictionary.com (Apache-2.0) — project shape and merge-by-path
mechanic; designtokens.org DTCG format module (W3C, public standard) — multi-file spec feature and
$extensions convention; tailwindcss.com/docs/theme (Vercel official docs) — verified multi-file
@theme merge pattern; turborepo.dev docs (Vercel official docs) — apps/+packages/ convention —
via researcher-fe-architecture.md -->
