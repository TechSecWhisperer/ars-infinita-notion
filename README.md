# 🌌 Ars Infinita Notion — *A.I.N*
### *"Ai-yn"* · Craft Without Limits.

![Mechanics](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FTechSecWhisperer%2Fars-infinita-notion%2Fmain%2Ffeed.json&query=%24.mechanics_version&label=mechanics&prefix=v&color=8A2BE2)
![Commands](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FTechSecWhisperer%2Fars-infinita-notion%2Fmain%2Ffeed.json&query=%24.commands_count&label=commands&color=2F9E44)
![License](https://img.shields.io/badge/license-MIT-blue)
![Status](https://img.shields.io/badge/status-BETA%20ACTIVE-8A2BE2)

## 🧪 Beta is live

**The System is in open beta.** Players can install, awaken, and play today — and the
petition channel returns a one-time receipt when a public issue is opened. A receipt
confirms delivery; it is not a review, decision, or promise that every request will
receive a substantive answer. What beta means in practice:

- **Working end to end** — install through the Seed, run `/awaken`, hunt, earn XP, level up.
- **The rules you see are the rules that run** — the Patch Feed, Rule Manifest and this
  repo's `feed.json` are checked against each other automatically; a release that breaks
  lockstep does not ship.
- **Petitions get a validated receipt** — any substantive reply must be grounded in
  published documentation; nothing quotes private player data or unpublished decisions.
- **Bumps may be bumpy** — the version is 2.x, the game is young. Report what breaks;
  verified fixes and shipped changes are recorded in the release notes.

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
| **[Codex · Antigravity · other CLIs](#codex-antigravity--other-clis)** | Any Notion-capable agent | `npx @ars-infinita-notion/system-skills install-codex` / `install-agy` |

Every path is four steps and ends the same way: you run `/awaken` and the agent builds the rest.

### Claude Code

**First, install Claude Code itself** if you haven't — `curl -fsSL https://claude.ai/install.sh | bash` on macOS, Linux or WSL; `irm https://claude.ai/install.ps1 | iex` in Windows PowerShell. `claude --version` should print a version. Other install routes and system requirements: [Claude Code setup](https://code.claude.com/docs/en/setup).

1. **Set your project directory.** Open Claude Code in your project directory (`mkdir ~/ars-infinita && cd ~/ars-infinita`). If you skip this, `/awaken` asks where your project should live and creates it automatically. Keep both `AGENTS.md` and `CLAUDE.md` that `/awaken` generates.
   ```sh
   mkdir ~/ars-infinita && cd ~/ars-infinita
   ```
2. **Duplicate the Seed** — the empty A.I.N template — into your Notion workspace: open the **[A.I.N Notion Seed](https://www.notion.so/3a356d8e806b8196855aeb97d1b0a630)** while signed into Notion → **Duplicate** (top right) → choose your workspace. *(If logged out, click "Sign up or login" first; Notion displays "Duplicate" once signed in).* Keep this link; `/awaken` may ask for it.
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

1. **Set your project directory.** In the prompt area, pick or create a project folder in the **Project folder** dropdown. If you skip this, `/awaken` prompts you for a folder path during setup.
2. **Duplicate the Seed** into your Notion workspace: open the **[A.I.N Notion Seed](https://www.notion.so/3a356d8e806b8196855aeb97d1b0a630)** while signed into Notion → **Duplicate** → choose your workspace. *(If logged out, click "Sign up or login" first; Notion displays "Duplicate" once signed in).* Keep this link.
3. **Connect Notion.** In the **Code** tab, click the **+** next to the prompt box → **Connectors** → **Notion**, and follow the sign-in flow. Grant access to the workspace holding your Seed copy. (Settings → Connectors is where you *manage* one later, not where you add it.)
4. **Install the commands.** In the **Code** tab, click the **+** next to the prompt box → **Plugins**, add the marketplace `TechSecWhisperer/ars-infinita-notion`, then install **the-system-player** from it. (You can also type the two slash commands from the [Claude Code](#claude-code) path straight into the prompt box.)

Now [run `/awaken`](#-then-run-awaken).

### Codex, Antigravity & other CLIs

1. **Set your project directory.** Open your CLI in your project directory (`mkdir ~/ars-infinita && cd ~/ars-infinita`). If you skip this, `/awaken` prompts you for a folder path and builds it for you.
   ```sh
   mkdir ~/ars-infinita && cd ~/ars-infinita
   ```
   Your CLI reads `AGENTS.md`. Keep both `AGENTS.md` and `CLAUDE.md` that `/awaken` generates.
2. **Duplicate the Seed** into your Notion workspace: open the **[A.I.N Notion Seed](https://www.notion.so/3a356d8e806b8196855aeb97d1b0a630)** while signed into Notion → **Duplicate** → choose your workspace. *(If logged out, click "Sign up or login" first; Notion displays "Duplicate" once signed in).* Keep this link.
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

`/awaken` is the Level-0 tutorial questline — the tutorial *is* the setup. It builds your workspace, writes your Kernel, teaches the loop hands-on, and leaves you at **Level 4** with real XP for the real work. If your session has no project folder yet, it asks you one question — where your project should live — and builds the folder itself; you never have to create one by hand. It is idempotent and resumable: if it stalls, run it again. It never double-builds or double-awards.

Stuck? **[Troubleshooting →](docs/TROUBLESHOOTING.md)**

## ⚙️ What you get

- **Track it** — a job link becomes a Quest, with the company logged for research.
- **Appraise it** — your fit scored against your profile, gaps named, talking points pulled.
- **Scout it** — real research on the company, so you walk in informed.
- **Forge it** — a tailored cover letter and CV in *your* voice, with the AI tells stripped out.
- **Run the pipeline** — applications, follow-ups and interview stages tracked, with a nudge before something goes stale.
- **Work your network** — log who you meet, get reminded who's due, prep for events.
- **Multi-surface visuals** — Desktop apps (Claude Desktop, Antigravity IDE) render native interactive visual widgets (XP radars, spider charts, pipeline funnels), while terminal CLIs receive clean, distraction-free Unicode ASCII art.

Every real action earns XP. XP earns levels. Levels and streaks give you the one thing a job hunt almost never does: the sense that you're getting somewhere.

**[All 27 commands →](docs/COMMANDS.md)** *(plus the hidden `/handover` session state bookmark, totaling 28 installed skills)*

## 🙋 Questions, bugs, ideas

File petitions as public **[GitHub Issues](https://github.com/TechSecWhisperer/ars-infinita-notion/issues/new)**, or run `/petition` with an authenticated `gh` CLI. Keep confidential job-search details and personal or security-sensitive information out of the issue.

Verified answers and shipped outcomes are best-effort. Updates appear on the issue
or in the next patch notes. The automatic issue receipt does not mean the request
has been reviewed or accepted.

## ⚠️ Status

> 🧪 **Beta — open and active.** Expect rough edges and report what breaks. An automatic receipt confirms that a report arrived; it does not promise review or resolution. Verified fixes and updates appear in the release notes when they are ready. **Keep playing:** nothing is disabled, your data is untouched, and nothing you have earned is re-scored. New mechanics never rewrite your history and your XP is never re-scored — see the [changelog](CHANGELOG.md).

**Your job-search content never leaves your Notion** — no employer, role, salary, contact or document. The only things that ever go anywhere are game stats you opt into: `/party` shares level, XP, streak and badges with friends you invite, and the same short list goes to the Hunter Registry during your own daily briefing. Every field is toggleable off.

## 📄 License

[MIT](LICENSE) — © 2026 Ars Infinita Contributors.

---

*Built with Notion, an AI agent, a headless browser, and pure determination.*
***Ars Infinita Notion (A.I.N)** — an **Ars Infinita** project.*

*P.S. — this world wasn't so much engineered as **vibe coded into existence**: one human with a vision, one AI with infinite patience, and a long night of "okay but what if it also—". No regrets. The System approves. ;)*
