# Changelog

All notable player-facing changes to Ars Infinita Notion (A.I.N) are logged here. Dates are UTC.

Version numbers here are the **plugin version** — the one set in `plugins/the-system-player/.claude-plugin/plugin.json`, and the only hand-set version in this repo. It is **usually** the same number the Patch Feed calls `mechanics_version`, because most releases ship a mechanics change and its build together. **They can legitimately differ:** a delivery-only release (bug fixes, docs, or getting already-merged work into your hands) moves the plugin version while the mechanics version stays put until the Patch Feed publishes the next one. When they differ, the entry says so. Nothing player-side compares the two — your agent checks its Kernel's Mechanics Version against the Patch Feed head, and both are the mechanics number. One other number appears elsewhere and versions a different thing: the **Seed / template-schema revision** (the shape of your Notion template). It is not expected to match this one. The `@ars-infinita/system-skills` **npm package** used to be in that list, but **now tracks this number exactly** — as of v1.3.2 it ships the skills prebuilt rather than only the tooling that builds them, so its version is what a Codex or Antigravity user actually receives. A build check fails if the two diverge.

## v1.3.2 — 2026-08-11

**Read this first: The System needs a paid AI agent subscription, and you should check that your agent can run routines.** Both are now stated up front instead of being implied. Notion's **free plan remains all you need** — nothing here requires you to pay Notion, and anything that turns out to is a bug worth reporting. The routines check is the part worth doing deliberately: a paid plan does **not** guarantee your agent can run scheduled tasks, and that capability is what delivers your morning briefing without you asking. If yours can't, The System still works — you just say *"run my daily briefing"* each weekday morning instead of it arriving on its own.

**Changed**
- **`/awaken` is now honest about routines it cannot reliably create.** On some surfaces a routine *created by an agent* gets weaker permissions than the same routine created by you: it runs under a classifier that can pause any tool call mid-run, so a briefing stalls part-written rather than delivering. No prompt fixes that — the permission model follows who created it. Where it applies, `/awaken` now walks you through creating the routine yourself and gives you an acceptance test to confirm it. **A routine that exists but stalls is worse than no routine**, because you believe you're covered and find out by hearing nothing.

**Codex and Antigravity users: no more cloning the repo**
- The skills now install straight from npm — `npx @ars-infinita/system-skills install-codex` (or `install-agy`). The package ships them **prebuilt**, so that one command is the whole install. Both accept `--dry-run` and print every path before writing. Previously you had to clone the whole repo and run a build; the published package contained the installers but none of the skills they install, so it would not have worked even if you had found it.
- Its version now tracks this one exactly, so `@ars-infinita/system-skills@1.3.2` is the v1.3.2 skills, and a build check fails if the two ever disagree.
- **Claude Code is unchanged** — keep installing the native plugin from the marketplace. There is deliberately no npm path for Claude, so there is only ever one way to have it installed.

**Delivery note — why this release exists at all**
- Six player-facing files changed on 2026-08-05→08-10 and **never reached anybody**, because the version never moved and an unchanged version offers no update. This release delivers them: the `/main/` Patch-Feed cache caveat in the boot card, `/doctor` and `/vitals`, plus the `/awaken` migration-view check, purpose-matched briefing detection and entity alias table.
- A new gate, `tools/delivery_gate.mjs`, now fails while shipped code sits undelivered. The previous checks compared release surfaces to each other at a point in time, so they passed whenever those surfaces agreed — including when they agreed on a stale number.

**Note on numbering:** no XP value, level threshold, badge criterion or rule surface changed, so the **mechanics version stays 1.3.1** until the Patch Feed publishes otherwise. This is a plugin delivery + documentation release.

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
