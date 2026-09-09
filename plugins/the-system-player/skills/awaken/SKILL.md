---
name: awaken
description: Initialises, repairs, or migrates the player's instance of The System — the Level-0 tutorial questline that builds the workspace, writes the Kernel, and levels the player to 4 by the time setup is done. Use when the player says "/awaken", "arise", "set up The System", "initialise my system", "my workspace is broken — fix it", or when a Migration-required patch directs a re-run. Idempotent and resumable — re-running never double-builds or double-awards; it picks up wherever the last run stopped. This is also the repair tool for a half-broken workspace.
---

# /awaken — the Awakening

Read the shared boot card `${CLAUDE_SKILL_DIR}/../../references/boot-card.md` for universal rules and `references/template-schemas.md` for the canonical database schemas. This command is the ONE exception to "the Kernel already exists" — /awaken is what writes it.

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
- **The theme question is a gate, not a preference.** Setup does not proceed past Step 0.5 until the player has actually answered it. There is no default theme and no silent fallback — an unanswered theme question fails setup and re-asks.
- Announce each milestone System-style, and run the level-up ceremony lines at L2, L3, L4 — awakening is designed to have several level-up moments. If a patch has staged 🔒 SEALED entries at a level just cleared, unsealing is part of the ceremony.

## Step 0 — locate or demand the template

Search the player's Notion for "The System — Job Search HQ" and a "🧬 Kernel" page.

- **Nothing found:** the player hasn't duplicated the Player Template. Tell them: get the Seed link from the Game Admin, open the Player Template, hit **Duplicate** into their own workspace, then say /awaken again. Do not attempt to build the entire workspace from scratch if the template is available — duplication is faster and canonical.
- **Template found (fresh duplicate or partial/broken instance):** proceed. /awaken inspects what exists and builds only what's missing.

## Step 0.5 — the theme gate (blocking — ask before you build)

**Ask the player which theme they want, and do not proceed until they answer.** This runs before Step 1 because the very first milestone ends in a level-up ceremony, and the ceremony's wording is themed — building first and asking later means the player's opening moment is written in a skin they never chose.

- Read the **Theme Registry** entity and offer the themes actually registered there, in one line each, in plain language. Do not hardcode a theme list here; the Registry is the source of truth for what exists, and re-reading it means a newly registered theme is offered automatically.
- **If the Theme Registry is missing or unreadable** (a partial or broken instance — Step 0 explicitly admits those, and /doctor routes them here): do not fall back to a default and do not skip the gate. Repair the Theme Registry first from `references/template-schemas.md` — run that piece of the Step 1 procedure early — then ask. The gate blocks on an unanswered question, never on a repairable missing page.
- Ask it as a single question (Interrogation Protocol), phrased as a real choice with no recommended default.
- **No default. No silent fallback. No "I'll assume X and you can change it later."** If the player does not answer — they go quiet, they reply with something that is not a theme choice, or the session ends — setup does **not** continue. Say plainly that setup is paused on this one question, and re-ask. An unanswered theme question is a failed setup, not a setup with a default.
- If the player explicitly asks what the difference is, answer from the Registry mappings and then re-ask. Answering the question is not the same as choosing.
- Once answered: record the choice on the Kernel in Step 2 (alongside Versions), and use that theme's wording for every ceremony and player-facing line from this point on. Changing it later is `/theme`'s job, never a silent re-skin here.

Idempotent, like everything else in /awaken: if the Kernel already records a theme choice from an earlier run, that is the answer — don't re-ask on a resume or a repair run.

## Step 1 — inventory & repair (Milestone 1)

Check each entity in `references/template-schemas.md` exists and matches schema: Hub, Operating Manual, Status Window, Guild Hall, Patch Notes, Theme Registry, Kernel (pages) · Quest Board, Hunter Network, Battle Log, Gate Intel, Story Bank, Competency Matrix, XP Ledger, 🗒 Agent Notes, Daily Log, Networking Events, Achievements, Questions & Feedback Log, 📅 System Calendar (databases).

