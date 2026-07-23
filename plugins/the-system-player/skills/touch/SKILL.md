---
name: touch
description: Scans Hunter Network for networking contacts overdue for a follow-up touch and suggests a reason to reach out for each. Read-only. Use when the player says "who's due for a networking touch", "who should I reach out to", "check my network", or "/touch".
---

Read `references/boot-card.md` first for IDs. Read-only — no writes, this is a scan like /grind but for people instead of quests.

## What /touch does
Scans Hunter Network for 🔔 Due contacts, each with a suggested reason to reach out.

## Steps

1. **Query Hunter Network** (data source `KERNEL:Hunter Network`) — use its "🔔 Follow-ups Due" view if it exists (check via `notion-fetch` on the database for available views), or compute manually against `date:Next Follow-up:start` / `Follow-up Ladder` if not.

2. **For each due contact**, pull `Conversation Notes` and `Notes` to ground a *specific* reason to reach out (something they mentioned, a shared interest, relevant news since) rather than a generic "just checking in." If there's nothing specific to say, note that honestly — a forced reason is worse than a plain one.

3. **Report as a short list**: name, company, how overdue, and the suggested reason/angle. Offer to draft the actual message for any of them (that's really /log's territory once the player picks one) — don't draft unprompted for the whole list, that's a lot of unrequested output.
