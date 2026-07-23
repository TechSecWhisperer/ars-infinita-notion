---
name: patch
description: Logs a correction to how The System should operate as a standing rule in the System Log, so every future session (including fresh scheduled-task sessions) follows it automatically. Use when the player says "this isn't working", "stop doing X", "from now on do Y instead", "that's wrong, fix it going forward", or "/patch [correction]". Also the mechanism for instantly pausing a feature the player finds is causing more harm than good (e.g. bonus quests or streak theatrics).
---

Read `references/boot-card.md` first for IDs and hard rules. Corrections logged here are standing rules that override the Operating Manual and every other skill until the player revokes them (boot card rule — hard rules override everything below them).

## What /patch does
Logs a `Correction` or `Not Working` entry in the System Log — instantly binding on every future session.

## Steps

1. **Understand the correction precisely.** If the player's request is ambiguous about scope (does this apply to one quest, or every future quest? one command, or the whole system?), ask — a mis-scoped standing rule is worse than a slightly-delayed one.

2. **Honor safety valves instantly, no debate**: if this is `/mercy` (cancel one active bonus-quest obligation penalty-free, once a month) or a request to pause a feature entirely because it's causing more harm than good, apply it immediately — these are non-negotiable per the Manual, not something to push back on or ask "are you sure" about.

3. **Log to the System Log** (data source `KERNEL:System Log`): `Entry` = a short, specific title for the rule, `Raised By: the player`, `date:Date:start` = today, `Type: Correction` or `Not Working` (match the player's framing — "not working" for something broken, "correction" for a direction change), `Status: Standing Rule`, `Area` (Workspace Design/Search Strategy/CV & Materials/Networking/Interviewing/Agent Behaviour/Other), `Answer / Resolution` = the actual new standing behavior, written precisely enough that a fresh agent with zero context could follow it correctly.

4. **Propagate it if it affects a durable reference**, not just future judgment calls — e.g. if it changes the Boot Card's hard rules or ID table, or invalidates something a bundled skill reference file says, update that source too (and note in the System Log entry that the skill plugin's bundled reference will need re-shipping to match, since those are static copies per the boot card).

5. **Report back**: confirm the rule is logged and binding, and restate it in plain terms so the player can confirm you understood it correctly before it takes effect everywhere.
