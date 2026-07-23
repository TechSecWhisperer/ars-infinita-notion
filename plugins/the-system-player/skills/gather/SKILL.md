---
name: gather
description: Logs a networking event the player's attending (a conference, meetup, industry dinner) to Raids & Gatherings and preps attendee intel + talking points ahead of time. Use when the player says "I'm going to X event", "help me prep for this meetup", "log this conference", or "/gather [event]".
---

Read `references/boot-card.md` first for IDs and hard rules.

## What /gather does
Logs the event, preps whatever attendee intel and talking points are feasible ahead of time.

## Steps

1. **Create/find the event entry** in Raids & Gatherings (data source `KERNEL:Raids & Gatherings` — fetch its schema on first use if you haven't seen it this session) with what the player gives you: event name, date, location/format.

2. **If the player names specific people or companies attending**, do a light public-source check (same rules as /scout — public professional info only, no scraping) so they walks in with a couple of talking points per person/org, not cold. If they doesn't have an attendee list yet, this step is just the event logged — that's a fine outcome, don't invent attendees.

3. **Prep general talking points** from the Status Window/Stat Sheet relevant to the event's likely audience (e.g. a security meetup vs a general tech networking night calls for a different angle to lead with).

4. **Report back**: the event is logged, plus whatever attendee prep you were able to do. After the event, remind the player that `/recruit` is the follow-up command for logging who they actually met.
