# Command reference

**[← README](../README.md)** · **[Player's Guide](PLAYERS-GUIDE.md)** · **[Troubleshooting](TROUBLESHOOTING.md)**

All 26 commands, in the plugin's own words. Type the slash command, or just say what you want in plain language — the System understands both.

## Setting up and keeping it healthy

| Command | What it does |
|---|---|
| `/awaken` | Initialises, repairs, or migrates your instance — the Level-0 tutorial questline that builds the workspace, writes the Kernel, and levels you to 4 by the time setup is done. Idempotent and resumable; also the repair tool for a half-broken workspace. |
| `/intake` | Runs or updates your intake interview to build the Status Window — the profile every tailored CV, talking point and fit score is generated from. |
| `/vitals` | Probes what your session can actually do — Notion reachability, browser presence and health — and reports a capability profile. Read-only. |
| `/doctor` | Diagnoses and repairs your instance: a battery of PASS/WARN/FAIL checks, fixing local problems via the `/awaken` repair path and escalating remote ones via `/petition`. |
| `/patch` | Logs a correction to how The System should operate as a standing rule, so every future session follows it — also how you instantly pause a feature causing more harm than good. |
| `/theme` | Re-skins titles and labels between the game theme and a plain Professional theme. Cosmetic only. |

## Chasing a role

| Command | What it does |
|---|---|
| `/quest` | Tracks a new job posting into your Quest Board — creates the quest, links or creates the company record, and starts the SLA clock. Also picks an existing quest back up with a fast briefing. |
| `/appraise` | Runs a fit-score and gap analysis against your Status Window, pulls talking points, and triggers a company `/scout`. |
| `/scout` | Deep-researches a company — strategy, recent news, culture signal, likely stakeholders — and writes it to the Gate Intel record. |
| `/raid` | Builds a full assault playbook on a high-priority quest: referral routing, a hiring-manager note draft, and a value-memo plan. |
| `/engage` | Marks a tracked job as applied — moves its stage, sets dates, logs it to the Battle Log, and awards XP. |
| `/report` | Logs an inbound reply — updates the stage and activity clock, archives the message, sets the next action. |
| `/respawn` | Attempts to revive an application marked *Closed – No Response* with a fresh angle. |
| `/grind` | Scans your whole pipeline for what needs attention: follow-ups due, quests going stale, open next actions. Read-only. |

## Writing things

| Command | What it does |
|---|---|
| `/forge` | Forges a tailored cover letter — drafts from the job description plus your profile and company research, de-AIs it into your voice, and files it against the quest. |
| `/armor` | Builds your tailored CV for a quest — an editable native-Notion master, a mandatory `/ghost` voice pass, then a send-ready HTML copy and an editable `.docx`. |
| `/ghost` | Rewrites AI-sounding text — an email, cover letter, LinkedIn message, CV bullet — into your real voice. |
| `/log` | Archives a message you sent to someone into the Battle Log and updates last-contacted tracking. |

## People

| Command | What it does |
|---|---|
| `/gather` | Logs a networking event you're attending and preps attendee intel and talking points ahead of time. |
| `/recruit` | Logs new people you met into Hunter Network, researches each from public sources, and drafts personalised follow-ups on a schedule. |
| `/touch` | Scans Hunter Network for contacts overdue for a follow-up and suggests a reason to reach out. Read-only. |
| `/party` | Requests a shared Party Board for friends also running The System — game stats only (level, XP, streak, badges). Never shares job-search content. |

## Progress, and reaching the admin

| Command | What it does |
|---|---|
| `/status` | Your current player state — level, XP, streak, active debuffs, recent unlocks. Read-only. |
| `/levelup` | Your weekly review ritual: pipeline check, archive stats, a lint pass over the wiki for contradictions, and logged enhancement suggestions. |
| `/browse` | Drives a live web page. Everything that needs a page hands it here, so one command probes for a browser and one command tells you honestly when it cannot reach something. |
| `/petition` | Sends a question, enhancement idea, bug report or appeal to the Game Admin. With an authenticated `gh` CLI it files a public GitHub Issue after showing you the exact text; without one it hands you the text and the link to post yourself. It never fakes a submission. |

---

*Drafts are drafts. The System never sends anything on your behalf, and never deletes anything — your XP Ledger and Battle Log are append-only.*
