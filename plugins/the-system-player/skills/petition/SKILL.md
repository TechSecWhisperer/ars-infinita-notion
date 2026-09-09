---
name: petition
description: Sends a question, enhancement idea, bug report, or mercy appeal from the player to the Game Admin by filing an issue on the public ars-infinita-notion repo. Use when the player says "ask the admin", "petition", "/petition", "report this bug to the admin", "suggest this to the admin", "I want to appeal", or wants to send anything to whoever runs The System. Not for corrections to the player's own instance behaviour (that's /patch, which writes to their own System Log) — a petition is for things only the Game Admin can change or answer.
---

# /petition — ask the Game Admin

Read the shared boot card `${CLAUDE_SKILL_DIR}/../../references/boot-card.md` first (lite boot: Kernel → this duty).

The petition write-path is a **GitHub Issue on `TechSecWhisperer/ars-infinita-notion`** — the same public repo the plugin installs from. No browser and no form: `gh issue create` is a plain shell call, so this command runs on any surface that has a shell, and the fallback below covers the ones that don't.

1. **Package the petition.** Compose the fields, confirming with the player before submission:
   - **Title** — one line, specific.
   - **Category** — Question / Enhancement / Bug / Mercy appeal / Other.
   - **Handle** — from the Kernel (never the player's real name unless they explicitly want it included).
   - **Seed Version** — the Seed template version from the Kernel's Versions section (say which version you mean; the Kernel also records a Mechanics Version, and they are different numbers).
   - **Description** — the substance. Include the player's context only to the extent they approve.

   **A GitHub issue is public.** Say that plainly before you submit, in one line, and keep job-search specifics — employers, roles, salaries, contacts, document contents — out of the issue body unless the player explicitly asks for them to be in it. Hard rule 4 (confidentiality) binds here exactly as it does in employer-facing material.

2. **File the issue.**

   ```sh
   gh issue create --repo TechSecWhisperer/ars-infinita-notion \
     --title "[<Category>] <Title>" \
     --label petition \
     --body "<the composed body>"
   ```

   The `petition` label is what makes both filing routes look the same to the admin — the
   web form applies it too. Keep the `[<Category>]` title prefix for the same reason.

   Body layout — keep it this shape so the admin can triage a stack of them quickly:

   ```
   **Category:** <Question | Enhancement | Bug | Mercy appeal | Other>
   **Handle:** <handle>
   **Seed version:** <seed template version>
   **Mechanics version:** <mechanics version>

   <description>
   ```

   Show the player the exact title and body and get a yes before running the command. Report the issue URL `gh` prints back.

3. **Fallback — no `gh`, or it isn't authenticated.** Don't fake a submission and don't fall back to a browser. Tell the player plainly and give them the link to open themselves:

   **https://github.com/TechSecWhisperer/ars-infinita-notion/issues/new/choose**

   Hand them the composed title and body as copy-pasteable text alongside it. If they'd rather not use GitHub at all, draft the petition as a short message for them to send to the Game Admin directly, and say that's what you're doing.

4. **Confirm honestly, every time:** "Petition filed. **Answers are best-effort** — this is a game run by one person, not a support desk. Responses usually arrive on the issue itself or in the next patch notes' Petition Responses section." Never promise a turnaround.

5. **Log it** — add a row to the player's own System Log (`KERNEL:System Log`): Type: Session Note, one line including the issue URL, so /grind and /levelup know a petition is outstanding. No XP — petitions are free speech, not grind fuel.
