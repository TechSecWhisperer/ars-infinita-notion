---
name: report
description: Logs an inbound reply on a tracked job application — updates the Quest Board stage and activity clock, archives the message, and sets the next action. Use when the player says "they replied", "I heard back from X", "got an email about the Y role", "moved to next round", or "/report".
---

Read `references/boot-card.md` first for IDs, query mechanics, and hard rules.

## What /report does
Logs the message to the Battle Log, updates `Last Activity`, moves `Stage` if the reply implies a stage change, and sets `Next Action`. No fixed XP line in the Game Rules table for this one — don't invent XP for it (boot card rule 5); the XP comes from later, more specific commands (/engage, or a stage-completion action).

## Steps

1. **Identify the quest** and get the actual message text/content from the player (or a forwarded email/screenshot) — don't summarize before archiving; the Battle Log wants the full text as the raw source.

2. **Log the full message to the Battle Log** (data source `KERNEL:Battle Log` — fetch its schema on first use if you haven't seen it this session), linked to the quest and, if it's from a specific person, to their Hunter Network entry (create a stub contact if this is someone new).

3. **Update the quest**: `date:Last Activity:start` = today. Map the reply to a `Stage`:
   - Recruiter screen scheduled/happened → `Recruiter Screen`
   - Hiring manager round → `Hiring Manager`
   - Panel/case study → `Panel / Case`
   - Final round → `Final Round`
   - Offer → `Offer`
   - Rejection → `Rejected` (still counts — rewards effort, never treat this as a loss condition; see /respawn if the player wants to revive it later)
   - Just an acknowledgment/no real update → leave `Stage` as-is
   If you're not sure which bucket a reply falls into, ask rather than guessing — a wrong stage skews the SLA clock and any XP a later command grants off of it.

4. **Set `Next Action`** on the quest — a concrete next step in the player's own words where possible ("prep for recruiter screen Tuesday", "send thank-you note", "await panel feedback"). If this next action has a real due date, mirror it into 📅 System Calendar (`Type: Follow-up Due`, `Quest` = this role/company, `Date` = the due date) — idempotent: check for an existing Calendar row for this quest with that same due date before creating one. The Quest Board's `Next Action`/`Next Action Due` stays the source of truth; the Calendar row is just a delivery copy so the player sees it on their calendar.

5. **If this is a completed interview stage** (Recruiter Screen/Hiring Manager/Panel/Final Round actually *completed*, not just scheduled), the boot card's Game Rules table pays out 75/100/150/200 XP respectively. Before logging, query the XP Ledger filtered to this quest for a row whose `Action` already names this exact stage (e.g. "Recruiter Screen completed: <role> @ <company>") — only log a new entry if none exists, so a `/report` re-run on the same reply, or a second reply about the same completed stage, can't double-pay it.

6. **Report back**: what changed (stage, next action), and flag if a decision or draft is now needed from the player (e.g. "want me to draft a reply?" — draft only, never send, per hard rule 1).
