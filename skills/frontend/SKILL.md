---
name: frontend
description: >-
  Implement production frontend code for websites, web apps, iOS, and Android, from creative
  website builds to dense product UI: components, state, data fetching, forms, auth flows, routing,
  responsive accessible interfaces, performance, client security, and tests. Covers React, Next.js,
  Tailwind, shadcn/ui, SwiftUI, Jetpack Compose, and React Native, and consumes a design handoff
  (handoff.yaml, DESIGN.md). Do not use for design direction, motion or animation implementation,
  SEO strategy, backend or system architecture, or QA audits unless the request also requires
  frontend implementation.
---

# Frontend Engineering

## Mission and boundary

Implement the production client — the code people actually run — across websites, web apps, iOS,
and Android. That spans the whole register: bringing a distinctive, art-directed website design to
pixel-perfect life is as much this skill's job as dense application UI. It covers component and
state architecture, routing, data fetching and API integration, forms and auth flows, responsive
and accessible interfaces, the full state set in code, client-side security, frontend performance,
and the tests that guard it. Own the implementation and its craft; consume design's intent rather
than re-deciding it.

Adjacent work this pack does not own: experience intent, visual direction, tokens-as-decisions, and
look-and-feel critique (`design`); motion and animation beyond wiring reduced-motion and consuming
motion tokens (animation, future); anything done for search beyond semantic markup (seo, future);
system decisions, stack-selection rationale, and API/event contracts (`architecture`); server
behavior, databases, and server APIs (`backend`) — but SSR and RSC runtime inside the client framework
is IN; independent verification, WCAG audits, and release gates (`quality`); deployment, CI/CD,
monitoring, and store delivery (`operate`) — but the client *build* config is IN; business processes
spanning systems you do not own — a client triggering a cross-vendor workflow is `automation`'s, not
this pack's.

When design supplies a `handoff.yaml` and `DESIGN.md`, consume them as the source of truth for
tokens, states, and per-screen intent; implement that intent faithfully and report conflicts rather
than silently overriding. Operate independently when invoked alone. Recommend adjacent skills when
useful; do not invoke them automatically unless the user requested a composition workflow.

## Route before acting

1. Identify the primary job — the core engineering task. Always at least one row from the primary
   job table.
2. Add the platform overlay the request names or implies: `web-platform-css` + `web-platform-runtime`
   for the web (the default substrate); the native cluster for iOS or Android. **Native is mandatory
   for native work and OVERRIDES the web-platform defaults** — never apply web-flavored substrate
   guidance to a SwiftUI or Compose screen.
3. Add a web stack overlay **only when the platform is web AND a covered stack is named or detected**
   (React, Next.js, Tailwind, shadcn/ui). At most one framework, one styling, one component overlay.
   For an uncovered stack (Vue, Svelte, Solid, Remix, Astro, UIKit, Flutter, and the rest), skip the
   overlay: the core job ref plus the platform substrate carry the work, and the project's own
   conventions win. Optional deeper skills + official docs for common uncovered or library stacks
   are listed in the matching reference when one exists (`nextjs.md`, `data-fetching-libraries.md`,
   `react-native.md`); for **Astro** (no dedicated overlay), see the short pointer block under
   Concern below.
4. Add only the concern references that materially affect the output.
5. Read every selected reference completely before writing the affected code. Do not load sibling
   platform or stack overlays you did not select.

### Primary job