- Missing database → create it per the reference schema (relations wired per the dependency order there). Missing page → recreate its skeleton per the reference.
- **📅 System Calendar is a delivery/record channel, not a source of truth** — it holds dated rows the System *generates* (briefings, weekly reviews, reminders, events) so the player has a calendar view of what's coming up; the Daily Log remains authoritative for anything also written here. Idempotent: if a player's duplicate already has it, verify schema and leave it alone; if missing, create it fresh and register its IDs on the Kernel like every other entity.
- **Quest follow-ups are NOT copied here.** `Next Action` / `Next Action Due` live on the ⚔️ Quest Board only. Create a **native calendar view on the Quest Board** instead, once, named **📆 Next Actions**, dated on `Next Action Due` and filtered to rows where `Next Action Due` is not empty. That is how a due follow-up reaches the player's calendar — one row, one place, no copy to drift. Idempotent: check the Quest Board's existing views by name before creating it, and if the surface can't create views, say so plainly in one line and tell the player how to add it themselves (Quest Board → **+** next to the view tabs → **Calendar** → date by `Next Action Due`).
- Never delete or rename anything that exists; never touch rows that carry player data.

**Milestone 1 — ledger key "Awakening: The System comes online" · +100 XP · ⚔️ LEVEL 2 ceremony.**

## Step 2 — inscribe the Kernel (Milestone 2)

Fill the 🧬 Kernel page:

