# Skill repository template

Create one independently owned, versioned, and installable agent-skill repository. Runtime skill
identifiers stay short (`frontend`); GitHub repositories and Codex plugin packages use the
`<skill>-skill` suffix (`frontend-skill`).

The template keeps agent-loaded content under `skills/<skill>/` and keeps human documentation,
evaluation fixtures, releases, and optional site assets outside the runtime package.

## Quick start

```bash
gh repo create gabros20/<skill>-skill \
  --template gabros20/skill-template \
  --private \
  --clone
cd <skill>-skill

# Runtime skill + README/docs/evals only
scripts/init <skill> "<Skill Title>" "<25-64 character tagline>" \
  "#336699" "#6699cc" 220

# Keep the static documentation site
scripts/init <skill> "<Skill Title>" "<tagline>" \
  "#336699" "#6699cc" 220 --site

# Keep the site and Remotion video-authoring project
scripts/init <skill> "<Skill Title>" "<tagline>" \
  "#336699" "#6699cc" 220 --site --video
```

Initialization is intentionally not a release. Replace the remaining `TODO` content, then work
through [TEMPLATE-CHECKLIST.md](TEMPLATE-CHECKLIST.md). `scripts/check-sync` fails closed until the
runtime pack, metadata, and evaluation fixtures are complete.

## Repository contract

```text
<skill>-skill/
├── .codex-plugin/
│   └── plugin.json
├── skills/
│   └── <skill>/
│       ├── SKILL.md
│       ├── agents/
│       │   └── openai.yaml
│       └── references/
├── evals/
│   ├── activation/
│   ├── traversal/
│   ├── output/
│   └── compression-ablation/
├── docs/
├── scripts/
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
└── LICENSE
```

Add runtime `scripts/` and `assets/` only when the skill has a real consumer for them. README,
changelog, contribution guidance, research, design records, and release tooling stay outside the
runtime directory.

## Runtime authoring standard

`SKILL.md` is the activation-time router, not an encyclopedia. Use this order:

1. Mission and ownership boundary.
2. Conditional routes with direct Markdown links and expected contributions.
3. Universal invariants.
4. Short, artifact-driven workflow.
5. Artifact contract.
6. Evidence-based completion and handoff.

Every reference begins with `Purpose`, `Read when`, `Skip when`, `Inputs`, and `Produces`. Keep
references one level below `SKILL.md`; add an early `## Contents` when a reference exceeds 100
lines. Prefer tested scripts for fragile or repeated mechanics.

The runtime frontmatter contains only:

```yaml
---
name: <skill>
description: <outcome, triggers, and close-neighbor exclusions>
---
```

Versions, repository URLs, licensing, and storefront metadata do not belong in runtime
frontmatter.

## Standalone and composition behavior

Every generated skill must work when invoked alone. A domain skill may consume supplied upstream
artifacts and recommend a next skill, but it must not silently invoke neighboring skills.
Compatibility with a larger composition system is optional and must be backed by contract tests.

## Evaluation layers

Keep the four layers separate so a failure points to the correct fix:

| Layer | Question |
|---|---|
| Activation | Should this skill trigger for this request? |
| Traversal | Did it load the smallest sufficient reference set? |
| Output | Did it satisfy the artifact and completion contracts? |
| Compression | Did a shorter candidate preserve quality and safety? |

`scripts/check-sync` validates fixture structure. Model-driven evaluation runners can be added per
repository without changing the portable fixture contract.

## Validation

```bash
scripts/check-sync
scripts/count-skill-tokens
```

The baseline gate checks:

- Exactly one primary skill.
- Frontmatter compatibility and description budget.
- Direct, flat, self-describing references and long-file contents lists.
- `agents/openai.yaml` and `.codex-plugin/plugin.json` alignment.
- Runtime placeholders, broken paths, script executability, and eval fixtures.
- README, `AGENTS.md`, `CLAUDE.md`, contribution, changelog, and license files.
- Plugin version alignment with the latest released changelog entry.
- Initializer safety with punctuation-heavy values.

Specialized repositories may add domain-specific checks after the baseline gate; they must not
replace it.

Repository agents should read [AGENTS.md](AGENTS.md); Claude Code receives the same rules through
the lightweight [CLAUDE.md](CLAUDE.md) pointer. Derived repositories must rewrite both files for
their own ownership boundary and non-negotiable invariants.

## Versioning and releases

Release each repository independently. The canonical release version lives in:

- `.codex-plugin/plugin.json`
- The newest released `CHANGELOG.md` heading
- Git tag `v<version>` and the matching GitHub Release

Do not duplicate the version in `SKILL.md`. Research or design records are appropriate for material
decisions, not mandatory ceremony for every patch.

## Invocation and installation language

Use `/skill` only as documentation shorthand. Client-facing examples must name the actual form:

- Codex: `$skill`
- Slash-command clients: `/skill`
- Other hosts: `@skill`, a skill tool, or natural-language activation

The generated installer keeps Codex and cross-agent paths separate:

```text
codex  → ${CODEX_HOME:-$HOME/.codex}/skills
agents → $HOME/.agents/skills
```

## Optional publishing profiles

The README is every repository's primary GitHub storefront. `--site` keeps the static site and
Vercel files; `--video` additionally keeps Remotion. Site and video work never block runtime skill
correctness unless that repository explicitly makes them part of its release scope.

## License

[MIT](LICENSE)
