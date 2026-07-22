# Testing

Purpose: Unit/component/UI testing doctrine and the frontend dev-loop verification discipline — a
green build is not evidence the feature works or looks right. Frontend owns writing tests and
self-verifying a build before calling it done; independent WCAG audits, cross-browser matrices, and
release-gate verification belong to `quality`.

Read when:
- Writing or reviewing unit, component, or UI tests.
- Deciding what a build must pass before it can be called done.
- Setting up TypeScript strict-mode compiler flags for a new project.
- Verifying a UI change actually renders and behaves correctly before reporting it complete.

Skip when:
- The task is an independent accessibility audit, a release-gate cross-browser matrix, or any
  verification meant to be adversarial to the author's own work — that's `quality`.

Inputs:
- The testing stack already in the project (Vitest/Jest, RTL, Playwright, or none yet).
- Whether the change is visual/layout-affecting (triggers the screenshot self-check).

Produces:
- Test code at the right query/interaction level, coverage that actually blocks a bad merge, and a
  verified-not-just-compiled build.

## Contents
- Static safety nets
- Test-shape selection and the RTL query ladder
- Mock discipline
- Coverage and mutation testing as blockers
- Contract and visual-regression testing
- The frontend dev-loop verification discipline
- Regression-gate scanning

## Static safety nets

Canonical TypeScript strict baseline for a new project — enable together from the start rather
than retrofitting piecemeal: `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`,
`noUnusedParameters`, `noFallthroughCasesInSwitch`, `isolatedModules`. `noUncheckedIndexedAccess`
specifically matters: without it, `array[0]` types as `T` even for an empty array, producing a
silent runtime `undefined` with no compile-time warning; with it, `array[n]` types as
`T | undefined`, forcing an explicit check. If retrofitting onto an existing codebase, add
`strictNullChecks` first, then layer in the rest incrementally rather than flipping `strict` all at
once. This list is the canonical home for TS-strictness — Turbopack/build-tool config lives in
`nextjs.md`, not here.

## Test-shape selection and the RTL query ladder

React Testing Library's query priority, in order — reach for the first one that resolves the
element, not the shortest to write: `getByRole` → `getByLabelText` → `getByPlaceholderText` →
`getByText` → `getByDisplayValue` → `getByAltText` → `getByTitle` → `getByTestId` (last resort
only — it carries zero accessibility signal, unlike every option above it). Query-variant choice:
`getBy*` throws if the match count is 0 or >1; `queryBy*` returns `null` on 0 matches and throws on
>1 — use it only to assert something's absence; `findBy*` is async and retries, for content that
appears after a render cycle. Prefer `userEvent` over `fireEvent` for anything simulating real user
interaction — it fires the full realistic event sequence a real user interaction produces, where
`fireEvent` fires exactly one event.

## Mock discipline

Mock external dependencies (network, database, filesystem) — never mock the business logic under
test. Prefer MSW for realistic API mocking so tests exercise the real request/response shape
instead of coupling to implementation details. Always restore mocks in `afterEach`
(`jest.restoreAllMocks()` or the Vitest equivalent) so one test's mock can't leak into the next.

## Coverage and mutation testing as blockers

Concrete floors, not aspirational targets: 70% branch coverage / 80% line-function-statement
coverage as a global floor, 90%+ on critical utility and business-logic code, excluding generated
code, type definitions, and config from the denominator. Coverage alone only proves a line
executed, not that a test would catch a regression in it — mutation testing (Stryker or
equivalent) measures whether the suite can detect a deliberately broken version of the code, with
an 80%+ mutation score as the bar on critical paths. Run mutation testing scoped to one module at a
time to keep CI time bounded rather than the whole codebase per run.

## Contract and visual-regression testing

Consumer-driven contract testing (Pact-style) decouples the frontend and backend integration test
suites: each side runs independently while a broker verifies the consumer's published contract
against the live provider. This replaces slow, brittle full-stack end-to-end tests specifically for
API-boundary correctness — it is not a substitute for E2E's job of covering real user journeys.

