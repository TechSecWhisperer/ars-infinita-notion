# Changelog

All notable player-facing changes to Ars Infinita Notion (A.I.N) are logged here. Dates are UTC.

Version numbers here are the **plugin version** — set in `plugins/the-system-player/.claude-plugin/plugin.json`, the only hand-set version in this repo. **It and the Patch Feed's `mechanics_version` track each other exactly** (ruled 2026-08-13). They used to be allowed to diverge on a delivery-only release, and that permission caused the problem it was meant to describe: four consecutive releases could not move the feed head, so nothing in them reached anyone. One number now — every release moves the head your agent checks against, and a build check fails if the two ever differ. Two other numbers version different things and are not expected to match: the **Seed / template-schema revision** (the shape of your Notion template), and nothing else. The `@ars-infinita-notion/system-skills` **npm package** tracks this number exactly — since v1.3.2 it ships the skills prebuilt, so its version is what a Codex or Antigravity user actually receives.

## v1.3.9 — 2026-08-13

**Codex CLI users: if you installed before v1.3.6, check your own skills.** Versions up to and including 1.3.5 installed 27 skills into your shared `~/.codex/skills/` folder and **replaced anything already sitting under the same name** — so a skill you wrote yourself called `status`, `log`, `report`, `browse`, `doctor` or `patch` may have been overwritten without warning. **Nothing in your Notion workspace was affected**, and **Antigravity installs were never affected**. The installer was fixed in v1.3.6 and now refuses to overwrite anything it did not install, telling you the exact paths instead.

This notice is late, and the reason is worth stating: the channel that delivers it compares a version number, and four consecutive releases had not moved that number — so the warning had nowhere to land. That was fixed in v1.3.8 by making the plugin and mechanics versions one number. This release is the first that can carry the advisory.

**Also in this release:** the plugin's own description no longer lists every command or pins a version highlight. It had drifted — it still advertised "v1.3" features while shipping 1.3.8 — and the same string is generated into the Antigravity manifest, so it drifted in two places at once. It now describes what The System is and what it will not do, and the catalogue lives where the catalogue lives.

**Note on numbering:** the mechanics version moves to 1.3.9, in lockstep, as it now does on every release. No XP value, level threshold, badge criterion or rule surface changed.

## v1.3.8 — 2026-08-13

**If you ask how the Forge works, you get a straight answer — and now every page in The System says so.** Since 31 July the `/forge` command has answered plainly when you ask about the Forge Roulette's odds and payout; ruling C redesigned that mechanic so it carries no hidden value at all. But the shared rules reference still carried a blanket "never reveal odds" line, contradicting the command sitting next to it in the same install. The rule now names the exception.

**The System still won't volunteer anything about a roll you didn't win.** That part is unchanged — for the Forge and everywhere else. What changed is that a direct question gets a direct answer, which is what the shipped command already did.

**Also corrected:** the XP table row for a development action named an internal alias rather than your **Competency Matrix**, which is what the database is actually called in your workspace. The amount is unchanged at 30.

**One version number from here on.** The plugin version and the Patch Feed's mechanics version used to be allowed to differ on a delivery-only release. That permission caused the failure it was meant to describe: releases 1.3.2 through 1.3.7 could not move the feed head, so **nothing in them reached anyone**. The two series are now reconverged at **1.3.8** and track each other exactly — every release moves the head your agent checks against, and a build check fails if they ever drift apart again.

No XP value, level threshold or unlock criterion changed; nothing is re-scored and there is nothing to do.

## v1.3.7 — 2026-08-13

**Nothing here changes how you play.** No command, rule, XP value, threshold or badge criterion moved, and there is nothing to do on your side.

This release carries build and release workflow enhancements only — internal tooling the project uses on itself. It ships as a version bump because the published package changed, and a change to the package that nobody receives is not a change.

**Note on numbering:** the **mechanics version stays 1.3.1**. This is a tooling and delivery release.

## v1.3.6 — 2026-08-13

**Codex CLI users: check your own skills — earlier versions may have overwritten one.** Up to and including v1.3.5, `npx @ars-infinita-notion/system-skills install-codex` installed 27 skills into your shared `~/.codex/skills/` folder and **replaced anything already sitting under the same name**. The names we use are ordinary words — `status`, `log`, `report`, `browse`, `doctor`, `patch`, `quest`, `forge` and 19 more — so a skill you wrote yourself under one of those names could have been deleted, with no warning, no prompt, no backup, and a success message. If you installed before today and had your own Codex skills, that is the set worth checking.

**Nothing in your Notion workspace was ever affected**, and **Antigravity installs were never affected** — that path writes only to its own namespaced plugin directory.

**What the installer does now**
- It **refuses to remove any directory it did not install.** Every destination is classified before a single byte is written, and if any of them turns out to be yours, the whole install stops and prints the exact paths. A partial install would leave 26 System commands beside one of your own skills wearing a System name; a clean refusal is the better answer.
- `--force` is the escape hatch, and it **moves aside rather than deletes** — your directory is renamed into `~/.codex/.ars-infinita-backup/<timestamp>/`, outside the folder Codex scans, and the path is printed for you. It is yours to keep, restore or remove.
- The install is now **recorded** in `~/.codex/.ars-infinita-install.json`, including a content hash per skill. That is what tells the installer which directories are its own, and it is what a future uninstall will need to remove only what you never edited.
- The summary line now distinguishes **"updated our own previous install"** from **"moved aside your own skill"**. The old wording said `replaced` for both, which read the same whether we had updated a System command or destroyed something you wrote.

**Also fixed — an install check that always looked like failure.** `install-agy` told you to verify with `agy plugin list`, which reports **"No imported plugins"** on a completely correct install: that command lists only plugins registered by `agy plugin import`, and plugins auto-discovered from a standard configuration root never appear there. It now suggests `agy -p "list your skills"` and says plainly that the registry listing is expected to be empty.

