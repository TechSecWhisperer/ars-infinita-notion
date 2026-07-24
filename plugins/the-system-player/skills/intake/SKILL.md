---
name: intake
description: Runs (or updates) the player's intake interview to build the Status Window — their single source of truth profile (positioning, experience, metrics, target roles) that every tailored CV/talking point/fit score is generated from. Use when the player says "run my intake", "let's update my profile", "I have new info about my experience", or "/intake". Also the right tool for a focused follow-up interview on one section (e.g. banking a new metric) rather than a full rebuild.
---

Read `references/boot-card.md` first for IDs and hard rules — the Interrogation Protocol below is one of them, follow it exactly.

## What /intake does
An interview-style session that builds or updates the Status Window (page `KERNEL:Status Window`). **+100 XP on first-time completion** (a full section rebuild); smaller banked-answer updates don't re-earn the full 100 — see step 5.

## The Interrogation Protocol (non-negotiable, applies to every question you ask)
- **One question at a time.** Never batch multiple questions in one message.
- **Before each question**, silently run a 4-line reasoning check: Gap (what's actually missing) / Why now (why this question, why this order) / Shape (what form should the answer take) / Branch (what do you do with different possible answers) — this keeps questions sharp instead of generic.
- **≤5 questions per session.** If there's more ground to cover, stop at 5 and tell the player there's more for next time rather than pushing through.
- **Bank every answer immediately** — write it into the Status Window (or Stat Sheet, or Metrics Bank table) as soon as it's given, before asking the next question. Answers that only live in the chat are lost.

## Steps

1. **Figure out scope.** Read the current Status Window first. If this is the first-ever intake, it's a full build (Positioning, Experience Ledger, Metrics Bank, Education/Certs, CV/LinkedIn versions, Interview Q&A prep, Side-Quest Calibration). If the Status Window already exists, ask the player what prompted this — a specific new fact to bank, or a fuller refresh — and scope the interview to that.

2. **Ask, one at a time**, following the Interrogation Protocol above. Good targets: unbanked metrics (numbers behind vague CV claims), un-probed scope details ("*probe: team size, endpoints count*" style markers already in the Experience Ledger), thin-evidence competencies flagged on the Stat Sheet, or side-quest calibration (what actually recharges them, so the System's adaptive quest recommendations stay aligned to your needs).

3. **Write answers into the right place as you go**: factual/positioning updates → Status Window sections directly (`update_content` for targeted edits, not a full page rewrite); numeric proof points → the Metrics Bank table with Context/Role/Verified columns; competency evidence → the Stat Sheet.

4. **Never inflate.** The Status Window "only contains claims the player can defend under interview pressure" — mark thin evidence as thin, don't round a vague answer into a precise-sounding metric.

5. **XP**: before logging anything, query the XP Ledger for an existing "Intake completed" row — if one exists, this is an update, not a first completion, so skip the +100 regardless of how the Status Window currently looks (don't re-judge "skeletal vs populated" on every run, trust the ledger). Only log **+100 XP ("Intake completed")** when no such row exists yet. A later single-metric or single-answer bank is worth logging as a smaller, specific action if the Game Rules table (in the boot card) covers it — e.g. a story added to the Skill Inventory = +20, a development action completed on the Stat Sheet = +30, each checked against its own existing-row guard the same way. If nothing in the table fits, don't invent a number — just log the update without XP.

6. **Report back** a short summary of what got banked this session and what's still open for next time.