Enforce two distinct performance budgets in CI, both able to fail a build: a bundle-size budget
(catches an accidentally-heavy new dependency) and a runtime budget (Lighthouse CI assertions
against the Core Web Vitals thresholds defined in `performance.md`) — pair both with production RUM
monitoring, since CI budgets alone miss regressions that only appear in the field.

## The frontend dev-loop verification discipline

**A green build proves the code compiles; it does not prove the feature works or looks right.**
Treat this as the acceptance gate for any UI-affecting change, before reporting it done:

1. Serve the build and get the full route list.
2. Screenshot every route at two viewports — a standard desktop width (e.g. 1440×900) and a
   representative mobile size — with `prefers-reduced-motion` emulated so in-flight animations
   settle before capture. A blank crop from motion mid-transition is a capture miss, not a defect;
   note it and move on rather than flagging a false positive.
3. For scroll-reveal or lazy-loaded content, step-scroll with a short wait between steps instead of
   taking one full-page shot — a single full-page screenshot can capture content still blank.
4. Actually look at each screenshot for: text overflow or clipping, element overlap, a fixed header
   obscuring content, broken or placeholder images, an unreachable or overlapping mobile nav,
   cramped or collapsed spacing, low-contrast text over imagery, and horizontal scroll on mobile.
5. Fix and re-shoot only the affected routes; cap this at a few rounds rather than iterating
   indefinitely.
6. Do an interactive pass (hover states, nav, forms) via a real or CDP-based browser tool, not
   screenshots alone. **Inline SVG logos / brand marks:** Chromium-only capture can miss WebKit paint
   bugs (empty box, correct layout). Spot-check **macOS Safari or WebKit** after logo/SVGO/svgr
   changes — see `css-craft.md` Inline SVG Safari paint traps.
7. Tear down the server when done.

**Coverage-as-a-blocker**: confirm every component or section a spec calls for is actually wired up
and rendering — a defined-but-never-rendered piece is a load-bearing gap, not a cosmetic one, and
blocks completion the same way a failing test would.

**Build-health as a gate**: the build/typecheck/lint pipeline must pass clean, and if a design-token
spec (e.g. `DESIGN.md`) backs the project, it must still lint clean with no broken token references
— a build that's green but has silently lost its design tokens is not done.

If no browser at all is available for the interactive/screenshot pass, degrade honestly: report the
result as a code-level pass, not a viewed visual review, and say so explicitly rather than
presenting an unviewed change as reviewed.

Reconnaissance-then-action pattern for any browser-automation verification: navigate → wait for
network idle → inspect the rendered DOM to identify real selectors → act. Inspecting the DOM before
the page has settled on a dynamic app yields incomplete or wrong selectors — a common cause of
flaky verification scripts, not a tooling bug.

Independent audits (WCAG conformance, cross-browser compatibility matrices, release-gate
verification) are `quality`'s job, not this one — this discipline is the author's own
before-I-call-it-done check, not a substitute for independent review.

## Regression-gate scanning

Scope any lint/quality regression gate to the diff, not the whole tree (`--scope changed` or
equivalent), and block the commit on a score-delta regression rather than an absolute threshold —
this keeps the gate fast enough to run on every commit and keeps its findings relevant to what
actually changed.

<!-- sources: OpenAEC-Foundation React-Claude-Skill-Package react-impl-testing, react-agents
project-scaffolder (MIT) — scout-github.md; antfu/skills vitest (MIT) — scout-github.md;
thedaviddias Front-End-Checklist testing category (no LICENSE, re-expressed) — scout-github.md;
anthropics/skills webapp-testing (Apache-2.0) — miner-ext-b.md; webdesign frontend-build-patterns.md
+ art-review.md + design-critique.md (MIT, same author) — miner-webdesign.md; millionco/react-doctor
regression-gate pattern (Modified MIT) — miner-react-doctor.md -->
