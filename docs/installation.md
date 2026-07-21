# Installation

Install the `__SKILL_NAME__` runtime pack from the independently versioned
`gabros20/__REPO_NAME__` repository.

## Prerequisites

- An Agent Skills-compatible client.
- TODO: Add only real skill-specific tools, credentials, or runtime requirements.

## Install with skills.sh

```bash
npx skills add gabros20/__REPO_NAME__
```

## Clone and install

```bash
git clone https://github.com/gabros20/__REPO_NAME__.git
cd __REPO_NAME__
./install.sh codex
```

Available targets:

| Argument | Destination |
|---|---|
| `codex` | `${CODEX_HOME:-$HOME/.codex}/skills/__SKILL_NAME__/` |
| `agents` | `~/.agents/skills/__SKILL_NAME__/` |
| `claude` | `~/.claude/skills/__SKILL_NAME__/` |
| `cursor` | `~/.cursor/skills/__SKILL_NAME__/` |
| `antigravity` | Gemini IDE and Antigravity CLI skill paths |
| `opencode` | `~/.config/opencode/skills/__SKILL_NAME__/` |
| `grok` | `~/.grok/skills/__SKILL_NAME__/` |
| `hermes` | `~/.hermes/skills/__SKILL_NAME__/` |
| `all` | Claude, Codex, and the cross-agent path |

The installer stages a complete copy before replacing an existing installation. If replacement
fails, it restores the previous copy.

## Verify

Start a new client session and use the client's supported invocation form:

- Codex: `$__SKILL_NAME__`
- Slash-command clients: `/__SKILL_NAME__`
- Other clients: an `@` mention, skill tool, or natural-language trigger

For Codex, verify the installed files directly:

```bash
test -f "${CODEX_HOME:-$HOME/.codex}/skills/__SKILL_NAME__/SKILL.md"
```

## Update

```bash
cd __REPO_NAME__
git pull --ff-only
./install.sh codex
```

Review `CHANGELOG.md` and GitHub Releases for version history. Version metadata intentionally stays
outside runtime `SKILL.md`.

## Uninstall

```bash
rm -rf "${CODEX_HOME:-$HOME/.codex}/skills/__SKILL_NAME__"
```
