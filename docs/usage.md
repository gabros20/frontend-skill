# Usage reference

## Activation

TODO: Document realistic implicit trigger language, explicit client-specific invocation examples,
and close-neighbor requests that should not activate `__SKILL_NAME__`.

Use `/__SKILL_NAME__` as documentation shorthand only. Codex explicit invocation is
`$__SKILL_NAME__`; other clients vary.

## Mission and boundary

TODO: State what the skill owns, its primary outputs, and the nearest work it hands off.

## Workflow

TODO: Summarize the smallest artifact-driven workflow. State which stages may be entered directly.

## Route by job

| User intent | Reference or script | Expected contribution |
|---|---|---|
| TODO: observable request condition | `references/example.md` | TODO: artifact, decision, or validation |

## Outputs and completion

| Output | Complete when |
|---|---|
| TODO | TODO: objective evidence or validation |

When downstream work is expected, the skill should provide artifact paths, owners, decisions,
constraints, risks, unresolved questions, and a recommended next capability without duplicating the
full artifact.
