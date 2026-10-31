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

- **Built for end-to-end play** — install through the Seed, run `/awaken`, hunt, earn XP,
  and level up. Distribution and source versions can differ while a release is being
  delivered; use the live release links below when choosing an install path.
- **One source of truth for game rules** — the Patch Feed, Rule Manifest and this repo's
  `feed.json` describe the current source rules. A matching version in source does not
  mean every package or marketplace has delivered it yet.
- **Petitions get a validated receipt** — any substantive reply must be grounded in
  published documentation; nothing quotes private player data or unpublished decisions.
- **Bumps may be bumpy** — the version is 2.x, the game is young. Report what breaks;
  verified fixes and shipped changes are recorded in the release notes.

> Part of **Ars Infinita** — a personal brand for building worlds without limits. **A.I.N** is its Notion-native chapter. *(And yes — the **AI** is right there in the name.)*

**Your job hunt as an RPG, inside your own Notion workspace.** You bring a job link; an AI agent tracks it, scores your fit, researches the company, drafts your materials in your voice, and turns real progress into XP and levels.

**Release availability:** the mechanics badge at the top follows the repository's
`feed.json` source on `main`, so it can move before package publication finishes. Check
the [published GitHub Releases](https://github.com/TechSecWhisperer/ars-infinita-notion/releases)
and the [npm package](https://www.npmjs.com/package/@ars-infinita-notion/system-skills)
for delivered versions. They are separate destinations and can differ during delivery.
Codex installs use this repository's marketplace at a chosen release tag; that source
is not a listing in the universal public Plugins Directory.

Before using npm, run `npm view @ars-infinita-notion/system-skills version` to check
the current registry version. A source version or draft release alone does not prove
that the package has been published.

The job market is a void of spreadsheets and silence. A.I.N imposes order on it — and makes the grind *feel* like progress, because it is.

> **You are the Player. Notion is the world. The agent is the System. What you build is yours.**

**[Full guide →](docs/PLAYERS-GUIDE.md)** · **[Commands →](docs/COMMANDS.md)** · **[Troubleshooting →](docs/TROUBLESHOOTING.md)**

## 🚀 Quick start

You need:

- A **Notion account** — the free plan is enough.
- An AI host that supports one of the installation routes below. Account and plan
  requirements vary by host; check its current setup documentation.
- **Node.js 18+** if you use the npx-installed skills route.
- An agent that can run **scheduled routines**, if you want your morning briefing to arrive on its own. **A paid plan does not guarantee this** — check before you start. Without it everything still works; you just say *"run my daily briefing"* yourself.

Then pick your agent:

| Installation route | Supported hosts | Start here |
|---|---|---|
| **[Plugin-supported hosts](#plugin-supported-hosts)** | Claude Code, Claude desktop, Codex | Install the plugin from its marketplace source. |
| **[npx-installed skills](#npx-installed-skills)** | Antigravity; Codex standalone-skills fallback | Install the packaged skills with the matching command. |

Each setup ends the same way: start a fresh session, verify the Notion connection with `/vitals`, then run `/awaken`.

### Plugin-supported hosts

#### Claude Code

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

#### Claude desktop app

1. **Set your project directory.** In the prompt area, pick or create a project folder in the **Project folder** dropdown. If you skip this, `/awaken` prompts you for a folder path during setup.
2. **Duplicate the Seed** into your Notion workspace: open the **[A.I.N Notion Seed](https://www.notion.so/3a356d8e806b8196855aeb97d1b0a630)** while signed into Notion → **Duplicate** → choose your workspace. *(If logged out, click "Sign up or login" first; Notion displays "Duplicate" once signed in).* Keep this link.
3. **Connect Notion.** In the **Code** tab, click the **+** next to the prompt box → **Connectors** → **Notion**, and follow the sign-in flow. Grant access to the workspace holding your Seed copy. (Settings → Connectors is where you *manage* one later, not where you add it.)
4. **Install the commands.** In the **Code** tab, click the **+** next to the prompt box → **Plugins**, add the marketplace `TechSecWhisperer/ars-infinita-notion`, then install **the-system-player** from it. (You can also type the two slash commands from the [Claude Code](#claude-code) path straight into the prompt box.)

Now [run `/awaken`](#-then-run-awaken).

#### Codex

Codex can install the repository marketplace package when it is included in a published release:

```sh
codex plugin marketplace add TechSecWhisperer/ars-infinita-notion --ref <release-tag>
codex plugin add the-system-player@ars-infinita-notion
```

Before using it, open your project directory and duplicate the [A.I.N Notion Seed](https://www.notion.so/3a356d8e806b8196855aeb97d1b0a630) into your workspace. Connect Notion to Codex with OAuth. Adding a missing server starts the OAuth flow immediately:

```sh
codex mcp add notion --url https://mcp.notion.com/mcp
codex mcp list
```

Complete the browser sign-in and grant access to the workspace holding your Seed copy. If the Notion server is already configured but not logged in, use this path instead:

```sh
codex mcp login notion
codex mcp list
```

Start a fresh Codex session, verify the plugin with `codex plugin list`, run `/vitals`, then `/awaken`.

This is a repository marketplace source, not a listing in the universal public Plugins Directory. Choose a tag from the [published GitHub Releases](https://github.com/TechSecWhisperer/ars-infinita-notion/releases). See [OpenAI's plugin and marketplace guide](https://developers.openai.com/plugins/build/plugins) for current Codex marketplace behavior.

`codex plugin marketplace upgrade ars-infinita-notion` refreshes the configured
marketplace at its existing Git ref; it does not select a different release tag. To
move to a newer release, remove the current plugin and marketplace source, then add the
new tag and reinstall:

```sh
codex plugin remove the-system-player@ars-infinita-notion
codex plugin marketplace remove ars-infinita-notion
codex plugin marketplace add TechSecWhisperer/ars-infinita-notion --ref <new-release-tag>
codex plugin add the-system-player@ars-infinita-notion
codex plugin list
```

See [OpenAI's plugin and marketplace guide](https://developers.openai.com/plugins/build/plugins) for current plugin commands.

### npx-installed skills

1. **Set your project directory.** Open Antigravity or Codex in your project directory (`mkdir ~/ars-infinita && cd ~/ars-infinita`). If you skip this, `/awaken` prompts you for a folder path and builds it for you.
   ```sh
   mkdir ~/ars-infinita && cd ~/ars-infinita
   ```
   Your CLI reads `AGENTS.md`. Keep both `AGENTS.md` and `CLAUDE.md` that `/awaken` generates.
2. **Duplicate the Seed** into your Notion workspace: open the **[A.I.N Notion Seed](https://www.notion.so/3a356d8e806b8196855aeb97d1b0a630)** while signed into Notion → **Duplicate** → choose your workspace. *(If logged out, click "Sign up or login" first; Notion displays "Duplicate" once signed in).* Keep this link.
3. **Connect Notion.** Add Notion's hosted MCP endpoint `https://mcp.notion.com/mcp` and complete OAuth sign-in, granting access to your Seed copy. For Codex, `codex mcp add notion --url https://mcp.notion.com/mcp` starts OAuth when the entry is missing; if it is already configured but not logged in, run `codex mcp login notion`. Check `codex mcp list` after either path. For Antigravity, add a Notion server to its MCP configuration file using the documented `serverUrl` field, then complete the OAuth prompt. See [Notion's current client setup guide](https://developers.notion.com/guides/mcp/get-started-with-mcp) for both hosts and their current steps.
4. **Install the skills.** No clone needed; Node 18+, no dependencies:
   ```sh
   npx @ars-infinita-notion/system-skills install-agy    # Antigravity -> ~/.gemini/config/plugins
   npx @ars-infinita-notion/system-skills install-codex  # optional Codex standalone-skills fallback -> $CODEX_HOME/skills
   ```
   Add `--dry-run` to see every path it would touch. **Codex only:** if you already have a skill named `status`, `log`, `report` or any other command name, `install-codex` stops without writing and prints the clash — re-run with `--force`, which moves yours aside into a backup folder rather than deleting them. `install-agy` writes only inside its own plugin directory, so it never collides — but by the same token it replaces edits you made *inside* that directory on update.

Then **start a new session** so your host picks the skills up. Run `/vitals` to confirm Notion is connected, then `/awaken` to set up. The Codex standalone-skills install is a fallback when you want skills in `$CODEX_HOME/skills` instead of the repository plugin.

To update standalone skills, check `npm view @ars-infinita-notion/system-skills version` and re-run the matching `npx` installer. The package does not provide a standalone-skill uninstall command. For Antigravity, the package-owned install path is `~/.gemini/config/plugins/the-system-player/`; preserve any files you added there, then remove that directory if you want to uninstall. For Codex standalone skills, inspect `$CODEX_HOME/.ars-infinita-install.json`, preserve any edits you made, and remove only the listed A.I.N skill directories and that manifest. Do not remove the shared skills folder. The Codex repository plugin has separate, supported `codex plugin remove` and marketplace-removal commands above.

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

**Your Notion workspace is the source of truth.** When you ask an AI assistant to appraise a role, research an employer, or draft application material from your workspace, the relevant content may be processed by the provider configured for that assistant; check that provider’s data-handling terms. Some commands also create downloadable documents, such as a tailored CV or cover letter, outside Notion. You choose where to save or share those files. The plugin does not send applications or messages on your behalf. Optional `/party` and Hunter Registry features share only the listed game stats you enable, and each field can be turned off.

## Update or remove an installation

- **Claude Code / Claude desktop Code tab:** use the Installed tab in `/plugin` to update or uninstall **the-system-player**. From a terminal, `claude plugin update the-system-player@ars-infinita-notion` updates it and `claude plugin uninstall the-system-player@ars-infinita-notion` removes it. To remove the marketplace and its installed plugins, use `claude plugin marketplace remove ars-infinita-notion`. See [Claude Code's plugin management guide](https://code.claude.com/docs/en/plugins/install).
- **Codex repository plugin:** use the tag-specific remove and re-add sequence in [Plugin-supported hosts → Codex](#codex). The `marketplace upgrade` command refreshes the currently configured ref; it does not select a newer tag. To uninstall without replacing it, remove the plugin with `codex plugin remove the-system-player@ars-infinita-notion`, then remove the source with `codex plugin marketplace remove ars-infinita-notion`. See [OpenAI's plugin and marketplace guide](https://developers.openai.com/plugins/build/plugins).
- **Antigravity / Codex standalone skills:** update by re-running the matching `npx @ars-infinita-notion/system-skills install-agy` or `install-codex` command. The npm package has no standalone-skill uninstaller. Antigravity's package-owned directory is `~/.gemini/config/plugins/the-system-player/`; preserve any files you added there before removing that directory. For Codex standalone skills, inspect `$CODEX_HOME/.ars-infinita-install.json`, preserve edits you made, and remove only the listed A.I.N skill directories and that manifest. Do not remove the shared skills folder.

## 📄 License

[MIT](LICENSE) — © 2026 Ars Infinita Contributors.

---

*Built with Notion, an AI agent, a headless browser, and pure determination.*
***Ars Infinita Notion (A.I.N)** — an **Ars Infinita** project.*

*P.S. — this world wasn't so much engineered as **vibe coded into existence**: one human with a vision, one AI with infinite patience, and a long night of "okay but what if it also—". No regrets. The System approves. ;)*
