---
name: frontend
description: >-
  Implement production frontend for websites, web apps, iOS, and Android, from creative sites and
  rebuilds to dense product UI: components, state, data fetching, forms, auth, chat and
  agent-run UIs, UI motion and micro-interactions, accessible responsive UI, performance, client
  security, and tests. Covers React, Next.js, Tailwind, shadcn/ui and Solid Glass, SwiftUI, Compose,
  and React Native; builds from a handoff, Figma file, or comp. Not for design direction, motion
  specs, scroll-linked animation, SEO strategy, backend or system architecture, or QA audits unless
  frontend code is also needed.
---

# Frontend Engineering

## Mission and boundary

Implement the production client — the code people actually run — across websites, web apps, iOS,
and Android, from art-directed websites built pixel-perfect to dense application UI. Own the
implementation and its craft; consume design's intent rather than re-deciding it.

Adjacent work this pack does not own: experience intent, visual direction, tokens-as-decisions, and
look-and-feel critique, and motion values and choreography decisions (`design`); scroll-linked
motion, scroll entrances, page transitions, and smooth scroll (`scroll-animation`) — UI and
component motion code is IN; anything done for search beyond semantic markup (seo, future);
system decisions, stack-selection rationale, and API/event contracts (`architecture`); server
behavior, databases, and server APIs (`backend`) — but SSR and RSC runtime inside the client framework
is IN; independent verification, WCAG audits, and release gates (`quality`); deployment, CI/CD,
monitoring, and store delivery (`operate`) — but the client *build* config is IN; business processes
spanning systems you do not own — a client triggering a cross-vendor workflow is `automation`'s, not
this pack's.

A design `handoff.yaml` and `DESIGN.md` are the source of truth for tokens, states, and per-screen
intent. Operate independently when invoked alone. Recommend adjacent skills when
useful; do not invoke them automatically unless the user requested a composition workflow.

## Standalone context check

Before producing anything the user will have to live with:
1. **Look first.** Read `digital-product/LEDGER.md` (Context), `digital-product/<pack>/`, upstream
   artifacts, the repo and this conversation. A fact found is never asked; a fact recorded is never
   re-asked.
2. **Size it.** Reversible and small → proceed, stating assumptions. New, costly or hard to undo →
   check.
3. **Ask only what the owner alone knows**, in their words: one round, at most four, highest
   leverage first, each with a recommended answer ("ok" accepts all). Two rounds at most.
4. **No or thin answers → decide as the expert.** Record each assumption with its basis and cost to
   reverse; prefer the reversible option; show the cheapest proof early.
5. **No way to ask → never block.** Proceed, and open the artifact with the assumptions and the
   answers that would change it most.
6. **Write it down.** Answers and assumptions go to the LEDGER's Context block.

