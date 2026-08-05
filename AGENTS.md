# AGENTS.md

Pointer file for agents that look here first. **[`README.md`](README.md) is the
authoritative setup guide** — read it, not this file, for anything beyond the
map below.

## What this repo is

The System (Ars Infinita Notion, "A.I.N") — a job-search RPG whose world lives
in a **Notion workspace**. This repo ships the agent side: the command skills,
the public rules mirror, and the installers. The game state is in Notion; this
repo is not the source of truth for any player's data.

## Where to go

| You want to | Go to |
|---|---|
| Set the game up (any agent) | [`README.md`](README.md) |
| Set it up on Codex or Antigravity | [README → Playing on another agent](README.md#playing-on-another-agent-codex-antigravity-) |
| Build the skills for a non-Claude CLI | [`packages/system-skills/`](packages/system-skills/) |
| Read the player-facing command guide | [`docs/PLAYERS-GUIDE.md`](docs/PLAYERS-GUIDE.md) |
| See what changed | [`CHANGELOG.md`](CHANGELOG.md) |
| Check the live rules version | [`feed.json`](feed.json) (`mechanics_version`) |
| Report a bug or ask the Game Admin | [GitHub Issues](https://github.com/TechSecWhisperer/ars-infinita-notion/issues) |

## Two things worth knowing before you start

- **Every command needs Notion reachable.** The agent talks to Notion over
  Notion's own MCP server. No Notion connection, no game — that is the first
  thing to check when a command does nothing.
- **Notion is the source of truth, not this repo.** `feed.json` is a read-only
  public projection of the rules; it is generated, never hand-edited.
