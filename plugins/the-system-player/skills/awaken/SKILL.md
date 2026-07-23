---
name: awaken
description: Initialises, repairs, or migrates the player's instance of The System — the Level-0 tutorial questline that builds the workspace, writes the Kernel, and levels the player to 4 by the time setup is done. Use when the player says "/awaken", "arise", "set up The System", "initialise my system", "my workspace is broken — fix it", or when a Migration-required patch directs a re-run. Idempotent and resumable — re-running never double-builds or double-awards; it picks up wherever the last run stopped. This is also the repair tool for a half-broken workspace.
---

# /awaken — the Awakening

Read `references/boot-card.md` for universal rules and `references/template-schemas.md` for the canonical database schemas. This command is the ONE exception to "the Kernel already exists" — /awaken is what writes it.

The player starts at **Level 0** (a level that exists only during awakening). Every build milestone is a quest that awards XP. By completion the player has legitimately earned **exactly 500 XP → Level 4**, one level below the L5 Job Change Trial.

## Explain before you ask (informed consent)

Setup asks the player to connect and allow several things. Before each one, give a one-line plain-language **why** — a new player is trusting an agent with their workspace, so never let them click "allow" blind. As each comes up:

- **Connecting Notion + granting page access** — "so I can build and run your game board inside your own workspace. I only touch the pages you grant me, and your job-search data never leaves your workspace — not even to the Game Admin."
- **Installing the Player Edition plugin** — "optional convenience: it turns the commands into /slash shortcuts. The Runebook does the same job without it, so skip it if you'd rather."
- **Installing agent-browser + letting it drive a browser** — "so the commands that read live job postings or submit web forms can actually open a page for you. It only controls a browser when you run one of those commands, on your behalf."
- **Scheduled tasks (daily briefing / weekly review)** — "so your morning briefing and Friday review run on their own. Totally optional — decline now or turn them off anytime."
- **Anything you mark confidential** — "stays in your workspace, and a hard rule keeps it out of anything employer-facing, forever."

Keep each to a sentence. The player should always know what they're allowing, and why, before they allow it.

## Hard properties (never violate)

- **Idempotent, ledger-keyed.** Before ANY milestone award, query the XP Ledger for an existing row with that exact ledger key ("Awakening: …"). Row exists → milestone already done; skip both the work-check and the award, move on. This is what makes /awaken safe to re-run and what makes it the repair/migration tool.
- **Milestone XP replaces standard XP.** During awakening, never also award the standard amount for the same act (milestone 3 subsumes /intake's +100; milestone 4 subsumes /quest's +10). One ledger row per milestone, Category: `Awakening`.
- **One question at a time** (Interrogation Protocol) for anything you must ask.
- Announce each milestone System-style, and run the level-up ceremony lines at L2, L3, L4 — awakening is designed to have several level-up moments. If a patch has staged 🔒 SEALED entries at a level just cleared, unsealing is part of the ceremony.

## Step 0 — locate or demand the template

Search the player's Notion for "The System — Job Search HQ" and a "🧬 Kernel" page.

- **Nothing found:** the player hasn't duplicated the Player Template. Tell them: get the Seed link from the Game Admin, open the Player Template, hit **Duplicate** into their own workspace, then say /awaken again. Do not attempt to build the entire workspace from scratch if the template is available — duplication is faster and canonical.
- **Template found (fresh duplicate or partial/broken instance):** proceed. /awaken inspects what exists and builds only what's missing.

## Step 1 — inventory & repair (Milestone 1)

Check each entity in `references/template-schemas.md` exists and matches schema: Hub, Operating Manual, Status Window, Guild Hall, Patch Notes, Theme Registry, Kernel (pages) · Quest Board, Hunter Network, Battle Log, Gate Intel, Story Bank, Competency Matrix, XP Ledger, 🗒 Agent Notes, Daily Log, Networking Events, Achievements, Questions & Feedback Log, 📅 System Calendar (databases).

- Missing database → create it per the reference schema (relations wired per the dependency order there). Missing page → recreate its skeleton per the reference.
- **📅 System Calendar is a delivery/record channel, not a source of truth** — it holds dated rows (briefings, reminders, due follow-ups, events) so the player has a calendar view of what's coming up; the Daily Log and Quest Board remain authoritative for anything also written here. Idempotent: if a player's duplicate already has it, verify schema and leave it alone; if missing, create it fresh and register its IDs on the Kernel like every other entity.
- Never delete or rename anything that exists; never touch rows that carry player data.

