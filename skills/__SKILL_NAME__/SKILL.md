---
name: __SKILL_NAME__
description: >-
  TODO: State the primary outcome, major artifacts, literal trigger language, and close-neighbor
  exclusions. Keep the primary intent in the first sentence and the full description under 800
  characters.
---

# __SKILL_TITLE__

## Mission and boundary

TODO: State what this skill owns, what successful work produces, and the closest adjacent work it
does not own. Keep this to two or three sentences.

Operate independently when invoked alone. When compatible upstream artifacts are provided, use
them without silently overriding established decisions. Recommend adjacent skills when useful; do
not invoke them automatically unless the user explicitly requested a composition workflow.

## Route before acting

1. Inspect the request, repository, and supplied artifacts.
2. Select the smallest sufficient route.
3. Read every selected reference completely before producing the affected artifact.
4. Do not load unrelated references.

| User intent | Read or run | Expected contribution |
|---|---|---|
| TODO: observable request condition | [Example reference](references/example.md) | TODO: artifact, decision, or validation supplied |

## Universal invariants

- Preserve user constraints and established decisions or report the conflict explicitly.
- Distinguish facts, decisions, assumptions, and proposals.
- Prefer repository evidence over generic defaults.
- Do not claim completion without validating the requested artifacts and acceptance criteria.
- Use scripts for fragile or repeated mechanics; keep judgment and conditional reasoning in prose.

## Core workflow

1. Inspect the request, evidence, constraints, and existing artifacts.
2. Select the smallest sufficient route from the table above.
3. Record material assumptions and unresolved inputs.
4. Produce the requested artifact or change.
5. Validate it against the request, constraints, and acceptance criteria.
6. Emit a compact handoff when downstream work is expected.

## Artifact contract

TODO: Define the required content of the skill's primary outputs. Provide a schema or asset only
when exact formatting is mechanically important.

## Completion and handoff

Before completion:

- Confirm every requested artifact exists.
- Record decisions, assumptions, risks, and unresolved questions.
- Distinguish validation performed from validation remaining.
- When downstream work is expected, provide artifact paths, owners, constraints, and a recommended
  next skill without duplicating the full artifact.

## Resources

- [Example reference](references/example.md) — TODO: state the observable condition for reading it
  and what it contributes.
