---
name: theme
description: Re-skins The System's titles/labels between the hidden Solo Leveling game theme and a plain Professional theme (or another registered theme), per the Theme Registry — cosmetic only, structure and IDs untouched. Use when the player says "switch theme to X", "turn off the game stuff", "make this look professional", "I want plain language", or "/theme [name]".
---

Read `references/boot-card.md` first for IDs and hard rules.

## What /theme does
Re-skins titles per the Theme Registry mapping. **This touches nearly every database and page title in the workspace — it's the highest blast-radius command in the whole system.** Treat it accordingly.

## Steps

1. **Confirm the target theme and scope before writing anything.** Fetch the Theme Registry (page `KERNEL:Theme Registry`) to see the canonical↔themed name mappings available (e.g. Professional vs the hidden Guild RPG skin). If the player's request is ambiguous about scope ("just my view" vs "actually rename things"), clarify — a full re-skin renames real page/database titles that every other skill's bundled reference expects by name (though those skills use IDs, not names, so this should be structurally safe — but say so, and if you find anything relying on a title match, flag it before proceeding).

2. **Do a dry-run first**: list every title that would change (old → new) and show the player the full list before writing a single one. This is not optional for this command — given the blast radius, get an explicit go-ahead on the actual list, not just the theme name, before applying it.

3. **Apply the rename** only to titles/labels — property values, IDs, relations, and content stay untouched. Work database-by-database so a failure partway through is easy to reason about and resume (report progress as you go rather than silently working through all of them).

4. **Re-skinning is cosmetic only** — it renames display titles per the Theme Registry and must never unseal, reveal, or rename sealed content beyond its registered lock wording.

5. **Report back** a before/after summary and confirm the game mechanics/history are unchanged underneath — the whole point of a theme is that the underlying system doesn't care what it's called.
