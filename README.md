# 🌌 Ars Infinita Notion — *A.I.N*
### *"Ai-yn"* · Craft Without Limits.

![Mechanics](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FTechSecWhisperer%2Fars-infinita-notion%2Fmain%2Ffeed.json&query=%24.mechanics_version&label=mechanics&prefix=v&color=8A2BE2)
![Commands](https://img.shields.io/badge/commands-26-2F9E44)
![License](https://img.shields.io/badge/license-MIT-blue)

> Part of **Ars Infinita** — a personal brand for building worlds without limits. **A.I.N** is its Notion-native chapter. *(And yes — the **AI** is right there in the name.)*

**Your job hunt as an RPG, inside your own Notion workspace.** You bring a job link; an AI agent tracks it, scores your fit, researches the company, drafts your materials in your voice, and turns real progress into XP and levels.

The job market is a void of spreadsheets and silence. A.I.N imposes order on it — and makes the grind *feel* like progress, because it is.

> **You are the Player. Notion is the world. The agent is the System. What you build is yours.**

**[Full guide →](docs/PLAYERS-GUIDE.md)** · **[Commands →](docs/COMMANDS.md)** · **[Troubleshooting →](docs/TROUBLESHOOTING.md)**

## 🚀 Quick start

You need:

- A **Notion account** — the free plan is enough.
- A **paid AI agent plan** — the one thing you pay for. For Claude that means **Pro or Max**.
- An agent that can run **scheduled routines**, if you want your morning briefing to arrive on its own. **A paid plan does not guarantee this** — check before you start. Without it everything still works; you just say *"run my daily briefing"* yourself.

Then pick your agent:

| | Best for | Install |
|---|---|---|
| **[Claude Code](#claude-code)** | Terminal, most tested path | `/plugin marketplace add TechSecWhisperer/ars-infinita-notion` |
| **[Claude desktop app](#claude-desktop-app)** | No terminal | Plugins panel → add the same marketplace |
| **[Codex · Antigravity · other CLIs](#codex-antigravity--other-clis)** | Any Notion-capable agent | `npx @ars-infinita-notion/system-skills install-codex` |

Every path is four steps and ends the same way: you run `/awaken` and the agent builds the rest.

### Claude Code

**First, install Claude Code itself** if you haven't — `curl -fsSL https://claude.ai/install.sh | bash` on macOS, Linux or WSL; `irm https://claude.ai/install.ps1 | iex` in Windows PowerShell. `claude --version` should print a version. Other install routes and system requirements: [Claude Code setup](https://code.claude.com/docs/en/setup).

1. **Make a folder and work from it.** `/awaken` writes `AGENTS.md` and `CLAUDE.md` there so later sessions pick up where you left off. Keep both — see [why two files](docs/TROUBLESHOOTING.md#awaken-finished-but-nothing-works-in-my-next-session).
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

Now [run `/awaken`](#-then-run-awaken).

### Claude desktop app

1. **Connect a folder to your session first.** Create a folder on your computer for The System, then — in the prompt area, before you send anything — use the **Project folder** dropdown to pick it. The desktop app has *no* file access until you do, and `/awaken` writes `AGENTS.md` and `CLAUDE.md` there at the end. Without it, setup finishes looking successful and every later session starts cold.
2. **Duplicate the Seed** into your Notion workspace: **[A.I.N Notion Seed](https://www.notion.so/3a356d8e806b8196855aeb97d1b0a630)** → **Duplicate** → choose your workspace. Keep this link.
3. **Connect Notion.** In the **Code** tab, click the **+** next to the prompt box → **Connectors** → **Notion**, and follow the sign-in flow. Grant access to the workspace holding your Seed copy. (Settings → Connectors is where you *manage* one later, not where you add it.)
4. **Install the commands.** In the **Code** tab, click the **+** next to the prompt box → **Plugins**, add the marketplace `TechSecWhisperer/ars-infinita-notion`, then install **the-system-player** from it. (You can also type the two slash commands from the [Claude Code](#claude-code) path straight into the prompt box.)

Now [run `/awaken`](#-then-run-awaken).

### Codex, Antigravity & other CLIs

1. **Make a folder and work from it.** `/awaken` writes `AGENTS.md` and `CLAUDE.md` there so later sessions pick up where you left off.
   ```sh
   mkdir ~/ars-infinita && cd ~/ars-infinita
   ```
   Your CLI reads `AGENTS.md`, which holds the content. `CLAUDE.md` is a one-line import of it, written so that opening this same folder in Claude Code later still works — keep both.
2. **Duplicate the Seed** into your Notion workspace: **[A.I.N Notion Seed](https://www.notion.so/3a356d8e806b8196855aeb97d1b0a630)** → **Duplicate** → choose your workspace. Keep this link.
3. **Connect Notion.** Add Notion's hosted MCP endpoint `https://mcp.notion.com/mcp` to your CLI's MCP config and complete the OAuth flow, granting access to your Seed copy. Codex: `~/.codex/config.toml`, under `[mcp_servers.notion]`. Antigravity: `~/.gemini/config/`, or `agy mcp add` if your build has it. Your CLI's own docs win over this line.
4. **Install the commands.** No clone needed; Node 18+, no dependencies:
   ```sh
   npx @ars-infinita-notion/system-skills install-codex   # Codex CLI  -> $CODEX_HOME/skills (default ~/.codex/skills)
   npx @ars-infinita-notion/system-skills install-agy     # Antigravity -> ~/.gemini/config/plugins
   ```
   Add `--dry-run` to see every path it would touch. **Codex only:** if you already have a skill named `status`, `log`, `report` or any other command name, `install-codex` stops without writing and prints the clash — re-run with `--force`, which moves yours aside into a backup folder rather than deleting them. `install-agy` writes only inside its own plugin directory, so it never collides — but by the same token it replaces edits you made *inside* that directory on update.

Then **start a new session** so your CLI picks the skills up. `/awaken` will not exist in the shell you installed from.

Now [run `/awaken`](#-then-run-awaken).

## 🎮 Then run `/awaken`

```text
/awaken
```

`/awaken` is the Level-0 tutorial questline — the tutorial *is* the setup. It builds your workspace, writes your Kernel, teaches the loop hands-on, and leaves you at **Level 4** with real XP for the real work. It is idempotent and resumable: if it stalls, run it again. It never double-builds or double-awards.

Stuck? **[Troubleshooting →](docs/TROUBLESHOOTING.md)**

## ⚙️ What you get

- **Track it** — a job link becomes a Quest, with the company logged for research.
- **Appraise it** — your fit scored against your profile, gaps named, talking points pulled.
- **Scout it** — real research on the company, so you walk in informed.
- **Forge it** — a tailored cover letter and CV in *your* voice, with the AI tells stripped out.
- **Run the pipeline** — applications, follow-ups and interview stages tracked, with a nudge before something goes stale.
- **Work your network** — log who you meet, get reminded who's due, prep for events.

Every real action earns XP. XP earns levels. Levels and streaks give you the one thing a job hunt almost never does: the sense that you're getting somewhere.

**[All 26 commands →](docs/COMMANDS.md)**

## 🙋 Questions, bugs, ideas

**[Open an Issue](https://github.com/TechSecWhisperer/ars-infinita-notion/issues/new)** — Issues are **public**, so leave confidential job-search details out. Once installed, `/petition` does it for you: with an authenticated `gh` CLI it files the Issue after showing you the exact text; without one it hands you that text and the link to post yourself. Answers are best-effort: this is a beta run by one Game Admin.

## ⚠️ Status

> 🔧 **In maintenance from 2026-09-09.** Work is under way and you may hit rough edges — a command that behaves oddly, an export that isn't right. **Keep playing:** nothing is disabled, your data is untouched, and nothing you have earned is re-scored. Please report anything that looks wrong with `/petition` or an Issue. We will say here when it lifts.

**Beta.** Open beyond the first small circle and no longer changing shape underneath you. Expect rough edges; report them and they get fixed. New mechanics never rewrite your history and your XP is never re-scored — see the [changelog](CHANGELOG.md).

**Your job-search content never leaves your Notion** — no employer, role, salary, contact or document. The only things that ever go anywhere are game stats you opt into: `/party` shares level, XP, streak and badges with friends you invite, and the same short list goes to the Hunter Registry during your own daily briefing. Every field is toggleable off.

## 📄 License

[MIT](LICENSE) — © 2026 William Moses. The game's sealed mechanics live only in the author's admin workspace; nothing here is withheld from you by licence.

---

*Built with Notion, an AI agent, a headless browser, and pure determination.*
***Ars Infinita Notion (A.I.N)** — an **Ars Infinita** project.*

*P.S. — this world wasn't so much engineered as **vibe coded into existence**: one human with a vision, one AI with infinite patience, and a long night of "okay but what if it also—". No regrets. The System approves. ;)*