**Note on numbering:** no XP value, level threshold, badge criterion or rule surface changed, so the **mechanics version stays 1.3.1**. This is a bug-fix release.

## v1.3.5 — 2026-08-12

**Petitions now look the same however you file them.** `/petition` applies a `petition` label when it files for you, and the new web form applies the same one — so a petition sent from your agent and one typed into GitHub by hand land identically. Keep starting your title with your category in brackets (`[Bug] …`, `[Question] …`); that convention is unchanged, and the form now asks for it too, since a web form cannot fill it in for you.

If your session has no working GitHub CLI, `/petition` hands you a link. That link now opens the structured form instead of an empty issue, so you get the category, version and handle fields — and the reminder that a GitHub issue is public — rather than a blank box.

**Fixed — documentation that had gone false**
- The plugin's version-map table still described the npm package as build tooling "unrelated to the game". It has shipped the actual skills since v1.3.2, and its version tracks this one exactly.
- The npm package's own README said it was "not published" and that publishing was deliberately unwired. It has been published since v1.3.2, from CI, with no stored token.
- The main README contradicted itself on the same point, and pinned a stale version in an example.

**Note on numbering:** no XP value, level threshold, badge criterion or rule surface changed, so the **mechanics version stays 1.3.1**. This is a delivery + documentation release.

## v1.3.4 — 2026-08-12

**Codex and Antigravity users: the install page now tells you what you need before you start.** The two prerequisites — a **paid AI agent subscription**, and **confirming your agent can run routines** — were stated in the main README and in the v1.3.2 notes, but not on the npm install path you actually read. They are now in `packages/system-skills/README.md` and in `npx @ars-infinita-notion/system-skills --help`, ahead of the install commands. Nothing about the install itself changed.

The prerequisites are deliberately **agent-agnostic**. Whichever CLI you use, expect to need a tier that permits sustained daily agent work, and check the routines capability separately — **a paid plan does not guarantee it**, and it is what delivers your morning briefing without you asking. If your agent can't run routines, The System still works; you say *"run my daily briefing"* each weekday instead. **Notion's free plan remains all you need.**

**Claude Code players: nothing here changes how you play.**

**Fixed**
- **The delivery gate was watching one channel of two.** `tools/delivery_gate.mjs` compared only the plugin directory against the last version bump, so anything under `packages/system-skills/` — the npm channel, including its install instructions — could change with every check green and reach nobody. That is the same defect the gate was built to catch, one directory across. It now watches both channels, and its self-test covers the new scope in both directions: an npm-channel change must fail it, a test-only change must not.
- Delivered with this release: the npm `repository` field added on 2026-08-11, which landed on main after v1.3.3 was cut and had been sitting unpublished. The widened gate is what surfaced it.

**Note on numbering:** no XP value, level threshold, badge criterion or rule surface changed, so the **mechanics version stays 1.3.1**. This is a delivery + documentation release.

## v1.3.3 — 2026-08-11

**Codex and Antigravity users: the package name changed.** It is now `@ars-infinita-notion/system-skills`, matching this repository and the Claude Code marketplace. The name in the v1.3.2 notes below — `@ars-infinita/system-skills` — **was never published under that name and never will be**; that scope did not exist on npm, which is how it was caught. If you copied that command and it failed, this is why. The working command:

```
npx @ars-infinita-notion/system-skills install-codex   # or install-agy
```

Nothing about the install changed beyond the name, and nothing you already have is affected — a package that was never published cannot be on your machine.

**Claude Code players: nothing here changes how you play.** This release carries a corrected package name in the plugin's own version-map table. No command, rule, XP value or threshold moved. It ships as a version bump because a documentation fix nobody receives is not a fix — the same reasoning behind v1.3.2's delivery gate.

**Note on numbering:** no XP value, level threshold, badge criterion or rule surface changed, so the **mechanics version stays 1.3.1**. This is a delivery + documentation release. Licensing is unchanged and always has been **MIT** — repository, plugin manifest and npm package have agreed from the start; nothing was relicensed here.

## v1.3.2 — 2026-08-11

**Read this first: The System needs a paid AI agent subscription, and you should check that your agent can run routines.** Both are now stated up front instead of being implied. Notion's **free plan remains all you need** — nothing here requires you to pay Notion, and anything that turns out to is a bug worth reporting. The routines check is the part worth doing deliberately: a paid plan does **not** guarantee your agent can run scheduled tasks, and that capability is what delivers your morning briefing without you asking. If yours can't, The System still works — you just say *"run my daily briefing"* each weekday morning instead of it arriving on its own.

**Changed**
- **`/awaken` is now honest about routines it cannot reliably create.** On some surfaces a routine *created by an agent* gets weaker permissions than the same routine created by you: it runs under a classifier that can pause any tool call mid-run, so a briefing stalls part-written rather than delivering. No prompt fixes that — the permission model follows who created it. Where it applies, `/awaken` now walks you through creating the routine yourself and gives you an acceptance test to confirm it. **A routine that exists but stalls is worse than no routine**, because you believe you're covered and find out by hearing nothing.

**Codex and Antigravity users: no more cloning the repo**
- The skills now install straight from npm — `npx @ars-infinita-notion/system-skills install-codex` (or `install-agy`). The package ships them **prebuilt**, so that one command is the whole install. Both accept `--dry-run` and print every path before writing. Previously you had to clone the whole repo and run a build; the published package contained the installers but none of the skills they install, so it would not have worked even if you had found it.
- Its version now tracks this one exactly, so `@ars-infinita-notion/system-skills@1.3.2` is the v1.3.2 skills, and a build check fails if the two ever disagree.
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
