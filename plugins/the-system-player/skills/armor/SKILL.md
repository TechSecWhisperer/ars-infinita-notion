---
name: armor
description: Builds the player's tailored CV for a tracked quest — their armor for the battle. Drafts it from the Status Window, Stat Sheet, and STAR stories plus the JD and appraisal into an EDITABLE native-Notion-blocks master on the quest, runs the mandatory /ghost voice pass, then exports a send-ready HTML copy (attached to the quest) and an editable .docx. Use when the player says "/armor", "build my CV for X", "tailor my resume for this role", "make a CV", or when another command hands off before an application. Pairs with /forge (the cover letter). Not for cover letters (/forge) or de-AIing arbitrary text (/ghost).
---

Read `references/boot-card.md` first (Kernel IDs, XP table, hard rules — especially rule 4 confidentiality and the 🗒 Agent Notes pattern). `/armor` builds the tailored CV that `/appraise`, `/engage`, and the "Tailored CV built +20" XP line all assume exists but nothing else creates. It's the defensive half of an application; `/forge` is the offensive half (the cover letter).

## Theme
Canonical game-theme command: **/armor** (your CV is the armor you carry into every battle). Professional-theme label: **Build CV**. Follows the Theme Registry like every other command — `/theme` swaps the display label, never the invocation. (Registry row to add: The System = "/armor / Armor", Professional = "Build CV".)

## The model — editable master in Notion, exports generated from it
- **Master = native Notion blocks**: one CV note per quest in `KERNEL:Agent Notes` (Type: `CV` if that option exists, else Type: `Other` with the title "CV — <role>"; Status: Current; `Related Quest` set). The player edits this **directly in Notion** OR by asking the agent — both act on the same page, so there is one source of truth, never a fork.
- **Exports = generated from the master**: a styled, ATS-clean **HTML** copy attached to the quest page (the "viewable copy"), and an editable **.docx** delivered to the player. Regenerate both after any edit — they are renders, not the master.

## Steps
1. **Gather source (never invent — hard rule 3).** Pull the Status Window + Stat Sheet (Competency Matrix) + banked STAR stories (Story Bank) + the quest's JD + the Current appraisal Agent Note + Gate Intel. Confidential items (hard rule 4) never appear.
2. **Draft the tailored CV** into the master note as native Notion blocks: contact line, a 2–3 line summary mapped to the JD, core skills, experience with metric-backed bullets chosen for THIS role, education/certs. **ATS-clean** (no tables/columns/graphics that break parsers). Map real evidence to the JD's must-haves; a genuine gap is logged as an Open Question, never fabricated.
3. **Mandatory /ghost voice pass** — run the draft through `/ghost` so it reads as the player, not as Claude. Never skip this.
4. **Let the player edit.** Show them the master and invite edits (in Notion, or by telling you). Only export once they're happy — it's their CV.
5. **Export send-ready files from the approved master:**
   - **HTML** — a self-contained, styled, print-friendly HTML file; attach it to the quest page as the viewable copy (`notion-create-attachment`).
   - **.docx** — build via the **docx skill** (read its SKILL.md first), then deliver it to the player (their file to submit).
6. **File + track.** Set the quest's `CV Version Sent` (e.g. "<Role> v1 (built <date>)"); keep the master note Status: Current and mark any prior CV note for this quest Superseded; award **+20 "Tailored CV built: <role>"** — ONCE per version: before writing the XP row, check the XP Ledger for an existing "Tailored CV built: <role>" row (hard rule 2); a redraft of the same version never re-awards. Recompute Total XP / level (hard rule 5).

## Notes
- **Reusable base vs tailored:** the Status Window holds the durable profile; each `/armor` produces a role-tailored copy — never overwrite the profile with one role's framing.
- **Honesty:** no invented titles, dates, employers, or metrics (hard rule 3); a real gap is disclosed, not papered over.
- **App-only session:** build the Notion master anywhere; the .docx/HTML export may need a file-capable desktop — say so and hand exports over there (see `/vitals`).
