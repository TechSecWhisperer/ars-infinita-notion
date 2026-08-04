# Changelog

All notable player-facing changes to Ars Infinita Notion (A.I.N) are logged here. Dates are UTC.

Version numbers here are the **plugin/mechanics version** — the same number the Patch Feed calls `mechanics_version`, and the one set in `plugins/the-system-player/.claude-plugin/plugin.json`. It is the only hand-set version in this repo. Two other numbers appear elsewhere and version different things: the **Seed / template-schema revision** (the shape of your Notion template) and the `@ars-infinita/system-skills` **package version** (build tooling for non-Claude CLIs). They are not expected to match this one.

## v1.3.1 — 2026-08-05

The build the Patch Feed announced on 2026-08-01 as "the build landed". **If your plugin still reports 1.3.0, run `/plugin update` — the 1.3.1 manifests were never published, so the update prompt never fired.** That is fixed here, and it is the reason this entry exists.

**Now actually in your installed plugin** (adopted as rule in v1.3.0)
- Stage-weighted follow-up. Quests nobody has answered no longer raise overdue flags or streak consequences.
- The theme question at setup. `/awaken` asks, and won't proceed until you answer.

**Changed**
- **`/petition` now files a GitHub Issue** on the public plugin repo instead of submitting a Notion form. It works on any session with a shell — no browser needed — and if the `gh` tool isn't available it hands you the link and the composed text to post yourself. **Read this bit:** a GitHub issue is public. Your agent will say so before filing, will show you the exact text first, and keeps job-search specifics out unless you ask for them. Handle registration and party requests go the same route.
- **Your due follow-ups are no longer copied into 📅 System Calendar.** `Next Action` / `Next Action Due` live on your Quest Board and only there — `/awaken` now adds a **📆 Next Actions** calendar view to the board itself, so you still see them on a calendar, but you're looking at the real row instead of a copy. Previously, editing a due date on the board left a stale duplicate sitting in the Calendar with the old date. If you have leftover `Follow-up Due` rows from before, they're harmless and you can delete them. Your briefings, weekly reviews and reminders still land in System Calendar exactly as before — that part is unchanged.
- **The Patch Feed no longer needs a browser, on any path.** Both the Notion feed and the public `feed.json` mirror are plain reads any agent can do, so `/doctor` and `/vitals` stop reporting feed checks as "needs desktop" — there was never anything for a browser to do there.

**Fixed**
- `/doctor` and `/vitals` no longer describe browser-less sessions as missing checks they can in fact run.
- Stale documentation: the plugin README claimed a skill count and a shared-file sync ritual that hadn't matched reality for several releases.

**Repo housekeeping (no mechanics change — nothing about how the game plays)**
- The universal boot card existed as 27 byte-identical copies, one per command. There is now exactly one, at the plugin root, that every command reads. A rule fixed once is fixed everywhere.
- Plugin version is set in one file. The marketplace listing is generated from it and no longer keeps a second copy that could silently disagree — which is precisely what suppressed the 1.3.1 update prompt.
- New `node test/checks.mjs` gate fails the build on any of these coming back: a second boot card, a drifted generated copy, a duplicated version, a command list out of step with the actual commands.

**Unchanged promises**
- Forward-only: no past XP, streak, or badge is re-scored.
- Your data stays in your Notion workspace.

## v1.3.0 — 2026-07-31

**Changed**
- Follow-up is now stage-weighted. Quests nobody has answered (Saved, Applied) no longer raise overdue flags, debuffs, or streak consequences — they're offered as an option, never as pressure. Once a human has replied (Recruiter Screen onward), the tight cadence stays and those become the priority surface in /grind and your daily briefing.
- Setup now asks which theme you want and will not proceed until you answer. No default, no silent fallback.

**Adopted as rule, shipping in a later build**
- Where Notion can compute a value itself, your agent will read it rather than re-derive it. The formulas land in the template over the next builds.

**Unchanged promises**
- Forward-only: no past XP, streak, or badge is re-scored.
- Your data stays in your Notion workspace.

## v1.2.0 — 2026-07-23

**Added**
- **📅 System Calendar** — a new database in the Player Template. Your daily briefings, weekly reviews, reminders, and due follow-ups now also land here as dated rows, so you can see them in your own Notion calendar view alongside everything else. It's a delivery channel only — your Quest Board and Daily Log remain the source of truth for anything also written here. `/awaken` creates it automatically if your workspace doesn't have it yet (safe to re-run, never duplicates it).
- `/report`, `/grind`, and `/recruit` now mirror a due follow-up into System Calendar when they set or surface one, so reminders show up on your calendar without you doing anything extra.

**Changed**
- **Gatecrasher I** now unlocks after **2 submitted applications** (cumulative), up from 1. This only affects players who haven't unlocked it yet — if you already have it, it stays unlocked; nothing is ever revoked or re-judged retroactively.
- Levels 1–4 are now formally named the **Tutorial Arc** in the Operating Manual and Welcome Protocol wording. Once you're past it, a normal active day tends to earn roughly **40–60 XP** — useful as a rough compass, not a quota.

**Unchanged promises**
- New mechanics never rewrite your history.
- XP is never re-scored.
- Your data lives in your Notion workspace and never leaves it.

## Alpha 2 — Marketplace release — 2026-07-23

The repo link is now the whole install path: no separate download, no side-loaded files. Duplicate the Seed, connect Notion, install the plugin from this repo, and run `/awaken`.

**Added**
- `.claude-plugin/marketplace.json` — this repo is now a Claude Code plugin marketplace (`ars-infinita`), installable with `/plugin marketplace add TechSecWhisperer/ars-infinita-notion` then `/plugin install the-system-player@ars-infinita`.
- `plugins/the-system-player/` — the Player Edition plugin (v1.1.5, 27 commands), published in-repo for the first time.
- A full **Getting Started** walkthrough in the README: prerequisites, Notion Seed duplication, connecting Claude to Notion, installing the plugin, running `/awaken`, and the browser layer — plus a complete command reference table and a Troubleshooting section.
- `docs/PLAYERS-GUIDE.md` — a longer first-session walkthrough (awaken → quest → appraise → forge → engage), the daily loop, and the public rules around XP/levels/streaks.
- `MAINTAINERS.md` — admin-only release-cutting notes (never player-facing content).
- `tools/leak_check.py` + `.github/workflows/leak-gate.yml` — an automated gate that scans every player-facing file for sealed-mechanics leaks (admin agent names, sealed IDs, exact formula values) on every PR and push to `main`.

**Unchanged promises**
- New mechanics never rewrite your history.
- XP is never re-scored.
- Your data lives in your Notion workspace and never leaves it.

**Known pending items**
- The Forge Roulette odds and bonus value were spelled out in the shipped player skill at this release. They were sealed on 2026-07-24 (PR #5) and moved behind the admin layer. This entry deliberately does not restate them — a changelog describing a leak must not reproduce it.
- A passing reference to a sealed internal engine name in the `/intake` skill was reworded on 2026-07-24 to describe the behaviour without the internal name.

See `MAINTAINERS.md` for details on both.
