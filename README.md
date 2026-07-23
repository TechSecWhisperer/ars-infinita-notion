# 🌌 Ars Infinita Notion — *A.I.N*
### *"Ai-yn"* · Craft Without Limits.

> Part of **Ars Infinita** — a personal brand for building worlds without limits. **A.I.N** is its Notion-native chapter. *(And yes — the **AI** is right there in the name.)*

**Ars Infinita Notion (A.I.N)** turns the job hunt into a role-playing game you actually want to open. It's a **Notion workspace** driven by an **AI agent** — together they form *the System*: a personal engine that tracks your applications, tailors your materials, researches your targets, manages your network, and turns real-world progress into levels, XP, and unlocks.

The job market is a void of spreadsheets and silence. Ars Infinita imposes order on it — and makes the grind *feel* like progress, because it is.

> **You are the Player. Notion is the world. The agent is the System. What you build is yours.**

---

## ⚙️ How it works

Ars Infinita runs on two things: a **Notion** workspace and an **AI agent** — Claude via the bundled command plugin, or any Notion-connected agent via the plain-text **Runebook**. Notion is the single source of truth; the agent is the interface.

You don't scrape job boards or wrestle a dashboard. You bring a posting — the System does the rest:

1. **Track it** — drop in a job link and it becomes a Quest on your board, with the company logged for research.
2. **Appraise it** — the System scores your fit against your profile, names the gaps, and pulls your talking points.
3. **Scout it** — it researches the company (strategy, recent news, likely stakeholders) so you walk in informed.
4. **Forge it** — it drafts a tailored cover letter in *your* voice, then strips out anything that reads as AI-written.
5. **Run the pipeline** — applications, follow-ups, replies, and interview stages are tracked, with a nudge when something's going stale.
6. **Work your network** — log the people you meet, get reminded who's due for a touch, and prep for events.

Every real action earns XP. XP earns levels. Levels and streaks give you the one thing a job hunt almost never does: the sense that you're getting somewhere.

---

## 🗺️ Your world

Your workspace is a set of linked Notion databases the System reads and writes for you:

- **Quest Board** — every role you're chasing, its stage, and the next move.
- **Status Window & Stat Sheet** — your positioning, and a living map of your competencies with evidence strength.
- **Story Bank** — your best STAR stories, built once and reused for every application and interview.
- **Hunter Network** — your contacts, with follow-up timing handled for you.
- **Gate Intel** — reusable company research.
- **Battle Log · XP Ledger · Achievements · Daily Log** — the record of everything you've done and earned.

---

## 🎮 The System speaks in commands

A slice of the 27 commands you'll actually use — the full reference lives in [Getting Started](#-getting-started) below:

| Command | What it does |
|---|---|
| `/awaken` | Builds your world and teaches the loop — the tutorial *is* the setup. |
| `/quest` | Track a new role, or pick up one you're mid-way through. |
| `/appraise` | Score your fit and surface the gaps. |
| `/scout` | Deep-research a company. |
| `/forge` | Draft a tailored cover letter in your voice. |
| `/engage` | Log a submitted application. |
| `/grind` | See your whole pipeline — what's due, what's going cold. |
| `/status` | Your level, XP, and streak. |
| `/ghost` | Rewrite anything AI-sounding back into how *you* actually talk. |
| `/doctor` | Run diagnostics and self-repair your setup. |

Type a slash command, or just say what you want in plain language — the System understands both.

---

## 🚀 Getting Started

This one repo is everything you need. No other links to chase — install the plugin, duplicate the template, connect Notion, and play.

### Prerequisites

- A **Notion account** (the free plan works fine).
- **Claude** on a Pro or Max plan, using either **Claude Code** (terminal) or the **Claude desktop app** (Cowork). Either works — steps below note where they differ.

### Step 1 — Duplicate the Seed into your own Notion workspace

The "Seed" is the empty A.I.N template: the databases and pages the System reads and writes, with nothing built out yet.

