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
- Stress-testing a component against worst-case content, or working every state it can render.

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
- Stress harness and state workbench
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

Visual regression is a pixel diff against an approved baseline: Playwright's `toHaveScreenshot()`
(pixelmatch; `threshold` per pixel, `maxDiffPixels` overall) or a faster engine such as odiff behind
a reporting service. Baselines are per browser and platform — rendering varies with host OS, browser
version, and installed fonts — so generate and compare them in one pinned environment, or the diff
measures the machine instead of the change. Fix the tolerance before the first comparison. A
faithful-rebuild parity gate is the same mechanic against a captured source (`site-rebuild.md`). A
dev-only gallery route (or Storybook) that renders every primitive and section variant gives the
visual check one surface to baseline; keep it out of the production build.

Enforce two distinct performance budgets in CI, both able to fail a build: a bundle-size budget
(catches an accidentally-heavy new dependency) and a runtime budget (Lighthouse CI assertions
against the Core Web Vitals thresholds defined in `performance.md`) — pair both with production RUM
monitoring, since CI budgets alone miss regressions that only appear in the field.

## The frontend dev-loop verification discipline

**A green build proves the code compiles; it does not prove the feature works or looks right.**
Treat this as the acceptance gate for any UI-affecting change, before reporting it done:

1. Serve the **production** build (`build`, then `start` or a static server), never the dev server:
   dev double-runs effects under Strict Mode, adds overlays, and ships unminified code, so timings,
   frame rates, console output, and vitals mean nothing there. Get the full route list. Script the mechanics once and reuse them — a free
   port, a ready-wait, route enumeration, absolute output paths (some capture tools silently skip a
   relative one), teardown by port — rather than re-improvising them each session.
2. Screenshot every route at two viewports — a standard desktop width (e.g. 1440×900) and a
   representative mobile size — with `prefers-reduced-motion` emulated so in-flight animations
   settle before capture. Add the user's real viewport width when known. Set the viewport explicitly
   (emulation or the capture API) and check the image width — resizing a window often leaves the
   capture at desktop width. Fluid type adds three mid-band widths and a 200% zoom (text must grow;
   if it doesn't, a `vw` term lacks its `rem` anchor). A blank crop from motion mid-transition is a
   capture miss, not a defect; note it and move on rather than flagging a false positive.
3. For scroll-reveal or lazy-loaded content, step-scroll with a short wait between steps instead of
   taking one full-page shot — a single full-page screenshot can capture content still blank. Step
   in increments under a viewport height: a fast scroll-to-bottom-and-back does not reliably fire
   `IntersectionObserver` reveals. A mobile full-page capture under device emulation can mis-stitch
   (output height a multiple of `document.body.scrollHeight`); set the viewport height to the
   measured document height and take a plain screenshot instead. Full-page shots also downscale
   detail — for a section-by-section read, wrap each section in a layout-neutral attribute
   (`data-section-key`) and capture element crops at full resolution. For stitched captures, warm
   lazy content with one full scroll first, settle ~2s per stop, cut section crops from the stitched
   image so they tile without gaps, and reject any capture with blank bands.
4. Open each capture and confirm it shows what its name claims (right section, nothing blank or
   half-loaded), then look for: text overflow or clipping, element overlap, a fixed header obscuring
   content, broken or placeholder images, an unreachable or overlapping mobile nav, cramped or
   collapsed spacing, and low-contrast text over imagery. Assert horizontal overflow rather than
   eyeballing it: at each mobile width, after scrolling each section into view,
   `document.documentElement.scrollWidth <= innerWidth` (usual culprits: `vw` type in a no-wrap row,
   fixed-width blocks, oversized or negatively positioned decoration, unclamped marquees —
   `overflow-x: clip` on a wrapper is the belt, not the fix). **Failed-reveal signature:** a large
   share of text still at `opacity: 0` or `visibility: hidden` after reveal handlers ran means
   content shipped invisible, usually one script error away; load each route with JavaScript
   disabled too — nothing may be blank. Run the text-spacing injection (`accessibility.md` Text
   spacing and reflow).
5. Fix and re-shoot only the affected routes; cap this at a few rounds rather than iterating
   indefinitely.
6. Do an interactive pass via a real or CDP-based browser tool, not screenshots alone: drive every
   reachable state (open, closed, hover, focus, error, empty, overlong) and check for overlap and
   clipping. Animated components get start/middle/end captures from a dev-only freeze switch, and
   gestures need device evidence (`ui-motion.md` Verify motion, Gestures and drag). Fetch each route
   type's raw server HTML and compare it with the rendered DOM: a heading, title, or body copy that
   exists only after JS is a search and assistive-tech risk; the LCP element is real text or an
   `<img>`, never a canvas. **Inline SVG:** Chromium-only checks miss WebKit paint-no-draw; spot-check
   Safari/WebKit after SVG or SVGO/svgr changes (`css-craft.md`). Confirm every route returns 200,
   internal links resolve, and the console and network panel show no errors or failed asset
   requests. Pin the emulated color scheme for captures so a theme-aware page does not shift with
   the host's OS setting.
7. Tear down the server when done.

**Coverage-as-a-blocker**: confirm every component or section a spec calls for is actually wired up
and rendering — a defined-but-never-rendered piece is a load-bearing gap, not a cosmetic one, and
blocks completion the same way a failing test would. Compute it — diff the content's section keys
against the component registry — rather than tracing the mapping by eye.

**Build-health as a gate**: the build/typecheck/lint pipeline must pass clean, and if a design-token
spec (e.g. `DESIGN.md`) backs the project, it must still lint clean with no broken token references
— a build that's green but has silently lost its design tokens is not done.

**Native builds** need the same loop. iOS: `xcrun simctl io booted screenshot <path>`, `xcrun simctl
ui booted appearance dark`, and the UDID from `xcrun simctl list devices booted` (never a display
name) when several are booted. Android: `adb exec-out screencap -p > <path>`, `adb shell cmd uimode
night yes`, `adb shell settings put system font_scale 1.3` (read current values first and restore
them; `-s <serial>` with several devices). Capture every shipped device class. Simulators give
breadth; posture, gestures, refresh rate, and performance need hardware — say which produced the
evidence.

Never make a page behave differently under automation (`navigator.webdriver`, a headless user
agent, test-hook checks) to pass a capture or audit; a check you think is wrong is reported, not
gamed.

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

## Stress harness and state workbench

Both run on one scratch client route, out of the production build; remove it on request and grep
for leftovers.

- **Stress harness:** render the real component once per scenario, each in a fixed-width labelled
  box (320px, squeezed by a sibling, very wide — boxes, not viewport resizes). Keep only axes its
  code can meet: content length (empty, one word, typical, several sentences, one unbreakable
  ~60-character string) if it renders text it didn't author; shape (emoji, RTL, mixed direction,
  tall scripts, aligned numbers) for user or locale text; quantity (0, 1, realistic, 10×) if it
  repeats; states that arrive as props. Dark mode, zoom, and reduced motion are toggled by the
  viewer, never simulated on the page. Write kept and dropped axes first; report only what visibly
  broke.