1. **Instance ID table** — every entity above: page ID + data source ID, discovered from the player's own workspace.
2. **Player section** — interrogate one question at a time, only for what's missing: preferred name · email · timezone (compute all future dates/SLAs in it) · anything they want marked confidential from employers (bank it here and in the Status Window; hard rule 4 protects it forever).
3. **Theme** — record the theme the player chose at the Step 0.5 gate. If this field is empty at this point on the **build path**, setup skipped the gate: stop, go back to Step 0.5, and ask. Never fill it with a default to get past this step. **This halt is build-path only.** In Migration mode, a Kernel with no theme recorded is simply an existing player who predates the gate — do **not** halt and do **not** interrogate them (Migration mode never re-asks settled questions). Carry on, and log an Open Question in the player's System Log so a later /awaken or /theme can settle it.
4. **Versions** — Seed version (from the Seed page), **Mechanics Version = current Patch Feed head** (a fresh awakening always builds at feed-head; late joiners are never behind), last Sigil Check = today.
5. **Nexus links** — ask the player for their Seed link (the one the Game Admin sent); copy the Patch Feed and Rule Manifest links from it into the Kernel. (Petitions don't need a link here — `/petition` files a GitHub Issue on the public plugin repo.)
6. **Sharing toggles** — default all yes; tell the player in one line what the heartbeat shares (handle, level, XP, streak, versions, last-active — game stats only, each toggleable off, never job-search content) and honour any "no".

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

**The goal:** the player gets a **Daily Quest Briefing on weekdays at roughly 8am in their own local time**, without having to remember to ask for it. Use whatever scheduler your agent actually offers to make that true. The goal is the requirement; the mechanism is whatever's in front of you. Don't leave the player unscheduled just because the route below isn't the one you have.

**Whatever the route, three things must hold:**

- **Idempotent — match on purpose, not on name.** List whatever schedules/jobs already exist and treat one as the briefing when its **prompt/config indicates daily-briefing duties and its cadence resolves to weekday mornings (~8am) in the Kernel's timezone**. The literal name "Daily Quest Briefing" is a hint, never the test — a renamed but live briefing must still be found (issue #26 records a real one that a name-only check missed and was found only by reading its cron and prompt). Found → done, skip creation, never make a second one. On a near-miss (right cadence but unclear prompt, or vice versa), surface the candidate and ask before creating anything — a silent duplicate double-advances the `Welcome # Delivered` invariant.
- **Correct local time.** Read the Player timezone from the Kernel and target the player's local weekday ~8am. If your scheduler wants UTC or a cron expression, convert — and when the conversion crosses midnight, shift the day-of-week field too, or the briefing lands on the wrong day.
- **Self-contained prompt.** Each firing starts a fresh session with no memory of this one. The scheduled prompt must therefore boot from the player's own 🧬 Kernel (resolve page IDs from there, same as any other session), run the daily briefing duties per the live `KERNEL:Operating Manual`, write today's Daily Log entry, add a 📅 System Calendar row (`Type: Daily Briefing`), and close with a concise briefing summary.

**Offer, never impose** — and once it's created, suggest the player turn on notifications for it, so the briefing reaches them instead of sitting unread.

**Verify it can actually run unattended — and if it can't, say so rather than leaving a routine that looks fine.** On some surfaces a routine *created by an agent* is granted weaker permissions than the same routine created by the player: it runs under a classifier that can pause any tool call mid-run, so the briefing stalls part-written instead of delivering. **No prompt fixes this** — the permission model follows the creation path, and on an agent-created routine the setting is not even exposed. Claude Code routines are a known case; assume any surface may behave this way until shown otherwise. Where it applies, **walk the player through creating the routine themselves**, and give them an acceptance test in two parts:

- **Behavioural, and it applies on every surface:** trigger one run now, or check that the first scheduled briefing actually arrived end to end. The failure being guarded against is a stall part-way through, so only a completed delivery proves anything. Inspecting configuration does not.
- **Inspective, only where the surface exposes such a thing:** a correctly created routine shows an unconditional connector grant and no separate approval-mode setting. On a host scheduler (`cron`, `launchd`, Task Scheduler) there is no connector grant to look at — skip this half rather than asking the player an unanswerable question.

**A routine that exists but stalls is worse than no routine at all**, because the player believes they are covered and finds out by hearing nothing.

### Finding a scheduler

Probe for what this session has, in whatever way is natural for your agent — a scheduled-task or cron-trigger tool in the tool list, a `schedule`/`cron` subcommand, a background-job or automation feature. Some examples, none of them the only right answer:

- **Claude Code / Cowork:** a scheduled-task tool (search the tool list for `create_trigger` or similar) creates the task directly.
- **A CLI agent with its own scheduler or automation config:** register the job there.
- **No agent-side scheduler, but a shell:** the host's own scheduler is a legitimate route — `cron` on Linux, `launchd` on macOS, Task Scheduler on Windows — invoking the agent non-interactively with the self-contained prompt above. Offer it; don't install anything without the player's yes.

### If nothing on this surface can schedule

Degrade out loud, never silently:

- Tell the player plainly, in one short line: their daily rhythm is manual here — open the app each weekday morning and say "run my daily briefing."
- Log an Open Question in the player's System Log (Type: Open Question, Area: Agent Behaviour) noting that scheduled-task setup was skipped on this surface, so a later `/doctor` run on a capable surface can revisit it.

No XP — this is plumbing, not a milestone. (The Friday `/levelup` review can be scheduled the same way, on request, under the same three rules — this step's mandate is the Daily Quest Briefing specifically.)

## Step 7 — register the Hunter (Milestone 7)

1. Ask the player to choose a **handle** (self-chosen alias; real name optional and off by default).
2. Submit it via `/petition` (which files a GitHub Issue on the plugin repo): title "HANDLE REGISTRATION: <handle>", Category: Other, with Seed version and current level. `/petition` carries its own fallback if `gh` isn't available, and its public-issue warning applies here too — a handle is a self-chosen alias, so say so before filing if the player picked something identifying. Handles are admin-registered (no duplicates) — tell the player the Game Admin may come back with a conflict, and the registration stands once confirmed.
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

**Step 1's view creation is part of the migration inventory, unconditionally.** "Schema changes described in the patch" does not narrow it away: verify the Quest Board carries the **📆 Next Actions** calendar view (dated on `Next Action Due`) and create it if missing, exactly as Step 1 mandates on the build path. Legacy instances migrated without this check lose the calendar writers and never gain the replacement view (issue #27). And report the inventory honestly — state what was actually verified: entity presence **and** the view check. If views were not checked, write "views not checked"; never an unqualified "nothing was missing".
