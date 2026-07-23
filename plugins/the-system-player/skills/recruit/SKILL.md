---
name: recruit
description: Logs new people the player met (usually at an event) into Hunter Network, researches each from public sources, and drafts personalised follow-ups on a schedule. Use when the player says "at [event] I met...", "I connected with these people", "add these contacts", or "/recruit [names + notes]".
---

Read `references/boot-card.md` first for IDs and hard rules.

## What /recruit does
Creates Hunter Network entries → light public-source research on each → drafts personalised follow-ups → schedules the follow-up ladder. **+25 XP per new contact, +75 XP if tied to a logged event** (check the event XP hasn't already been awarded if multiple people are recruited from the same event across separate messages — idempotency, boot card rule 2).

## Steps

1. **For each person the player describes, check for an existing entry first** — query Hunter Network (data source `KERNEL:Hunter Network`) matching on `Name` + `Company` before creating anything. If found, update it (add these new `Conversation Notes`, bump `Warmth` if it's grown) instead of creating a duplicate row, and don't re-award the +25 for that person. Only for genuinely new people: create a Hunter Network entry with `Name`, `Role / Title`, `Company`, `Met At` = relation to the Raids & Gatherings event if there is one, `Type` (best guess from context — Recruiter/Hiring Manager/Interviewer/Referral/Network/Other), `Warmth: Warm` (they just met in person — warmer than a cold scout stub), `Conversation Notes` = whatever the player actually told you they talked about or mentioned personally — this is the fuel for a genuinely personalized follow-up, don't lose it to a generic summary.

2. **Light public-source research** on each (same public-only rule as /scout) to round out `Role / Title`/`Company` if the player's notes were partial, and set `Research Brief` accordingly (`Researched — see page` or `Not Findable Online`).

3. **Draft a personalised follow-up** per person, grounded in the actual conversation notes — a generic "great meeting you" message defeats the point of banking what they talked about. Draft only; never send.

4. **Set the follow-up ladder**: `Follow-up Ladder: T+2d Thank You` to start, with `date:Next Follow-up:start` set accordingly. Mirror that due date into 📅 System Calendar (`Type: Follow-up Due`, `Notes` naming the contact, `Date` = the follow-up date) — idempotent: check for an existing Calendar row for this contact with that same date before creating one. Hunter Network's `Next Follow-up` stays the source of truth; the Calendar row is only a delivery copy.

5. **Log XP**: +25 per new contact (`Category: Networking`). If this batch is tied to a `/gather`-logged event and the event-level +75 hasn't been logged yet, add that too (once per event, not once per person).

6. **Report back**: contacts logged, a one-line summary of each research find, and the drafted follow-ups for the player's review before anything goes out.
