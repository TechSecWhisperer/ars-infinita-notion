# Maintainers Notes (Admin-Only)

This file is for whoever cuts releases of this repo — not for players. It's checked into the repo because it's not sensitive on its own (no sealed content, no admin IDs), but the practices in it are only relevant to the Game Admin.

## The admin plugin is never published here

`the-system` (the admin plugin, at `/root/.claude/plugins/synced/the-system/` on the admin's machine) contains sealed mechanics, the admin agent roster, admin-only configuration switches, the sealed reference material, and other content that must never reach a player-facing surface. **It must never be copied into this repository, in whole or in part, under any path.** Only `the-system-player` (the Player Edition mirror) belongs in `plugins/`.

If you're ever unsure whether a file belongs here, ask: "would I be comfortable with all 3–6 alpha players reading this line?" If no, it doesn't go in this repo.

## `plugins/the-system-player/` is canonical

The checked-in tree **is** the Player Edition source. It is not a mirror of anything, and nothing is ever copied over it wholesale.

This used to say the opposite — that a release began by copying an external "current Player Edition source" over the whole directory. That instruction was already false in practice (`packages/system-skills/builder.mjs` reads this tree directly and calls it the source of truth) and actively harmful: a wholesale copy silently reverts any fix made here in a reviewed PR, and an external edit reaches players without review. **Edit this tree, in a pull request, like any other code.** If the sealed admin system ever needs to produce player content, it opens a reviewed change — it does not overwrite the directory.

## Cutting a release

1. **Confirm `plugins/the-system-player/` is the change you reviewed.** No import step, no whole-tree copy.
2. **Run the validation ritual** (this has caused real installer failures before — do not skip it):
   - `plugins/the-system-player/.claude-plugin/plugin.json` parses as JSON.
   - Its `description` field is ≤500 characters.
   - Every `plugins/the-system-player/skills/*/SKILL.md` has YAML frontmatter that parses with `yaml.safe_load`, and its `name` field matches its folder name exactly.
   - `.claude-plugin/marketplace.json` at the repo root still parses as JSON and still points `source` at `./plugins/the-system-player`.

   Most of that is now mechanical. From `packages/system-skills/`:
   ```bash
   node builder.mjs      # regenerates .claude-plugin/marketplace.json from plugin.json
   node test/checks.mjs   # structural gate: manifests, versions, catalog, boot card
   ```
   `test/checks.mjs` needs no network, no CLIs and no dependencies, and is the check that fails the release if any of the invariants below drift.

   Then, from the repo root, the one check that reads git history:
   ```bash
   node tools/delivery_gate.mjs   # did shipped code change without the version moving?
   ```
   **It can only PASS after the release is committed.** Run it here to see what is stranded; it reports BLOCKED once you have bumped but not yet committed (the version exists only in your working tree, so there is no commit to measure from), and PASSes when you re-run it after step 6.
   **This answers a question `test/checks.mjs` structurally cannot.** That gate compares release surfaces *to each other at a point in time*, so it passes whenever they agree — including when they agree on a stale number and nothing has moved. On 2026-08-10 three PRs merged six changes into `plugins/the-system-player/`, every surface still agreed at 1.3.1, `checks.mjs` passed, and **no player received any of it**, because a client that sees the same version offers no update. `delivery_gate.mjs` diffs the shipped tree against the commit that last moved `plugin.json`'s `version` and fails while anything sits undelivered. It exits `2` (BLOCKED, never PASS) if it cannot read history — a shallow clone needs `fetch-depth: 0` — and self-tests against known-bad fixtures first, because a gate that cannot fail is not a gate.

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
4. **Bump the version — in exactly one place:** `plugins/the-system-player/.claude-plugin/plugin.json`. Setting an explicit `version` means players only get prompted to update when this field changes — if you skip it, every commit to the tracked branch counts as a new version instead.

   **Do not mirror it into `.claude-plugin/marketplace.json`.** That entry deliberately carries only `name`, `source` and marketplace-level classification. Claude Code resolves the plugin's own manifest, so a second `version`/`description` there does not win — it just sits there disagreeing, which is exactly how the 1.3.1 release shipped a feed at 1.3.1 with manifests still at 1.3.0 and no update prompt. `node builder.mjs` regenerates the file; `node test/checks.mjs` fails if a duplicate `version` or `description` reappears in it.

   Version parity is enforced as follows — this is what the check asserts, so it is also the rule:
   - `plugin.json.version` **must equal** the newest `## vX.Y.Z` heading in `CHANGELOG.md`. Hard failure.
   - `feed.json`'s `head` / `mechanics_version` **should equal** it, but a mismatch is a **WARN, not a failure**: during a release train the feed legitimately announces a rules change before the build that implements it lands. Ship the plugin, then the feed catches up (or vice versa) — the warning is there so the gap is deliberate rather than forgotten.
   - `feed.json` keeps `mechanics_version` and `head` because the boot card and `/doctor` name both ("compare the Kernel's Mechanics Version against the Patch Feed head"). The old third field, `feed_version`, had no consumer anywhere and was removed.
5. **Update `CHANGELOG.md`** with a dated entry describing what shipped, in player-safe language.
6. **Commit** with a clear message, and tag the release if you're using tags for this repo's history.

## Publishing the npm package (Codex / Antigravity channel)

`@ars-infinita/system-skills` is a **second distribution channel** carrying a prebuilt copy of the skills for the two non-Claude CLIs. Claude Code is deliberately not a target — it installs from the marketplace, and a second path would mean two installs able to disagree.

Publish **after** the release commit, from `packages/system-skills/`:

```bash
npm publish --access public
```

`prepublishOnly` runs the build, the structural gate and the leak check first, and aborts the publish if any of them fail — so a broken or leaking tarball cannot be pushed by forgetting a step.

Three things worth knowing:

- **Its version must equal `plugin.json`'s.** `release-metadata-check` fails otherwise. The package ships real skills, so its number is what a Codex user actually receives; letting it float would mean the two channels shipping different content under different numbers.
- **`dist/` is gitignored but must be packed, and `files[]` is what makes that work.** On npm ≥7 `files[]` is a true allowlist that the `.gitignore` fallback cannot strip — verified on npm 10 by packing with and without `.npmignore` and getting identical 122-file tarballs. `packages/system-skills/.npmignore` is therefore **belt-and-braces for an old npm** (npm 6 *did* apply the fallback over `files[]`), not the mechanism. Do not remove `dist/` from `files[]` on the theory that `.npmignore` covers it; it does not.
- **Verify the tarball, don't trust the manifest — this is the real protection.** `npm pack --dry-run` should report ~120 files including 54 `SKILL.md`. If it reports 9, `dist/` was excluded and the publish would be empty.
- **Verify after publishing, too.** `npm view @ars-infinita/system-skills version` should match `plugin.json`. `tools/delivery_gate.mjs` prints this on every run as an advisory line — deliberately advisory, because failing on it would deadlock the repo between merging a release and publishing it. It is the thing that says out loud that the npm channel is behind; it will not stop you.

## The Seed page

The Notion Seed template players duplicate lives at:

```
https://www.notion.so/3a356d8e806b8196855aeb97d1b0a630
```

It has to stay **shared publicly** (or at minimum, shared such that "Duplicate" works for someone with only a Notion account and no prior relationship to your workspace) for the "one repo link gets you everything" promise in the README to hold. Notion sharing settings can silently drift — if a player reports the link 404s or prompts for access they don't have, the fix is almost always: open the Seed page in your own Notion, check **Share**, and re-confirm it's set to public / anyone-with-the-link, then re-share if needed.

## Known pending items (not blockers, but need your ruling)

- **Forge Roulette values — RESOLVED 2026-07-24.** The exact odds and bonus value were removed from the shipped player skill and moved behind the sealed layer (see `tools/leak_allowlist.txt`). This note previously restated both values in plaintext, in a file the leak gate did not scan — which made this document the last place in the repo they appeared. It no longer states them, and `MAINTAINERS.md` is now inside `SCAN_TARGETS`. **Standing rule: never restate a sealed value in order to describe it. Reference the mechanic, not the number.**

- **Sealed engine name — RESOLVED 2026-07-24.** The player intake skill previously named a sealed internal engine in passing. It was reworded to describe the behaviour without the internal name. No engine internals were ever disclosed.

- **Open, genuinely needs your ruling:** whether player-facing copy may ever state exact odds or XP values for a bonus mechanic. Current position is no — a player sees the mechanic fire at runtime; the docs do not pre-announce the numbers. Worth noting the limit of this: any value the player's own agent must compute cannot be hidden from that player, so sealing is only meaningful for values the client never needs.