This pack's questions (a pool — ask the top four that step 1 left open):
1. Where will this run, and who maintains it? (Detect the stack first; ask only what the repo
   can't tell you.)
2. What is the design source of truth: a handoff, a Figma file, a comp, an existing site — or none?
3. Where does the data come from: a real API (which), mocks, or static content? Is there sign-in?
4. Who edits the content afterwards: developers, or non-developers through a CMS?
5. What does "done" mean here: a prototype to react to, or production with tests and a deploy?
6. Any targets beyond the defaults: older browsers, specific devices, languages, a performance
   budget, an accessibility level above WCAG 2.2 AA?

**No design source:** when `design` is installed, say so and recommend it; when it is not, build the
category standard from the project's component library, state that no design direction was set, and
keep tokens in one place so a direction can land later.

## Route before acting

1. Identify the primary job — the core engineering task. Always at least one row from the primary
   job table.
2. Add the platform overlay the request names or implies: `web-platform-css` + `web-platform-runtime`
   for the web (the default substrate); the native cluster for iOS or Android. **Native is mandatory
   for native work and OVERRIDES the web-platform defaults** — never apply web-flavored substrate
   guidance to a SwiftUI or Compose screen.
3. Add a web stack overlay **only when the platform is web AND a covered stack is named or detected**
   (React, Next.js, Tailwind, shadcn/ui). At most one framework, one styling, one component overlay.
   For an uncovered stack, skip the overlay: the core job ref plus the platform substrate carry the
   work, and the project's own conventions win (pointers under Uncovered frameworks below).
4. Add only the concern references that materially affect the output.
5. Read every selected reference completely before writing the affected code. Do not load sibling
   platform or stack overlays you did not select.

### Primary job

| When the request is | Read | Expected contribution |
|---|---|---|
| Model client, server, URL, or form state; wire data fetching, caching, mutations, optimistic updates, retries, or client auth-flow shape; build a chat UI or streaming agent-run UI | [State and data](references/state-and-data.md) | State categories and machines, no-waterfall fetch discipline, optimistic+rollback, auth-flow shape, agent-run client (resume, provisional text, approve/cancel) |
| Cover every state a UI can be in — loading, empty, error, success, recovery, notifications, undo | [State completeness](references/state-completeness.md) | The two-layer state model in code, loading-by-duration bands, error/empty/recovery taxonomy |
| Build or fix a form — validation timing, submission, input types, error association | [Forms](references/forms.md) | Validation-timing model, submit-state rules, input-type/autocomplete tables, error wiring |
| Implement accessibility — ARIA patterns, focus management, semantic HTML, keyboard support | [Accessibility](references/accessibility.md) | ARIA pattern code, focus/keyboard mechanics, and code for design's contrast/target/reduced-motion floors |
| Engineer performance — Core Web Vitals, bundle/code-split, images, fonts, rendering cost | [Performance](references/performance.md) | CWV thresholds/fix ladder; responsive preload (`imagesrcset`/`fetchpriority`); image decode/sizes; compositor paint traps; idle/adaptive loading; virtualization |
| Handle client security and privacy — token storage, XSS sinks, CSP, CSRF, credentialed fetch, OAuth cookie traps | [Client security](references/client-security.md) | Client attack-surface rules, credentials/CSRF ladders, sanitize sinks, security-header consumption |
| Write client tests and run the dev-loop self-check — unit/component/UI, coverage, screenshot verification, stress and state harnesses | [Testing](references/testing.md) | Test doctrine, RTL query ladder, TS strict baseline, the green-build-is-not-looks-right loop, stress harness and state workbench |
| Internationalize — logical properties, Intl APIs, direction/language, text-expansion resilience | [i18n](references/i18n.md) | Logical-property mapping, Intl usage, dir/lang wiring, text-expansion budget |
| Consume a design handoff — handoff.yaml and DESIGN.md, or build from a Figma file or approved comp image; wire tokens, dark mode | [Design handoff and tokens](references/design-handoff-and-tokens.md) | handoff.yaml acceptance, 3-tier token model, build-from-file rounding contract and per-region gate, dark-mode token strategy |
| Implement UI motion — micro-interactions, popover/dialog/drawer/toast enter and exit, height and layout animation, springs, drag and gestures, animated numbers | [UI motion](references/ui-motion.md) | Cheapest-driver ladder, `@starting-style`/`allow-discrete` exits, height-auto and FLIP, spring conversion, track/release gestures with cleanup, motion perf traps, freeze-and-seek verification |
| Rebuild or migrate an existing site the client owns, faithfully, onto a new stack — or restyle an app in place keeping its wiring | [Site rebuild](references/site-rebuild.md) | Render capture + full asset harvest, identity map, no-substitution rules, measured tokens, pixel-diff fidelity gate, in-place wiring inventory |
| Structure or restructure a client codebase — folders, feature boundaries, import discipline, token file layout, CMS/section registries | [Client architecture](references/client-architecture.md) | Feature-vs-type decision, import layering, barrels, token layout; content-driven section registry + visual acceptance |
| Wire a production SPA shell — API client, single-flight 401 refresh, multi-tab session, feature flags, error boundaries, public runtime config | [Client app wiring](references/client-app-wiring.md) | Shared fetch client, refresh mutex, logout fanout, flag bootstrap, multi-level error reporting, build-once config |

### Platform overlay

Add the one substrate the request targets. At most one. Native overrides web defaults.

| When the platform is | Read | Expected contribution |
|---|---|---|
| The web (default substrate) | [Web platform CSS](references/web-platform-css.md) + [Web platform runtime](references/web-platform-runtime.md) | Modern CSS layout/stacking/margin collapse/color-gamut; SPA routing, storage, Safari/iOS hardening, transparent+scrub video traps, Popover/Anchor floors, View Transitions |
| Polish or harden CSS details — scrollbars, stacking, overflow, blur/compositor, numeric alignment, defensive patterns, composited (layered, collage, poster-led) layouts | [CSS craft](references/css-craft.md) | Scrollbar/overscroll/grid patterns; Safari blur/backdrop-root/will-change layer craft; paint/texture budgets; aspect-ratio and micro-patterns |
| Typography in CSS — units, synthesis, OpenType features, cap-height trimming, wrapping, decoration | [Typography CSS](references/typography-css.md) | Unitless leading, no faked faces, properties over raw feature tags, `text-box` trim, hyphenation and balance limits, icon and colour fonts |
| Vanilla DOM and browser-API mechanics — events, observers, clipboard, timing, measurement, cross-tab | [JS DOM craft](references/js-dom-craft.md) | Event delegation, AbortController-as-cleanup, microtask/macrotask/rAF timing, media IO+abort patterns, ResizeObserver loop, structuredClone, cross-tab sync |
| Native iOS / iPadOS | [SwiftUI](references/swiftui.md) (+ [Swift concurrency and testing](references/swift-concurrency-and-testing.md) when async or tests are involved) | SwiftUI/HIG conformance in code; Swift concurrency correctness and Swift Testing |
| Native Android | [Compose](references/compose.md) (+ [Kotlin and Compose state](references/kotlin-and-compose-state.md) when state, coroutines, or Flow are involved) | Material 3 conformance in code; Kotlin doctrine and Compose state/recomposition |
| Cross-platform native (React Native / **Expo default**) | [React Native](references/react-native.md) | Expo-first RN: Router, managed/prebuild, EAS, env/image/storage; core list/gesture/New Arch traps and motion principles; SwiftUI/Compose remain pure-native stacks |

`css-craft.md`, `typography-css.md`, and `js-dom-craft.md` are supplementary web-substrate reads, not alternate
substrates — add any of them alongside the web row (not instead of it) when the request specifically
needs that craft-level polish; they don't count against the "at most one" substrate rule above.

### Web stack overlay

Add only when the platform is web and the project names or uses the stack. Skip for uncovered stacks
(project conventions win). Never load a sibling stack you did not select.

| When the web stack is | Read | Expected contribution |
|---|---|---|
| React components, hooks, effects, state placement | [React components and state](references/react-components-and-state.md) | Composition, hook discipline, you-might-not-need-effect, dependency correctness |
| React rendering, RSC/client boundary, hydration, memoization | [React rendering and RSC](references/react-rendering-and-rsc.md) | Memo-defeat family, RSC serialization boundary, hydration, code-split shape |
| Next.js App Router, server actions, caching, next/* primitives | [Next.js](references/nextjs.md) | File conventions, RSC/server-actions, caching model, image/font/link primitives |
| Data-fetching libraries — TanStack Query, SWR, React Router data APIs, TanStack Start | [Data fetching libraries](references/data-fetching-libraries.md) | Current-API pointers per library (principles live in `state-and-data.md`) |
| Tailwind CSS — theme, utilities, responsive variants | [Tailwind](references/tailwind.md) | v4 `@theme` canonical (v3 compat), `cn`/twMerge/CVA, the postcss trap |
| shadcn/ui and component-library selection | [shadcn](references/shadcn.md) | Registry/CLI/ownership model, composition recipes, official-library selection table, icon discipline |
| The Solid Glass theme, or a thick-glass material on a shadcn/ui app (replaces shadcn as the component overlay) | [Solid Glass](references/solid-glass.md) | Base UI requirement, pinned registry install, material and deltas from stock, agent components bound to run states, forced-colours and reduced-transparency fixes |

### Concern

Add when the request involves it, on any platform.

- Provenance of a technique, value, or license → [Sources](references/SOURCES.md).

### Uncovered frameworks: optional skills + docs (not full overlays)

No dedicated reference; run the core job + platform substrate. When the task is deeply
framework-specific, install a specialist skill and open live docs rather than inventing conventions:

| Stack | Deeper skill (skills.sh) | Official docs |
|---|---|---|
| **Astro** | `npx skills add astrolicious/agent-skills@astro` (~11K) · Clerk: `clerk/skills@clerk-astro-patterns` | [docs.astro.build](https://docs.astro.build) — prefer [on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/) over legacy “SSR” slugs |
| **Remix / React Router framework mode** | `npx skills add remix-run/agent-skills@react-router-framework-mode` (~3K, official) | [reactrouter.com](https://reactrouter.com/start/framework/installation) (Remix successor); archive: [remix.run/docs/en/main](https://remix.run/docs/en/main) |
| **TanStack Start / Query / Router** | Pointers and companion skills in [Data fetching libraries](references/data-fetching-libraries.md) | [tanstack.com](https://tanstack.com) |

Vue, Svelte, Solid, Flutter, UIKit: no high-signal single skill pinned here — use project docs +
official framework docs; do not force Next/Expo patterns onto them.

### Declared bundles

Read these together — the router encodes the pairing so no lateral hop is required:

- **Next.js web app** → [Next.js](references/nextjs.md) + [React components and state](references/react-components-and-state.md) + [React rendering and RSC](references/react-rendering-and-rsc.md) + [Tailwind](references/tailwind.md) (+ [shadcn](references/shadcn.md) when the project uses it).
- **React SPA (Vite/React Router)** → [React components and state](references/react-components-and-state.md) + [State and data](references/state-and-data.md) for the fetch/cache/optimistic doctrine + [Data fetching libraries](references/data-fetching-libraries.md) for the current library API + [Web platform runtime](references/web-platform-runtime.md) for client routing + [Tailwind](references/tailwind.md).
- **Production SPA bootstrap** → [Client app wiring](references/client-app-wiring.md) + [Client security](references/client-security.md) + [State and data](references/state-and-data.md) (+ [Client architecture](references/client-architecture.md) when folder/import structure is in scope).
- **Native iOS screen** → [SwiftUI](references/swiftui.md) (+ [Swift concurrency and testing](references/swift-concurrency-and-testing.md) when async or tests are involved). This overrides the web-platform substrate.
- **Native Android screen** → [Compose](references/compose.md) + [Kotlin and Compose state](references/kotlin-and-compose-state.md). This overrides the web-platform substrate.
- **Expo / React Native app** → [React Native](references/react-native.md) (+ [React components and state](references/react-components-and-state.md) for shared React discipline). Overrides the web-platform substrate. Prefer Expo-managed unless the repo is already bare.
- **Consume a design handoff** → [Design handoff and tokens](references/design-handoff-and-tokens.md) + the relevant primary job ref + the target platform/stack overlay.
- **Faithful site rebuild** → [Site rebuild](references/site-rebuild.md) + [Design handoff and tokens](references/design-handoff-and-tokens.md) for the token pipeline + the target platform/stack overlay.
- **Animated web component** → [UI motion](references/ui-motion.md) + the primary job ref (+ [Accessibility](references/accessibility.md) when reduced motion or a pause control is in play). Scroll-linked motion routes to `scroll-animation`.
- **Any surface where accessibility or performance is explicit** → the primary job ref + [Accessibility](references/accessibility.md) and/or [Performance](references/performance.md).

## Universal invariants

Hold on every job, whether or not the reference that owns the detail is open:

- **Project conventions win.** Conform to the project's existing stack, structure, and idioms. Stack
  overlays sharpen core doctrine for the stacks we cover; they never gate the work. For an uncovered
  stack, run the core job plus the web-platform substrate and follow the project's patterns.
- **Ship the full state set in code.** Every interaction element carries its states (default, hover,
  focus-visible, active, disabled, loading) and every data region its states (empty, error, success),
  plus component-specific states. See `state-completeness.md`; a build that renders only the happy
  path is incomplete, not done.
- **Reduced motion is a complete alternative, not a suppressed animation.** Honor
  `prefers-reduced-motion` (and each platform's equivalent) by swapping to a legible no-motion state,
  never leaving an element mid-transition. `accessibility.md` owns the canonical rule.
- **Accessibility floors are constraints.** Meet the contrast, target-size, focus, and keyboard
  floors from `accessibility.md` even when it is not open; cite its numbers, do not redefine them.
- **A green build is not a correct screen.** Before claiming completion, run the `testing.md`
  dev-loop self-check: serve the build, screenshot every route at two viewports with reduced motion
  emulated, and interact with it. Independent audits and release gates are quality's job.
- **Never present untested code as verified.** State what was run and what was not; if tests fail or
  a step was skipped, say so with the evidence rather than signing off.
- **Preserve design intent and product constraints.** Implement the handoff faithfully; when code
  and a design, brand, or architecture constraint conflict, report it rather than silently override.

## Workflow, artifact, and completion

1. Run the context check above, then route to the smallest sufficient set.
2. Write the production code, tests included, matching the project's conventions. Implementation
   notes state the detected stack, assumptions, states covered or deferred, and validation run versus
   remaining — never a design document.
3. Validate against the request, the full state set, the accessibility and performance floors, and
   the `testing.md` dev-loop self-check; fix what it surfaces and report what remains.
4. When quality or operate work follows, hand off paths, public contracts touched, known gaps, and
   the recommended next skill, without duplicating the artifact.

## Artifact home

Deliverables this skill produces default to `digital-product/frontend/` at the working repository's
root, with cross-skill state in `digital-product/LEDGER.md` — created on first use and committed
with the repo. The `digital-product` composer skill owns this convention; solo use writes to the
same place. Never write into `.orchestrate/` — that folder belongs to an orchestration run's
execution state, not to this family's deliverables.
