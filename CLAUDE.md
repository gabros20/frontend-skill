# Claude Code repository guide

Read [AGENTS.md](AGENTS.md) before changing runtime behavior and
[CONTRIBUTING.md](CONTRIBUTING.md) before preparing a release. Keep `frontend` focused on the
production client — components, state, data, forms, accessibility, performance, client security,
and tests — and hand experience design, system architecture, marketing, quality audits, and
deployment/release to their owning capabilities.

Preserve the canonical homes: the two-layer state model in `state-completeness.md`, accessibility
floors in `accessibility.md`, design-handoff token acceptance in `design-handoff-and-tokens.md`. Run
`scripts/check-sync` after every runtime, routing, metadata, documentation, or evaluation change. Do
not claim completion unless the `testing.md` dev-loop self-check actually ran.
