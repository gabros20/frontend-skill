# Usage reference

The full control surface: how the skill triggers, how its faceted router selects references, the
universal invariants every artifact answers to, and what each route produces. For ready-to-paste
prompts, see [recipes.md](recipes.md).

## There is no invocation grammar

`frontend` takes no flags, dimensions, or config file — there's nothing to memorize before using
it. It triggers one of two ways:

- **Explicit**: `$frontend` in Codex, `/frontend` in slash-command clients, or the equivalent
  explicit form supported by the current host.
- **Implicit**: natural engineering-task phrasing — "build this signup form with every state and
  tests", "wire this design handoff into the component", "fix these Core Web Vitals", "implement
  this SwiftUI screen", "harden this client against XSS" — matched against the frontmatter
  `description` in `skills/frontend/SKILL.md`.

It should **not** activate for experience or visual design, system architecture, marketing/SEO
strategy, or independent release verification — unless the request also requires frontend
implementation. Those are the close neighbors in the
[Digital Product Skills](https://github.com/gabros20/digital-product-skill) family (design,
architecture, marketing, quality).

## The faceted router

`SKILL.md` is a **router, not a workflow engine**. It never executes a fixed sequence. Instead it
composes the smallest sufficient reference set from three facets, then reads only those files
before writing the affected code:

1. **Primary job** — exactly one. The core engineering task: state and data, state completeness,
   forms, accessibility, performance, client security, testing, i18n, or design-handoff consumption.
2. **Platform overlay** — the web substrate by default, or the native cluster (iOS, Android, React
   Native) when the request names or implies it. **Native is mandatory for native work and
   overrides the web-platform defaults** — never apply web-flavored substrate guidance to a SwiftUI
   or Compose screen.
3. **Web stack overlay** — only when the platform is web and a covered stack is named or detected
   (React, Next.js, Tailwind, shadcn/ui). At most one framework, one styling, one component overlay.
   For an uncovered stack (Vue, Svelte, Solid, Remix, Astro, UIKit, Flutter, and the rest), skip the
   overlay: the core job ref plus the platform substrate carry the work, and the project's own
   conventions win.

That "read only what you need" discipline is the whole point. A one-file accessibility fix loads
`accessibility.md`, not all 22 references.

### Declared bundles

Some jobs pair predictably, so the router encodes the pairing — no lateral discovery required:

- **Next.js web app** → `nextjs.md` + `react-components-and-state.md` + `react-rendering-and-rsc.md`
  + `tailwind.md` (+ `shadcn.md` when the project uses it).
- **React SPA (Vite/React Router)** → `react-components-and-state.md` +
  `data-fetching-libraries.md` + `web-platform-runtime.md` for client routing + `tailwind.md`.
- **Native iOS screen** → `swiftui.md` (+ `swift-concurrency-and-testing.md` when async or tests
  are involved). This overrides the web-platform substrate.
- **Native Android screen** → `compose.md` + `kotlin-and-compose-state.md`. This overrides the
  web-platform substrate.
- **Consume a design handoff** → `design-handoff-and-tokens.md` + the relevant primary job ref + the
  target platform/stack overlay.
- **Any surface where accessibility or performance is explicit** → the primary job ref +
  `accessibility.md` and/or `performance.md`.

## Route by job

Read only what the job requires. This is the fast path from "what am I trying to do" to "which
reference file(s)".

### Primary job

| I need to… | Read |
|---|---|
| Model client, server, URL, or form state; wire data fetching, caching, mutations, optimistic updates, retries, or client auth-flow shape | `state-and-data.md` |
| Cover every state a UI can be in — loading, empty, error, success, recovery, notifications, undo | `state-completeness.md` |
| Build or fix a form — validation timing, submission, input types, error association | `forms.md` |
| Implement accessibility — ARIA patterns, focus management, semantic HTML, keyboard support | `accessibility.md` |
| Engineer performance — Core Web Vitals, bundle/code-split, images, fonts, rendering cost | `performance.md` |
| Handle client security and privacy — token storage, XSS sinks, CSP consumption | `client-security.md` |
| Write client tests and run the dev-loop self-check — unit/component/UI, coverage, screenshot verification | `testing.md` |
| Internationalize — logical properties, Intl APIs, direction/language, text-expansion resilience | `i18n.md` |
| Consume a design handoff — read handoff.yaml and DESIGN.md, wire tokens, dark mode | `design-handoff-and-tokens.md` |

### Platform overlay

