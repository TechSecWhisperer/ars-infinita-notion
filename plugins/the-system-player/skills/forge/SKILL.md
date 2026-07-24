---
name: forge
description: Forges a tailored cover letter for a job tracked on the player's Quest Board — drafts from the JD + their Status Window/Stat Sheet + Gate Intel, de-AIs it into their real voice, and files it against the quest with cover-letter lifecycle tracking. Use when the player says "write a cover letter for X", "forge a letter", "I need a cover letter for the Y role", "/forge [role]", or when another command hands off to /forge before an application. Not for CVs or general messages (/ghost handles voice-fixing arbitrary text; this builds the letter itself).
---

Read `references/boot-card.md` first for the Kernel ID table, query mechanics, and hard rules.

## What /forge does
Produces a tailored, the player-voiced cover letter for one tracked quest, files it as a 🗒 Agent Notes row (Type: `Cover Letter`), delivers it as a document, and — on a quest's **first** forge only — rolls the Forge Roulette.

## Steps

1. **Identify the quest** on the Quest Board (data source `KERNEL:Quest Board`) — match by the role/company the player names. Not tracked yet → offer to run /quest first; don't forge letters for untracked roles.

2. **Check for existing cover-letter notes** (data source `KERNEL:Agent Notes`, filtered to this quest, Type = `Cover Letter`, any Status):
   - **None exist** → this is the quest's first forge; the Forge Roulette applies (step 7).
   - **One exists (Current)** → this is a **redraft**: the old note flips to `Status: Superseded` when the new one lands, and there is **no roulette roll** — redrafts never re-roll, ever, regardless of how different the new letter is.

3. **Gather inputs** — the quest page's JD and `[SYSTEM]` summary; the company's Gate Intel record (`KERNEL:Gate Intel`); the Status Window (`KERNEL:Status Window`) and Stat Sheet (`KERNEL:Stat Sheet`); any Current /appraise Agent Notes for this quest (talking points, fit highlights, watch-outs). Don't re-fetch pages already read this session.

4. **Draft the letter.** Target ~250–350 words unless the posting says otherwise. Lead with the strongest genuine overlap from the appraisal (if one exists), evidence claims from the Stat Sheet/Status Window only (hard rule 3 — never invent metrics or competencies), and respect hard rule 4 absolutely: the founder/startup project never appears. Address a named person only if Gate Intel has a **verified** current name — never guess at titles or leadership.

5. **Ghost pass (mandatory).** Apply the /ghost de-AI rewrite to the draft before anything is stored or delivered: strip AI tells (em-dash chains, "I am excited to", tricolon padding, mirrored-JD phrasing), rebuild in the player's real voice per their Status Window positioning. The forge is not done until the letter would pass as player-written.

6. **File and deliver:**
   - New row in 🗒 Agent Notes: `Note` title "Cover Letter — <role> @ <company>", `Type: Cover Letter`, `Status: Current`, `Date` today, one-line `Summary` (angle used), `Related Quest` linked. Letter text in the page body. If this was a redraft, flip the previous note to `Superseded` now.
   - Deliver the letter to the player as a document (docx unless they asks otherwise).
   - Update the quest's `date:Last Activity:start` = today (hard rule 9).

7. **Forge Roulette** — first forge for this quest only (step 2 said so), and only after the letter is filed:
   - **Cadence gate first:** query the XP Ledger (`KERNEL:XP Ledger`) for roulette-drop rows in the last 7 days. If **2 or more** small-win drops already landed this week, the Forge stays quiet — no roll this time (cadence cap — wellbeing > engagement > XP). A quest whose roll was cadence-skipped has still had its one roll; it does not bank a retry.
   - **Roll with real randomness** (hard rule 11): `bash -c 'echo $((RANDOM % 3))'` — a result of `0` triggers a bonus-XP drop. Never "pick" a number; if no random source is available this session, skip the roll and log an Open Question (the roll, not the letter, waits). The exact odds are sealed in the Codex.
   - **On a drop:** log the bonus amount to the XP Ledger — `Action` = "Forge Roulette drop: <role> @ <company>", fetch the payout value from `references/boot-card.md` (admin-controlled, not in this file), `Related Quest` linked, `date:Date:start` = today (fetch the Ledger schema on first use; pick the closest existing `Category` option rather than inventing one). Recompute Total XP, check level thresholds, announce: `⚒️ [SYSTEM] The Forge hums — bonus XP granted`.
   - **On no drop (or cadence-skip):** say nothing about the roll at all. No "better luck next time", no acknowledgment a roll happened. The schedule is sealed — the player sees occasional drops, never the machinery. Do not record no-drop outcomes anywhere the player-visible; the once-per-quest key is the existence of any Cover Letter note for the quest (step 2), not a ledger row.

8. **Report back** concisely: letter delivered, angle used, where it's filed, any XP/level-up from a drop, and the natural next step (usually /engage once they've submitted — which grants its own "Armed for battle" bonus when it finds this letter).

## Idempotency
Re-running /forge on the same quest is always safe: it's a redraft (supersede, no roll). The roulette can never fire twice for one quest because it only ever runs when zero Cover Letter notes exist. Duplicate "Forge Roulette drop" rows for the same quest = double-dip (hard rule 2) — check before writing.
