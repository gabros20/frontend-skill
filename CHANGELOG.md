# Changelog

All notable changes to **frontend** are documented here.

The release procedure synchronizes `.codex-plugin/plugin.json`, this changelog, git tag
`v<version>`, and the matching GitHub Release. Runtime `SKILL.md` contains no version metadata.

## [Unreleased]

### Added
- **`site-rebuild.md`** (28th reference): faithful rebuild/migration of an owner-authorized site —
  port and measure rather than re-author, render capture + raw-HTML read, thin-page anomaly flag,
  full asset harvest (lazy `data-*`, `srcset`, computed backgrounds, slider placeholder frames,
  map-tile exclusion, Referer-gated originals), the asset identity map, no-substitution rules,
  measured tokens, partial-preview placeholder routes, and a pixel-diff fidelity gate. Wired as a
  primary-job row and a declared bundle; description names faithful rebuilds.

### Changed
- `testing.md`: visual-regression baselines (pixelmatch/odiff, per-platform environment, fixed
  tolerance); scripted capture mechanics; fast-scroll reveal miss, mobile full-page mis-stitch,
  section element crops; computed section-key coverage; dev-only gallery route as the baseline surface;
  route/link/console/failed-request check and a pinned color scheme in the dev loop.
- `shadcn.md`: icon name resolution via tag manifests, Iconify build-time bundling, Phosphor SSR
  entry, logo trademark rule, ISO-keyed tree-shakeable flags, vendored build-time assets.
- `css-craft.md`: `ch` caps on the text element; fixed-header offset on hero-less routes.
- `nextjs.md`: per-environment `remotePatterns`; shared-layout fetch blast radius.
- `client-architecture.md`: typed fixture/CMS loader swap, delivery-API done-check, starter
  templates with baked fixes and a smoke build, one render path for CMS-modeled chrome.
- Evals: activation, traversal, and output cases for faithful rebuilds.

## [0.2.3] — 2026-07-27

### Fixed
- Sibling-skill references in boundary/routing prose now use the family-standard backticked
  runtime id (`design`, `architecture`, `backend`, `quality`, `operate`) instead of bare
  parenthetical names, matching convention used elsewhere in this pack and across the family.
- "Adjacent work this pack does not own" now names `automation` (business processes spanning
  systems this pack does not own), closing a gap against the released 10-pack family.

## [0.2.2] — 2026-07-22

### Changed
- Site hero intro: plain scope for websites, creative/marketing sites, web apps, product UI, and
  native iOS/Android (no defensive phrasing).
- Safari SVG trap wording: agent-facing facts only — no incident or project-specific narrative.

## [0.2.1] — 2026-07-22

### Added
- **Safari inline SVG paint traps:** `content-visibility` + SVG paint invalidation; Tailwind v4
  `@layer` vs presentation attributes; flat paths (no `<g transform>`); unique clip IDs; SVGO
  `removeViewBox: false` — `css-craft.md` + cross-refs.

### Changed
- Site framing matches docs: creative websites and web apps (`site/index.html`, `llms.txt`,
  `og-source.html`).

## [0.2.0] — 2026-07-22

### Added
- **`client-app-wiring.md`** (27th reference): production SPA harness — API client, single-flight
  401 refresh, multi-tab session fanout, feature-flag client rules, error boundaries → reporting,
  public runtime config, idempotency-key headers. New primary-job router row + **Production SPA
  bootstrap** declared bundle.
- Capability-delta fold wave from research corpus (skills / GitHub / X / expert blogs): SPA CSRF +
  credentialed fetch + OAuth cookie traps; iOS 26 fixed-modal clip; React View Transitions silent
  failures; TanStack durable cache principles; margin-collapse + stacking-context models; third-party
  facades + adaptive loading; FSD/ESLint architecture; upload/`revokeObjectURL` forms; Next cache
  tag registry limits.
- **Web-search pass (sweep-2b):** Comeau frosted-glass near-edge sample (`mask-image` not overflow);
  visualViewport keyboard vs fixed bottom chrome; video Reduce Motion / preload ladder / no video Gzip;
  `contain-intrinsic-size: auto` retained size; Safari mix-blend tall-page flake.
