# Step 7.5 project context setup

Read and follow this complete contract whenever `/awaken` reaches Step 7.5. It is kept as a reference so every supported player surface can load the full file-safety procedure and both templates.

## Step 7.5 — seat the local project context (AGENTS.md + CLAUDE.md, if this session can actually write here)

### Resolve the project directory first — do not hand the player a folder to create

**The player should never have to create a project folder by hand — but they do decide
where it lives.** The folder is plumbing for the context files below, so building it is a
machine's job; the *location* is theirs, because it is their machine and their filesystem.
The older version of this step said "attach a folder and re-run" whenever the session had
none attached — that outsourced a machine step to the player, and it was the single largest
piece of avoidable setup friction in /awaken.

So, before any write is attempted, resolve a project directory, in this order:

1. **Already attached.** If the session has a working directory, project folder, or
   workspace attached (a filesystem tool reports one, `pwd` resolves, a workspace root is
   exposed), use it. Say which path you resolved and move on — no question asked.
2. **No folder attached, but the session can write files.** Ask **one** question and
   offer **no default** — do not suggest a location, do not pre-fill one, and do not treat
   a blank answer as consent to choose for them: *"Where should your System project live?
   Give me the full path, for example `/home/you/the-system` or `~/the-system`."* When they
   give a path, create it with a plain `mkdir -p` and proceed. If they decline entirely
   (they want no folder on this machine), record that and go straight to the outcome-4 skip
   below — never create a folder they refused, and never create one they did not name.
3. **No folder attached and the session cannot write files at all.** Skip to outcome 4.
   There is nothing to resolve, and asking the player to go create a folder somewhere this
   session cannot even reach is the friction this section exists to remove.

Resolution is **idempotent**: on a re-run or repair, the folder already exists — `mkdir
-p` on an existing directory is a no-op, so resolve-then-proceed never rebuilds or
duplicates anything. If a previous run recorded a path on the Kernel, reuse it instead of
asking again.

Creating a folder is the one thing this step does **without further permission** once the
player has named the path: it is empty, it is
reversible (`rmdir` undoes it, and the close tells the player that), and refusing to create
it silently would leave setup looking done with nothing seated. Writing the two context
files inside it stays governed by the marker rules below. Nothing else on the player's
machine is touched.

**Probe before you claim. Do not infer writability from the kind of session this is.** A session can report as file-capable and still have nowhere to write — some hosts grant *no* filesystem access at all, not restricted access but none, until the player attaches a folder or workspace to the session. Gate on session type alone and setup finishes looking successful with nothing written, and every session afterwards starts cold with nothing explaining why.

So: **attempt each write, then check it landed.** Resolve the project directory, write **both** files (below), and read **each** back. One of four outcomes, and say which:

1. **Both wrote.** Note both full paths in the close so the player knows where they are.
2. **Neither could be written.** Say so plainly and name the cause — do not report Step 7.5 as done. **Quote the host's own refusal back to the player word for word rather than paraphrasing it.** That exact string is what lets them match the symptom to the remedy, and it differs by host, so inventing a likely-sounding one is worse than useless. If the refusal names a missing folder or workspace, resolve the directory per the section above (ask where it should live, then create it there — never hand them the mkdir), then re-run `/awaken`; it is idempotent and picks up here. Everything already built in Notion is safe and is not rebuilt.
3. **One wrote and the other did not.** **Report this as a failure of the step, never as a success.** Name the file that is missing and the refusal for it verbatim, and say which agent that leaves without context: no `AGENTS.md` means Codex and the Antigravity CLI start cold here, no `CLAUDE.md` means Claude Code does. Re-running `/awaken` retries the missing one. **Never report the half that succeeded as the step being done** — a folder with one of the two files is the silent cold start this step exists to prevent, and it is the outcome most likely to be mistaken for success.
4. **No filesystem at all.** Only when this session has **no file-writing tool whatsoever** — not a tool that exists and refuses. Skip, and note in the close that a desktop session is what seats the project context. **If a write tool exists and the write was refused, that is outcome 2, not this** — a desktop chat app with no connected folder is the common case, and it belongs in outcome 2, where the remedy is the directory-resolution section above (ask where it should live and create it there), then a re-run.

**Notion-backed setup can continue either way.** Step 7.5 itself is not complete unless both files were written and read back. In a chat-only session with no filesystem, mark Step 7.5 **deferred** and leave a concise handover pointer for a capable session; do not ask the player to claim that context files were written.

**If a file already exists, read it before writing.** A player may already have a `CLAUDE.md` or `AGENTS.md` of their own — from another tool, or hand-written. Decide by a marker, not by judgement. Both templates below begin with the line:

