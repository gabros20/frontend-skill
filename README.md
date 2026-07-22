# Frontend

Implement and review production frontend code for websites, web apps, iOS, and Android — from
bringing a distinctive, art-directed website design to pixel-perfect life to building dense
application UI. `frontend` owns the production client — component and state architecture, data
fetching, forms and auth flows, responsive and accessible interfaces, the full state set in code,
client-side security, performance, and the tests that guard it — across React, Next.js, Tailwind,
shadcn/ui, SwiftUI, Jetpack Compose, and React Native (**Expo-first**), without re-deciding
experience intent.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Visual guide:** [frontendengskill.vercel.app](https://frontendengskill.vercel.app)

`frontend` is the **Build**-stage skill of the [Digital Product Skills](https://github.com/gabros20/digital-product-skill)
family — the capability that turns an approved design or engineering request into shipped client
code. See that repository for the family architecture and the adjacent stages.

## What it owns

Use `frontend` when the request needs one or more of:

- Component and state architecture — client, server, URL, and form state; data fetching, caching,
  mutations, optimistic updates, retries, and client auth-flow shape.
- The full state set in code — loading, empty, error, success, recovery, undo, notifications — not
  just the happy path.
- Forms — validation timing, submission and error wiring, input types and autocomplete.
- Accessibility in code — ARIA patterns, focus management, semantic HTML, keyboard support, and the
  canonical contrast/target/reduced-motion floors.
- Performance engineering — Core Web Vitals, responsive image preload, compositor traps, bundle
  and code-splitting, virtualization.
- Client security — token storage, XSS sinks, CSP/CSRF/credentials ladders, client-reachable-is-public.
- Production SPA shell — shared API client, single-flight 401 refresh, multi-tab session, flags.
- Web platform craft — Safari/iOS viewport and chrome, dual-codec transparent video patterns,
  scroll-scrub media traps, View Transitions wiring, CSS/DOM craft.
- Unit, component, and UI tests, plus the dev-loop self-check (screenshot every route, two
  viewports, reduced motion emulated).
- Internationalization, and consuming a design handoff (`handoff.yaml` plus `DESIGN.md`) — tokens,
  states, and per-screen intent, faithfully implemented.
- The covered stacks: React, Next.js, Tailwind, shadcn/ui, SwiftUI, Jetpack Compose, and
  **Expo / React Native** (Expo is the default greenfield RN path, like Next.js for web; bare RN
  when the project already is or needs it). Plus the native web platform substrate. An uncovered
  stack (Vue, Svelte, Solid, Remix, Astro, UIKit, Flutter, and the rest) still gets the core job
  plus the platform substrate; the project's own conventions win.

It does **not** own experience intent, visual direction, or look-and-feel critique (`design`);
motion and animation beyond wiring reduced-motion and consuming motion tokens; anything done for
search beyond semantic markup; system decisions and API/event contracts (`architecture`); server
behavior, databases, and server APIs (`backend`) — though SSR/RSC runtime inside the client
framework is in scope; independent verification, WCAG audits, and release gates (`quality`); or
deployment, CI/CD, monitoring, and store delivery (`operate`) — though the client build config is in
scope.

`frontend` consumes a `design` handoff when one is supplied and recommends `quality` for
independent audits and release gates downstream. It works standalone with no upstream handoff and
never invokes another skill silently. See
[github.com/gabros20/design-skill](https://github.com/gabros20/design-skill) for the upstream
design capability.

## How it works

`SKILL.md` is a faceted **router, not a workflow engine**. It composes the smallest sufficient
reference set from three facets and reads only those files before writing code:

- **One primary job** — the core engineering task.
- **A platform overlay** — the web substrate by default, or the native cluster (iOS, Android, React
  Native) when the request targets one. Native always overrides the web defaults.
- **A web stack overlay, only when it applies** — React, Next.js, Tailwind, shadcn/ui, added only
  when the platform is web and the project names or uses that stack. An uncovered stack skips the
  overlay entirely: the core job ref plus the web-platform substrate carry the work.

Declared bundles encode the common pairings (a Next.js web app, a React SPA, production SPA
bootstrap, Expo/RN app, a native iOS or Android screen, consuming a design handoff) so no lateral
discovery is needed. The runtime router is [skills/frontend/SKILL.md](skills/frontend/SKILL.md); it
links directly to **27** focused references and loads only what the job needs.

## Install

With skills.sh:

```bash
npx skills add gabros20/frontend-skill
```

Or clone and install for a specific client:

```bash
git clone https://github.com/gabros20/frontend-skill.git
cd frontend-skill
./install.sh codex
```

| Target | Destination |
|---|---|
| `codex` | `${CODEX_HOME:-$HOME/.codex}/skills/frontend` |
| `agents` | `~/.agents/skills/frontend` |
| `claude` | `~/.claude/skills/frontend` |
| `cursor` | `~/.cursor/skills/frontend` |
| `antigravity` | Gemini IDE and Antigravity CLI skill paths |
| `opencode` | `~/.config/opencode/skills/frontend` |
| `grok` | `~/.grok/skills/frontend` |
| `hermes` | `~/.hermes/skills/frontend` |
| `all` | Claude, Codex, and the cross-agent path |

The installer stages a complete copy before replacing an existing installation and restores the
old copy if replacement fails.

## Use

Codex explicit invocation uses `$frontend`:

```text
Use $frontend to build an accessible Next.js signup form with every state and tests.
Use $frontend to implement a SwiftUI settings screen that conforms to the HIG.
Use $frontend to wire a design handoff into a React and Tailwind component with tokens.
Use $frontend to fix Core Web Vitals on this product page — LCP, CLS, and bundle size.
Use $frontend to serve a dual-codec transparent hero video that works in Safari and Chrome.
Use $frontend to fix iOS Safari chrome tint and svh shell for this dark app.
Use $frontend to build an Expo Router profile screen with expo-image and SecureStore session.
```

Documentation may use `/frontend` as shorthand. Other clients may expose a slash command,
`@frontend`, a skill tool, or natural-language activation. The skill should **not** activate for
experience/visual design, system architecture, marketing/SEO, or independent release verification
unless the request also requires frontend implementation.

## The 27 references

The router selects from a primary-job set, a platform overlay, and a web stack overlay. It loads
the smallest sufficient set — never all 27.

**Primary job**

| Reference | Scope |
|---|---|
| [state-and-data.md](skills/frontend/references/state-and-data.md) | State categories and machines, no-waterfall fetch discipline, optimistic+rollback, client auth-flow shape |
| [state-completeness.md](skills/frontend/references/state-completeness.md) | The two-layer state model in code, loading-by-duration bands, error/empty/recovery taxonomy |
| [forms.md](skills/frontend/references/forms.md) | Validation-timing model, submit-state rules, input-type/autocomplete tables, error wiring |
| [accessibility.md](skills/frontend/references/accessibility.md) | ARIA pattern code, focus/keyboard mechanics, canonical contrast/target/reduced-motion floors |
| [performance.md](skills/frontend/references/performance.md) | CWV thresholds/fix ladder, responsive preload, compositor paint traps, virtualization, idle prefetch |
| [client-security.md](skills/frontend/references/client-security.md) | Client attack-surface rules, credentials/CSRF ladders, OAuth cookie traps, sanitize sinks, security headers |
| [testing.md](skills/frontend/references/testing.md) | Test doctrine, RTL query ladder, TS strict baseline, green-build-is-not-looks-right dev-loop |
| [i18n.md](skills/frontend/references/i18n.md) | Logical-property mapping, Intl usage, dir/lang wiring, text-expansion budget |
| [design-handoff-and-tokens.md](skills/frontend/references/design-handoff-and-tokens.md) | handoff.yaml acceptance, 3-tier token model, never-edit-generated, dark-mode token strategy |
| [client-architecture.md](skills/frontend/references/client-architecture.md) | Feature-vs-type decision rule, unidirectional import layering, colocation doctrine, barrel-vs-public-API reconciliation, token file layout |
| [client-app-wiring.md](skills/frontend/references/client-app-wiring.md) | API client, single-flight 401 refresh, multi-tab session, feature flags, error boundaries → reporting, public runtime config |

**Platform overlay** (the web substrate by default, native when named or implied — native overrides web)

| Reference | Scope |
|---|---|
| [web-platform-css.md](skills/frontend/references/web-platform-css.md) | Modern CSS layout, stacking, color-gamut / color-management, dark-mode mechanism |
| [web-platform-runtime.md](skills/frontend/references/web-platform-runtime.md) | SPA routing, Safari/iOS chrome & video dual-codec patterns, scroll-scrub traps, View Transitions, Popover/Anchor |
| [swiftui.md](skills/frontend/references/swiftui.md) | SwiftUI/HIG conformance in code |
| [swift-concurrency-and-testing.md](skills/frontend/references/swift-concurrency-and-testing.md) | Swift concurrency correctness and Swift Testing, added when async or tests are involved |
| [compose.md](skills/frontend/references/compose.md) | Material 3 conformance in code |
| [kotlin-and-compose-state.md](skills/frontend/references/kotlin-and-compose-state.md) | Kotlin doctrine and Compose state/recomposition, added when state, coroutines, or Flow are involved |
| [react-native.md](skills/frontend/references/react-native.md) | Expo-first RN (Router, managed/prebuild, EAS, env/media); core list/gesture/New Arch traps; optional `expo/skills` + [docs.expo.dev](https://docs.expo.dev) deeper dives; bare when required |
| [css-craft.md](skills/frontend/references/css-craft.md) | Scrollbars, Safari blur/backdrop roots, will-change layers, frosted-glass craft, micro-patterns |
| [js-dom-craft.md](skills/frontend/references/js-dom-craft.md) | Delegation, AbortController, media IntersectionObserver + abort, ResizeObserver loop, timing, clipboard |

**Web stack overlay** (only when the platform is web and the project names or uses the stack)

| Reference | Scope |
|---|---|
| [react-components-and-state.md](skills/frontend/references/react-components-and-state.md) | Composition, hook discipline, you-might-not-need-effect, dependency correctness |
| [react-rendering-and-rsc.md](skills/frontend/references/react-rendering-and-rsc.md) | Memo-defeat family, RSC serialization boundary, hydration, code-split shape |
| [nextjs.md](skills/frontend/references/nextjs.md) | App Router, RSC/actions, cache, assets/Turbopack; optional deeper skills + [nextjs.org/docs](https://nextjs.org/docs) |
| [data-fetching-libraries.md](skills/frontend/references/data-fetching-libraries.md) | Durable cache traps; TanStack Query/Router/Start + SWR pointers; companion skills + official docs |
| [tailwind.md](skills/frontend/references/tailwind.md) | v4 `@theme` canonical (v3 compat), `cn`/twMerge/CVA, the postcss trap |
| [shadcn.md](skills/frontend/references/shadcn.md) | Registry/CLI/ownership model, composition recipes, official-library selection table, icon discipline |

**Concern and provenance**

| Reference | Scope |
|---|---|
| [SOURCES.md](skills/frontend/references/SOURCES.md) | Provenance and attribution index for every mined technique |

## Outputs and completion

Depending on the route, the skill produces production components and state, a state-complete UI, a
validated form, accessible markup meeting the numeric floors, a performance fix against the CWV
budget, hardened client security, or wired design tokens — always with the tests that guard the
change.

Work is complete only when requested changes exist in code with passing tests, the full state set
and accessibility floors are met, and the `testing.md` dev-loop self-check has run: served build,
screenshots at two viewports with reduced motion emulated, and an interactive pass. A green build is
not a correct screen; the skill states what was run and what remains rather than presenting untested
code as verified.

## Evaluations

Four fixture layers keep failures diagnosable — each points at a distinct fix:

| Layer | Question | Fixtures |
|---|---|---|
| Activation | Should `frontend` trigger for this request? | `evals/activation/` (28 cases, incl. craft + adjacent near misses) |
| Traversal | Did it load the smallest sufficient reference set? | `evals/traversal/` (17 cases) |
| Output | Did it satisfy the artifact and completion contracts? | `evals/output/` (5 cases) |
| Compression | Did a shorter candidate preserve quality? | `evals/compression-ablation/` (4 cases) |

`scripts/check-sync` validates fixture structure; representative live activation and traversal runs
are in progress for the v0.1.0 release. See [evals/README.md](evals/README.md).

## Provenance

The pack was synthesized from a research fan-out over our own `webdesign`/`design` skills plus
external frontend and platform skills, keeping only what `frontend` owns and rewriting every
technique to the authoring standard. Load-bearing values (numbers, thresholds, API/config names,
rule lists) are preserved verbatim; only permissively licensed sources contribute any verbatim
prose. Full attribution and licenses:
[skills/frontend/references/SOURCES.md](skills/frontend/references/SOURCES.md).

## Repository map

```text
.codex-plugin/plugin.json  Codex plugin and release metadata
AGENTS.md / CLAUDE.md      repository and client-specific maintainer guidance
skills/frontend/           portable runtime skill and client metadata (27 references)
evals/                     activation, traversal, output, and compression fixtures
docs/                      installation, usage, and recipes
site/                      visual guide (deployed to frontendengskill.vercel.app)
scripts/                   repository validation and token accounting
```

## Validate

```bash
scripts/check-sync
scripts/count-skill-tokens
```

The gate validates runtime frontmatter, direct reference routing, reference primacy headers and
contents lists, plugin/client metadata, evaluation fixtures, internal links, executable scripts, and
release version alignment. Every reference stays within its token target; the family ceiling is soft
where a reference needs the extra room to preserve capability-delta content.

## Documentation

- [Installation](docs/installation.md)
- [Usage](docs/usage.md)
- [Recipes](docs/recipes.md)
- [Evaluation fixtures](evals/README.md)

## Versioning and releases

Each release synchronizes `.codex-plugin/plugin.json`, the newest `CHANGELOG.md` release, git tag
`v<version>`, and the matching GitHub Release. Runtime `SKILL.md` intentionally carries no version
or repository metadata. Current release: **v0.2.1**.

## Contributing

See [AGENTS.md](AGENTS.md) for repository invariants and [CONTRIBUTING.md](CONTRIBUTING.md) for the
change and release workflow. The repository is independently versioned and does not require a
sibling skill or collection checkout, though it is designed to compose with the
[Digital Product Skills](https://github.com/gabros20/digital-product-skill) family.

## License

[MIT](LICENSE) · Tamás Gábor ([@gabros20](https://github.com/gabros20))
