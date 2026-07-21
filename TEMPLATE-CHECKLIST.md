# Skill repository release checklist

Work top to bottom. A derived repository is expected to fail `scripts/check-sync` until every
release-critical placeholder has been replaced.

## 1. Instantiate

- [ ] Create the GitHub repository as `<skill>-skill` while keeping the runtime identifier short.
- [ ] Run `scripts/init` once, choosing `--site` and `--video` only when needed.
- [ ] Confirm `.codex-plugin/plugin.json` uses `<skill>-skill` and `skills/<skill>/SKILL.md` uses
      `<skill>`.
- [ ] Confirm no unresolved `__SKILL_*__`, `__REPO_NAME__`, color, or year tokens remain outside
      the template tooling itself.

## 2. Build the runtime skill

- [ ] Replace the `SKILL.md` description with outcome, trigger vocabulary, and close-neighbor
      exclusions.
- [ ] Fill mission, boundary, routes, universal invariants, workflow, artifact contract, validation,
      and handoff behavior.
- [ ] Replace `references/example.md`; create only references with observable loading conditions.
- [ ] Give every reference its primacy header and an early contents list when it exceeds 100 lines.
- [ ] Add runtime scripts or assets only when the workflow actually uses them; test every script.
- [ ] Ensure standalone use never depends on a sibling repository or silently invokes another skill.

## 3. Package and describe

- [ ] Fill `skills/<skill>/agents/openai.yaml`; keep the short description at 25-64 characters and
      mention `$<skill>` in the default prompt.
- [ ] Fill `.codex-plugin/plugin.json`; keep release versioning here rather than in `SKILL.md`.
- [ ] Replace activation, traversal, output, and compression-ablation eval placeholders with
      realistic cases, including adjacent-skill near misses.
- [ ] Update `install.sh` only for real host-specific prerequisites or install behavior.

## 4. Write the storefront

- [ ] Rewrite README for users: outcome, boundary, install, examples, outputs, docs, evaluations,
      releases, contribution, and license.
- [ ] Update `docs/installation.md`, `docs/usage.md`, and useful recipes; delete unused skeleton docs.
- [ ] Add research, design notes, or ADRs only for decisions future maintainers need to understand.
- [ ] Fill `CONTRIBUTING.md` with repository-specific validation and release commands.

## 5. Optional site and video

- [ ] If `--site` was selected, replace every site `TODO`, confirm repository URLs, and deploy it.
- [ ] If `--video` was selected, replace the Remotion composition and render verified light/dark
      assets. Without video, verify the static workflow fallback.
- [ ] Treat README as the primary storefront even when a site exists.

## 6. Validate and release

- [ ] Run `scripts/check-sync` and `scripts/count-skill-tokens`.
- [ ] Run realistic activation and traversal cases multiple times; inspect selected-file traces.
- [ ] Compare a representative output against no-skill and previous-version baselines.
- [ ] Update `.codex-plugin/plugin.json` and `CHANGELOG.md` to the same semantic version.
- [ ] Create and push `v<version>`, then publish the matching GitHub Release.
- [ ] Install the released skill into a clean host session and run one end-to-end smoke test.
- [ ] Remove this checklist and rewrite `AGENTS.md` and `CLAUDE.md` for the skill's actual boundary,
      invariants, validation, and release workflow.