- **State workbench:** one instance in every state its code branches on — data (loading, empty,
  error, one, typical, long, partly pending, stale while refetching), account (plan, role, owner vs
  member), feature (flag, trial, limit, locked) — selected by a `?__state=` switcher kept visibly
  outside the design system. Feed data at the app's own boundary (props, a seeded query cache, a mock
  provider, request mocks), never by editing internals; use product-shaped data in real counts; keep
  pending states pending; confirm fixtures actually render (a live sync or refetch can overwrite the
  seed); re-flip every state after each visual change. A state the code can't reach is listed
  missing, never added.

## Regression-gate scanning

Scope any lint/quality regression gate to the diff, not the whole tree (`--scope changed` or
equivalent), and block the commit on a score-delta regression rather than an absolute threshold —
this keeps the gate fast enough to run on every commit and keeps its findings relevant to what
actually changed.

Before calling a UI change done, read the removed side of your own diff for dropped signals:
`aria-*`, `role`, `alt`, `for`/`htmlFor`, `scope`, `:focus-visible`/`outline`, `tabindex`,
`prefers-reduced-motion`/`prefers-contrast`, logical→physical swaps, `lang`/`dir`,
`text-wrap`/`line-clamp`/`tabular-nums`, token→literal color swaps, and deleted user-facing strings.
A removal is a regression unless the diff carries an equivalent (an `aria-label` replaced by
`aria-labelledby` to visible text, a role dropped because the element became native, a literal
replaced by a same-value token). A changed token or shared primitive: search its consumers by the
token name, two hops out.

<!-- sources: OpenAEC-Foundation React-Claude-Skill-Package react-impl-testing, react-agents
project-scaffolder (MIT) — scout-github.md; antfu/skills vitest (MIT) — scout-github.md;
thedaviddias Front-End-Checklist testing category (no LICENSE, re-expressed) — scout-github.md;
anthropics/skills webapp-testing (Apache-2.0) — miner-ext-b.md; webdesign frontend-build-patterns.md
+ art-review.md + design-critique.md (MIT, same author) — miner-webdesign.md; millionco/react-doctor
regression-gate pattern (Modified MIT) — miner-react-doctor.md; playwright.dev/docs/test-snapshots
(pixelmatch, threshold/maxDiffPixels, per-platform baselines; verified 2026-10-17); odiff README
(MIT); anonymous production site-rebuild runs (2026, re-expressed) — capture-script mechanics,
scroll-reveal fast-reset miss, mobile full-page mis-stitch, section element crops, computed
coverage, dev-only gallery route; design-fold 2026-11: jakubkrehel/skills (MIT) — stress harness, state
workbench, removed-signals review; pbakaus/impeccable (Apache-2.0, iOS/Android loop distilled from
ehmo/platform-design-skills MIT) — capture validity, state drive, failed-reveal signature, native
screenshot loop; juliobsz/skills (MIT) — production build only, server HTML vs DOM, LCP not canvas;
gcomartins/myfskills (MIT) — scrollWidth overflow assertion and culprits, explicit viewport;
MengTo/skills (MIT) — stitched capture; jpoindexter/typography-skills (MIT) — fluid-type widths;
Leonxlnx/taste-skill (MIT) — never game automation; Nutlope/hallmark (MIT) — JS-disabled load -->
