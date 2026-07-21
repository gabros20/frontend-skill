# Agent guide — creating an independent skill repository

This repository is the source template for one `<skill>-skill` repository. The runtime skill name
remains short and lives under `skills/<skill>/`; repository and plugin names use the `-skill`
suffix. Work [TEMPLATE-CHECKLIST.md](TEMPLATE-CHECKLIST.md) top to bottom after initialization.

## Detect state first

- `skills/__SKILL_NAME__/` exists in the actual `gabros20/skill-template` repository: maintain the
  source template and run `scripts/check-sync` to exercise the initializer regression test.
- `skills/__SKILL_NAME__/` exists anywhere else: stop and run `scripts/init`; the gate must fail
  until this happens.
- `skills/<real-name>/` exists with the checklist: populate and validate the derived repository.
- No checklist: treat it as an ordinary released skill repository and follow its local README.

## Required behavior

1. Run the generic `scripts/check-sync` gate before specialized repository checks. Never replace
   packaging and navigation validation with domain-specific assertions.
2. Keep runtime frontmatter to `name` and `description`. Keep versions and repository metadata in
   `.codex-plugin/plugin.json`, `CHANGELOG.md`, tags, and releases.
3. Keep `SKILL.md` as the direct router. References are flat, directly linked, self-describing, and
   loaded only when their observable conditions apply.
4. Keep repository documentation, evaluation data, release files, and optional site assets outside
   `skills/<name>/`.
5. Make standalone behavior complete. Recommend adjacent skills without silently invoking them.
6. Add deterministic scripts only for fragile or repeated mechanics and execute them in tests.
7. Treat README as the primary storefront. Site and Remotion profiles are optional publishing work.
8. Release through matching plugin version, changelog entry, tag, and GitHub Release. Do not put a
   version string back into `SKILL.md`.

Do not mark the repository complete merely because structural lint passes. Activation, traversal,
and representative output evaluations must also show that the skill changes agent behavior usefully.
