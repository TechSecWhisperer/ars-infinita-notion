# The System — Player Edition (the-system-player)

Gate Protocol Seed component. **27 skills** — 26 public commands plus the hidden `/handover` route — one directory each under `skills/`.

## Versions (what each number versions)

This plugin sits next to several other version numbers. They are deliberately different domains; do not try to make them agree.

| Number | Lives in | Versions |
|---|---|---|
| **Plugin version** | `.claude-plugin/plugin.json` → `version` | This installable plugin. **The only hand-set version in the repo.** `.claude-plugin/marketplace.json` deliberately does not repeat it — Claude Code resolves the plugin's own manifest and a second copy would silently disagree. |
| **Mechanics version** | Notion Patch Feed (mirrored as `mechanics_version` / `head` in `/feed.json`), recorded on each player's 🧬 Kernel | The game rules. Tracks the plugin version by convention — a rules change ships as a plugin build — but the feed's head may briefly lead during a release train. |
| **Seed / template-schema revision** | `skills/awaken/references/template-schemas.md` | The *shape* of the Notion Player Template (which pages and databases exist, and their properties). Moves only when the template's structure changes, which is rare. |
| **`@ars-infinita/system-skills`** | `packages/system-skills/package.json` | The cross-agent build tooling for the Codex and Antigravity CLIs. Its own npm-package lifecycle, unrelated to the game. |

## Architecture

- **No instance data in this plugin.** Skills reference entities as `KERNEL:<Entity>`, resolved against the 🧬 Kernel page in the player's own Notion workspace (written by `/awaken`).
- **One boot card, not twenty-seven.** `references/boot-card.md` sits at the **plugin root** and every skill reads that same file via `${CLAUDE_SKILL_DIR}/../../references/boot-card.md`. It carries universal rules only — a mirror of the Nexus 📜 Rule Manifest. Fix a rule once and every command has it.
- **Patches:** every command's lite boot compares the Kernel's Mechanics Version to the Nexus Patch Feed and applies missed patches. The Runebook (on the Seed page) is ground truth for any agent; this plugin is the Claude convenience wrapper.
- **Privacy:** Party Wall + whitelist push. No job-search content ever leaves the player's workspace.

## Maintenance (Game Admin)

**This checked-in tree is canonical.** Edit it here, in a reviewed change — nothing is copied over it wholesale from elsewhere.

- **Shared-rule fixes → edit `references/boot-card.md`. That's it.** There is exactly one copy and no sync ritual. (`packages/system-skills/builder.mjs` stamps a per-skill copy into its gitignored `dist/` for the Codex and Antigravity CLIs, whose formats install skills as standalone folders with no shared parent. Those are build output. The build's `shared-reference-build-check` fails if any stamped copy differs from this file by so much as a byte — never hand-edit one.)
- **Single-command fixes** → that skill's `SKILL.md`.
- **Pre-ship validation ritual** — see `MAINTAINERS.md` for the full release flow, including the mandatory leak gate.
- **Masking rules:** no reference anywhere to admin-side machinery or sealed mechanics — the authoritative masked-terms list lives in the Game Admin's build doc, not in this package. Player-facing register for anything sealed: "The System occasionally grants bonus quests."
