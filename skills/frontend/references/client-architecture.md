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
- Placing providers, splitting Context, or escalating from flat features to FSD layers.

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
- Production SPA harness (API client, session bootstrap, flags, error reporting) →
  `client-app-wiring.md`.

Inputs: the codebase's current size, contributor count, and number of distinct business domains; its
monorepo status, if any; any existing token export needing a file home.

Produces: a feature-vs-type organizing decision matched to the codebase's actual size, an enforced
import direction, a colocation-consistent tree, a barrel policy that distinguishes a bounded
public-API file from a banned directory-wide re-export, and a token-file layout.

## Contents
- Feature folders vs. type folders — the decision
- Unidirectional import layering
- ESLint `import/no-restricted-paths` zones
- Colocation doctrine
- Composition → Context → store ladder; provider-per-subtree
- The public-API-boundary vs. anti-barrel-file reconciliation
- Escalating beyond a flat feature tree (FSD)
- Monorepo packages/ui — what's still frontend's job
- Design-token file organization
- Content-driven site / marketing structure patterns
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
a sibling feature's folder.

## ESLint `import/no-restricted-paths` zones

Convention alone does not hold under multi-contributor pressure. Enforce with
`eslint-plugin-import`'s `import/no-restricted-paths` in two zone families (bulletproof-react shape):

**1. Cross-feature ban** — each feature is only allowed to import itself from `features/`:

```js
// one zone per feature; expand as features are added
{
  target: './src/features/auth',
  from: './src/features',
  except: ['./auth'],
},
{
  target: './src/features/comments',
  from: './src/features',
  except: ['./comments'],
},
// …discussions, teams, users, …
```

**2. Unidirectional ban** — features cannot import from `app`; shared modules cannot import from
features or app:

```js
{
  target: './src/features',
  from: './src/app',
},
{
  target: [
    './src/components',
    './src/hooks',
    './src/lib',
    './src/types',
    './src/utils',
  ],
  from: ['./src/features', './src/app'],
},
```

Generate the per-feature zones from the directory listing in CI or a small codegen step so a new
feature folder without a zone is a build failure, not a silent hole. Under FSD (below), the same
plugin shape maps to layer targets: a `features/*` target cannot import from `widgets`/`pages`/`app`,
and same-layer slice cross-imports are banned with per-slice `except` lists.

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

## Composition → Context → store ladder; provider-per-subtree

Order of operations for where client state lives (KCD):

| Rung | Reach for when | Do not use when |
|---|---|---|
| 1. Composition (`children` / slots) | Parent owns state; only direct children need it | Siblings outside the parent frame must act on it |
| 2. Context (small, split providers) | Low-velocity shared data across a subtree (theme, auth user, locale) | High-frequency values (pointer, scroll, per-keystroke) or unrelated domains in one bag |
| 3. Global store (Zustand/Redux/…) | Truly cross-route client state with selectors, or high-velocity data that Context cannot isolate | Default for every form field or every server list |

React is already a state manager — over-globalizing into one Redux/mega-Context is the common failure
mode, not under-using a library. Lift state only as far as shared consumers need.

**Multi-context split:** user settings ≠ notifications ≠ auth session. One mega-provider re-renders
every consumer of any field on every update. Split by change frequency and domain; keep each value
object stable (see Context value stability in `react-components-and-state.md`).

**Provider-per-route-subtree:** place a provider under the route tree that needs it
(`NotificationsProvider` only on `/notifications/**`, not the root layout). Unused trees never
subscribe; the provider module code-splits with the route. App-wide providers (theme, auth session)
stay at root; feature providers stay under their feature route.

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

**Vite-specific ban:** feature barrels defeat Vite's tree-shaking and inflate both build time and
client graph. Prefer leaf imports (`features/auth/components/LoginForm`) over
`features/auth` re-export hubs. If a public API file is required for lint/FSD boundaries, keep it to
a short explicit export list — never `export * from './components'`. Icon/component library barrels
have measured 200–800ms import cost at scale; same rule applies (direct source path or
`optimizePackageImports` under Next).

