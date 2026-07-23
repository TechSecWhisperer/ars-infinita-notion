# Changelog

All notable player-facing changes to Ars Infinita Notion (A.I.N) are logged here. Dates are UTC.

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
- The exact Forge Roulette odds (1-in-3) and bonus value (+15 XP) are currently spelled out in the shipped player skill, allowlisted pending an admin ruling on whether that level of detail should stay player-visible.
- A passing "Class Engine" name-check reference in the `/intake` skill is allowlisted pending the same kind of review.

See `MAINTAINERS.md` for details on both.
