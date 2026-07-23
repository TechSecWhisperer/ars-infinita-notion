---
name: status
description: Reports the player's current player state in "The System" — level, XP, streak, active debuffs, and recent unlocks. Read-only. Use when the player says "show my status", "what level am I", "how much XP do I have", "what's my streak", or "/status".
---

Read `references/boot-card.md` first for IDs. Read-only command — no writes.

## What /status does
Reads the Player Card + XP Ledger + Achievements and reports back cleanly.

## Steps

1. **Read the Player Card** at the top of the Status Window page (`KERNEL:Status Window`) — it's maintained after every XP event, so it should already be current; don't recompute from scratch unless something looks obviously stale (e.g. it doesn't match a level implied by the raw Total XP number).

2. **Pull recent XP Ledger activity** (data source `KERNEL:XP Ledger`) if the player wants specifics on where recent XP came from — a handful of the most recent rows is usually enough, not the full history.

3. **Check Achievements** (`KERNEL:Achievements`) for anything recently unlocked, and note how close they are to the *next* visible one (only the next locked tier of each badge track is ever meant to be visible — don't reveal future tiers beyond that, and never reveal sealed mechanics beyond what the player has already unlocked, even if asked directly). Note: the Player Card's "Achievements: N/12" count is `Kind: Achievement` rows only — the six `Kind: Badge` rows (one per track, its current tier) are a separate count, reported as "Badges: N forged / 6 tracks."

4. **Report**: Level, Rank, Total XP and XP to next level, streak, any active debuffs (🟠 Hesitation / 🔴 Fading Gate / 🔔 Cooling Ally — pull from the pipeline if the player wants specifics), and achievement/badge count. Keep it to the numbers and a line of color, not a full re-explanation of the whole game system every time.
