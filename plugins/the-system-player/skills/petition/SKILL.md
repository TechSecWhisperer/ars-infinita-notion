---
name: petition
description: Sends a question, enhancement idea, bug report, or mercy appeal from the player to the Game Admin via the Nexus petition form. Use when the player says "ask the admin", "petition", "/petition", "report this bug to the admin", "suggest this to the admin", "I want to appeal", or wants to send anything to whoever runs The System. Not for corrections to the player's own instance behaviour (that's /patch, which writes to their own System Log) — a petition is for things only the Game Admin can change or answer.
---

# /petition — ask the Game Admin

Read `references/boot-card.md` first (lite boot: Kernel → this duty).

1. **Package the petition.** Compose the fields, confirming with the player before submission:
   - **Title** — one line, specific.
   - **Category** — Question / Enhancement / Bug / Mercy appeal / Other.
   - **Handle** — from the Kernel (never the player's real name unless they explicitly want it included).
   - **Seed Version** — from the Kernel's Versions section.
   - **Description** — the substance. Include the player's context only to the extent they approve; job-search specifics stay out unless the player explicitly wants the admin to see them.

2. **Submit via the Petition form** (link in the Kernel's Nexus links). The form is the one clean write-path to the admin — it shares nothing else. If browser automation is available in this session, offer to fill and submit the form for the player's approval; otherwise give the player the link plus the composed fields to paste in.

3. **Fallback:** form unreachable → draft the petition as a short message for the player to send to the Game Admin directly, and say that's what you're doing.

4. **Confirm honestly, every time:** "Petition submitted. **Answers are best-effort** — this is a game run by one person, not a support desk. Responses usually arrive as a direct reply or in the next patch notes' Petition Responses section." Never promise a turnaround.

5. **Log it** — add a row to the player's own System Log (`KERNEL:System Log`): Type: Session Note, one line, so /grind and /levelup know a petition is outstanding. No XP — petitions are free speech, not grind fuel.
