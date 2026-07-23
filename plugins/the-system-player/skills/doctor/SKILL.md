---
name: doctor
description: Diagnoses and repairs the player's instance of The System — a battery of PASS/WARN/FAIL checks (Notion access, Kernel and rule-surface integrity, schedules, Player-Card vs XP-Ledger reconciliation, version-vs-feed), each classified local or remote, then fixes local problems via the idempotent /awaken repair path and escalates remote ones via /petition. Use when the player says "/doctor", "something's broken", "run diagnostics", "check my system", "is my setup healthy", or after an error. Degrades gracefully on browser-less sessions.
---

Read `references/boot-card.md` first (Sigil Check, boot ritual, "/vitals and /doctor"). `/doctor` is diagnostics + repair in the `flutter doctor` / `brew doctor` idiom — a battery of checks, each PASS / WARN / FAIL with specifics, then fixes.

## Step 1 — run /vitals first
Start with the `/vitals` capability probe. Its profile tells you which later checks you can actually run — a browser-less session can't reach a browser-gated feed, so mark those SKIPPED (needs desktop), don't FAIL them.

## Step 2 — the check battery
Run each; report PASS / WARN / FAIL with a one-line specific:

1. **Notion access** — the /vitals connector result. FAIL stops the run (nothing else is checkable).
2. **Kernel integrity** — does the 🧬 Kernel page exist with a complete Instance ID table + Player + Versions + Nexus links? Missing/empty → not initialised. Partial → note which sections are missing.
3. **Rule-surface / Sigil Check** — compare local rule surfaces against the Nexus 📜 Rule Manifest (needs feed reachability). Drift → WARN, name the surface. Restore is always FROM the Manifest.
4. **Schedules** — enumerate the session's scheduled tasks and compare against what the player opted into (recorded in the Kernel's schedules note, or the System Log setup entry). Missing where expected → WARN. If there's no opt-in record to compare against, report "unknown" — don't guess.
5. **Player-Card ↔ XP-Ledger reconcile** — does displayed Total XP equal the Ledger sum? Mismatch → WARN (recompute FROM the ledger, visibly, never a silent rewrite).
6. **Mechanics Version vs Patch-Feed head** — behind → WARN (a head-check / migration is due).

## Step 3 — classify each failure local vs remote
- **Local** (the player's own instance — a missing database or schedule, a drifted surface, a partial Kernel): fixable here.
- **Remote** (admin/Nexus-side — a broken Patch Feed page, a Rule Manifest that itself looks wrong): not the player's to fix.

## Step 4 — repair

**First, respect standing rules & freezes.** Re-read the player's System Log for a Standing-Rule Correction or maintenance freeze (boot ritual step 3). If writes are frozen, STOP here — report the scorecard and what *would* be repaired, make no writes, no /awaken, no schedule changes. Repairs resume only when the freeze lifts.

**Never rebuild a live instance.** An empty or "uninitialised-looking" Kernel *together with* a populated Quest Board / XP Ledger means a **Kernel-resolution problem**, not an uninitialised instance — treat it as a WARN and log an Open Question, never an /awaken rebuild. Only run the /awaken *build* path when corroborating probes agree the instance is genuinely absent (no Hub, no databases). Running /awaken over live data is destructive-by-omission, so this guard is mandatory.

- **Local → run the /awaken repair path** (subject to the two guards above). It's idempotent and ledger-keyed, so it rebuilds only what's missing and never double-awards — recreate a missing schedule, rewrite a drifted surface from the Manifest, rebuild a genuinely partial Kernel. Re-run the affected checks after to confirm PASS.
- **Remote → escalate via /petition.** Package the failing checks (Category: Bug) and submit through the petition form so it reaches the Game Admin. Tell the player plainly it's admin-side, best-effort response.

## Step 5 — report
A short scorecard — each check with its verdict, what was fixed locally, what was escalated, what still needs their desktop. On a healthy system, say so in one line, not a wall of green.

## Graceful degradation
On a browser-less / app-only session, most checks still run — Notion access, Kernel integrity, Player-Card reconcile, **and the Sigil Check and version head-check, because the Patch Feed and Rule Manifest live in Notion** (reachable via the connector). Only checks needing an off-Notion resource (the `feed.json` mirror) are SKIPPED (needs a browser). Never present a partial run as a clean bill of health, and never mark a Notion-reachable check as "needs desktop".