| When the request is | Read | Expected contribution |
|---|---|---|
| Model client, server, URL, or form state; wire data fetching, caching, mutations, optimistic updates, retries, or client auth-flow shape | [State and data](references/state-and-data.md) | State categories and machines, no-waterfall fetch discipline, optimistic+rollback, auth-flow shape |
| Cover every state a UI can be in — loading, empty, error, success, recovery, notifications, undo | [State completeness](references/state-completeness.md) | The two-layer state model in code, loading-by-duration bands, error/empty/recovery taxonomy |
| Build or fix a form — validation timing, submission, input types, error association | [Forms](references/forms.md) | Validation-timing model, submit-state rules, input-type/autocomplete tables, error wiring |
| Implement accessibility — ARIA patterns, focus management, semantic HTML, keyboard support | [Accessibility](references/accessibility.md) | ARIA pattern code, focus/keyboard mechanics, and the canonical contrast/target/reduced-motion floors |
| Engineer performance — Core Web Vitals, bundle/code-split, images, fonts, rendering cost | [Performance](references/performance.md) | CWV thresholds/fix ladder; responsive preload (`imagesrcset`/`fetchpriority`); image decode/sizes; compositor paint traps; idle/adaptive loading; virtualization |
| Handle client security and privacy — token storage, XSS sinks, CSP, CSRF, credentialed fetch, OAuth cookie traps | [Client security](references/client-security.md) | Client attack-surface rules, credentials/CSRF ladders, sanitize sinks, security-header consumption |
| Write client tests and run the dev-loop self-check — unit/component/UI, coverage, screenshot verification | [Testing](references/testing.md) | Test doctrine, RTL query ladder, TS strict baseline, and the green-build-is-not-looks-right loop |
| Internationalize — logical properties, Intl APIs, direction/language, text-expansion resilience | [i18n](references/i18n.md) | Logical-property mapping, Intl usage, dir/lang wiring, text-expansion budget |
| Consume a design handoff — read handoff.yaml and DESIGN.md, wire tokens, dark mode | [Design handoff and tokens](references/design-handoff-and-tokens.md) | handoff.yaml acceptance, 3-tier token model, never-edit-generated, dark-mode token strategy |
| Structure or restructure a client codebase — folders, feature boundaries, import discipline, token file layout, CMS/section registries | [Client architecture](references/client-architecture.md) | Feature-vs-type decision, import layering, barrels, token layout; content-driven section registry + visual acceptance |
| Wire a production SPA shell — API client, single-flight 401 refresh, multi-tab session, feature flags, error boundaries, public runtime config | [Client app wiring](references/client-app-wiring.md) | Shared fetch client, refresh mutex, logout fanout, flag bootstrap, multi-level error reporting, build-once config |

### Platform overlay

Add the one substrate the request targets. At most one. Native overrides web defaults.

| When the platform is | Read | Expected contribution |
|---|---|---|
| The web (default substrate) | [Web platform CSS](references/web-platform-css.md) + [Web platform runtime](references/web-platform-runtime.md) | Modern CSS layout/stacking/margin collapse/color-gamut; SPA routing, storage, Safari/iOS hardening, transparent+scrub video traps, Popover/Anchor floors, View Transitions |
| Polish or harden CSS details — scrollbars, stacking, overflow, blur/compositor, numeric alignment, defensive patterns | [CSS craft](references/css-craft.md) | Scrollbar/overscroll/grid patterns; Safari blur/backdrop-root/will-change layer craft; paint/texture budgets; aspect-ratio and micro-patterns |
| Vanilla DOM and browser-API mechanics — events, observers, clipboard, timing, measurement, cross-tab | [JS DOM craft](references/js-dom-craft.md) | Event delegation, AbortController-as-cleanup, microtask/macrotask/rAF timing, media IO+abort patterns, ResizeObserver loop, structuredClone, cross-tab sync |
| Native iOS / iPadOS | [SwiftUI](references/swiftui.md) (+ [Swift concurrency and testing](references/swift-concurrency-and-testing.md) when async or tests are involved) | SwiftUI/HIG conformance in code; Swift concurrency correctness and Swift Testing |
| Native Android | [Compose](references/compose.md) (+ [Kotlin and Compose state](references/kotlin-and-compose-state.md) when state, coroutines, or Flow are involved) | Material 3 conformance in code; Kotlin doctrine and Compose state/recomposition |
| Cross-platform native (React Native / **Expo default**) | [React Native](references/react-native.md) | Expo-first RN: Router, managed/prebuild, EAS, env/image/storage; core list/gesture/New Arch traps; SwiftUI/Compose remain pure-native stacks |

`css-craft.md` and `js-dom-craft.md` are supplementary web-substrate reads, not alternate
substrates — add either alongside the web row (not instead of it) when the request specifically
needs that craft-level polish; they don't count against the "at most one" substrate rule above.

### Web stack overlay

Add only when the platform is web and the project names or uses the stack. Skip for uncovered stacks
(project conventions win). Never load a sibling stack you did not select.

