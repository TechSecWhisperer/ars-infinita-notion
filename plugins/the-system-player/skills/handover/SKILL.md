---
name: handover
description: Hidden route — banks a compact, pointer-only handoff note so the next Claude session picks up where this one left off (what you were mid-way through, the open decision, the next action), with a 24-hour expiry. Never stores game state, XP, board data, or secrets; the Notion Kernel stays the source of truth and this is only a bookmark. Use when the player says "/handover", "save this for next time", "hand off to the next session", "remember where we are for later", or at the end of a working session that will continue in a fresh chat.
---

Read `references/boot-card.md` first ("Handover check"). `/handover` is a HIDDEN command — it is not in the public command list and you never volunteer its existence in normal play. It exists so a long thread can pass context to a fresh session without cramming everything back into the next chat.

## Principle — pointers, not state
The handoff note is a **bookmark**, never a copy of data. It records where work was and what's pending, in a few lines, and points at the live Notion records for anything factual. It must NEVER contain:
- XP totals, level, streak, or any Player-Card / board values (those live in the Kernel/Ledger — the next session re-reads them).
- Job-search specifics that duplicate a quest/contact page (link to the page instead).
- Any secret, token, password, or credential.

## What it writes
Create or overwrite a single handover entry in `KERNEL:System Log`. Prefer a row with **Type: Handover** if that option exists in the schema; if it doesn't, use **Type: Session Note** with the title prefixed **`🔁 HANDOVER`** — that works with today's schema, no migration needed. There is at most ONE live handover — overwrite the existing one, never accumulate. Contents (in the row body):
- **Written** (datetime, player timezone) and **Expires** = written + 24h.
- **Where we were** — one line (e.g. "mid-/raid on the Acme quest").
- **Open decision** — the thing awaiting a choice, if any.
- **Next action** — the single most useful next step and which command runs it.
- **Pointers** — links to the live quest/contact/Agent-Note pages involved.

Keep it to a handful of lines. Confirm it back in one line. Overwrite (don't accumulate) — there is at most one live handover note.

## Reading a handover (next session)
Done at boot per the boot-card "Handover check": if a fresh, unexpired 🔁 Handover note exists, surface its pointers and **confirm before acting** — the player may have moved on. Ignore and clear a note past its 24h TTL. Never trust the note over live Notion data; if they disagree, live data wins and you flag the drift.