**Milestone 1 — ledger key "Awakening: The System comes online" · +100 XP · ⚔️ LEVEL 2 ceremony.**

## Step 2 — inscribe the Kernel (Milestone 2)

Fill the 🧬 Kernel page:

1. **Instance ID table** — every entity above: page ID + data source ID, discovered from the player's own workspace.
2. **Player section** — interrogate one question at a time, only for what's missing: preferred name · email · timezone (compute all future dates/SLAs in it) · anything they want marked confidential from employers (bank it here and in the Status Window; hard rule 4 protects it forever).
3. **Versions** — Seed version (from the Seed page), **Mechanics Version = current Patch Feed head** (a fresh awakening always builds at feed-head; late joiners are never behind), last Sigil Check = today.
4. **Nexus links** — ask the player for their Seed link (the one the Game Admin sent); copy the Patch Feed, Rule Manifest, and Petition form links from it into the Kernel.
5. **Sharing toggles** — default all yes; tell the player in one line what the heartbeat shares (handle, level, XP, streak, versions, last-active — game stats only, each toggleable off, never job-search content) and honour any "no".

**Milestone 2 — ledger key "Awakening: Kernel inscribed" · +50 XP.**

## Step 3 — the Status Window (Milestone 3)

Run the /intake interview (its own skill; interrogation rules apply; it may take more than one sitting — the milestone lands when the Status Window is genuinely initialised, not skeletal). Update the Player Card as XP accrues.

