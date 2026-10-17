# Sources and attribution

Purpose: Trace a technique, value, or rule in this pack back to the skill or named author it came
from, with its license — the provenance index for the frontend pack.

Read when:
- You need to attribute a method, credit an author, or check a license before reusing material.
- A reviewer asks where a specific value, API name, threshold, or rule originated.

Skip when:
- You are doing frontend work; this file carries no engineering guidance, only provenance.

Inputs:
- A technique, value, API, or claim whose origin you want to confirm.

Produces:
- The originating skill or author and the applicable license.

## Contents
- Apache-2.0 (attribution required)
- Modified MIT
- MIT (attribution)
- CC0-1.0 (public domain)
- CC BY 4.0 (attribution required)
- WTFPL (no attribution required)
- No-license (facts re-expressed only)
- Evaluated, not adopted as a target
- Underlying standards and references cited

The pack was composed by mining our own `webdesign`/`design` skills plus the external frontend and
platform skills below, keeping only what `frontend` owns and rewriting it to the authoring standard.
Load-bearing values (numbers, thresholds, API/config names, rule lists) are preserved verbatim;
prose is re-expressed. Only permissively licensed sources contribute any verbatim prose, and only
within that license's terms. No-license sources contribute re-expressed facts cited to the
underlying standard (MDN, WCAG, web.dev, React docs, Apple HIG, Material 3), never verbatim prose or
code. Each reference file also carries a bottom `<!-- sources: ... -->` comment recording its own
provenance in more detail.

## Apache-2.0 (attribution required; verbatim reuse within license terms)

- **claude-plugins-official / Vercel** (`react-best-practices`, `nextjs`, `shadcn`, `bootstrap`
  plugins) — App Router file conventions, RSC / server-actions / caching model, `next/*` primitives,
  no-waterfall and rendering-performance rules, and shadcn composition. Attribution required per the
  plugin's NOTICE. Drawn into `nextjs.md`, `react-rendering-and-rsc.md`, `data-fetching-libraries.md`,
  `state-and-data.md`, `shadcn.md`, `tailwind.md`.
- **anthropics/skills** (`webapp-testing`) — the browser dev-loop verification discipline
  (reconnaissance-then-action, screenshot both viewports). Drawn into `testing.md`.
- **pbakaus/impeccable** — `:focus-visible`/`inert`/Popover API/native `<dialog>` decisions,
  text-expansion budget and RTL logical-properties, layout-thrashing/content-visibility/responsive
  images, forms hardening, API-status-to-UI-state mapping and teardown checklist, and CSP detection.
  Carries a `NOTICE.md` whose attribution chain credits **ehmo** (impeccable is also the upstream of
  our `webdesign` skill). Drawn into `accessibility.md`, `i18n.md`, `performance.md`, `forms.md`,
  `state-and-data.md`, `client-security.md`, `web-platform-css.md`.
- **chrisbanes/skills** (`compose-*`, `kotlin-*`) — Compose modifier/slot/focus/testing APIs, state
  authoring/hoisting/deferred-reads, recomposition and stability diagnostics, Kotlin structured
  concurrency and Flow/StateFlow event modeling, value classes, control-flow exhaustiveness. Drawn
  into `compose.md`, `kotlin-and-compose-state.md`.

## Modified MIT

- **millionco/react-doctor** — the ~635-rule oxlint taxonomy (state-and-effects, react-builtins,
  performance, architecture, a11y, correctness, nextjs, react-native, tanstack-query/start, server,
  bundle-size, security/security-scan). Its license is a **Modified MIT**: per the terms recorded in
  `miner-react-doctor.md`'s report header, short recommendation strings may be quoted with
  attribution, but the pack re-expresses its guidance rather than quoting verbatim to stay safely
  inside those terms. Used as the checklist backbone for `react-components-and-state.md`,
  `react-rendering-and-rsc.md`, `data-fetching-libraries.md`, `react-native.md`, `nextjs.md`,
  `accessibility.md`, `forms.md`, `client-security.md`, `performance.md`, `testing.md`, `i18n.md`.

