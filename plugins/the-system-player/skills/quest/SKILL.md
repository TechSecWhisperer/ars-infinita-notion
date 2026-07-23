---
name: quest
description: Tracks a NEW job posting into the player's Quest Board in Notion (their gamified job-search tracker, "The System") — creates the quest entry, links/creates a Gate Intel company record, and starts the SLA clock. Also picks an EXISTING quest back up — a fast one-quest briefing (stage, latest agent notes, what's next) — when the player names a role/company already on the board instead of pasting a new link. Use this whenever the player pastes a job link and says something like "quest", "track this job", "add this to the board", "found a role at X"; or when they want to resume/check one specific tracked role — "pick up my quest for X", "where am I on the Y application", "let's continue with Z", "quest continue". Also triggers on "/quest [link]". Not for a fit score (/appraise), not for reporting a submitted application (/engage), and not for a whole-pipeline scan across every quest (/grind — that's multi-quest, this is single-quest).
---

Read `references/boot-card.md` first (once per session) for the Notion ID table, query mechanics, and hard rules — this skill assumes you have it loaded.

## Two modes, one command
`/quest` either **starts** a quest or **picks one back up** — decide which before doing anything else:

- **New**: the player gave a job link/URL, or clearly describes a posting that isn't tracked yet. → go to **Mode: New**.
- **Continue**: the player names a role/company/quest with no link, especially with language like "continue", "pick up", "where am I on", "resume", "status on X quest" — or a link they gives turns out to already be on the board. → go to **Mode: Continue**.

**How to tell them apart when it's not explicit**: always check the Quest Board first (data source `KERNEL:Quest Board`) for a match before creating anything —
1. If the player gave a `Job Link`, query for that exact URL.
2. Otherwise, query for a `Role`/`Company` text match against what they named.

If you get **one clear match** → Continue mode, regardless of which trigger phrase they used (even "track X" on something already tracked should resolve to a status check, not a silent duplicate). If you get **no match** and they gave you enough to create something (a link, or a role+company+source they're describing fresh) → New mode. If you get **multiple plausible matches** (e.g. two roles at the same company) → list them and ask which one before doing either. If you get **no match and not enough to create a quest** (they name a company/role vaguely with no link and no real detail) → ask whether they want to track it fresh (and needs to give you the posting/link) or they meant a different quest.

---

## Mode: New
Fetch the job posting → create a Quest Board entry (role, company, location, salary, source, full JD in the page body) → create or link a Gate Intel company record → set Stage, start the SLA clock → log +10 XP (`Quest tracked`).

1. **Duplicate check** (see "Two modes" above — you should have already done this before choosing New mode; if you somehow haven't, do it now and switch to Continue mode if it turns out to exist).

2. **Fetch the posting.** If it's a LinkedIn URL, be ready for bot-detection: never solve a CAPTCHA/checkpoint yourself. Try a normal fetch first; if it's blocked, use the user's own already-authenticated browser (device bridge Chrome, or an existing logged-in claude-in-chrome tab) instead of a clean session, and ask the player to clear any checkpoint themselves if one appears. Extract: role title, company, location, employment type, salary (if listed — most postings omit it, that's normal, don't guess a number), and the full job description text.

3. **Find or create the Gate Intel company row** (data source `KERNEL:Gate Intel`). Check via `notion-query-database-view` on its default view for an existing row matching the company name (case-insensitive) before creating a new one — don't create a duplicate company. If new, create it with just the basics (Company, Industry, HQ/Locations, Website if known, `Research Status: Not Started`) — deep research is /scout's job, not /quest's.

4. **Create the Quest Board entry.** Properties: `Role` (title) = job title, `Company` = relation to the Gate Intel page from step 3, `Location`, `Source` (LinkedIn/Seek/Referral/Recruiter Outreach/Company Site/Other — infer from the URL), `Job Link` = the posting URL, `Stage` = `Saved`, `Salary Range` = the figure if listed else `"Not listed"`, `date:Last Activity:start` = today — this starts the SLA clock. Leave `Fit Score`, `Deep Research Done`, `Talking Points Ready` for /appraise and /scout to fill in later.

5. **Page body** — write the JD content following this pattern (see the standing Agent Notes rule in the boot card, rule 6): a short `[SYSTEM]` summary callout at the very top (initially just "not yet appraised — run /appraise" if you haven't also been asked to appraise), then the raw JD verbatim below as the immutable Layer-1 source, closing with a one-line note that deep agent analysis belongs in 🗒 Agent Notes, not here.

6. **Log XP.** Create an XP Ledger row (data source `KERNEL:XP Ledger`): `Action` = "Quest tracked: <role> @ <company>", `Category` = `Application`, `date:Date:start` = today, `XP` = 10, `Related Quest` = the new quest page, `Notes` = brief context. Then recompute Total XP on the Status Window Player Card and check for a level-up (see boot card hard rule 5) — announce it if one happens.

7. **Report back** concisely: `[SYSTEM] Quest tracked: <role> — <company> (+10 XP)` [+ level-up line if applicable], a one-line read on the role if obvious, and the Quest Board link. Ask if the player wants /appraise and/or /scout run next — don't run them automatically unless they've already asked for the full sequence in the same message.

## Mode: Continue
A fast, read-oriented briefing on one already-tracked quest — no XP, no duplicate-avoidance needed (nothing gets created), the point is to re-orient the player (and yourself) on where this one stands.

1. **Pull the quest's current state** from its Quest Board row: `Role`, `Company`, `Stage`, `Priority`, `date:Last Activity:start`, `Next Action`, `date:Next Action Due:start`, `Fit Score`, `Deep Research Done`, `Talking Points Ready`, `Job Link`, `Salary Range`.

2. **Pull its latest agent analysis** — query 🗒 Agent Notes (data source `KERNEL:Agent Notes`) filtered to this quest's `Related Quest` relation and `Status: Current`. Summarize what's there (appraisal fit score + biggest gap, scout highlights, raid prep, etc.) — don't dump the full text of every note, that defeats the point of the index; one line per note is usually enough unless the player asks to go deeper on one.

3. **Compute where it stands against the SLA clock** the same way /grind would for this one quest: business days since `Last Activity` (the player's timezone, per the Kernel) — flag 🟠 if a follow-up is due (2+ business days, not in a terminal stage), 🔴 if it's gone quiet (14+ days).

4. **Suggest the natural next command** based on `Stage` and what's missing, e.g.: `Saved` + no Fit Score → "not yet appraised, want me to run /appraise?"; `Saved` + appraised but no Current Cover Letter note and they're leaning toward applying → "want me to /forge the cover letter?"; `Saved`/`Applied` + follow-up due → "worth a /log follow-up"; `Recruiter Screen`/`Hiring Manager`/`Panel` upcoming and no Raid Prep note → "want a /raid playbook before this one?"; `Closed – No Response` → mention /respawn is available if they want another shot. Offer, don't just do — Continue mode is a briefing, not an excuse to auto-run another command.

5. **Report back** as a tight briefing: stage + how long it's been there, the agent-notes summary, the SLA flag if any, and the suggested next step. This should read like picking up a conversation, not like a fresh /quest confirmation.

## Notes
- Never invent a salary figure. "Not listed" is a normal, honest value.
- Continue mode never writes to Notion by itself — it's a read. If the SLA check or the agent-notes summary prompts the player to actually do something (log a follow-up, run /appraise), that's the next command, not this one.