| When the web stack is | Read | Expected contribution |
|---|---|---|
| React components, hooks, effects, state placement | [React components and state](references/react-components-and-state.md) | Composition, hook discipline, you-might-not-need-effect, dependency correctness |
| React rendering, RSC/client boundary, hydration, memoization | [React rendering and RSC](references/react-rendering-and-rsc.md) | Memo-defeat family, RSC serialization boundary, hydration, code-split shape |
| Next.js App Router, server actions, caching, next/* primitives | [Next.js](references/nextjs.md) | File conventions, RSC/server-actions, caching model, image/font/link primitives |
| Data-fetching libraries — TanStack Query, SWR, React Router data APIs, TanStack Start | [Data fetching libraries](references/data-fetching-libraries.md) | Current-API pointers per library; the cache/optimistic/no-waterfall principles themselves are homed in `state-and-data.md` |
| Tailwind CSS — theme, utilities, responsive variants | [Tailwind](references/tailwind.md) | v4 `@theme` canonical (v3 compat), `cn`/twMerge/CVA, the postcss trap |
| shadcn/ui and component-library selection | [shadcn](references/shadcn.md) | Registry/CLI/ownership model, composition recipes, official-library selection table, icon discipline |

### Concern

Add when the request involves it, on any platform.

- Provenance of a technique, value, or license → [Sources](references/SOURCES.md).

### Uncovered frameworks: optional skills + docs (not full overlays)

These stacks do **not** have a dedicated reference in this pack. Still run the core job + platform
substrate (and project conventions). When the task is deeply framework-specific, install a
specialist skill and open live docs rather than inventing conventions:

| Stack | Deeper skill (skills.sh) | Official docs |
|---|---|---|
| **Astro** | `npx skills add astrolicious/agent-skills@astro` (~11K) · Clerk: `clerk/skills@clerk-astro-patterns` | [docs.astro.build](https://docs.astro.build) — prefer [on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/) over legacy “SSR” slugs |
| **Remix / React Router framework mode** | `npx skills add remix-run/agent-skills@react-router-framework-mode` (~3K, official) | [reactrouter.com](https://reactrouter.com/start/framework/installation) (Remix successor); archive: [remix.run/docs/en/main](https://remix.run/docs/en/main) |
| **TanStack Start** | Covered as a **pointer** in [Data fetching libraries](references/data-fetching-libraries.md) + `npx skills add deckardger/tanstack-agent-skills@tanstack-start-best-practices` | [tanstack.com/start/latest](https://tanstack.com/start/latest) |
| **TanStack Query / Router** | Same reference + Query/Router companion skills listed there | [tanstack.com/query/latest](https://tanstack.com/query/latest) · [tanstack.com/router/latest](https://tanstack.com/router/latest) |
| **Next.js** | Full overlay [Next.js](references/nextjs.md) + optional skills/docs tables in that file | [nextjs.org/docs](https://nextjs.org/docs) |
| **Expo / RN** | Full overlay [React Native](references/react-native.md) + Expo skills/docs tables | [docs.expo.dev](https://docs.expo.dev) |

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

## Core workflow

1. Inspect the request, the repository (stack, conventions, existing components), and any supplied
   `handoff.yaml`/`DESIGN.md` or upstream artifacts.
2. Route to the smallest sufficient set: one primary job, at most one platform overlay, at most one
   web stack overlay per axis, only material concerns.
3. State material assumptions, detected stack, and unresolved inputs.
4. Write the production code — components, state, tests — matching the project's conventions.
5. Validate against the request, the full state set, the accessibility and performance floors, and
   the dev-loop self-check; fix what the check surfaces.
6. Emit a compact handoff when downstream work (quality verification, operate/deploy) is expected.

## Artifact contract

Frontend work delivers production code, its tests, and short implementation notes — not a design
document. Code conforms to the project's conventions and ships with the full state set, accessibility
floors met, and the tests that guard the change. Implementation notes state the detected stack, the
assumptions made, the states and edge cases covered or deferred, and what validation was run versus
what remains. When the work feeds a downstream skill (quality for audit, operate for deployment),
emit a dual-channel handoff: the code and tests plus a brief note of paths, public contracts touched,
known gaps, and the recommended next skill.

## Completion and handoff

Before completion:

- Confirm every requested change exists in code and its tests pass, or state precisely which do not.
- Confirm the full state set, accessibility floors, and (where relevant) performance budget are met.
- Run the `testing.md` dev-loop self-check, report what it surfaced, and distinguish validation
  performed from validation remaining. Never present unrun code as verified.
- When downstream work is expected, provide file paths, public contracts touched, remaining risks,
  and a recommended next skill without duplicating the full artifact.
