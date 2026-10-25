---
name: petition
description: Sends a question, enhancement idea, bug report, or mercy appeal from the player to the Game Admin through public GitHub Issues. Use when the player says "ask the admin", "petition", "/petition", "report this bug to the admin", "suggest this to the admin", "I want to appeal", or wants to send something only the Game Admin can change or answer. Not for corrections to the player's own instance behaviour (that's /patch, which writes to their own System Log).
---

# /petition: ask the Game Admin

Read the shared boot card `${CLAUDE_SKILL_DIR}/../../references/boot-card.md` first (lite boot: Kernel to this duty).

Submit petitions as public GitHub Issues on `TechSecWhisperer/ars-infinita-notion`. Keep confidential job-search details, personal information, and document contents out of the issue.

## 1. Package the petition

Compose the fields and show the player the exact title and body before submission:
- **Title**: One line, specific.
- **Category**: Question, Enhancement, Bug, Mercy appeal, or Other.
- **Handle**: From the Kernel. Never use the player's real name unless they explicitly ask for it.
- **Seed Version**: The Seed template version from the Kernel's Versions section.
- **Mechanics Version**: The Mechanics Version from the Kernel.
- **Description**: The substance, without private job-search information unless the player explicitly asks to include it.

Layout:

```
**Category:** <Question | Enhancement | Bug | Mercy appeal | Other>
**Handle:** <handle>
**Seed version:** <seed template version>
**Mechanics version:** <mechanics version>

<description>
```

## 2. Check GitHub capability and confirm

Check whether `gh` is authenticated with `gh auth status`. Explain that the issue will be public and ask the player to confirm the exact title and body before submission.

## 3. Submit through GitHub Issues

After confirmation, if `gh` is authenticated, create the issue:

```sh
gh issue create --repo TechSecWhisperer/ars-infinita-notion \
  --title "[<Category>] <Title>" \
  --label petition \
  --body "<the composed body>"
```

The `petition` label and `[<Category>]` prefix align intake with triage. Report the issue URL returned by `gh`.

If `gh` is absent or unauthenticated, report **unavailable** (the shell submission was not completed), preserve the exact prepared title/body, and give the player this route to submit themselves:
https://github.com/TechSecWhisperer/ars-infinita-notion/issues/new/choose

## 4. Confirm honestly

Say that the petition was filed and that substantive responses are best-effort. Do not promise a turnaround.

## 5. Log it

Add a row to the player's own System Log (`KERNEL:System Log`): Type: Session Note, with the issue URL, so `/grind` and `/levelup` can see that a petition is outstanding. No XP. Petitions are free speech, not grind fuel.
