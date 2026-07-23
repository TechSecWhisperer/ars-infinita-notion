---
name: log
description: Archives a message the player sent to someone (a recruiter, hiring manager, or contact) into the Battle Log, links it to the right person and quest, and updates last-contacted tracking. Use when the player says "I sent this to X", "log this message to Y", "here's what I told the recruiter", or "/log [message] to [person]".
---

Read `references/boot-card.md` first for IDs, query mechanics, and hard rules.

## What /log does
Archives the full outbound message, links person + quest, updates `Last Contacted`. **On-time follow-up (within SLA) = +15 XP** — only when this message is actually a follow-up on an existing quest inside the 2-business-day SLA window; a first-contact or off-SLA message doesn't earn this.

## Steps

1. **Get the full message text and the recipient.** Don't paraphrase before archiving — the exact text is the Layer-1 source.

2. **Find or create the Hunter Network contact** (data source `KERNEL:Hunter Network`) for the recipient. If new, capture what the player tells you (name, role, company, how they're connected) — don't invent details you don't have.

3. **Log the message to the Battle Log** (`KERNEL:Battle Log` — fetch its schema on first use if you haven't seen it this session), relation to both the contact and the relevant quest (if there is one).

4. **Update `date:Last Contacted:start`** on the Hunter Network entry = today, and set/advance `Follow-up Ladder` if this fits the T+2d/T+3w/T+7w pattern.

5. **Check the SLA/XP condition**: if this message is a follow-up on a quest whose `date:Last Activity:start` shows the reply was due (2+ business days since last activity, but not yet 14 — see boot card for "today"), and this is genuinely the follow-up closing that gap, log +15 XP to the XP Ledger (`Category: Follow-up`, `Related Quest` = the quest, `date:Date:start` = today). Before logging, query the Ledger for a `Follow-up` row already dated today against this same quest — one on-time-follow-up award per gap-closing event, not one per message if several near-identical touches get logged the same day. If it doesn't meet the SLA-follow-up definition, don't award XP — that's fine, most logged messages won't qualify and that's expected, not a bug.

6. **Update the quest's `date:Last Activity:start`** too, since an outbound touch resets the clock the same as an inbound one.

7. **Report back**: confirmation it's archived, whether XP was earned and why/why not, and the next follow-up date if the ladder advanced.
