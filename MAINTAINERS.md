# Maintainers Notes (Admin-Only)

This file is for whoever cuts releases of this repo — not for players. It's checked into the repo because it's not sensitive on its own (no sealed content, no admin IDs), but the practices in it are only relevant to the Game Admin.

## The admin plugin is never published here

`the-system` (the admin plugin, at `/root/.claude/plugins/synced/the-system/` on the admin's machine) contains sealed mechanics, the admin agent roster (Warden/Cardinal), the Feature Flag Registry, the Sealed Codex, and other content that must never reach a player-facing surface. **It must never be copied into this repository, in whole or in part, under any path.** Only `the-system-player` (the Player Edition mirror) belongs in `plugins/`.

If you're ever unsure whether a file belongs here, ask: "would I be comfortable with all 3–6 alpha players reading this line?" If no, it doesn't go in this repo.

## Cutting a release

1. **Pull the latest Player Edition source.** Copy the current player plugin mirror over `plugins/the-system-player/` in full (don't hand-edit individual files out of sync with the source — copy the whole tree so nothing drifts).
2. **Run the validation ritual** (this has caused real installer failures before — do not skip it):
   - `plugins/the-system-player/.claude-plugin/plugin.json` parses as JSON.
   - Its `description` field is ≤500 characters.
   - Every `plugins/the-system-player/skills/*/SKILL.md` has YAML frontmatter that parses with `yaml.safe_load`, and its `name` field matches its folder name exactly.
   - `.claude-plugin/marketplace.json` at the repo root still parses as JSON and still points `source` at `./plugins/the-system-player`.

   A quick one-liner for the SKILL.md check:
   ```bash
   python3 -c "
   import yaml, glob, sys
   ok = True
   for path in sorted(glob.glob('plugins/the-system-player/skills/*/SKILL.md')):
       folder = path.split('/')[-2]
       content = open(path, encoding='utf-8').read()
       fm = yaml.safe_load(content.split('---', 2)[1])
       if fm.get('name') != folder:
           print('MISMATCH', path, fm.get('name')); ok = False
   sys.exit(0 if ok else 1)
   "
   ```
3. **Run the leak-verification gate** before anything else touches git:
   ```bash
   python3 tools/leak_check.py
   ```
   This scans every player-facing file (README, `docs/`, `plugins/the-system-player/**`) for sealed-mechanics patterns — admin agent names, sealed page IDs, awakening XP-split numbers, class-engine internals, and so on. It must exit `0` (or only report allowlisted hits) before you commit. See `tools/leak_allowlist.txt` for the current accepted exceptions and why each one is there — don't add an entry to that file without a real justification comment, and treat every new addition as something that needs your explicit sign-off, not something to wave through by default.
4. **Bump the version** in `plugins/the-system-player/.claude-plugin/plugin.json` and mirror it in `.claude-plugin/marketplace.json`'s plugin entry. Setting an explicit `version` means players only get prompted to update when this field changes — if you skip it, every commit to the tracked branch counts as a new version instead.
5. **Update `CHANGELOG.md`** with a dated entry describing what shipped, in player-safe language.
6. **Commit** with a clear message, and tag the release if you're using tags for this repo's history.

## The Seed page

The Notion Seed template players duplicate lives at:

```
https://www.notion.so/3a356d8e806b8196855aeb97d1b0a630
```

It has to stay **shared publicly** (or at minimum, shared such that "Duplicate" works for someone with only a Notion account and no prior relationship to your workspace) for the "one repo link gets you everything" promise in the README to hold. Notion sharing settings can silently drift — if a player reports the link 404s or prompts for access they don't have, the fix is almost always: open the Seed page in your own Notion, check **Share**, and re-confirm it's set to public / anyone-with-the-link, then re-share if needed.

## Known pending items (not blockers, but need your ruling)

- **Forge Roulette (`plugins/the-system-player/skills/forge/SKILL.md`, lines ~32–33):** the exact 1-in-3 odds and the +15 XP value for the bonus roll are currently spelled out in the shipped player skill. This is allowlisted in `tools/leak_allowlist.txt` pending your ruling on whether player-facing files should ever state exact odds/XP values for a bonus mechanic, or whether that skill file should be rewritten to keep the *existence* of a roulette bonus visible (players can see it fire) while moving the precise odds/value into something the player skill queries at runtime instead of hardcoding.
- **"Class Engine" mention (`plugins/the-system-player/skills/intake/SKILL.md`, line ~21):** the intake skill references "the Class Engine's daily menu" by name in passing, while explaining why side-quest calibration matters. `class engine` is one of the sealed-mechanics patterns the leak gate watches for. It's allowlisted for now because the mention doesn't disclose any engine internals (no precondition logic, no formulas) — it's just naming a system the player already knows exists (Side-Quest Calibration is a documented step in that same skill). Flagging it explicitly so you can decide whether the mention should be reworded to drop the internal name entirely, or whether "Class Engine" as a bare name is fine to leave in player-facing copy.

Both of these are pre-existing in the player plugin source as synced — nothing in this repo build introduced them, but the leak gate (correctly) flags both, so they need your explicit call rather than silent allowlisting by whoever cuts the next release.