## Escalating beyond a flat feature tree (FSD)

Feature-Sliced Design is the escalation path once a flat feature-folder tree stops making ownership
legible on a large, multi-team codebase — not the default. Layers, top → bottom (most → least
responsibility):

| Layer | Role |
|---|---|
| `app` | App-wide providers, routers, styles, entry |
| `pages` | Full pages / route compositions |
| `widgets` | Large self-contained UI blocks composed of features/entities |
| `features` | User interactions that bring business value (actions) |
| `entities` | Business entities (user, product, order) |
| `shared` | UI kit, libs, API client, config — zero business knowledge |

`processes` is deprecated; omit unused layers rather than inventing new ones. **Import rule:** a
module may import only from layers **strictly below** it. Same-layer slices never cross-import —
compose at the layer above. External consumers import only the **public API of a slice** (slice root
`index.ts` / explicit public file); internal segments (`ui`, `api`, `model`, `lib`, `config`) are
private. Segments describe purpose (`api`, `ui`, `lib`, `config`), not a dump of `components`/`hooks`
across every slice.

**Exceptions:** `app` and `shared` are layer+slice hybrids — segments inside them may import freely
among themselves. **Named failure modes** (FSD issues docs): cross-imports (sibling features reaching
in), desegmented dumps (no public API, everything exported), excessive entities (entity explosion
without real domain weight). Remediate by lifting shared UI to `shared`/`entities`, composing at
`widgets`/`pages`, and tightening the public API surface.

Learning-curve cost is real; boundaries blur once cross-feature communication is genuinely needed.
Reach for FSD only when shared→features→app is demonstrably not enough, and expect to bend rules for
practicality at real scale rather than treating them as inviolable. Atomic Design is not a substitute
for FSD: atoms/molecules lack a business-responsibility layer.

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

## Content-driven site / marketing structure patterns

Procedural structure for CMS/JSON-driven marketing pages — not art direction. Stack-agnostic:
one section key → one component is the pattern; React `'use client'`, Astro islands, or template
includes are implementations of the same contract.

**Keyed section registry, fail loud.** One client component per distinct section key, registered in
a key→component map. The page renderer walks the page's ordered sections, looks up each key, spreads
typed fields as props, and uses a stable entry id as the list key. **An unmatched key fails loud in
development** (throw or hard warn) — never silent skip; a missing registry entry is a section
quietly gone from a live page with no error anywhere. Render order equals data order; do not re-sort
in the renderer. List-typed fields arrive partial or empty: filter rows missing required keys before
mapping, and use index-qualified stable keys (`` `${label}-${i}` ``) when values can repeat or be
blank.

**Standardized image + link primitives.** Centralize a responsive image wrapper (framework `Image`
or hand-rolled `srcset`): default `sizes` for common breakpoints (override `100vw` for full-bleed),
infer width/height from the largest variant so layout does not shift, and resolve `alt` through a
fallback chain (explicit alt → asset metadata → safe generic default) so nothing ships as accidental
empty alt. Centralize a link primitive that branches internal (framework router) vs external
(`<a rel="noopener noreferrer">` when opening a new tab) so sections never re-remember the security
attrs.

**Visual acceptance ≠ green build.** A compile-green build does not prove correct UI. Serve the
build, screenshot every route at desktop and mobile, and actually inspect for overflow, overlap,
fixed-header occlusion, broken/placeholder images, collapsed spacing, and horizontal scroll. For
lazy-loaded or scroll-reveal content, a single full-page shot can capture blank — step-scroll with
a short wait between steps, then return to top before final capture. Map/iframe embeds often paint
black under headless capture; put an on-brand static fallback behind the iframe so visual QA does
not ship a black rectangle.

**Container-token collision (cite only).** If globals already own container/spacing custom
properties feeding `max-w-*` layout, a per-project theme must not redefine or drop that block —
layout collapses site-wide. Full trap and Tailwind `@theme` version live in `web-platform-css.md`
and `tailwind.md`; do not "clean up" those tokens out of the global sheet.

