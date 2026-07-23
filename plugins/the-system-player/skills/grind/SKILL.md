---
name: grind
description: Scans the player's whole Quest Board pipeline for what needs attention — follow-ups due, quests going stale, and open next actions. Read-only, no writes. Use when the player says "check my pipeline", "what's due", "grind", "what should I work on today", or "/grind".
---

Read `references/boot-card.md` first for IDs and query mechanics. This command is read-only — it reports, it doesn't write to the board (that's what /report, /log, /engage etc. are for).

## What /grind does
A pipeline scan: what's overdue, what's stale, what's next — nothing more.

## Steps

1. **Query the Quest Board** (data source `KERNEL:Quest Board`) via `notion-query-database-view` on its default view, or a filtered view if one exists for active quests. Pull `Role`, `Company`, `Stage`, `date:Last Activity:start`, `Next Action`, `date:Next Action Due:start`, `Priority`.

2. **Compute against today (the player's timezone, from the Kernel)**, not the formula columns (`SLA Status`/`Days Silent` are noted in the boot card as live approximations — your own date math is authoritative):
   - 🟠 **Follow-up due**: 2+ business days since `Last Activity` on any quest not in a terminal stage (Rejected/Closed – No Response/Withdrawn/Offer).
   - 🔴 **Going stale**: 14+ days silent — flag for a closure confirmation or a final-nudge draft, don't close it yourself without the player's confirmation.
   - **Next actions**: anything with a `Next Action` set and no clear reason it's blocked.

3. **Also check Hunter Network** for 🔔 due networking touches (its `Follow-up Status` formula / the "🔔 Follow-ups Due" view) if the player's asking broadly rather than just about applications — but skip this if the Quest Board itself is empty, per the "emptiness propagates" rule in the boot card.

4. **Report as a short triage list**, grouped by urgency (overdue follow-ups first, then going-stale, then plain next-actions), each with the role/company and what's needed. Offer concrete next steps ("want me to draft the follow-up for X?") but don't draft or send anything unless asked — this command is read-only by design.

5. If the board has nothing due, say so plainly rather than padding the report — a clean pipeline is a fine answer.
