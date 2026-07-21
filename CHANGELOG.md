# Changelog

All notable changes to **frontend** are documented here.

The release procedure synchronizes `.codex-plugin/plugin.json`, this changelog, git tag
`v<version>`, and the matching GitHub Release. Runtime `SKILL.md` contains no version metadata.

## [Unreleased]

### Added
- Queue unreleased changes here.

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

[0.1.0]: https://github.com/gabros20/frontend-skill/releases/tag/v0.1.0
