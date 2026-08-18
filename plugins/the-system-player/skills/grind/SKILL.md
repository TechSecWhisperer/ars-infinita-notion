---
name: grind
description: Scans the player's whole Quest Board pipeline for what needs attention — follow-ups due, quests going stale, and open next actions. Strictly read-only — it reports, it never writes anywhere. Use when the player says "check my pipeline", "what's due", "grind", "what should I work on today", or "/grind".
---

Read the shared boot card `${CLAUDE_SKILL_DIR}/../../references/boot-card.md` first for IDs and query mechanics. This command is **read-only, with no exceptions** — it reports, it never writes anywhere (that's what /report, /log, /engage etc. are for).

## What /grind does
A pipeline scan: what's overdue, what's stale, what's next — nothing more.

## Steps

1. **Query the Quest Board** (data source `KERNEL:Quest Board`) with a narrow, filtered read — never a whole-board pull filtered client-side:

   ```sql
   SELECT Role, Company, Stage, "date:Last Activity:start", "Next Action",
          "date:Next Action Due:start", Priority
   FROM "<resolved Quest Board collection:// URL>"
   ```

   Project only these columns rather than pulling every property — but do **not** filter stages here. Which stages are reported is decided per-bucket in step 2, and excluding terminal stages at query level would silently drop them from all three buckets (a `Rejected` quest with an open `Next Action` would vanish entirely). Row filtering is a game-meaning decision, not an efficiency one.

   Three things that will bite you: date properties are only queryable as their expanded columns (`"date:Last Activity:start"`, never `"Last Activity"` — that errors with *no such column*); `SLA Status`/`Days Silent` are formulas that cannot be selected in SQL at all (see step 2 — you compute those yourself anyway); and `Company` is a relation, so it comes back as a page reference, not a display name — resolve it before printing. If SQL mode returns `entitlement_required` (free-plan quota), fall back to `notion-query-database-view` on the default view per the boot card.

2. **Compute against today (the player's timezone, from the Kernel)**, not the formula columns (`SLA Status`/`Days Silent` are the not-yet-verified formulas called out under Deterministic-first in the boot card, so your own date math still governs those two):
   - 🟠 **Follow-up due**: 2+ business days since `Last Activity` on a quest that has had **inbound human contact** — i.e. `Recruiter Screen` or later. Pre-contact stages (`Saved`, `Applied`) and terminal stages (`Rejected`/`Closed – No Response`/`Withdrawn`/`Offer`) are never surfaced here. Chasing before a human has replied yields little, and the standing rule forbids overdue framing on those quests — they may be offered as an option, never flagged as late.
   - 🔴 **Going stale**: 14+ days silent on a quest that has had **inbound human contact** and is **still live** — i.e. `Recruiter Screen` through `Final Round`. Pre-contact stages (`Saved`, `Applied`) and terminal stages (`Rejected`/`Closed – No Response`/`Withdrawn`/`Offer`) are never surfaced here, exactly as in the bullet above: a terminal quest has nothing left to go stale, and asking the player to "confirm closure" on one they already closed — or on an `Offer` — is noise at best. For pre-contact quests the standing rule is the reason: "going stale" plus a closure prompt is overdue framing, which those stages never get. If a pre-contact quest has been quiet a long time you may report the elapsed time as a plain number and offer a nudge as an option — never as a deadline, a debuff, or a reason to close. When a quest does qualify: flag it for a closure confirmation or a final-nudge draft, and never close it yourself without the player's say-so.
   - **Next actions**: anything with a `Next Action` set and no clear reason it's blocked.

3. **Also check Hunter Network** for 🔔 due networking touches (its `Follow-up Status` formula / the "🔔 Follow-ups Due" view) if the player's asking broadly rather than just about applications — but skip this if the Quest Board itself is empty, per the "emptiness propagates" rule in the boot card.

4. **Report as a short triage list**, grouped by urgency (overdue follow-ups first, then going-stale, then plain next-actions), each with the role/company and what's needed. Offer concrete next steps ("want me to draft the follow-up for X?") but don't draft or send anything unless asked — this command is read-only by design, and this stays true for the Quest Board and Hunter Network: nothing here ever writes to either.

5. **Never mirror any of this into 📅 System Calendar.** `Next Action`/`Next Action Due` live on the Quest Board and `Next Follow-up` lives on Hunter Network; the player sees them dated through those databases' own calendar views (the Quest Board's **📆 Next Actions** view, created once by `/awaken`), not through copied rows. A copy goes stale the moment the player edits the date at source, and /grind is read-only anyway.

6. If the board has nothing due, say so plainly rather than padding the report — a clean pipeline is a fine answer.