## MIT (attribution; verbatim reuse within license terms)

- **gabros20 / Tamás Gábor** — the internal sources and same author as this repo: `webdesign`
  (`tailwind-v4-theme`, `frontend-build-patterns`, `art-review`, `design-critique`) and the `design`
  skill (`handoff.md`, `design-systems.md`, `interaction.md`). The receiving side of design's
  `handoff.yaml`/`DESIGN.md` contract and the eight-state intent model cited by `state-completeness.md`.
  Drawn into `design-handoff-and-tokens.md`, `tailwind.md`, `web-platform-css.md`, `testing.md`,
  `state-completeness.md`.
- **ehmo/platform-design-skills** — the single richest cross-cutting source: web CSS and runtime
  (content-driven breakpoints, logical properties, storage/History/scroll-restoration), a11y and
  forms sections, i18n, and the `ios/SKILL.md` and `android/SKILL.md` platform-conformance troves.
  Drawn into `web-platform-css.md`, `web-platform-runtime.md`, `accessibility.md`, `i18n.md`,
  `forms.md`, `state-and-data.md`, `swiftui.md`, `compose.md`.
- **twostraws / Paul Hudson** — `swiftui-pro`, `swift-concurrency-pro`, `swift-testing-pro`, and
  `SwiftUI-Agent-Skill` (the last diffed against `swiftui-pro`; no material net-new content). The
  backbone of `swiftui.md` and `swift-concurrency-and-testing.md`.
- **OpenAEC-Foundation/React-Claude-Skill-Package** — react syntax/core/errors, hydration,
  server-components, data-fetching, routing, and testing/scaffolding. Drawn into
  `react-components-and-state.md`, `react-rendering-and-rsc.md`, `data-fetching-libraries.md`,
  `testing.md`.
