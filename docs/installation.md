# Installation

Install the `frontend` runtime pack from the independently versioned
`gabros20/frontend-skill` repository.

## Prerequisites

- An Agent Skills-compatible client.
- TODO: Add only real skill-specific tools, credentials, or runtime requirements.

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

## Update

```bash
cd frontend-skill
git pull --ff-only
./install.sh codex
```

Review `CHANGELOG.md` and GitHub Releases for version history. Version metadata intentionally stays
outside runtime `SKILL.md`.

## Uninstall

```bash
rm -rf "${CODEX_HOME:-$HOME/.codex}/skills/frontend"
```