- **Specialist consolidation:** full client learnings from `transparent-web-video` +
  `safari-mobile-optimization` merged into `web-platform-runtime.md` (plain-MP4 path, size tiers,
  decorative video contract, encode-breaking table, chrome workflow/PWA verify, input-zoom non-flip).
- **Production Pattern A card:** grounded Pattern A on `bowser` + SSR-null dual-codec trees;
  Safari `matchMedia` video source swap; dual-codec → single bt709 H.264 migration signal when
  alpha is not required.
- **Expo-first React Native:** thickened `react-native.md` — managed/prebuild/CNG, config plugins,
  Expo Router, `EXPO_PUBLIC_*`, expo-image/SecureStore, Expo Go vs dev client, EAS Build/Update;
  SKILL router treats Expo as the default cross-platform RN path (Next-like role on web).
- **Expo deeper-dive skills:** `react-native.md` optional install table → official `expo/skills`
  (building-native-ui, Router, UI kits, EAS/deploy) + high-install Vercel/Callstack RN playbooks;
  official docs table → [docs.expo.dev](https://docs.expo.dev). README / docs / site updated for
  Expo-first posture.
- **Next / TanStack / Astro skill+docs parity:** `nextjs.md` and `data-fetching-libraries.md` get
  optional skills + official docs tables (Expo-style); SKILL.md uncovered-frameworks block for
  Astro + Start/Query pointers.
- **Framework skills/docs research (find-skills + live URL verify):** pin official
  `remix-run/agent-skills@react-router-framework-mode` for Remix/RR framework mode; Next docs table
  moved to canonical `getting-started/*` + `guides/*` (+ proxy file convention); TanStack/SWR/RR
  deep-link columns; SWR “no ≥1K skill” confirmed.
- **Sweep-2 craft/media fold** (research-sweep-2 → fold-wave-2): corrected transparent-video pattern
  matrix; scroll-scrub + Safari video lock traps; Safari blur/backdrop-root/will-change layer craft;
  color-gamut / P3 pipeline / gamut-map; responsive `imagesrcset` preload + Early Hints limits;
  media IO abort patterns; content-driven section registry; Popover/Anchor floors; `canPlayType`
  video ladder + dual-track escape hatch; idle/prefetch composition; fastdom-shaped dual queues.

### Changed
- Thickened `client-security.md`, `web-platform-runtime.md`, `web-platform-css.md`, `css-craft.md`,
  `performance.md`, `data-fetching-libraries.md`, `state-and-data.md`, `client-architecture.md`,
  `react-components-and-state.md`, `forms.md`, `accessibility.md`, `tailwind.md`, `nextjs.md`,
  `js-dom-craft.md`.
- Activation and traversal evals extended for wiring, CSRF/CORS, TanStack traps, and sweep-2 media/CSS.
- README, docs, and site refreshed for Expo-first RN, SPA wiring, and framework skill/docs pointers.

## [0.1.0] — 2026-07-21

### Added
- Initial release of the **frontend** engineering pack: a lean universal `SKILL.md` core (mission
  and boundary, faceted router, universal invariants, workflow, artifact contract) plus 22 focused
  references covering state and data, state completeness, forms, accessibility, performance, client
  security, testing, i18n, and design-handoff-and-tokens consumption, across React, Next.js,
  Tailwind, shadcn/ui, SwiftUI, Jetpack Compose, and React Native, plus a SOURCES trace.
- Faceted router with primary-job, platform-overlay, and web-stack-overlay tables plus declared
  bundles, capping load at one primary job, at most one platform overlay (native overrides web), and
  only material concerns.
- Evaluation fixtures across four dimensions — activation, traversal, output, and
  compression-ablation — replacing the placeholder sets.

[0.2.2]: https://github.com/gabros20/frontend-skill/releases/tag/v0.2.2
[0.2.1]: https://github.com/gabros20/frontend-skill/releases/tag/v0.2.1
[0.2.0]: https://github.com/gabros20/frontend-skill/releases/tag/v0.2.0
[0.1.0]: https://github.com/gabros20/frontend-skill/releases/tag/v0.1.0
