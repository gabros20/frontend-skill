# Agent guide — frontend-skill

This repository packages one independently versioned runtime skill: `frontend`. The GitHub and
plugin package name is `frontend-skill`; the runtime identifier and Codex invocation remain
`frontend` and `$frontend`. It is the Build-stage skill of the Digital Product Skills family.

## Ownership boundary

`frontend` owns the production client — component and state architecture, routing, data fetching
and API integration, forms and auth flows, responsive and accessible UI, the full state set in
code, client-side security, frontend performance, and the tests that guard it — across websites,
web apps, iOS, and Android. It consumes design's intent (a `handoff.yaml` and `DESIGN.md`) rather
than re-deciding it, and never presents prototype or unverified code as production-ready. It does
not absorb experience intent and visual direction (design), system decisions and API/event
contracts (architecture), server behavior and databases (backend) — though SSR/RSC runtime inside
the client framework is in scope — independent audits and release gates (quality), or deployment
and store delivery (operate) — though client build config is in scope. When an adjacent capability
is required, preserve the approved artifacts and emit a handoff. Do not silently expand this skill
into a lifecycle composer.

## Invariants

- **Production code, not a prototype.** Never present untested or unverified code as complete.
  State what validation ran and what remains rather than signing off on an unrun check.
- **A green build is not a correct screen.** The `testing.md` dev-loop self-check (serve, screenshot
  every route at two viewports with reduced motion emulated, interact) gates completion claims.
- **Canonical homes — one source of truth, others point to it, never restate.** The two-layer state
  model lives in `state-completeness.md`. Universal accessibility floors (contrast, target sizes,
  focus, zoom, reduced-motion) live in `accessibility.md`. Design-handoff token acceptance lives in
  `design-handoff-and-tokens.md`. TypeScript strict baseline lives in `testing.md`.

## Change rules

1. Put universal behavior in `SKILL.md`; put conditional depth in the smallest owning reference.
2. Every reference stays directly linked from `SKILL.md` and begins with `Purpose`, `Read when`,
   `Skip when`, `Inputs`, `Produces`; add an early `## Contents` when it exceeds 100 lines. No
   nested reference directories or discovery chains.
3. Keep every reference near its token target (`scripts/count-skill-tokens`). The ceiling is soft:
   never cut capability-delta content to satisfy a number, but padding and restated canon still get
   removed.
4. Keep runtime frontmatter to `name` and `description` only. Versions and repository URLs belong in
   plugin metadata, changelog, tags, and releases — never in `SKILL.md`.
5. Route load stays capped: one primary job, at most one platform overlay (native overrides web),
   at most one web stack overlay per axis, only material concerns. Add a declared bundle to the
   router rather than a reference-to-reference chain.
6. Preserve upstream design/product/architecture constraints; report conflicts instead of
   overriding.
7. Update the affected activation, traversal, output, or compression fixtures when behavior changes.
8. **Externalize library-API doctrine; keep the principle.** Foundational surfaces (the web
   platform, React, Next.js, Tailwind, the platform UI frameworks) are written in full here. For
   everything else, a fact is a KEEP only if it survives the library being swapped out (a
   transferable principle, or judgment on which library to pick); a fact tied to one library's exact
   hook names, CLI flags, or config knobs is API doctrine that library's own docs/skill teach better
   and keep fresher — state the principle once and point to the library instead of copying its
   surface in. The pointer order, once per library, where its doctrine used to live: check
   `node_modules/<package>/skills/` first (a packaged skill installed with the library, freshest, no
   network needed); else `npx skills add <owner/repo@skill>` from the skills.sh registry; else the
   library's official docs. Never hard-code a version-pinned detail from memory; match whatever the
   project has installed.

## Validation and release

Run before handoff:

```bash
scripts/check-sync
scripts/count-skill-tokens
```

Structural success is necessary but not sufficient: representative evals must show useful
activation, minimal traversal, and better outputs. Release by synchronizing
`.codex-plugin/plugin.json`, `CHANGELOG.md`, tag `v<version>`, and the GitHub Release. Never add the
version to runtime `SKILL.md`.
