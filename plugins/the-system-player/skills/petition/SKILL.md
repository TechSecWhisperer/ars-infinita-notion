---
name: petition
description: Sends a question, enhancement idea, bug report, or mercy appeal from the player to the Game Admin via GitHub Issues (requires GitHub account) or the Notion petition form (requires in-built or agent browser tools from paid subscriptions). Use when the player says "ask the admin", "petition", "/petition", "report this bug to the admin", "suggest this to the admin", "I want to appeal", or wants to send anything to whoever runs The System. Not for corrections to the player's own instance behaviour (that's /patch, which writes to their own System Log). A petition is for things only the Game Admin can change or answer.
---

# /petition: ask the Game Admin

Read the shared boot card `${CLAUDE_SKILL_DIR}/../../references/boot-card.md` first (lite boot: Kernel to this duty).

The petition channel offers two paths:
1. **GitHub Issues on `TechSecWhisperer/ars-infinita-notion`**: Requires a GitHub account and authenticated `gh` CLI. Publicly visible.
2. **Notion Petition Intake**: Requires in-built browser or agent browser tools (`/browse`). Private to Game Admin triage. Available when the player uses a paid agent subscription (Claude Desktop, OpenAI Canvas or Plus, Codex, Antigravity).

## 1. Package the petition

Compose the fields, confirming with the player before submission:
- **Title**: One line, specific.
- **Category**: Question, Enhancement, Bug, Mercy appeal, or Other.
- **Handle**: From the Kernel. Never use the player's real name unless they explicitly ask for it.
- **Seed Version**: The Seed template version from the Kernel's Versions section.
- **Mechanics Version**: The Mechanics Version from the Kernel.
- **Description**: The substance. Keep job-search specifics (employers, roles, salaries, contacts, document contents) out of the description unless the player explicitly asks for them. Hard rule 4 (confidentiality) binds here.

Layout:

```
**Category:** <Question | Enhancement | Bug | Mercy appeal | Other>
**Handle:** <handle>
**Seed version:** <seed template version>
**Mechanics version:** <mechanics version>

<description>
```

## 2. Check capabilities and ask player preference

Inspect available session capabilities:
- Check `gh` CLI authentication (`gh auth status`).
- Check browser capability via `/vitals` or agent browser tools (`/browse` with `agent-browser` or built-in browser).

Ask the player their preferred channel:
- **Option 1: GitHub Issue.** Requires a GitHub account. The submission is public.
- **Option 2: Notion Petition Form.** Requires in-built or agent browser tools from a paid agent plan. The submission is private to admin triage.

## 3. Submit via the chosen channel

### Path A: GitHub Issue

If the player chooses GitHub (or only `gh` is available):

```sh
gh issue create --repo TechSecWhisperer/ars-infinita-notion \
  --title "[<Category>] <Title>" \
  --label petition \
  --body "<the composed body>"
```

The `petition` label and `[<Category>]` prefix align both intake channels.
Show the player the exact title and body and get confirmation before running the command. Report the issue URL that `gh` returns.

**Fallback when `gh` is absent or unauthenticated:**
Report **unavailable** (the shell submission was not completed), preserve the exact prepared title/body for the player, and give them the link to open themselves:
https://github.com/TechSecWhisperer/ars-infinita-notion/issues/new/choose

### Path B: Notion Petition Form

If the player chooses Notion:
1. Check if browser tools are available. If running with a paid agent subscription that supports browser automation, use `/browse` to open the Notion petition intake form:
   `https://app.notion.com/p/3a93acf23dd94ba09b1e1fbe1c53ce4c`
2. Fill the form fields using the packaged petition payload: Category, Handle, Seed Version, Title, and Description.
3. Submit the form and verify the confirmation screen.
4. **Fallback:** If no browser tools are available in the current session, provide the direct Notion form URL and the packaged fields so the player can paste them in their own browser.

## 4. Confirm honestly, every time

"Petition filed. Answers are best-effort. This is a game run by one person, not a support desk. Responses usually arrive on the issue itself, via Notion triage reply, or in the next patch notes." Never promise a turnaround.

## 5. Log it

Add a row to the player's own System Log (`KERNEL:System Log`): Type: Session Note, one line including the issue URL or Notion submission confirmation, so `/grind` and `/levelup` know a petition is outstanding. No XP. Petitions are free speech, not grind fuel.