**Stack posture.** Prefer these patterns over stack loyalty — the registry, defensive lists,
primitives, and visual gate transfer across Next/Astro/SvelteKit; only the file names change.

**One typed content interface, two loaders.** Render sections from a typed content interface that
a local fixture loader and the CMS client both satisfy, so the site builds, previews, and
prerenders (static params from the fixtures) without CMS credentials, and the CMS swaps in without
touching a section. **Done means delivered:** a headless CMS's delivery API typically serves only
published content, while authoring tools read the management API — verify every route resolves
through the delivery side, never by a management read, and keep the management credential out of
the client entirely (`client-security.md`). When the content model carries the header and footer
as sections, render chrome through exactly one path — the registry or the layout, never both — or
it renders twice.

**Bake solved traps into the starter.** For repeated site builds, commit a starter that already
encodes the fixes (container tokens, image-host allow-list, registry wiring) with pinned
dependencies, a lockfile, and a standalone build smoke test against fixture content; per-site
sections stay authored. A solved bug then cannot recur, and dependency drift fails the smoke build
instead of a live project.

## Structure anti-patterns

- **Cyclic feature imports** — a sibling feature reaching into another's internals; prevented by the
  ESLint zones above, not by convention alone.
- **A shared/`utils/` dumping ground** — code extracted to "shared" before a second real consumer
  exists; prevented by the colocation doctrine's stay-inline-until-needed rule.
- **Premature abstraction into a fixed taxonomy** — sorting components into atoms/molecules/organisms
  (or an equivalent forced layer) before real usage patterns reveal how they should group; start flat
  and introduce structure only once the flat tree causes felt pain, not upfront.
- **Wrong-granularity barrels** — a directory-wide re-export file built or read as if it were a
  bounded public-API file, or vice versa; Vite feature barrels that defeat tree-shaking.
- **One mega-provider at root** — unrelated domains (settings, notifications, auth) forced through a
  single Context value; split and place under the route subtree that needs them.
- **Forcing all feature code into route folders** — treating Next.js's route-colocation option as a
  mandate rather than one of its three named, equally-valid organizing strategies; `nextjs.md` owns
  the file-convention mechanics this anti-pattern misapplies.

<!-- sources: alan2207/bulletproof-react docs/project-structure.md (MIT, 35.5k★) — feature-folder
shape, unidirectional import rule, ESLint import/no-restricted-paths zones, Vite no-feature-barrel
guidance; feature-sliced.design docs (MIT, 2.3k★) — layer/slice/segment model, import-only-below,
public API of slice, same-layer ban, adoption critique, named failure modes; Josh Comeau,
joshwcomeau.com/react/file-structure (personal blog, no license, re-expressed) — function-based
counter-case; Kent C. Dodds, kentcdodds.com/blog/colocation + Application State Management with
React (personal blog, no license, re-expressed) — colocation doctrine, composition→Context→store
ladder, multi-provider split, provider-per-route-subtree; nextjs.org/docs/app/getting-started/
project-structure (Vercel official docs) — three named organizing strategies; styledictionary.com
(Apache-2.0) — project shape and merge-by-path mechanic; designtokens.org DTCG format module (W3C,
public standard) — multi-file spec feature and $extensions convention; tailwindcss.com/docs/theme
(Vercel official docs) — verified multi-file @theme merge pattern; turborepo.dev docs (Vercel
official docs) — apps/+packages/ convention; Vercel react-best-practices residual barrel import cost
— via authors-architecture.md, github-relay.md, skills-finder.md; webdesign frontend-build-patterns
(local specialist, re-expressed) — section-key registry fail-loud, data-order render, defensive
list fields, image/link primitives, visual acceptance screenshots + step-scroll, container-token
collision cite to web-platform-css/tailwind, map embed black-in-headless; anonymous production
site-rebuild runs (2026, re-expressed) — typed fixture/CMS loader swap, delivery-API done-check,
starter template with baked fixes + smoke build. -->
