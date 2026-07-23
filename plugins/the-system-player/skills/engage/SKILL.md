---
name: engage
description: Marks a tracked job on the player's Quest Board as applied — moves its stage, sets dates, logs the application to the Battle Log, and awards XP. Use when the player says "I applied to X", "just submitted my application for X", "engage on X", or "/engage [role]" — this is for reporting a completed submission, not for tracking a new posting (/quest) or scoring fit before deciding to apply (/appraise).
---

Read `references/boot-card.md` first for IDs, query mechanics, and hard rules.

## What /engage does
Stage → `Applied`, sets `Applied On` + `Last Activity`, logs the application to the Battle Log. **+50 XP** ("Application submitted").

## Steps

1. **Identify the quest** on the Quest Board (data source `KERNEL:Quest Board`) — match by role/company the player names. If you can't find a matching quest, ask before creating one blind (or offer to run /quest first if this is a role that was never tracked).

2. **Idempotency check first** (boot card rule 2): if `Stage` is already `Applied` or further along, don't re-log the +50 XP — tell the player it's already marked applied and ask if something else changed (e.g. they want to log a resubmission or update the date).

3. **Update the quest**: `Stage: Applied`, `date:Applied On:start` = today (or the date the player gives), `date:Last Activity:start` = today.

4. **Log to the Battle Log** (data source `KERNEL:Battle Log` — fetch its schema on first use if you haven't seen it this session) with a note that the application went out, which quest it's linked to, and the CV/cover-letter version if the player mentions one (also settable on the quest's `CV Version Sent` property). If step 5a finds a forged letter, reference it in this entry.

5. **Log +50 XP** to the XP Ledger (`KERNEL:XP Ledger`): `Action` = "Application submitted: <role> @ <company>", `Category: Application`, `XP: 50`, `Related Quest` = this quest, `date:Date:start` = today. Recompute Total XP, check for a level-up, announce if one happens.

5a. **Armed for battle check** — query 🗒 Agent Notes (`KERNEL:Agent Notes`) for a `Type: Cover Letter`, `Status: Current` note on this quest. If one exists (i.e. the application went out with a /forge-built letter), award the guaranteed bonus: **+10 XP** — `Action` = "Armed for battle: <role> @ <company>", `Related Quest` = this quest, `date:Date:start` = today. Idempotency (hard rule 2): check for an existing "Armed for battle" row for this quest first; one bonus per quest, ever. Announce alongside the +50: `[SYSTEM] Armed for battle — forged letter deployed (+10 XP)`. No Current cover-letter note → no bonus, and don't mention it.

6. **Check the "First Blood" / "Gatecrasher I" / "Speed Runner" achievements** (Achievements data source `KERNEL:Achievements`, via `notion-query-database-view`) — these unlock on a first/early application. If criteria are met and the achievement is still `🔒 Locked`, unlock it: set `Status: 🏆 Unlocked`, `date:Unlocked On:start` = today, log its `XP Bonus` as a separate XP Ledger row (`Category: Achievement Bonus`), and announce it System-style: `[SYSTEM] Achievement unlocked: <name> (+N XP)`.

7. **Report back** concisely with the XP total, any unlocks, and a reminder of the next SLA milestone (follow-up due in 2 business days if there's no response).
