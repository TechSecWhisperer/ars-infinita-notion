# 🌌 Ars Infinita Notion — *A.I.N*

![Mechanics](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FTechSecWhisperer%2Fars-infinita-notion%2Fmain%2Ffeed.json&query=%24.mechanics_version&label=mechanics&prefix=v&color=8A2BE2)
![Commands](https://img.shields.io/badge/commands-26-2F9E44)
![License](https://img.shields.io/badge/license-MIT-blue)

**Your job hunt as an RPG, inside your own Notion workspace.** You bring a job link; an AI agent tracks it, scores your fit, researches the company, drafts your materials in your voice, and turns real progress into XP and levels.

**[Full guide →](docs/PLAYERS-GUIDE.md)** · **[Commands →](docs/COMMANDS.md)** · **[Troubleshooting →](docs/TROUBLESHOOTING.md)**

## Quick start

You need a **Notion account** (free plan is enough) and a **paid AI agent plan** — that is the one thing you pay for. Then pick your agent:

| | Best for | Install |
|---|---|---|
| **[Claude Code](#claude-code)** | Terminal, most tested path | `/plugin marketplace add TechSecWhisperer/ars-infinita-notion` |
| **[Claude desktop app](#claude-desktop-app)** | No terminal | Plugins panel → add the same marketplace |
| **[Codex · Antigravity · other CLIs](#codex-antigravity--other-clis)** | Any Notion-capable agent | `npx @ars-infinita-notion/system-skills install-codex` |

Every path is four steps and ends the same way: you run `/awaken` and the agent builds the rest.

### Claude Code

1. **Make a folder and work from it.** `/awaken` writes a `CLAUDE.md` there so later sessions pick up where you left off.
   ```sh
   mkdir ~/ars-infinita && cd ~/ars-infinita
   ```
2. **Duplicate the Seed** — the empty A.I.N template — into your Notion workspace: **[A.I.N Notion Seed](https://www.notion.so/3a356d8e806b8196855aeb97d1b0a630)** → **Duplicate** (top right) → choose your workspace. Keep this link; `/awaken` may ask for it.
3. **Connect Notion.** Add the server, then authenticate — it does not happen on its own:
   ```sh
   claude mcp add --scope user --transport http notion https://mcp.notion.com/mcp
   ```
   Then start a session, run `/mcp`, select **notion**, and choose **Authenticate**. Your browser opens Notion's sign-in — grant access to the workspace holding your Seed copy. `/mcp` should then show `✔ Connected`.
4. **Install the commands.**
   ```text
   /plugin marketplace add TechSecWhisperer/ars-infinita-notion
   /plugin install the-system-player@ars-infinita-notion
   ```
   Accept the confirm view if one opens, then `/reload-plugins`.

Now [run `/awaken`](#then-run-awaken).

### Claude desktop app

1. **Connect a folder to your session first.** In the prompt area, before you send anything, use the **Project folder** dropdown to pick the folder Claude works in. The desktop app has *no* file access until you do, and `/awaken` writes a file at the end. Without it, setup finishes looking successful and every later session starts cold.
2. **Duplicate the Seed** into your Notion workspace: **[A.I.N Notion Seed](https://www.notion.so/3a356d8e806b8196855aeb97d1b0a630)** → **Duplicate** → choose your workspace. Keep this link.
3. **Connect Notion.** In the **Code** tab, click the **+** next to the prompt box → **Connectors** → **Notion**, and follow the sign-in flow. Grant access to the workspace holding your Seed copy. (Settings → Connectors is where you *manage* one later, not where you add it.)
4. **Install the commands.** Open the plugins panel, add the marketplace `TechSecWhisperer/ars-infinita-notion`, then install **the-system-player** from it.

Now [run `/awaken`](#then-run-awaken).

### Codex, Antigravity & other CLIs

1. **Make a folder and work from it.** `/awaken` writes an `AGENTS.md` there — not `CLAUDE.md`; the installer rewrites it for your CLI.
   ```sh
   mkdir ~/ars-infinita && cd ~/ars-infinita
   ```
2. **Duplicate the Seed** into your Notion workspace: **[A.I.N Notion Seed](https://www.notion.so/3a356d8e806b8196855aeb97d1b0a630)** → **Duplicate** → choose your workspace. Keep this link.
3. **Connect Notion.** Add Notion's hosted MCP endpoint `https://mcp.notion.com/mcp` to your CLI's MCP config and complete the OAuth flow, granting access to your Seed copy. Codex: `~/.codex/config.toml`, under `[mcp_servers.notion]`. Antigravity: `~/.gemini/config/`, or `agy mcp add` if your build has it. Your CLI's own docs win over this line.
4. **Install the commands.** No clone needed:
   ```sh
   npx @ars-infinita-notion/system-skills install-codex   # Codex CLI  -> $CODEX_HOME/skills
   npx @ars-infinita-notion/system-skills install-agy     # Antigravity -> ~/.gemini/config/plugins
   ```
   Add `--dry-run` to see every path it would touch. **If you already have a skill named `status`, `log`, `report` or any other command name, it stops without writing and prints the clash** — re-run with `--force`, which moves yours aside into a backup folder rather than deleting them.

Now [run `/awaken`](#then-run-awaken).

## Then run `/awaken`

```text
/awaken
```

`/awaken` is the Level-0 tutorial questline — the tutorial *is* the setup. It builds your workspace, writes your Kernel, teaches the loop hands-on, and leaves you at **Level 4** with real XP for the real work. It is idempotent and resumable: if it stalls, run it again. It never double-builds or double-awards.

Stuck? **[Troubleshooting →](docs/TROUBLESHOOTING.md)**

## What you get

- **Track it** — a job link becomes a Quest, with the company logged for research.
- **Appraise it** — your fit scored against your profile, gaps named, talking points pulled.
- **Scout it** — real research on the company, so you walk in informed.
- **Forge it** — a tailored cover letter and CV in *your* voice, with the AI tells stripped out.
- **Run the pipeline** — applications, follow-ups and interview stages tracked, with a nudge before something goes stale.
- **Work your network** — log who you meet, get reminded who's due, prep for events.

Every real action earns XP. XP earns levels. **[All 26 commands →](docs/COMMANDS.md)**

## Questions, bugs, ideas

**[Open an Issue](https://github.com/TechSecWhisperer/ars-infinita-notion/issues/new)** — Issues are **public**, so leave confidential job-search details out. Once installed, `/petition` files one for you. Answers are best-effort: this is a beta run by one Game Admin.

## Status

**Beta.** Open beyond the first small circle and no longer changing shape underneath you. Expect rough edges; report them and they get fixed. **Your data lives in your Notion and never leaves it.** New mechanics never rewrite your history and your XP is never re-scored.

## License

[MIT](LICENSE) — © 2026 William Moses. The game's sealed mechanics live only in the author's admin workspace; nothing here is withheld from you by licence.
