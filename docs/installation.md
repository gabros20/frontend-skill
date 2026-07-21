# Installation

Install the `frontend` runtime pack from the independently versioned
`gabros20/frontend-skill` repository.

## Prerequisites

- An Agent Skills-compatible client (Codex, Claude Code, or any cross-agent host).
- No external CLI is required to route, implement, or write tests for covered stacks.
- The `testing.md` dev-loop self-check (serve the build, screenshot every route at two viewports
  with reduced motion emulated, interact with it) requires a runnable dev server and screenshot
  capability. Without it, the skill states precisely what validation ran and what remains rather
  than claiming a green build looks correct.
- Consuming a design handoff requires the upstream `handoff.yaml` and `DESIGN.md` files from
  [design-skill](https://github.com/gabros20/design-skill); frontend works standalone without them.

## Install with skills.sh

```bash
npx skills add gabros20/frontend-skill
```

## Clone and install

```bash
git clone https://github.com/gabros20/frontend-skill.git
cd frontend-skill
./install.sh codex
```

Available targets:

| Argument | Destination |
|---|---|
| `codex` | `${CODEX_HOME:-$HOME/.codex}/skills/frontend/` |
| `agents` | `~/.agents/skills/frontend/` |
| `claude` | `~/.claude/skills/frontend/` |
| `cursor` | `~/.cursor/skills/frontend/` |
| `antigravity` | Gemini IDE and Antigravity CLI skill paths |
| `opencode` | `~/.config/opencode/skills/frontend/` |
| `grok` | `~/.grok/skills/frontend/` |
| `hermes` | `~/.hermes/skills/frontend/` |
| `all` | Claude, Codex, and the cross-agent path |

The installer stages a complete copy before replacing an existing installation. If replacement
fails, it restores the previous copy.

## Verify

Start a new client session and use the client's supported invocation form:

- Codex: `$frontend`
- Slash-command clients: `/frontend`
- Other clients: an `@` mention, skill tool, or natural-language trigger

For Codex, verify the installed files directly:

```bash
test -f "${CODEX_HOME:-$HOME/.codex}/skills/frontend/SKILL.md"
```

Then run a small route-specific request, for example:

```text
Use $frontend to fix Core Web Vitals on this product page — LCP, CLS, and bundle size.
```

## Update

```bash
cd frontend-skill
git pull --ff-only
./install.sh codex
```

Review [CHANGELOG.md](../CHANGELOG.md) and GitHub Releases for version history. Version metadata
intentionally stays outside runtime `SKILL.md`.

## Uninstall

```bash
rm -rf "${CODEX_HOME:-$HOME/.codex}/skills/frontend"
```
