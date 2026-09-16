# Command reference

**[← README](../README.md)** · **[Player's Guide](PLAYERS-GUIDE.md)** · **[Troubleshooting](TROUBLESHOOTING.md)**

All 27 commands, in the plugin's own words — **generated** from each skill's frontmatter by `tools/generate_catalog.mjs`. Do not hand-edit; run the generator with `--write` instead (command-catalog-check fails the build if this file is stale). Type the slash command, or just say what you want in plain language — the System understands both.

## Setting up and keeping it healthy

| Command | What it does |
|---|---|
| `/awaken` | Initialises, repairs, or migrates the player's instance of The System — the Level-0 tutorial questline that builds the workspace, writes the Kernel, and levels the player to 4 by the time setup is done. |
| `/intake` | Runs (or updates) the player's intake interview to build the Status Window — their single source of truth profile (positioning, experience, metrics, target roles) that every tailored CV/talking point/fit score is generated from. |
| `/vitals` | Probes what this session can actually do — Notion connector reachability, agent-browser presence and health, MCP-capable vs app-only, Patch Feed reachability — and reports a capability profile that drives command gating. |
| `/doctor` | Diagnoses and repairs the player's instance of The System — a battery of PASS/WARN/FAIL checks (Notion access, Kernel and rule-surface integrity, schedules, Player-Card vs XP-Ledger reconciliation, version-vs-feed), each classified local or remote, then fixes local problems via the idempotent /awaken repair path and escalates remote ones via /petition. |
| `/patch` | Logs a correction to how The System should operate as a standing rule in the System Log, so every future session (including fresh scheduled-task sessions) follows it automatically. |
| `/theme` | Re-skins The System's titles/labels between the hidden Solo Leveling game theme and a plain Professional theme (or another registered theme), per the Theme Registry — cosmetic only, structure and IDs untouched. |

## Chasing a role

| Command | What it does |
|---|---|
| `/quest` | Tracks a NEW job posting into the player's Quest Board in Notion (their gamified job-search tracker, "The System") — creates the quest entry, links/creates a Gate Intel company record, and starts the SLA clock. |
| `/appraise` | Runs a fit-score and gap analysis for a job on the player's Quest Board against their Status Window/Stat Sheet, pulls talking points, and triggers a company /scout. |
| `/scout` | Does deep research on a company the player's job-hunting at (strategy, recent news, culture signal, likely stakeholders) and writes it to the Gate Intel record in Notion. |
| `/raid` | Builds a full assault playbook on a high-priority tracked job — referral routing, a hiring-manager note draft, and a value-memo plan. |
| `/engage` | Marks a tracked job on the player's Quest Board as applied — moves its stage, sets dates, logs the application to the Battle Log, and awards XP. |
| `/report` | Logs an inbound reply on a tracked job application — updates the Quest Board stage and activity clock, archives the message, and sets the next action. |
| `/respawn` | Attempts to revive a job application the player's Quest Board marked "Closed – No Response" with a fresh angle. |
| `/grind` | Scans the player's whole Quest Board pipeline for what needs attention — follow-ups due, quests going stale, and open next actions. |

## Writing things

| Command | What it does |
|---|---|
| `/forge` | Forges a tailored cover letter for a job tracked on the player's Quest Board — drafts from the JD + their Status Window/Stat Sheet + Gate Intel, de-AIs it into their real voice, and files it against the quest with cover-letter lifecycle tracking. |
| `/armor` | Builds the player's tailored CV for a tracked quest — their armor for the battle. |
| `/ghost` | Rewrites AI-sounding text (a draft email, cover letter, LinkedIn message, CV bullet) into the player's real voice, stripping the tells that make it read as Claude-written. |
| `/log` | Archives a message the player sent to someone (a recruiter, hiring manager, or contact) into the Battle Log, links it to the right person and quest, and updates last-contacted tracking. |

## People

| Command | What it does |
|---|---|
| `/gather` | Logs a networking event the player's attending (a conference, meetup, industry dinner) to Raids & Gatherings and preps attendee intel + talking points ahead of time. |
| `/recruit` | Logs new people the player met (usually at an event) into Hunter Network, researches each from public sources, and drafts personalised follow-ups on a schedule. |
| `/touch` | Scans Hunter Network for networking contacts overdue for a follow-up touch and suggests a reason to reach out for each. |
| `/party` | Requests a shared Party Board in the Guild Hall for the player and friends who also run The System — a group dashboard of game stats only (level, XP, streak, badges). |

## When it's too much

| Command | What it does |
|---|---|
| `/mercy` | Cancels one active bonus-quest obligation penalty-free, instantly, once a month. |

## Progress, and reaching the admin

| Command | What it does |
|---|---|
| `/status` | Reports the player's current player state in "The System" — level, XP, streak, active debuffs, and recent unlocks. |
| `/levelup` | Runs the player's weekly review ritual for The System — pipeline check, archive stats (response rates), a lint pass over the wiki for contradictions/stale claims, and 2-3 logged Enhancement Suggestions. |
| `/browse` | Drive a live web page with agent-browser (the vercel-labs browser CLI) using its real interface — health-check, open, snapshot, click, fill — so browser work actually runs instead of being hallucinated or silently skipped. |
| `/petition` | Sends a question, enhancement idea, bug report, or mercy appeal from the player to the Game Admin by filing an issue on the public ars-infinita-notion repo. |

---

*Drafts are drafts. The System never sends anything on your behalf, and never deletes anything — your XP Ledger and Battle Log are append-only.*
