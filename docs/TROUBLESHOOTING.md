# Troubleshooting

If something is wrong and you don't know what, run **`/doctor`** first. It is a full diagnostic pass that repairs anything local, and it resolves most of what is on this page without you reading further. **`/vitals`** tells you what your current session can and cannot do — useful for anything browser- or connector-shaped.

Both of those arrive with the commands, in step 4 of setup. If you are stuck **before** that, use the sections below.

## During setup

### The Seed link 404s, or asks for access I don't have

The Seed page is shared publicly by the Game Admin, so this is not something you can fix on your end, and working around it will only produce a broken workspace.

**[Open an Issue](https://github.com/TechSecWhisperer/ars-infinita-notion/issues/new)** and say the Seed link is unreachable. That link is the report route — you do not have `/petition` yet at this point in setup, because it arrives with the commands in step 4.

### The plugin failed to install

Update Claude Code to the latest version and try again — plugin marketplace support needs a recent release. If the `/plugin` syntax in the README disagrees with what `/plugin` help prints in your session, **trust your session**: Claude Code's own [plugin docs](https://code.claude.com/docs/en/discover-plugins) are authoritative over this repo.

### The Codex installer stopped without installing anything

Expected, and deliberate. `install-codex` puts 27 skills into your shared `$CODEX_HOME/skills/` folder under ordinary names — `status`, `log`, `report`, `browse`, `doctor`, `patch` and so on. If any of those names is already taken by a directory the installer did not create, it **stops before writing anything** and prints the clashing paths, rather than silently replacing work you wrote yourself.

Re-run with `--force`. That **moves your directories aside** — renamed into `$CODEX_HOME/.ars-infinita-backup/<timestamp>/`, outside the folder Codex scans — and tells you where they went. Nothing is ever deleted.

> **Don't pin below `1.3.6`.** Up to and including `1.3.5`, `install-codex` replaced same-named directories without warning. See [`packages/system-skills/README.md`](../packages/system-skills/README.md).

### `/awaken` can't see my Notion workspace

Almost always the connector. Go back to setup step 3 and confirm two things: that the Notion connection is authorized at all, and that the **specific page** you duplicated the Seed into is shared with it. Notion scopes access per page or per workspace — authorizing the connector does not automatically grant it everything.

### `/awaken` says it can't find my template

It means the Seed. The link is in the README, in your setup path's step 2 — you already have it and do not need to ask anyone for it.

### `/awaken` finished but nothing works in my next session

Two causes, both about where the context file landed.

**On the Claude desktop app:** the app has *no access to your files at all* until a folder is connected to the session — not restricted access, none. `/awaken` will build your entire Notion workspace happily and then fail at the last step, because it has nowhere to write. If you saw *"No folders are connected to this device for the current session"*, that was this. Connect a folder and run `/awaken` again — it is safe to re-run and will not rebuild anything already in Notion.

**Anywhere else:** you ran `/awaken` from an arbitrary folder, so the file landed in an arbitrary folder. Find it and move it to the folder you actually work in, or just re-run `/awaken` from there. The file is `CLAUDE.md` on Claude, and **`AGENTS.md`** on Codex and Antigravity — the installer rewrites it for your CLI, so a Codex player searching for `CLAUDE.md` will never find one.

## After setup

### A command says it needs a browser

For company research and job postings that need real rendering, the System drives a headless browser (`agent-browser`) on your machine. `/awaken` offers to set it up; `/browse` is the only command that drives it.

Without one — mobile-only, or a session that cannot run a local browser — the System degrades honestly rather than pretending. It tells you it could not reach the page and offers to work from text you paste. Tracking, appraising, forging and the whole XP loop keep working fully.

`/browse` distinguishes three outcomes, and the difference matters: **no browser here** (run it from your desktop instead), **page unreachable** (a dead link, a login wall, a bot check — pasting the text will work), and **reached**.

### `/doctor` says my Mechanics Version is behind

That is the one worth acting on. Pull the update — `/plugin update` in Claude Code, or re-run the installer on another CLI — and your agent applies any patch steps on the next boot. See [Updating](PLAYERS-GUIDE.md#updating) for what the numbers mean.

### Something else

Run `/doctor`, then `/petition` — it files a GitHub Issue for you after showing you the exact text. Or **[open an Issue](https://github.com/TechSecWhisperer/ars-infinita-notion/issues/new)** directly. Issues are **public**: leave confidential job-search details out of them.