**Milestone 3 — ledger key "Awakening: Status Window forged" · +100 XP · ⚔️ LEVEL 3 ceremony.** (Subsumes /intake's +100 — never both.)

## Step 4 — first gate (Milestone 4)

Have the player bring a real job posting; run /quest on it. **Milestone 4 — "Awakening: First gate opened" · +50 XP.** (Subsumes /quest's +10.)

## Step 5 — first appraisal (Milestone 5)

Run /appraise on that quest. **Milestone 5 — "Awakening: First appraisal complete" · +75 XP.**

## Step 6 — first day logged (Milestone 6)

Write the player's first Daily Log entry (today, domains touched, mood if offered, `Welcome # Delivered` = 1). **Milestone 6 — "Awakening: First day logged" · +50 XP.**

## Step 6.5 — set up your daily rhythm

Before the finale, make the daily-briefing promise actually real — don't just offer it and leave the player unscheduled.

1. **Probe for scheduled-task tools** (e.g. via `ToolSearch` for `create_trigger` / a scheduled-task or cron-trigger tool — on Cowork and Claude Code sessions these are usually available; a plain claude.ai chat or mobile session usually won't have them).
2. **If available:**
   - **List existing scheduled tasks first.** If one already named "Daily Quest Briefing" exists, skip creation entirely — idempotent, never a duplicate.
   - Otherwise, offer (never impose) to create **one** scheduled task: **"Daily Quest Briefing"**, weekdays at roughly the player's local 8am. Compute the cron in UTC from the Kernel's Player timezone — if the UTC conversion crosses midnight, shift the day-of-week field accordingly so it still lands on the player's weekday morning, not the wrong day in UTC.
   - The scheduled prompt must be **self-contained** (each firing starts a fresh session with no memory of this one): boot from the player's own 🧬 Kernel (resolve the Boot Card/Kernel page IDs from there, same as any other session), run the daily briefing duties per the live `KERNEL:Operating Manual`, write today's Daily Log entry, add a 📅 System Calendar row (`Type: Daily Briefing`), and close with a concise briefing summary.
   - Recommend the player turn on notifications for it, so the briefing actually reaches them instead of sitting unread.
3. **If scheduled-task tools are NOT available** (app-only / mobile-only session): degrade gracefully, don't fail silently.
   - Tell the player plainly, in one short line: their daily rhythm is manual here — open the app each weekday morning and say "run my daily briefing."
   - Log an Open Question in the player's System Log (Type: Open Question, Area: Agent Behaviour) noting that scheduled-task setup was skipped on this surface, so a later `/doctor` run on a capable surface can revisit it.

No XP — this is plumbing, not a milestone. (Friday `/levelup` can be scheduled the same way, on request, using the same probe/idempotency pattern above — this step's mandate is the Daily Quest Briefing specifically.)

## Step 7 — register the Hunter (Milestone 7)

1. Ask the player to choose a **handle** (self-chosen alias; real name optional and off by default).
2. Submit it via the Petition form (link in the Kernel): title "HANDLE REGISTRATION: <handle>", Category: Other, with Seed version and current level. If the form is unreachable, draft the registration text for the player to send to the Game Admin directly. Handles are admin-registered (no duplicates) — tell the player the Game Admin may come back with a conflict, and the registration stands once confirmed.
3. Record handle + registration date in the Kernel.

**Milestone 7 — ledger key "Awakening: Hunter registered" · +75 XP · ⚔️ LEVEL 4 ceremony — the Awakening is complete.**

Close with: total 500 XP banked, Level 4, D-Rank; the L5 Job Change Trial waits at 1,000 XP — their first real quests carry them toward class territory. The System is awake.

## Step 7.5 — seat the local desktop context (CLAUDE.md, if this session can write files)

If this session can write local files (a Claude Code desktop session, not app-only — check via `/vitals`), write a thin **`CLAUDE.md`** into the player's Claude Code project context so a fresh desktop session boots The System without being told how. This file is a **bootstrap pointer, not a second source of truth** — the 🧬 Kernel in Notion remains authoritative; `CLAUDE.md` only says how to find and follow it. Keep it short:

```
# The System — Claude Code context

This project runs "The System" — a gamified job-search tracker living in Notion.
SOURCE OF TRUTH is the 🧬 Kernel page in Notion, never this file. This file only bootstraps a session.

On session start:
1. Ensure the Notion connector is available (run /vitals).
2. Read the 🧬 Kernel page (search "Kernel" inside "The System — Job Search HQ") for instance IDs, player facts, versions, and Nexus links; follow the boot ritual.
3. Run the command asked for — /status, /grind, /quest, /forge, /doctor, … (the installed the-system-player plugin).
Never cache IDs in this file; always resolve them from the Kernel. If the Kernel is missing or empty, run /awaken.
```

Regenerate this file on a **Migration-required** re-run (its contents are version-agnostic, but re-writing keeps it present if the workspace moved). If the session is app-only, skip silently and note in the close that desktop sessions get a CLAUDE.md. No XP — this is plumbing, not a milestone.

## Step 7.6 — set up the browser (agent-browser, optional but recommended)

Browser-required commands (`/scout`, a live/JS-heavy `/quest`, the research half of `/recruit` & `/gather`, form submissions) need **agent-browser** (the vercel-labs browser CLI — see the boot-card "Using agent-browser"). Probe and offer to set it up:
- `agent-browser doctor --json` → healthy → record "agent-browser: ready" on the Kernel's capability line.
- Not installed → explain why first ("browser commands like /scout and live /quest need it, and it drives a browser on your behalf only when you run those"), then offer the player their preferred install path from the vercel-labs repo — **npm** (`npm install -g agent-browser`), **Homebrew** on macOS (`brew install agent-browser`), or **Cargo** (`cargo install agent-browser`) — followed by `agent-browser install` (downloads Chrome for Testing on first run). If the player can't/won't now, that's fine — record "agent-browser: not installed (universal commands only)"; those commands degrade with the paste-the-text fallback until it's set up.
- Broken → `agent-browser doctor --fix`.

Record the outcome on the Kernel so `/vitals` and capability-gating reflect it. No XP — plumbing, not a milestone. App-only session → skip and note that browser setup happens on their desktop.

## Migration mode

When a Patch Feed entry marked **Migration-required** directs a re-run: run steps 1–2 only (inventory, schema changes described in the patch applied idempotently, Kernel version bump), then re-run Step 6.5 (daily rhythm probe — idempotent, so it only fills in a missing schedule), Step 7.5 (CLAUDE.md), and Step 7.6 (agent-browser probe) if this session can. Milestones already earned stay earned — the ledger keys see to that. Never re-run intake or re-ask settled questions during a migration.
