# @ars-infinita/system-skills

Cross-agent build of **The System — Player Edition** skills.

The canonical skills live in `plugins/the-system-player/` as a Claude Code plugin. This package
re-emits them for two other CLIs:

- **OpenAI Codex CLI** (`codex`) — as user skills in `$CODEX_HOME/skills/<name>/SKILL.md`
- **Antigravity CLI** (`agy`, Gemini-based) — as a plugin in `~/.gemini/config/plugins/the-system-player/`

**Claude Code users should keep using the native plugin** (`/plugin install the-system-player@ars-infinita`).
This package exists only for the other two CLIs; nothing here is needed for Claude.

Zero dependencies, Node stdlib only, Node >= 18.

## What the build does

`builder.mjs` reads every `plugins/the-system-player/skills/<name>/SKILL.md`, keeps the
`name`/`description` frontmatter (both target CLIs use the same two fields), copies the
`references/` mirror alongside each skill so the boot-card pattern still works standalone,
and rewrites Claude-harness-specific idioms per target:

| Source (Claude) | codex | agy |
| --- | --- | --- |
| `CLAUDE.md` | `AGENTS.md` | `AGENTS.md` |
| "Claude Code" | "OpenAI Codex CLI" | "Antigravity CLI (agy)" |
| `claude-in-chrome` | "your own logged-in browser" | same |
| `ToolSearch` | "the available tool list" | same |
| "reads as Claude" | "reads as an AI assistant" | same |

`Claude Rating (1-5)` is **protected** and never rewritten — it is a literal Notion property
name in the Competency Matrix, not a harness reference. The builder fails the build if any
other `Claude`/`Anthropic` token survives.

Output lands in `dist/` (gitignored) plus `dist/manifest.json`, which drives the installers
and the smoke test.

## Install

```sh
npm run install-codex   # build, then copy into $CODEX_HOME/skills (default ~/.codex/skills)
npm run install-agy     # build, validate with `agy plugin validate`, then copy into ~/.gemini/config/plugins
```

Both installers accept `--dry-run` and print every path they touch. Overrides:
`CODEX_HOME` for codex, `AGY_CONFIG_ROOT` for agy.

After installing, start a fresh session:

- codex: `codex`, then ask for a command by name (e.g. "run /status")
- agy: `agy plugin list` should show `the-system-player`; skills load on the next session

## Build and test

```sh
npm run build   # node builder.mjs
npm test        # node test/smoke.mjs
```

`test/smoke.mjs` invokes the **real** CLIs non-interactively — no mocks:

```sh
codex exec --sandbox read-only --skip-git-repo-check --output-last-message <f> -   # prompt on stdin
agy --sandbox --print "<prompt>"
```

For each of the 3 smallest built skills (currently `gather`, `touch`, `status`) it feeds the whole
built SKILL.md plus `Smoke check: reply OK plus one sentence on what this skill does`, then asserts
the answer is non-empty, non-error, and mentions at least one domain term derived from the skill's
own name and description.

Environment failures (CLI not on PATH, auth, quota, timeout) **skip with a warning**; they are never
counted as passes. A run where nothing executed exits `2` (inconclusive), not `0`.

Knobs: `SMOKE_SKILL_LIMIT`, `SMOKE_TIMEOUT_MS`, `SMOKE_AGENT=codex|agy`.

## Evals are never committed

Prompts, raw CLI transcripts, and summaries are written to `evals/<timestamp>/`. That directory —
along with `dist/`, `test-output/` and `*.eval.*` — is in this package's `.gitignore`. Do not
relocate eval artefacts outside those paths.

## Format notes and assumptions

Verified empirically on this machine, not guessed:

- **codex** ships its own skills at `~/.codex/skills/.system/<name>/SKILL.md` with `name` +
  `description` YAML frontmatter and optional `references/`, `scripts/`, `assets/` subdirs.
  User skills go in the same tree one level up, at `$CODEX_HOME/skills/<name>/`.
  Codex has no `~/.codex/prompts/` directory on this install; skills are the current mechanism.
- **agy** documents its plugin layout in its own bundled skill
  (`~/.gemini/antigravity-cli/builtin/skills/agy-customizations/docs/plugins.md`):
  `plugins/<name>/plugin.json` (only `name` is required) with `skills/<name>/SKILL.md` inside.
  Global customisations are discovered under `~/.gemini/config/`. `agy plugin validate <path>`
  confirms the built tree ("27 processed").
- Only `name` and `description` are used in frontmatter — that is all the source skills carry,
  and it is exactly what both targets read.
- The extra `version`/`description` fields written into the agy `plugin.json` are informational;
  agy only requires `name`.

## Known issues

- **codex rejects a prompt beginning with `---`.** Passing the built SKILL.md as a positional
  argument fails with `error: unexpected argument '---`, because the arg parser reads the YAML
  frontmatter fence as a flag. The smoke test therefore pipes the prompt on stdin and passes `-`
  as the prompt argument. This only affects passing skill text as a CLI argument, not normal
  skill loading from `$CODEX_HOME/skills`.
- **agy boolean flags need to precede the prompt.** `agy --print "<prompt>" --sandbox` works, but
  `agy --print --sandbox "<prompt>"` is the form the tests use; putting `--sandbox` immediately
  before the prompt string makes Go's flag parser swallow it.
- No auth or quota failures were observed on this machine at the time of writing; both CLIs
  returned real answers for all 6 checks. If either starts failing for auth/quota, the smoke test
  reports `SKIP ... environment failure — <exact CLI error>` and does not fake a pass.

## Publishing

Not published. `npm publish` is deliberately not wired into any script — that is the maintainer's
call, not the build's.
