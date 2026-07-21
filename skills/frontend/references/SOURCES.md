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
  choreography routes OUT to animation). Drawn into `web-platform-runtime.md`.

## Evaluated, not adopted as a target

- **saadeghi/daisyUI** (MIT) — evaluated as a component-stack target; not a supported target in v1
  (inventory R17), since shadcn/ui and Tailwind carry the component-stack story. One web-standard
  decision it documents (native `<dialog>` vs the Popover API for modals) was cross-checked and
  re-expressed in `accessibility.md`.

## Underlying standards and references cited (not copied)

MDN Web Docs · WCAG 2.2 (W3C) · web.dev / Core Web Vitals · React documentation · Apple Human
Interface Guidelines · Material 3 (m3.material.io) · ECMA-402 Intl / Unicode CLDR · W3C Design Tokens
Community Group (DTCG) format · Can I Use (for current browser-support verification).
