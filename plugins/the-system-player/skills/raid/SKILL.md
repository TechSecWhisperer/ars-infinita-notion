---
name: raid
description: Builds a full assault playbook on a high-priority tracked job — referral routing, a hiring-manager note draft, and a value-memo plan. Use when the player says "let's go all in on X", "raid this role", "what's my full play for X", or "/raid [role]". This is for a quest the player has decided is worth the extra effort, not routine tracking.
---

Read `references/boot-card.md` first for IDs and hard rules — draft-only applies here more than anywhere: this command produces plans and drafts, it never contacts anyone.

## What /raid does
A full edge-playbook for one priority quest: referral routing, a hiring-manager note draft, and a value-memo plan.

## Prerequisites
This works best on a quest that's already been /appraise'd and /scout'ed — if either hasn't happened, run them first (or tell the player you're proceeding without them and that the playbook will be thinner as a result).

## Steps

1. **Identify the quest and pull context**: the Quest Board entry, its 🗒 Agent Notes (`Status: Current` rows only), and the Gate Intel company record.

2. **Referral routing**: check Hunter Network (data source `KERNEL:Hunter Network`) for any warm (`Warmth: Warm`/`Hot`) contact at the company, or anyone who could plausibly make an introduction. If nothing warm exists, say so plainly rather than stretching a cold Gate Intel stub into a "referral path" — a real plan needs a real path.

3. **Hiring-manager note draft**: using the JD, the Gate Intel scout brief, and the player's Stat Sheet/Status Window, draft a short, specific note to whoever the likely hiring manager is (only if identified with reasonable confidence — otherwise draft it as a template with an explicit `[confirm recipient]` placeholder rather than guessing a name). Ground it in something specific to the company's actual situation from the scout brief, not generic flattery.

4. **Value-memo plan**: sketch what a short "here's how I'd think about this problem" memo could cover — 2-4 bullet points tied to real Stat Sheet strengths and the JD's actual priorities, not a generic template. This is a plan/outline, not necessarily the full memo unless the player asks you to write it out.

5. **Write the playbook to 🗒 Agent Notes** (data source `KERNEL:Agent Notes`): `Note` = "<role> @ <company> — Raid Playbook", `Type: Raid Prep`, `Status: Current` (mark any prior raid note for this quest `Superseded` first), `Related Quest` = the quest, one-line `Summary`. Bump the quest's `Priority` to `🔥 High` if it isn't already.

6. **Report back** the playbook as a short actionable list — referral path (or lack of one), the draft note, and the memo outline — and remind the player everything here is a draft for their review, nothing gets sent automatically.