- **callstackincubator/agent-skills** (`react-native-best-practices`, "The Ultimate Guide to React
  Native Optimization" by Callstack) — FlatList/FlashList, atomic state, Hermes/bundle, threading and
  New-Architecture facts. Drawn into `react-native.md`.
- **wondelai/skills** — `high-perf-browser` (network fundamentals, resource hints, caching, Core Web
  Vitals depth, real-time transport), `web-typography` (font-loading mechanics), and `ios-hig-design`
  (SwiftUI conformance facts). Drawn into `performance.md`, `web-platform-runtime.md`, `swiftui.md`.
- **cuellarfr/design-skills** — state-and-transitions machines, error-prevention, and the 3-tier
  design-token model. Drawn into `state-and-data.md`, `state-completeness.md`, `forms.md`,
  `design-handoff-and-tokens.md`, `accessibility.md`.
- **Owl-Listener/designer-skills** — state-machine framing and form-design validation timing. Drawn
  into `state-and-data.md`, `forms.md`.
- **Nutlope/hallmark** — interaction-and-states form a11y and the shadcn CSS-variable / DTCG export
  shape. Drawn into `state-completeness.md`, `forms.md`, `shadcn.md`, `design-handoff-and-tokens.md`,
  `tailwind.md`.
- **Leonxlnx/taste-skill** — client-architecture and state-management notes, the RSC safety contract
  and interactivity isolation, the official component-library selection table, the dark-mode protocol,
  and the Tailwind v4 postcss trap. Drawn into `react-components-and-state.md`,
  `react-rendering-and-rsc.md`, `shadcn.md`, `design-handoff-and-tokens.md`, `tailwind.md`.
- **hamen/material-3-skill** — window-size-class APIs, foldable Compose branch, edge-to-edge inset
  modifiers (code-level facts only; the M3 design decisions stay in design's `surface-android.md`).
  Drawn into `compose.md`.
- **nextlevelbuilder/ui-ux-pro-max-skill** — shadcn theming/accessibility notes and Tailwind
  customization/responsive doctrine (its BM25/CSV tooling was declined per family policy). Drawn into
  `shadcn.md`, `tailwind.md`.
- **ibelick/baseline-ui** — Tailwind utility and runtime conventions. Drawn into `tailwind.md`,
  `web-platform-runtime.md`.
- **antfu/skills** (`vitest`) — Vitest configuration and testing conventions. Drawn into `testing.md`.
- **emilkowalski/skills** (`emil-design-eng`, `apple-design`) — runtime interaction conventions
  (motion implementation itself routes OUT to the future animation skill). Drawn into
  `web-platform-runtime.md`.
- **web-quality-skills / accessibility skill** — WCAG 2.2 new criteria (focus-not-obscured),
  visually-hidden CSS, and live-region re-trigger recipe. Drawn into `accessibility.md`.
- **yuschick/stylelint-plugin-defensive-css** — `require-scrollbar-gutter` and
  `require-overscroll-behavior` rule shapes (per-axis, exempt on `overflow: hidden`) and
  `no-user-select-none`'s narrow-exception framing. Drawn into `css-craft.md`.
- **phuocng/csslayout** and **phuocng/frontend-tips** — masonry/grid-pattern corroboration and the
  `currentColor` reuse snippet. Drawn into `css-craft.md`.
- **camsong/You-Dont-Need-jQuery** — DOM insertion APIs, measurement math (offsetHeight/
  clientHeight/getBoundingClientRect), `readyState` guard. Drawn into `js-dom-craft.md`.
- **you-dont-need/You-Dont-Need-Lodash-Underscore** — `Object.groupBy`, optional-chaining deep-get,
  `Array.prototype.at`/`includes` traps. Drawn into `js-dom-craft.md`.
- **lydiahallie/javascript-questions** — the microtask/macrotask worked-ordering example. Drawn into
  `js-dom-craft.md`.

## CC0-1.0 (public domain; verbatim reuse permitted)

- **AllThingsSmitty/css-protips** — `aspect-ratio` plus the legacy padding-top intrinsic-ratio
  fallback, `pointer-events: none` on disabled controls, `currentColor` reuse. Drawn into
  `css-craft.md`.

## CC BY 4.0 (attribution required — credit Chalarangelo/30-seconds-of-code)

- **Chalarangelo/30-seconds-of-code** — `structuredClone` vs. JSON/hand-rolled comparison table,
  `AbortController` fetch-cancellation shape, clipboard write-plus-legacy-fallback,
  FormData/URLSearchParams one-liners, `textContent` vs. `innerText`, passive-scroll-listener
  performance note, `ResizeObserver`/`IntersectionObserver`/`MutationObserver` lifecycle shape.
  Drawn into `js-dom-craft.md`.

## WTFPL (no attribution required)

- **denysdovhan/wtfjs** — `Array.prototype.sort()`'s lexicographic default, `parseInt` without an
  explicit radix. Drawn into `js-dom-craft.md`.

## No-license (facts re-expressed only, never verbatim prose or code)

Cited to the underlying standard (MDN, WCAG, web.dev, React docs, Apple HIG, Material 3) rather than
copied.

- **thedaviddias/Front-End-Checklist** — security, testing, CSS, and performance checklist items;
  facts re-expressed and cited to MDN / web.dev / WCAG / CLDR. Drawn into `client-security.md`,
  `testing.md`, `web-platform-css.md`, `performance.md`, `i18n.md`.
- **dembrandt/dembrandt-skills** — notifications/recovery, loading-by-duration, button-states,
  z-index scale, sticky/fixed decision, font-display specifics, i18n text-expansion framing.
  Classified **no-license for this pack per inventory R18**; treated as re-expressed facts only.
  (Note: several reference `<!-- sources: -->` comments label this source "MIT" — that label is
  incorrect against R18 and is flagged for the review phase; the content itself is re-expressed.)
  Touches `state-completeness.md`, `forms.md`, `accessibility.md`, `performance.md`,
  `web-platform-css.md`, `web-platform-runtime.md`, `i18n.md`, `design-handoff-and-tokens.md`.
- **building-components** — component and token integration facts, re-expressed. Drawn into
  `tailwind.md`.
- **safari-mobile-optimization**, **transparent-web-video**, **scroll-driven-video** — iOS Safari
  viewport/chrome hardening and web-video encoding/serving facts, re-expressed (scroll-scrub
  choreography routes OUT to animation). Drawn into `web-platform-runtime.md`. **Consolidation
  (2026-07-22):** full client-side surface of `transparent-web-video` + `safari-mobile-optimization`
  is merged into `web-platform-runtime.md` (patterns A–D, encode-breaking triad/bitrate bands,
  decorative video contract, chrome three layers + PWA verify checklist, input-zoom trade-off).
  Full ffmpeg command matrix remains optional in the specialist skill for encode-only tasks.
- **Production marketing-site dual-codec video (anonymous production app)** — Pattern A with
  `bowser@^2.13`/`2.14`, SSR-null detect, dual-codec asset matrix under `public/videos/`; Safari
  `matchMedia` source swap when `<source media>` fails; dual-codec→single bt709 H.264 migration
  when transparency not required. Report:
  `.orchestrate/research-sweep-2/reports/production-transparent-video.md`. Drawn into
  `web-platform-runtime.md`.
- **expo/skills** (official, skills.sh) — `building-native-ui`, `expo-router`, `expo-ui` /
  `expo-ui-swiftui` / `expo-native-ui`, `expo-dev-client`, `upgrading-expo`, `expo-deployment`,
  `expo-cicd-workflows`, `expo-api-routes`, `eas-*` — **optional deeper dives** linked from
  `react-native.md` (not vendored into this pack). Also **vercel-labs/agent-skills**
  `vercel-react-native-skills` and **callstackincubator/agent-skills** `react-native-best-practices`
  / `upgrading-react-native` for RN perf and upgrade playbooks.
- **Next / TanStack / Astro / Remix deeper dives (skills.sh, not vendored)** — Next: `vercel-labs`
  react best-practices + view-transitions, `wshobson` app-router patterns, `mohamed-hossam1` cache
  architecture, `vercel/next.js` cache-components + dev-loop, `clerk` nextjs-patterns; official
  docs prefer `/docs/app/getting-started/*` + `/guides/*` (not legacy `building-your-application`).
  TanStack: `deckardger/tanstack-agent-skills` query/start/router; docs
  tanstack.com/{query,router,start}/latest. Astro (uncovered): `astrolicious/agent-skills@astro`,
  `clerk-astro-patterns`; docs [docs.astro.build](https://docs.astro.build) (SSR → on-demand
  rendering). Remix lineage: official `remix-run/agent-skills@react-router-framework-mode`; new
  work → [reactrouter.com framework mode](https://reactrouter.com/start/framework/installation).
  Tables: `nextjs.md`, `data-fetching-libraries.md`, SKILL.md uncovered-frameworks. Research:
  `.orchestrate/research-sweep-2/reports/framework-skills-ranked.md` + `framework-docs-skills.md`.
- **Production site-rebuild runs (anonymous studio pipeline, 2026)** — first-hand failure lessons
  from production site-rebuild runs onto Next.js: re-authoring drift vs measured porting,
  raw-vs-cleaned HTML media loss, thin-page anomaly, lazy/computed-background harvest, slider
  placeholder frames, map-tile exclusion, Referer-gated originals, the asset identity map, logo /
  stock / slider substitution failures, partial-preview placeholder routes, screenshot-capture
  pitfalls, shared-layout fetch blast radius, starter templates with baked fixes. Re-expressed;
  no client or site named. Drawn into `site-rebuild.md`, `testing.md`, `css-craft.md`,
  `nextjs.md`, `client-architecture.md`.
- **defensivecss.dev (Ahmad Shadeed)** — no license visible; the scrollbar native-overlay default
  and the `position: sticky`-in-grid `align-self: stretch` failure, re-expressed and credited to
  Ahmad Shadeed. Drawn into `css-craft.md`.
- **X/Twitter posts (live search) and their linked blog posts** — proprietary platform content, no
  open license; every fact re-expressed and cited to the underlying standard or article rather than
  quoted, short functional CSS/JS snippets reconstructed independently. Convergent corroboration for
  `overscroll-behavior:contain`, `scrollbar-gutter:stable`, and `tabular-nums` in `css-craft.md`;
  `AbortSignal.timeout`/`AbortSignal.any`, the `WeakMap` DOM-metadata pattern, `BroadcastChannel` vs.
  the `storage` event, the `visibilitychange`/`pagehide`/`sendBeacon` reliability framing (citing
  nicj.net's beaconing study), and the `Intl.Segmenter` grapheme-truncation pattern in
  `js-dom-craft.md` and `i18n.md`.

## Evaluated, not adopted as a target

- **saadeghi/daisyUI** (MIT) — evaluated as a component-stack target; not a supported target in v1
  (inventory R17), since shadcn/ui and Tailwind carry the component-stack story. One web-standard
  decision it documents (native `<dialog>` vs the Popover API for modals) was cross-checked and
  re-expressed in `accessibility.md`.

## Fold-wave research corpus (2026-07-22, capability-delta extend)

Synthesized from `.orchestrate/research-extend/` (skills.sh fan-out, github-relay 1182-repo corpus,
X/bookmarks, expert deep-reads). Load-bearing facts re-expressed; no unlicensed verbatim prose.

- **vercel-labs/agent-skills** (`vercel-react-view-transitions`, residual `react-best-practices`,
  `composition-patterns`) — React `<ViewTransition>` silent failures; residual perf/composition
  bullets. Apache-2.0 attribution chain. Drawn into `web-platform-runtime.md`,
  `react-components-and-state.md`, `performance.md`.
- **deckardger/tanstack-agent-skills** + **TkDodo Practical React Query** — durable staleTime/gcTime,
  placeholder vs initialData, key = deps principles (not full API dump). Drawn into
  `data-fetching-libraries.md`, `state-and-data.md`.
- **OWASP CheatSheetSeries** (CC BY-SA 4.0 facts re-expressed) — SPA CSRF ladder, DOM clobbering,
  clickjacking header rules. Drawn into `client-security.md`.
- **Josh Comeau / Ahmad Shadeed / Sara Soueidan** — margin collapse, stacking contexts, hover media,
  generated-content a11y. Drawn into `web-platform-css.md`, `css-craft.md`, `accessibility.md`.
- **Addy Osmani / web.dev** — third-party facades, adaptive loading, speculation eagerness.
  Drawn into `performance.md`.
- **alan2207/bulletproof-react**, **feature-sliced/documentation** (MIT) — ESLint zones, FSD layers,
  multi error boundaries. Drawn into `client-architecture.md`, `client-app-wiring.md`.
- **Practitioner X threads** (devongovett iOS 26 fixed clip; Rich Harris Safari filter+Vite;
  content-visibility + contain-intrinsic-size; OAuth redirect cookies) — re-expressed. Drawn into
  `web-platform-runtime.md`, `css-craft.md`, `performance.md`, `client-security.md`.

## Fold-wave-2 research corpus (2026-07-22, craft/media/perf sweep)

Synthesized from `.orchestrate/research-sweep-2/` (local specialist skills, web research, bookmarks,
github-relay digests). Load-bearing facts re-expressed.

- **transparent-web-video / safari-mobile-optimization / scroll-driven-video** (ours) — production
  pattern matrix, iOS chrome edge cases, scrub/runtime media traps. Drawn into
  `web-platform-runtime.md`.
- **webdesign frontend-build-patterns / depth-and-texture / imagery** (ours) — section registry,
  visual QA, glass/grain/shadow budgets (procedural). Drawn into `client-architecture.md`,
  `css-craft.md`.
- **web.dev / TuneTheWeb / DebugBear** — responsive preload `imagesrcset`/`imagesizes`,
  `fetchpriority`, Early Hints limits, image `decoding` paint semantics. Drawn into `performance.md`.
- **Josh Comeau backdrop-filter; Safari blur GPU promote notes** — backdrop roots, filter CPU path.
  Drawn into `css-craft.md`.
- **addyosmani/web-quality-skills** (MIT) — `scheduler.yield` priority, LoAF INP attribution.
  Drawn into `performance.md`.
- **Rethink-JS/alpha-video-cli**, **descriptinc/transparent-video-support** — `canPlayType` ladder,
  dual-track alpha escape hatch. Drawn into `web-platform-runtime.md`.
- **wilsonpage/fastdom**, **GoogleChromeLabs/idlize + quicklink** — dual-queue thrash prevention,
  idle-until-urgent + viewport idle prefetch. Drawn into `performance.md`.
- **color-js gamut mapping**, Display-P3 SVG repeat bug reports — gamut map vs clip, pipeline table.
  Drawn into `web-platform-css.md`.

## Underlying standards and references cited (not copied)

MDN Web Docs · WCAG 2.2 (W3C) · web.dev / Core Web Vitals · React documentation · Apple Human
Interface Guidelines · Material 3 (m3.material.io) · ECMA-402 Intl / Unicode CLDR · W3C Design Tokens
Community Group (DTCG) format · Can I Use (for current browser-support verification) · OWASP
CheatSheetSeries (client half, re-expressed). · Rebuild and visual-diff tooling, facts verified at the
primary repo/docs 2026-10-17 and cited only: Playwright snapshot docs (pixelmatch), odiff (MIT),
SingleFile CLI (AGPL-3.0), monolith (CC0-1.0), Project Wallace css-analyzer (MIT),
JCodesMore/ai-website-cloner-template README (MIT), lucide-static `tags.json` (ISC), `@tabler/icons`
`icons.json` (MIT), Iconify search API docs, Phosphor React README (MIT), simple-icons
DISCLAIMER.md.

## Fold-wave-2b web-search pass (2026-07-22)

Primary-source web research (MDN, web.dev, Josh Comeau, SiteLint, WebKit bugs, VisualViewport docs):

- **Josh Comeau "Next-level frosted glass with backdrop-filter" (2024, updated 2026)** — near-edge sample via extended child + mask-image (not overflow), pointer-events, top flicker gradient, Firefox sticky+overflow+radius. Drawn into `css-craft.md`.
- **SiteLint iOS video poster / `#t=0.001` / preload ladder (2025)** — Reduce Motion autoplay refusal, no Gzip on video, poster vs fragment cost. Drawn into `web-platform-runtime.md`.
- **VisualViewport + keyboard (MDN, bram.us, WebKit 265578)** — layout vs visual viewport under OSK; fixed bottom chrome offset. Drawn into `web-platform-runtime.md`.
- **MDN/web.dev content-visibility** — `contain-intrinsic-size: auto` remembers size after first paint. Drawn into `performance.md`.
- **WebKit inline SVG paint traps** (re-expressed) — `content-visibility` + SVG paint invalidation;
  Tailwind v4 `@layer` vs presentation attributes; `<g transform>` paint-no-draw; duplicate
  `url(#id)` clips; SVGO `removeViewBox`. Drawn into `css-craft.md`, `performance.md`,
  `tailwind.md`, `nextjs.md`, `testing.md`.