1. Open the Seed page: **[A.I.N Notion Seed](https://www.notion.so/3a356d8e806b8196855aeb97d1b0a630)**
2. Click **Duplicate** in the top-right corner.
3. Choose your own Notion workspace as the destination (create one first if you don't already have one).

That copy is entirely yours — nothing you do in it phones anyone else.

> If the link 404s or asks for access you don't have, don't try to work around it — see **Troubleshooting** below and let the admin know.

### Step 2 — Connect Claude to Notion

The System reads and writes your Notion pages through Notion's own connector (an MCP integration), so Claude needs permission to reach your new workspace.

**Using claude.ai or the Claude desktop app (Cowork):**
1. Go to **Settings → Connectors** (sometimes labeled **Connected apps**).
2. Find **Notion** and click **Connect** — this opens Notion's own authorization flow in your browser.
3. When Notion asks which pages or workspace to share, grant access to the workspace (or at least the page) where you duplicated the Seed in Step 1.

**Using Claude Code (terminal):**
1. Add the Notion MCP server if it isn't already connected — Claude Code will walk you through the same Notion OAuth flow in your browser.
2. Confirm the connection covers the page from Step 1.

You can sanity-check the connection later with `/vitals` (Step 5).

### Step 3 — Add the marketplace and install the plugin

In Claude Code, or the desktop app's plugin panel, run:

```
/plugin marketplace add TechSecWhisperer/ars-infinita-notion
```

Then install the plugin from that marketplace:

```
/plugin install the-system-player@ars-infinita
```

If a plugin-details/confirm view opens, accept it, then run `/reload-plugins` (or restart your session) so the new commands are active.

> **Syntax note:** the `owner/repo` marketplace-add shorthand and the `<plugin-name>@<marketplace-name>` install syntax above are the exact forms in Claude Code's own docs for [discovering and installing plugins](https://code.claude.com/docs/en/discover-plugins). If a future Claude Code version changes this syntax, trust its own `/plugin` help output over this README.

### Step 4 — Run `/awaken`

```
/awaken
```

`/awaken` is the Level-0 tutorial questline — the tutorial *is* the setup. It's idempotent and resumable: if it stalls partway (a missing permission, a dropped connection), just run it again. It never double-builds or double-awards; it picks up exactly where it stopped.

What to expect:
- It checks your Notion connection and confirms it can see the workspace/page from Step 1.
- It builds anything missing and writes your **Kernel** — the config that lets every other command find your pages reliably.
- It teaches the core loop hands-on (tracking a quest, appraising it, and so on) rather than lecturing at you.
- By the time it finishes, you'll be at **Level 4**, holding real XP for the real setup work you just did.

If `/awaken` can't see your Notion workspace, re-check Step 2 before re-running it.

### Step 5 (recommended, desktop) — The browser layer

For company research, reading job postings that need a real browser to render, and the fullest experience, the System drives a headless browser (`agent-browser`) on your machine. `/awaken` checks for it and helps set it up if you're on desktop.

- **With it available**, you get the full experience — live `/scout` research, form-filling, reading protected postings.
- **Without it** (mobile-only, or a session that can't run a local browser), the System degrades gracefully into **mobile-lite mode**: browser-dependent steps are skipped or handled with a lighter fallback, while tracking, appraising, forging, and the whole XP loop keep working fully.

Run `/vitals` any time to see exactly what your current session can and can't do.

### Command reference

All 27 commands, in the plugin's own words:

| Command | What it does |
|---|---|
| `/awaken` | Initialises, repairs, or migrates your instance of The System — the Level-0 tutorial questline that builds the workspace, writes the Kernel, and levels you to 4 by the time setup is done. Idempotent and resumable; also the repair tool for a half-broken workspace. |
| `/quest` | Tracks a new job posting into your Quest Board — creates the quest entry, links/creates a Gate Intel company record, and starts the SLA clock. Also picks an existing quest back up with a fast briefing when you name a role already on the board. |
| `/appraise` | Runs a fit-score and gap analysis for a tracked job against your Status Window/Stat Sheet, pulls talking points, and triggers a company `/scout`. |
| `/scout` | Deep-researches a company (strategy, recent news, culture signal, likely stakeholders) and writes it to the Gate Intel record. |
| `/forge` | Forges a tailored cover letter for a tracked job — drafts from the JD plus your profile and Gate Intel, de-AIs it into your voice, and files it against the quest. |
| `/armor` | Builds your tailored CV for a tracked quest — drafts an editable native-Notion master, runs the mandatory `/ghost` voice pass, then exports a send-ready HTML copy and an editable .docx. |
| `/engage` | Marks a tracked job as applied — moves its stage, sets dates, logs the application to the Battle Log, and awards XP. |
| `/report` | Logs an inbound reply on a tracked application — updates the stage and activity clock, archives the message, and sets the next action. |
| `/respawn` | Attempts to revive an application marked "Closed – No Response" with a fresh angle. |
| `/raid` | Builds a full assault playbook on a high-priority tracked job — referral routing, a hiring-manager note draft, and a value-memo plan. |
| `/grind` | Scans your whole Quest Board pipeline for what needs attention — follow-ups due, quests going stale, open next actions. Read-only. |
| `/log` | Archives a message you sent to someone (recruiter, hiring manager, contact) into the Battle Log and updates last-contacted tracking. |
| `/gather` | Logs a networking event you're attending and preps attendee intel and talking points ahead of time. |
| `/recruit` | Logs new people you met (usually at an event) into Hunter Network, researches each from public sources, and drafts personalised follow-ups on a schedule. |
| `/touch` | Scans Hunter Network for contacts overdue for a follow-up and suggests a reason to reach out. Read-only. |
| `/intake` | Runs or updates your intake interview to build the Status Window — the profile every tailored CV, talking point, and fit score is generated from. |
| `/ghost` | Rewrites AI-sounding text (a draft email, cover letter, LinkedIn message, CV bullet) into your real voice. |
| `/status` | Reports your current player state — level, XP, streak, active debuffs, and recent unlocks. Read-only. |
| `/levelup` | Runs your weekly review ritual — pipeline check, archive stats, a lint pass over the wiki for contradictions, and logged enhancement suggestions. |
| `/theme` | Re-skins The System's titles/labels between the hidden game theme and a plain Professional theme — cosmetic only. |
| `/party` | Requests a shared Party Board for you and friends also running The System — a group dashboard of game stats only (level, XP, streak, badges). Never shares job-search content. |
| `/vitals` | Probes what your session can actually do — Notion connector reachability, browser presence and health, and more — and reports a capability profile. Read-only. |
| `/doctor` | Diagnoses and repairs your instance — a battery of PASS/WARN/FAIL checks, fixing local problems via the `/awaken` repair path and escalating remote ones via `/petition`. |
| `/patch` | Logs a correction to how The System should operate as a standing rule, so every future session follows it automatically — also how you instantly pause a feature that's causing more harm than good. |
| `/petition` | Sends a question, enhancement idea, bug report, or appeal to the Game Admin. |
| `/browse` | Drives a live web page with the browser layer — health-check, open, snapshot, click, fill — for tasks that need real browser rendering. |
| `/handover` | Hidden route: banks a compact, pointer-only handoff note so your next session picks up where this one left off. Never stores game state or board data — a 24-hour bookmark only. |

### Updating

New mechanics arrive two ways:
- A **Patch Feed** entry appears in your Notion workspace describing what changed and why.
- You pull the plugin update in Claude Code with `/plugin update` (or via the plugin manager's update check).

The promise that makes this safe to keep running: **new mechanics never rewrite your history, and your XP is never re-scored.** What you've already earned, you keep — updates add to the game going forward, they don't retroactively change what happened.

### Troubleshooting

- **Plugin failed to install.** Update Claude Code to the latest version and try again — plugin marketplace support needs a recent release.
- **`/awaken` can't see my Notion workspace.** Almost always a connector problem: go back to Step 2 and confirm the Notion connection is authorized, and that the *specific page* you duplicated the Seed into is shared with that connection (Notion scopes access per-page/per-workspace, not automatically to everything).
- **The Seed link asks for access / shows a 404.** The Seed page has to be shared publicly by the admin — this isn't something you can fix on your end. Use `/petition` if you already have the plugin installed, or otherwise tell the admin directly.
- **Something else feels broken.** Run `/doctor` first — a full diagnostic pass that self-repairs anything local. Run `/vitals` to see exactly what your session can and can't do (useful for browser- or connector-shaped issues). For anything else — a question, a bug, an idea — `/petition`.

---

## 📡 A living System

Ars Infinita improves over time, and your instance keeps itself current. New mechanics **never rewrite your history** and your XP is **never re-scored** — what you earned, you keep. Whether you're on desktop or mobile, your world stays in sync with the current rules.

---

## ⚠️ Status

This is an **early alpha**, shared with a small circle while it stabilizes — not an officially released product. Expect rough edges; that's what alpha is for. Your data lives in *your* Notion and never leaves it.

*License: to be set by the author. For now, treat this as personal-use, by invitation — not for redistribution.*

---

*Built with Notion, an AI agent, a headless browser, and pure determination.*
***Ars Infinita Notion (A.I.N)** — an **Ars Infinita** project. Status: Alpha — the System is stabilizing.*