```
<!-- ars-infinita:the-system -->
```

The block is **delimited at both ends** — the opening marker above and `<!-- /ars-infinita:the-system -->` below it. That pair, not the file, is what The System owns. Two branches, and only two:

- **Exactly one opening marker and exactly one closing marker, in that order** → replace **only the text between them**, byte for byte, and leave every other line in the file exactly as it is. This is the re-run and migration path.
- **Anything else** — no file, no markers, only one of the pair, or more than one of either → **append** the whole marked block, opening and closing markers included, to whatever is already there, separated by a blank line, and never overwrite a byte of what was there. If the file was non-empty, say in the close that you appended rather than replaced, and name the file.

**Count both markers before you choose a branch.** Any count other than exactly one and one takes the append branch — including a file with two opening markers and one closing marker, which is what a hand-deleted closing marker leaves behind. Guessing a pairing there is how the player's own writing gets swallowed: the outermost reading spans from the first opening marker to the closing one, and everything in between — theirs included — would be replaced.

**Never replace a whole file because it contains the opening marker.** After the append branch runs once, the player's own content and The System's block live in the same file — replacing it outright on the next run destroys their work, which is the exact outcome this rule exists to prevent. The closing marker is what makes "replace in place" a real operation rather than a wish: without an end delimiter there is no way to tell where The System's block stops and the player's writing resumes.

If a player deletes one of the markers by hand — they are HTML comments and invisible in a rendered-Markdown editor — the counts stop being one and one, so every later run appends rather than replaces. That is the safe failure: a visible duplicate the player can delete, never a silent deletion of their own text.

**Text the player writes between the markers is replaced on the next run**, because that region is the block. On a fresh folder the marked block is the whole file, so this is the likeliest place a player will add a note. Say so in the close when you write the files: their own notes belong outside the marker pair.

**Write both files, on every harness.** A player's folder may be opened by more than one agent — they may start in one CLI and later open the same folder in another — and the agents do not agree on a filename. Writing only the one this harness happens to read is what leaves the next agent starting cold. The two names are not alternatives to choose between; they are one instruction reachable by two conventions:

- **`AGENTS.md`** carries the content. Codex, the Antigravity CLI and other agents read this name from the project root.
- **`CLAUDE.md`** imports it. Claude Code reads **only** `CLAUDE.md` and does not read a bare `AGENTS.md`, so without this file a session in that folder starts cold no matter what `AGENTS.md` says.

This is an import, not a copy: the instructions exist once, in `AGENTS.md`. Never write the body into both files — two copies drift, and the moment they disagree neither is trustworthy.

The content is a thin **bootstrap pointer, not a second source of truth** — the 🧬 Kernel in Notion remains authoritative; these files only say how to find and follow it. Keep it short.

`AGENTS.md`:

```
<!-- ars-infinita:the-system -->
# The System — project context

This project runs "The System" — a gamified job-search tracker living in Notion.
SOURCE OF TRUTH is the 🧬 Kernel page in Notion, never this file. This file only bootstraps a session.

On session start:
1. Ensure the Notion connector is available (run /vitals).
2. Read the 🧬 Kernel page (search "Kernel" inside "The System — Job Search HQ") for instance IDs, player facts, versions, and Nexus links; follow the boot ritual.
3. Run the command asked for — /status, /grind, /quest, /forge, /doctor, … (the installed the-system-player commands).
Never cache IDs in this file; always resolve them from the Kernel. If the Kernel is missing or empty, run /awaken.
<!-- /ars-infinita:the-system -->
```

`CLAUDE.md`:

```
<!-- ars-infinita:the-system -->
@AGENTS.md

# The System — bootstrap
The line above imports this project's context. If it did not expand, open AGENTS.md in this
folder and follow it. SOURCE OF TRUTH is the 🧬 Kernel page in Notion, never a local file.
If the Kernel is missing or empty, run /awaken.
<!-- /ars-infinita:the-system -->
```

Those three fallback lines are deliberate. `@`-import expansion is documented for Claude Code but not for every surface it runs on, and a `CLAUDE.md` whose single line failed to expand is indistinguishable from no context at all — the exact cold-start this step exists to prevent. A session that cannot expand the import can still read the sentence telling it where to look.

Report **which files were written**, by name, in the close. "Context seated" without naming them is the kind of unverifiable success this step is built to avoid.

Regenerate both on a **Migration-required** re-run (their contents are version-agnostic, but re-writing keeps them present if the workspace moved) — probing the same way, with the same four outcomes. No XP — this is plumbing, not a milestone.
