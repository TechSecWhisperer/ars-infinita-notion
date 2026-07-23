---
name: levelup
description: Runs the player's weekly review ritual for The System — pipeline check, archive stats (response rates), a lint pass over the wiki for contradictions/stale claims, and 2-3 logged Enhancement Suggestions. Use when the player says "run the weekly review", "let's do the Friday review", "/levelup", or when a scheduled Friday trigger fires this command.
---

Read `references/boot-card.md` first for IDs and hard rules. This is a **full-boot-worthy** session (per the boot card's progressive-disclosure rule, weekly reviews are one of the few cases that warrant reading the Operating Manual + System Log corrections in full, not just this skill's lite reference) — if you have time/budget, read the live Operating Manual (`KERNEL:Operating Manual`) and check System Log corrections before proceeding, since a week's worth of /patch corrections may have landed since this skill's bundled reference was last shipped.

## What /levelup does
Weekly ritual: pipeline + archive stats + lint pass + 2–3 Enhancement Suggestions logged. **+50 XP** on completion, once per week.

## Steps

0. **Idempotency check (do this first, before anything else)**: query the XP Ledger for an existing "Weekly review completed" row in the last 7 days. If one exists, this is a same-day/same-week re-run — treat it as a continuation (patch/extend the existing review rather than redoing it) and skip the +50 XP in step 7.

1. **Pre-flight**: check the latest Daily Log entry for today's local date (player's timezone) — if this is a same-day re-run, this is a continuation, not a fresh weekly review; patch/extend rather than double-logging.

2. **Pipeline review**: run the same scan as /grind — overdue follow-ups, stale quests, open next actions — but with a week's-eye view (what moved this week, what's stuck).

3. **Archive stats**: response rates by message type/channel from the Battle Log over the past week (or since the last /levelup) — how many outbound touches, how many got a reply, roughly how fast.

4. **Lint pass**: check for contradictions between wiki pages (e.g. Status Window claims vs Stat Sheet ratings), stale claims (research older than 30 days still marked current on an *active* quest — check Gate Intel `Last Refreshed` against linked Quest Board stages), orphaned entries (a Quest Board row with no Gate Intel link, a Hunter Network contact with no Company relation), and missing cross-references. Fix trivial ones directly; log structural ones as Enhancement Suggestions rather than restructuring the wiki unilaterally.

5. **Log 2-3 Enhancement Suggestions** to the System Log (`Type: Enhancement Suggestion`, `Status: Open`) with real evidence from this week's activity — not generic "consider doing X better" filler. the player marks them Adopted/Declined; adopted ones get actioned and folded into the Operating Manual by a future /patch or manual edit, not by this skill automatically rewriting the Manual.

6. **Sigil Check (full)**: compare your local rule surfaces (Kernel hard rules, XP table, level curve, command list, Party Wall) against the Nexus Rule Manifest (link in the Kernel). Restore any drifted rule copy from the Manifest, log it as a Correction in the player's System Log, and mention it in the report-back ("⚙️ Sigil Check: N rule surfaces re-synced"). Also reconcile the Player Card's displayed Level/XP against the XP Ledger sum — a mismatch is recomputed from the ledger with a visible correction note, never silently.

7. **Log +50 XP** ("Weekly review completed", `Category: Weekly Ritual`) once the above is done — skip this if step 0 found an existing entry this week. Recompute Total XP, check for a level-up.

8. **Report back**: pipeline summary, stats, lint findings (fixed vs logged), the Enhancement Suggestions raised, and confirm the XP/level state.
