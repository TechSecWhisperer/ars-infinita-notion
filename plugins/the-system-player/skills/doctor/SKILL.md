---
name: doctor
description: Diagnoses and repairs the player's instance of The System — a battery of PASS/WARN/FAIL checks (Notion access, Kernel and rule-surface integrity, schedules, Player-Card vs XP-Ledger reconciliation, version-vs-feed), each classified local or remote, then fixes local problems via the idempotent /awaken repair path and escalates remote ones via /petition. Use when the player says "/doctor", "something's broken", "run diagnostics", "check my system", "is my setup healthy", or after an error. Needs no browser — every check runs off the Notion connector or a plain HTTPS fetch.
featured: 10
tagline: "Run diagnostics and self-repair your setup."
---

Read the shared boot card `${CLAUDE_SKILL_DIR}/../../references/boot-card.md` first (Sigil Check, boot ritual, "/vitals and /doctor"). `/doctor` is diagnostics + repair in the `flutter doctor` / `brew doctor` idiom — a battery of checks, each PASS / WARN / FAIL with specifics, then fixes.

## Step 1 — run /vitals first
Start with the `/vitals` capability probe. Its profile tells you which later checks you can actually run — mark a check SKIPPED (with the specific missing capability) rather than FAILED when the session genuinely can't run it. Note that **no check in this battery is browser-gated**: everything below runs off the Notion connector or a plain HTTPS GET.

## Step 2 — the check battery
Run each; report PASS / WARN / FAIL with a one-line specific:

1. **Notion access** — the /vitals connector result. FAIL stops the run (nothing else is checkable).
2. **Kernel integrity** — does the 🧬 Kernel page exist with a complete Instance ID table + Player + Versions + Nexus links? Missing/empty → not initialised. Partial → note which sections are missing.
3. **Rule-surface / Sigil Check** — compare local rule surfaces against the Nexus 📜 Rule Manifest (needs feed reachability). Drift → WARN, name the surface. Restore is always FROM the Manifest.
4. **Schedules** — enumerate the session's scheduled tasks and compare against what the player opted into (recorded in the Kernel's schedules note, or the System Log setup entry). Missing where expected → WARN. If there's no opt-in record to compare against, report "unknown" — don't guess.
   - **Daily Quest Briefing check (where tools allow):** if scheduled-task tools are available this session, check whether a briefing schedule exists — **matching on purpose, not on name**: a schedule counts when its prompt/config indicates daily-briefing duties and its cadence resolves to weekday mornings (~8am) in the Kernel's timezone. The name "Daily Quest Briefing" is a hint, never the test — a renamed but live briefing must not be reported missing (issue #26). Genuinely missing (and the player didn't decline one during /awaken or a later ask) → WARN, and offer to run /awaken's Step 6.5 daily-rhythm setup to create it. On a surface without scheduled-task tools, skip this sub-check as "needs a capable surface" rather than WARN or FAIL.
5. **Player-Card ↔ XP-Ledger reconcile** — does displayed Total XP equal the Ledger sum? Mismatch → WARN (recompute FROM the ledger, visibly, never a silent rewrite).
6. **Mechanics Version vs Patch-Feed head** — behind → WARN (a head-check / migration is due).
7. **📆 Next Actions view exists** — the Quest Board has a calendar view dated on `Next Action Due` (the dating property is the test; the view name is a hint). Missing → WARN, classified **local**, repaired via /awaken's idempotent Step 1 view creation. Catches the migration gap where the legacy calendar writers were removed but the replacement view never landed (issue #27).

## Step 3 — classify each failure local vs remote
- **Local** (the player's own instance — a missing database or schedule, a drifted surface, a partial Kernel): fixable here.
- **Remote** (admin/Nexus-side — a broken Patch Feed page, a Rule Manifest that itself looks wrong): not the player's to fix.

## Step 4 — repair

**First, respect standing rules & freezes.** Re-read the player's System Log for a Standing-Rule Correction or maintenance freeze (boot ritual step 3). If writes are frozen, STOP here — report the scorecard and what *would* be repaired, make no writes, no /awaken, no schedule changes. Repairs resume only when the freeze lifts.

**Never rebuild a live instance.** An empty or "uninitialised-looking" Kernel *together with* a populated Quest Board / XP Ledger means a **Kernel-resolution problem**, not an uninitialised instance — treat it as a WARN and log an Open Question, never an /awaken rebuild. Only run the /awaken *build* path when corroborating probes agree the instance is genuinely absent (no Hub, no databases). Running /awaken over live data is destructive-by-omission, so this guard is mandatory.

- **Local → run the /awaken repair path** (subject to the two guards above). It's idempotent and ledger-keyed, so it rebuilds only what's missing and never double-awards — recreate a missing schedule, rewrite a drifted surface from the Manifest, rebuild a genuinely partial Kernel. Re-run the affected checks after to confirm PASS.
- **Remote → escalate via /petition.** Package the failing checks (Category: Bug) and file them through `/petition`, which opens a GitHub Issue on the plugin repo so it reaches the Game Admin. A diagnostic scorecard is game-state, not job-search data, but the issue is public — show the player the body before it goes. Tell them plainly it's admin-side, best-effort response.

## Step 5 — report
A short scorecard — each check with its verdict, what was fixed locally, what was escalated, what still needs their desktop. On a healthy system, say so in one line, not a wall of green.

## Graceful degradation
**Every check above runs on a browser-less / app-only session.** Notion access, Kernel integrity, Player-Card reconcile, the Sigil Check and the version head-check all reach their source through the Notion connector; and the public `feed.json` mirror is read with a plain HTTPS GET of

```
https://raw.githubusercontent.com/TechSecWhisperer/ars-infinita-notion/main/feed.json
```

which any agent that can make an HTTP request or run `curl` can do. **That URL is cache-unreliable, and check 6 must not be decided from it alone.** It has been observed serving a stale `head` across repeated fetches while the Notion feed was already ahead — so a mirror/Kernel mismatch read from `/main/` is not by itself a "behind" verdict. Confirm against the Notion Patch Feed through the connector before reporting check 6 as WARN; the Notion feed wins any disagreement. Reporting drift on one uncorroborated `/main/` fetch is a false alarm, not a finding. There is no browser-gated check here — never mark one "needs a browser" or "needs desktop". The only honest SKIP is a capability the session genuinely lacks (e.g. no scheduled-task tools for the Daily Quest Briefing sub-check, or no HTTP capability at all for the mirror — in which case the Notion Patch Feed still answers the same question). Never present a partial run as a clean bill of health.
