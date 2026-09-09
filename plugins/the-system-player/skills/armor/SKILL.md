---
name: armor
description: Builds the player's tailored CV for a tracked quest — their armor for the battle. Drafts it from the Status Window, Stat Sheet, and STAR stories plus the JD and appraisal into an EDITABLE native-Notion-blocks master on the quest, runs the mandatory /ghost voice pass, then exports a send-ready HTML copy (attached to the quest) and an editable .docx. Sections are a reorderable library — the player can move, add, drop or rename any section by name, and pick a layout preset. Adapts to the target country's conventions (length, photo, referees, work rights, spelling, dates). Use when the player says "/armor", "build my CV for X", "tailor my resume for this role", "make a CV", "move my skills section up", "reorder my resume", "make this CV work for Germany/the US/the UK", or when another command hands off before an application. Pairs with /forge (the cover letter). Not for cover letters (/forge) or de-AIing arbitrary text (/ghost).
---

Read the shared boot card `${CLAUDE_SKILL_DIR}/../../references/boot-card.md` first (Kernel IDs, XP table, hard rules — especially rule 4 confidentiality and the 🗒 Agent Notes pattern), then `references/RESUME-LIBRARY.md` for the section library, layout presets, regional conventions and formatting standards. `/armor` builds the tailored CV that `/appraise`, `/engage`, and the "Tailored CV built +20" XP line all assume exists but nothing else creates. It's the defensive half of an application; `/forge` is the offensive half (the cover letter).

## Theme
Canonical game-theme command: **/armor** (your CV is the armor you carry into every battle). Professional-theme label: **Build CV**. Follows the Theme Registry like every other command — `/theme` swaps the display label, never the invocation. (Registry row to add: The System = "/armor / Armor", Professional = "Build CV".)

## The model — editable master in Notion, exports generated from it
- **Master = native Notion blocks**: one CV note per quest in `KERNEL:Agent Notes` (Type: `CV` if that option exists, else Type: `Other` with the title "CV — <role>"; Status: Current; `Related Quest` set). The player edits this **directly in Notion** OR by asking the agent — both act on the same page, so there is one source of truth, never a fork.
- **Exports = generated from the master**: a styled, ATS-clean **HTML** copy attached to the quest page (the "viewable copy"), and an editable **.docx** delivered to the player. Regenerate both after any edit — they are renders, not the master.
- **Section order lives on the master.** Record the chosen layout id and the resolved section order in the master note's first block, so a later edit or a later run reorders from what the player actually chose rather than resetting to the default.

## The section library — every section is a movable part
`references/RESUME-LIBRARY.md` defines each section once, with a stable `id` and the names players actually use for it. That table is what makes "move my skills above experience", "drop the interests bit", "add work rights", "put certs at the top" resolvable instead of guesswork.

- **Resolve by id or alias.** The player never has to know the id. "work history", "employment", "my jobs" all resolve to `experience`. If a request is genuinely ambiguous between two sections, ask once — don't guess.
- **A layout is just an ordered list of section ids.** Switching layout reorders; it never rewrites content or drops a section's text.
- **Reorder is not a rebuild.** Moving a section edits the master's block order and regenerates the exports. It does not re-draft bullets, does not re-run `/ghost`, and does not award XP again.
- **Honour the player's order.** Once they've moved something, that is their preference for this quest — don't quietly restore the preset on the next edit. If their order breaks a hard convention for the target market (a photo on a US application), say so once, plainly, and let them decide.
- **Adding a section that has no content is a question, not an invention.** Ask for the content or leave the section out (hard rule 3).

## Target market — ask before drafting
Resume convention is not universal, and the failure runs both ways: a photo can force a US employer to bin the application, and a missing data-consent line can void a Polish one. `references/RESUME-LIBRARY.md` carries a profile per region.

1. **Establish the target country from the quest** (the posting's location), not the player's. Applying from Melbourne to a London role is the UK profile.
2. **Apply the profile**: document name, length, spelling, date format, required sections, sections to omit, and the per-section notes.
3. **Say what you changed and why** in one line — "two pages and no photo, per UK convention" — so the player can overrule it.
4. **Work rights matter more than anything else on a cross-border application.** If the quest is in another country, the `work-authorization` section goes in and gets a straight answer. Silence on it is read as "needs sponsorship".
5. **Unknown or mixed market** (fully remote, global company, no location given): use the `ats-reverse-chron` default with no personal details, and say that's what you did.

## Steps
1. **Gather source (never invent — hard rule 3).** Pull the Status Window + Stat Sheet (Competency Matrix) + banked STAR stories (Story Bank) + the quest's JD + the Current appraisal Agent Note + Gate Intel. Confidential items (hard rule 4) never appear.
2. **Pick the target market and the layout.** Region from the quest's location (above); layout from the presets — `ats-reverse-chron` unless the player's situation matches another. Confirm both in one short line rather than a questionnaire.
3. **Draft the tailored CV** into the master note as native Notion blocks, in the resolved section order. **ATS-clean** (no tables/columns/graphics that break parsers). Follow the library's formatting, bullet and ATS standards. Map real evidence to the JD's must-haves; a genuine gap is logged as an Open Question, never fabricated.
4. **Mandatory /ghost voice pass** — run the draft through `/ghost` so it reads as the player, not as Claude. Never skip this.
5. **Let the player edit and reorder.** Show them the master, the layout used, and the section order, and invite changes — including moving sections. Only export once they're happy — it's their CV.
6. **Export send-ready files from the approved master:**
   - **HTML** — a self-contained, styled, print-friendly HTML file; attach it to the quest page as the viewable copy (`notion-create-attachment`).
   - **.docx** — build via the **docx skill** (read its SKILL.md first), then deliver it to the player (their file to submit).
7. **File + track.** Set the quest's `CV Version Sent` (e.g. "<Role> v1 (built <date>)"); keep the master note Status: Current and mark any prior CV note for this quest Superseded; award **+20 "Tailored CV built: <role>"** — ONCE per version: before writing the XP row, check the XP Ledger for an existing "Tailored CV built: <role>" row (hard rule 2); a redraft, a reorder, or a region switch of the same version never re-awards. Recompute Total XP / level (hard rule 5).

## Notes
- **Reusable base vs tailored:** the Status Window holds the durable profile; each `/armor` produces a role-tailored copy — never overwrite the profile with one role's framing.
- **Honesty:** no invented titles, dates, employers, or metrics (hard rule 3); a real gap is disclosed, not papered over. This binds the regional profiles too — adapting to a market changes presentation, never facts.
- **Provenance:** the library tags each rule `V` (verified against a cited source), `S` (attributed but unverified) or `G` (general practice). Never tell a player a rule comes from a named institution unless it is tagged `V`.
- **Keeping the library current:** `node tools/resume_library.mjs sources` checks the cited pages for drift; `build` regenerates `RESUME-LIBRARY.md` from `resume-library.json`, which is the only file to hand-edit.
- **App-only session:** build the Notion master anywhere; the .docx/HTML export may need a file-capable desktop — say so and hand exports over there (see `/vitals`).
