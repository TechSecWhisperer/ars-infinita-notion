---
name: appraise
description: Runs a fit-score and gap analysis for a job on the player's Quest Board against their Status Window/Stat Sheet, pulls talking points, and triggers a company /scout. Use when the player says "appraise this", "I want to apply for this", "how good a fit is this role", "score this against my profile", or asks whether a tracked quest is worth pursuing. This is analysis-heavy work — take your time and reason carefully rather than rushing to a number. If the role isn't tracked yet, run /quest first; if the player's already submitted the application, that's /engage, not this.
---

Read `references/boot-card.md` first for IDs, query mechanics, and hard rules. This command wants careful reasoning (boot card rule 7) — don't rush a shallow score.

## What /appraise does
Fit score (1–10) + honest gap analysis, written to the Stat Sheet and a new 🗒 Agent Notes entry — plus talking points and triggering /scout if the company hasn't been researched yet.

## Steps

1. **Identify the quest.** If the player didn't name one, ask which Quest Board entry (data source `KERNEL:Quest Board`), or use the JD text they pasted directly if there's no quest yet (in that case, suggest running /quest first so the appraisal has somewhere to live).

2. **Read the JD** (quest page body) and the **Status Window** (page `KERNEL:Status Window` — positioning, target roles, non-negotiables) and the **Stat Sheet** (data source `KERNEL:Stat Sheet`, via `notion-query-database-view`) for the player's rated competencies.

3. **Score the fit (1–10).** Map JD requirements to Stat Sheet competencies/ratings explicitly — cite which competency covers which requirement, not just a gut number. Check the Status Window's non-negotiables (location, salary floor, autonomy) too. Be honest about a low score if it's low; the system explicitly rewards honesty over flattery (game layer never inflates advice).

4. **Log gaps.** For any JD requirement with no real Stat Sheet coverage, add a new Stat Sheet row: `Competency`, `Category`, `Evidence Strength: Gap — needs building`, a believable `Claude Rating (1-5)` (low, 1–2), `Talking Point Angle` (how to honestly reframe via adjacent experience, if any — don't invent experience the player doesn't have), `Benchmark Notes`, `Development Actions`. Don't skip logging a real gap just because it's uncomfortable — hard rule 3 (don't guess/inflate) cuts both ways.

5. **Check for talking points.** Query the Skill Inventory / Story Bank (data source `KERNEL:Skill Inventory`) for banked STAR stories relevant to this JD. If it's empty or thin (likely, early on), say so plainly and pull competency-level `Talking Point Angle` text from the Stat Sheet instead as a stand-in — flag that real STAR stories should be built via a focused `/intake` session (banking them into the Skill Inventory) before this goes past a recruiter screen.

6. **Write the note, not the quest page.** Per boot card rule 6: create a row in 🗒 Agent Notes (data source `KERNEL:Agent Notes`) — `Note` = "<role> @ <company> — Appraisal", `Related Quest` = the quest, `Type: Appraisal`, `Status: Current` (mark any prior appraisal note for the same quest `Superseded` first), `Date` = today, `Summary` = one line with the fit score and the single biggest gap. Full breakdown goes in the note's page body. Then update the quest's `Fit Score` property and add a short summary line to the quest page's top `[SYSTEM]` callout (don't duplicate the full analysis there).

7. **Trigger /scout** if the linked Gate Intel company's `Research Status` isn't `Complete` — either run it now (if you have the room to) or tell the player you'd recommend it next.

8. **Report back**: the fit score, one line on why, the single biggest gap, and a link to the full note.
