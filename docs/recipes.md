# Recipes

Copy-paste scenario prompts. Prefix any example with `Use $frontend to` in Codex; other clients use
their own explicit form or natural-language phrasing. There's no invocation grammar to compose (see
[usage.md](usage.md#there-is-no-invocation-grammar)) — each recipe is a natural-language prompt you
hand to an agent with `frontend` installed. Each names the references the router loads, so you can
see the smallest sufficient set at work. For the full route table, see
[usage.md](usage.md#route-by-job).

## Build a Next.js feature end to end

```
Build the account-settings page in this Next.js App Router project — server-fetched profile data,
a client form for editable fields with optimistic save and rollback on failure, and every state:
loading, empty, error, success. Use the project's existing Tailwind and shadcn/ui conventions and
write component tests.
```

**Routes**: the Next.js web-app bundle — `nextjs.md` + `react-components-and-state.md` +
`react-rendering-and-rsc.md` + `tailwind.md` + `shadcn.md` (primary) + `state-and-data.md` +
`state-completeness.md` + `forms.md` (concern) + `testing.md`. **Produces**: server/client
components with the RSC boundary respected, an optimistic-update-with-rollback form, the full
state set, and component tests.

## Implement a SwiftUI screen from a design handoff

```
Implement the sign-up screen from this design handoff — handoff.yaml and DESIGN.md are attached.
Wire the tokens, all eight states, and Dynamic Type. Target SwiftUI and confirm HIG conformance.
```

**Routes**: the design-handoff bundle — `design-handoff-and-tokens.md` + `swiftui.md` (+
`swift-concurrency-and-testing.md` if the screen has async loading) as the native-iOS overlay
(overrides the web-platform substrate). **Produces**: a SwiftUI screen with tokens accepted from the
handoff as the source of truth, states wired per the design intent, and HIG-conformant chrome —
with any conflict between the handoff and the codebase reported rather than silently resolved.

## Retrofit accessibility on an existing component

```
Audit and fix accessibility on this data table and its row-selection controls — keyboard support,
focus management, ARIA roles, and the contrast/target-size floors. This is a code fix, not a
release-gate audit.
```

**Routes**: `accessibility.md` (primary). Pull in `state-completeness.md` if the fix also needs the
empty/error/loading states for the table. **Produces**: ARIA-correct markup, keyboard and focus
mechanics, and floors met in code. The skill notes that a full independent WCAG audit belongs to
quality; this is the code-level fix.

## Fix Core Web Vitals on a product page

```
Fix Core Web Vitals on this product page — LCP, CLS, and bundle size are all failing the budget.
Diagnose the causes, apply the fix ladder, and verify against the thresholds after the change.
```

**Routes**: `performance.md` (primary); pull `web-platform-css.md`/`web-platform-runtime.md` or the
relevant web-stack overlay (e.g. `nextjs.md` for image/font primitives) if the fix touches that
layer. **Produces**: a diagnosed root cause per metric, the applied fix (image/font loading,
code-splitting, virtualization, or rendering-cost fix), and a before/after check against the
canonical CWV thresholds.

## Restructure a growing client codebase

```
Our React app's src/ has become a dumping ground — components, hooks, and utils folders with
cross-imports everywhere. Restructure it around feature boundaries with clean import rules,
and organize the design-token files while you're at it.
```

**Routes**: `client-architecture.md` (primary); `react-components-and-state.md` if component
boundaries move, `design-handoff-and-tokens.md` for token values (file layout lives in the
architecture ref). **Produces**: a feature-vs-type decision for the codebase's size, the
unidirectional shared → features → app import layering with per-feature public APIs, colocation
of tests/stories/styles, and a token-file layout that matches the delivery pipeline.
