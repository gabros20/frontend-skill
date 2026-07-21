# Contributing

Contributions should improve the skill's activation, traversal, execution, validation, or
portability without adding unnecessary runtime context.

## Before opening a pull request

1. Update the smallest owning runtime file; link instead of duplicating knowledge.
2. Add or update activation, traversal, output, and regression fixtures affected by the change.
3. Run:

   ```bash
   scripts/check-sync
   scripts/count-skill-tokens
   ```

4. Update README/user docs when the public workflow changes and `AGENTS.md`/`CLAUDE.md` when
   repository invariants change.
5. Record user-visible behavior changes in `CHANGELOG.md`.

Material contract or architecture decisions should receive a focused design note or ADR. Routine
fixes do not require ceremonial research documents.

## Releases

Use semantic versioning. Update `.codex-plugin/plugin.json` and the newest released changelog
heading together, create tag `v<version>`, and publish the matching GitHub Release.