| When the platform is | Read |
|---|---|
| The web (default substrate) | `web-platform-css.md` + `web-platform-runtime.md` |
| Native iOS / iPadOS | `swiftui.md` (+ `swift-concurrency-and-testing.md` when async or tests are involved) |
| Native Android | `compose.md` (+ `kotlin-and-compose-state.md` when state, coroutines, or Flow are involved) |
| Cross-platform native (React Native) | `react-native.md` |

### Web stack overlay

| When the web stack is | Read |
|---|---|
| React components, hooks, effects, state placement | `react-components-and-state.md` |
| React rendering, RSC/client boundary, hydration, memoization | `react-rendering-and-rsc.md` |
| Next.js App Router, server actions, caching, next/* primitives | `nextjs.md` |
| Data-fetching libraries — TanStack Query, React Router data APIs | `data-fetching-libraries.md` |
| Tailwind CSS — theme, utilities, responsive variants | `tailwind.md` |
| shadcn/ui and component-library selection | `shadcn.md` |

### Concern

| When the request involves | Read |
|---|---|
| Tracing a technique to its source | `SOURCES.md` |

## The universal invariants

These govern every job, whether or not the reference that owns the detail is open:

1. **Project conventions win.** Conform to the project's existing stack, structure, and idioms.
   Stack overlays sharpen core doctrine for covered stacks; they never gate the work. For an
   uncovered stack, run the core job plus the web-platform substrate and follow the project's
   patterns.
2. **Ship the full state set in code.** Every interaction element carries its states (default,
   hover, focus-visible, active, disabled, loading) and every data region its states (empty, error,
   success), plus component-specific states. A build that renders only the happy path is
   incomplete, not done.
3. **Reduced motion is a complete alternative, not a suppressed animation.** Honor
   `prefers-reduced-motion` (and each platform's equivalent) by swapping to a legible no-motion
   state, never leaving an element mid-transition.
4. **Accessibility floors are constraints.** Meet the contrast, target-size, focus, and keyboard
   floors from `accessibility.md` even when it is not open; cite its numbers, do not redefine them.
5. **A green build is not a correct screen.** Before claiming completion, run the `testing.md`
   dev-loop self-check: serve the build, screenshot every route at two viewports with reduced
   motion emulated, and interact with it. Independent audits and release gates are quality's job.
6. **Never present untested code as verified.** State what was run and what was not; if tests fail
   or a step was skipped, say so with the evidence rather than signing off.
7. **Preserve design intent and product constraints.** Implement the handoff faithfully; when code
   and a design, brand, or architecture constraint conflict, report it rather than silently
   override.

## What the skill produces

There's no fixed run directory or ledger — each route's output is production code, its tests, and
short implementation notes, kept wherever your project convention puts them.

| Route | Artifact |
|---|---|
| State and data | Client/server/URL/form state models, fetch/mutation/optimistic-update code |
| State completeness | A state-complete UI in code — loading, empty, error, success, recovery |
| Forms | A validated form with correct timing, submit-state handling, and error wiring |
| Accessibility | ARIA-correct markup, focus/keyboard mechanics, floors met |
| Performance | A CWV-budget fix — image/font loading, bundle discipline, virtualization |
| Client security | Hardened token/session handling, sanitized sinks, CSP-aware code |
| Testing | Unit/component/UI tests plus a completed dev-loop self-check |
| i18n | Logical-property layout, Intl-wired copy, dir/lang handling |
| Design-handoff | Tokens and states wired from `handoff.yaml`/`DESIGN.md`, dark mode included |

## Completion and handoff

The skill is complete only when requested changes exist in code with passing tests, the full state
set and accessibility floors are met, and the dev-loop self-check has run and its results are
reported. When downstream work (quality verification, operate/deploy) is expected, it emits a
compact handoff — file paths, public contracts touched, known gaps, and a recommended next skill —
without duplicating the full artifact. It recommends adjacent skills; it does not invoke them
automatically.

## Adjacent skills (don't duplicate these)

`frontend` owns the production client. Recommend these neighbors for adjacent jobs; do not invoke
them automatically:

- **design** — experience intent, visual direction, tokens-as-decisions, look-and-feel critique.
- **architecture** — system decisions, stack-selection rationale, API/event contracts.
- **backend** — server behavior, databases, and server APIs (client-framework SSR/RSC runtime stays
  in frontend).
- **quality** — independent verification, WCAG audits, and release gates.
- **operate** — deployment, CI/CD, monitoring, and store delivery (the client build config stays in
  frontend).
