# The System — Player Edition (the-system-player)

This directory is also packaged as a portable Agent Plugin for Codex. Its root [`plugin.json`](plugin.json) is generated from the canonical plugin identity; the repository's [Codex marketplace](../../.agents/plugins/marketplace.json) makes it discoverable from this source. The existing `.claude-plugin/plugin.json` serves the Claude Code marketplace.

Gate Protocol Seed component. **28 skills** — 27 public commands plus the hidden `/handover` route — one directory each under `skills/`.

## Versions (what each number versions)

This plugin sits next to several other version numbers. They are deliberately different domains; do not try to make them agree.

| Number | Lives in | Versions |
|---|---|---|
| **Plugin version** | `.claude-plugin/plugin.json` → `version` | This installable plugin. **The only hand-set version in the repo.** `.claude-plugin/marketplace.json` deliberately does not repeat it — Claude Code resolves the plugin's own manifest and a second copy would silently disagree. |
| **Mechanics version** | Notion Patch Feed (mirrored as `mechanics_version` / `head` in `/feed.json`), recorded on each player's 🧬 Kernel | The game rules. Tracks the plugin version by convention — a rules change ships as a plugin build — but the feed's head may briefly lead during a release train. |
| **Seed / template-schema revision** | `skills/awaken/references/template-schemas.md` | The *shape* of the Notion Player Template (which pages and databases exist, and their properties). Moves only when the template's structure changes, which is rare. |
| **`@ars-infinita-notion/system-skills`** | `packages/system-skills/package.json` | Standalone skills for Codex or Antigravity; Codex can also use this repository's plugin marketplace when the package is present in a published release. The package ships skills prebuilt and its version is checked against the plugin version. |

## Architecture

- **No instance data in this plugin.** Skills reference entities as `KERNEL:<Entity>`, resolved against the 🧬 Kernel page in the player's own Notion workspace (written by `/awaken`).
- **One boot card, not twenty-seven.** `references/boot-card.md` sits at the **plugin root** and every plugin skill reads that same file via `${CLAUDE_SKILL_DIR}/../../references/boot-card.md`. It carries universal rules only — a mirror of the Nexus 📜 Rule Manifest. Fix a rule once and every command has it. (Two `references/` directories exist by design: this shared root one, and `skills/awaken/references/` for /awaken's own template schemas — per-skill material that only /awaken reads. Neither replaces the other.)
- **Patches:** every command's lite boot compares the Kernel's Mechanics Version to the Nexus Patch Feed and applies missed patches. The Runebook (on the Seed page) is ground truth for any agent; this tree ships the plugin-supported routes and is the source for the separate standalone-skill build.
- **Privacy:** Notion is the source of truth. AI assistants may process content they use under the configured provider's terms. Party Wall and Hunter Registry receive only the enabled game-stat whitelist.

## Maintenance

**This checked-in tree is canonical.** Edit it here, in a reviewed change — nothing is copied over it wholesale from elsewhere.

- **Shared-rule fixes → edit `references/boot-card.md`. That's it.** There is exactly one authored copy and no sync ritual. (`packages/system-skills/builder.mjs` stamps a per-skill copy into its gitignored `dist/` for the Codex standalone-skills fallback and Antigravity, whose npx installers place skills as standalone folders with no shared parent. Those are build output. The Codex repository plugin retains its plugin-root reference. The build's `shared-reference-build-check` fails if any stamped copy differs from this file by so much as a byte — never hand-edit one.)
- **Single-command fixes** → that skill's `SKILL.md`.
- **Pre-ship validation ritual** — see `MAINTAINERS.md` for the full release flow, including the mandatory leak gate.
- **Player-facing content:** keep private operating details and unreleased game content out of the distributed package. Describe only the behavior a player needs to use the feature.
