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
responsive preload, code-splitting, virtualization, or rendering-cost fix), and a before/after
check against the canonical CWV thresholds.

## Dual-codec transparent hero video (Safari + Chrome)

```
Add a transparent-looking looping hero video that works on Safari/iOS and Chrome. Page background
is a solid dark hex. Prefer the production dual-codec Pattern A (bowser + SSR-null) unless a
simpler stacked-source Pattern B is enough. Include mobile variants and autoplay insurance.
```

**Routes**: `web-platform-runtime.md` (primary web substrate) + `performance.md` if LCP/poster
budget matters. **Produces**: pattern decision (A/B/C), encode-breaking checklist (hvc1 / type /
bake hex), React client mount with SSR-null detect, responsive sources, verification on real Safari
and Chrome.

## iOS Safari chrome tint + app shell

```
This dark app shows white iOS URL/status bars and the full-height shell jumps when the address bar
collapses. Fix chrome tint for current iOS Safari (including Liquid Glass) and switch the shell to
stable svh with the right viewport meta.
```

**Routes**: `web-platform-runtime.md` (+ `css-craft.md` if input 16px / form font inherit is
involved). **Produces**: three-layer chrome tint (edge strips + body bg + theme-color), `svh`
shell, PWA status-bar meta, device/simulator verify checklist.

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

## Expo app screen (default RN path)

```
Build the profile screen in this Expo app — Expo Router file under app/, load the avatar with
expo-image, keep the session token in SecureStore, and make the list of posts use FlashList.
Don't assume Expo Go if we need a native module.
```

**Routes**: `react-native.md` (native overlay; Expo-first) + `react-components-and-state.md` +
`state-completeness.md` if empty/error/loading are in scope. For heavy Expo UI kits, EAS, or SDK
upgrades, the agent should also install the matching optional skill from the table in
`react-native.md` and consult [docs.expo.dev](https://docs.expo.dev). **Produces**: route file in
the Expo Router tree, Expo-correct image/storage choices, virtualized list, and an explicit call on
Expo Go vs development build if native deps appear.

## Wire a production SPA session + API client

```
Our Vite SPA talks to an API on a subdomain with cookie sessions. 401s redirect everyone to login
even when refresh would work, two tabs thrash refresh tokens, and logout in one tab leaves the
other tab "signed in." Wire a shared client, single-flight silent refresh, multi-tab logout, and
the credentialed CORS / CSRF client half.
```

**Routes**: `client-app-wiring.md` (primary) + `client-security.md` + `state-and-data.md`.
**Produces**: one API surface with credentials mode, 401 single-flight mutex, multi-tab session
fanout, CSRF/credentials checklist applied, and clear stop conditions when the backend half is
missing.
