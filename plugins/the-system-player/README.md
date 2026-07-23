# The System — Player Edition (the-system-player)

Gate Protocol Seed component. 22 skills, one per Command Codex command, plus /awaken, /petition, /party. Forked from the Admin Edition (the-system v0.3.2).

## Architecture
- **No instance data in this plugin.** Skills reference entities as `KERNEL:<Entity>`, resolved against the 🧬 Kernel page in the player's own Notion workspace (written by /awaken). The bundled `references/boot-card.md` (one canonical copy in `_source/`, synced to every skill folder) carries universal rules only — a mirror of the Nexus 📜 Rule Manifest.
- **Patches:** every command's lite boot compares the Kernel's Mechanics Version to the Nexus Patch Feed and applies missed patches. The Runebook (on the Seed page) is ground truth for any agent; this plugin is the Claude convenience wrapper.
- **Privacy:** Party Wall + whitelist push. No job-search content ever leaves the player's workspace.

## Maintenance (Game Admin)
- Shared-rule fixes → edit `_source/boot-card.md`, re-sync to all 22 folders, re-ship.
- Single-command fixes → that skill's SKILL.md.
- Pre-ship validation ritual (MANDATORY, against the final zip, not the source tree): (1) manifest JSON parses, name kebab-case, description ≤500 chars; (2) every SKILL.md frontmatter YAML-parses with name + description.
- Masking rules: no reference anywhere to admin-side machinery or sealed mechanics — the authoritative masked-terms list lives in the Game Admin's build doc (claude/the-system-plugin-build.md), not in this package. Player-facing register for anything sealed: "The System occasionally grants bonus quests."
