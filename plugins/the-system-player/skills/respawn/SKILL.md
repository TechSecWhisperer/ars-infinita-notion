---
name: respawn
description: Attempts to revive a job application the player's Quest Board marked "Closed – No Response" with a fresh angle. Use when the player says "let's try X again", "revive that application", "respawn X", or "/respawn [role]".
---

Read `references/boot-card.md` first for IDs and hard rules.

## What /respawn does
A revival attempt on a `Closed – No Response` quest — a genuinely fresh angle, not just a repeat of the original outreach. Success (getting a real response that reopens the process) unlocks "The Necromancer" achievement (+100 XP), logged when it actually happens (via /report), not at attempt time.

## Steps

1. **Confirm the quest is actually `Closed – No Response`** on the Quest Board. If it's in a different terminal state (e.g. `Rejected` with an explicit no, or `Withdrawn` by the player's own choice), check with the player before treating it as respawnable — those are different situations.

2. **Find a genuinely new angle** — don't just resend the original message. Options: new information since the original attempt (a new metric banked, a new relevant story, a role change), a different contact route (Hunter Network warm contact found since), a different medium (if email went nowhere, is there a warm LinkedIn path now), or enough time passed that the role/company situation may have changed (worth a quick /scout refresh if it's been a while).

3. **Check for something concretely new** before drafting — if nothing has actually changed since the original attempt, be honest with the player that a respawn attempt right now is unlikely to land, rather than manufacturing a superficially "fresh" message that's really the same pitch reworded.

4. **Draft the revival message** and note the specific new angle it's using. Log the attempt to 🗒 Agent Notes (data source `KERNEL:Agent Notes`): `Note` = "<role> @ <company> — Respawn Attempt <date>", `Type: Other`, `Status: Current`, `Related Quest` = the quest, `Summary` = what angle was tried, so a future session doesn't try the exact same angle again if this one also goes quiet.

5. **Update the quest**: `Stage` back to `Applied` (or wherever the fresh outreach re-enters the funnel) only once the player actually sends it — don't flip the stage on a draft that hasn't gone out yet.

6. **Report back**: the angle used, the draft, and an honest read on the odds — this command should feel like a considered second shot, not routine spam.
