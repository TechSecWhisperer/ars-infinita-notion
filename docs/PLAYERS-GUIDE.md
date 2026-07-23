# Player's Guide

A longer walkthrough for once you're installed and connected. If you haven't done that yet, start with the [Getting Started](../README.md#-getting-started) section of the README — this doc picks up right after `/awaken` finishes.

---

## Your first session

### 1. Awaken

If you haven't already, run `/awaken`. This is covered in the README, but the short version: it builds your workspace, writes your Kernel, and walks you to Level 4 as part of setup. Don't skip ahead of it — every other command assumes the Kernel exists.

### 2. Your first quest

Find a job posting you actually care about — a real one, not a test. Paste the link (or just describe the role) and say something like:

> "Track this: [link]"

or run:

```
/quest [link]
```

The System creates an entry on your **Quest Board**, and creates or links a **Gate Intel** record for the company so research has somewhere to live. This also starts an SLA clock on the quest — a nudge later if it goes quiet.

If you want to pick a quest back up later instead of adding a new one, name the role or company and `/quest` will pull up a fast briefing (stage, latest notes, what's next) instead of creating a duplicate.

### 3. Appraise it

Before you commit real effort to an application, get an honest read on it:

```
/appraise
```

This scores your fit against your **Status Window** and **Stat Sheet** (your profile — see Step 4 if you haven't built this out yet), names the actual gaps instead of hand-waving, and pulls talking points you can use later. It also kicks off a `/scout` on the company if one hasn't run yet.

This is deliberately not instant — real reasoning takes a moment. If the role isn't tracked yet, run `/quest` first; if you've already submitted the application, you want `/engage`, not this.

### 4. Build your profile (if you haven't yet)

Everything tailored — CVs, cover letters, fit scores — comes from your **Status Window**: your positioning, experience, metrics, and target roles. Build or update it with:

```
/intake
```

This runs as a real interview: one question at a time, capped at a handful of questions per session, banking each answer immediately so nothing lives only in the chat. You don't have to do it all at once — a focused follow-up ("I have a new metric to add") works the same way as a full rebuild.

### 5. Forge your materials

Once you've appraised a role and have a profile to draw from:

```
/forge
```

drafts a tailored cover letter from the job description, your profile, and the Gate Intel research — then runs it through a voice pass so it doesn't read like AI wrote it. It's filed against the quest with its own lifecycle tracking (so a later redraft supersedes the old one cleanly, it doesn't just pile up).

```
/armor
```

builds your tailored CV the same way — an editable master, a voice pass, and both a send-ready copy and an editable file attached to the quest.

### 6. Engage

When you actually submit the application (not before):

```
/engage
```

This moves the quest's stage, logs dates, records it to your Battle Log, and awards XP for the real-world action you just took.

---

## The daily loop

Once you're set up, most sessions look like this:

1. **`/grind`** — a read-only scan of your whole pipeline: what's due, what's gone stale, what's an open next action. Start here when you're not sure what to work on.
2. **Work whatever `/grind` surfaced** — appraise a new quest, forge a letter, log a reply with `/report`, follow up on a stalled one.
3. **`/touch`** — check who in your network is overdue for a reach-out, if you're doing any networking that day.
4. **`/status`** — a quick read-only check of your level, XP, and streak, any time you want it.

Weekly, run `/levelup` — a review ritual that checks your pipeline health, response-rate stats, catches contradictions or stale claims in your notes, and logs a couple of enhancement suggestions for the System itself.

If something about how the System behaves isn't working for you, `/patch` logs a standing correction so every future session (including scheduled ones) follows it automatically — including pausing a feature outright if it's doing more harm than good.

---

## XP, levels, and streaks

The public rules you can rely on:

- **Real actions earn XP.** Setup steps, application submissions, cover letters, intake work, and other tracked actions each carry their own XP value, logged to your XP Ledger.
- **XP accumulates into levels.** Your level is a running reflection of real work done, not a countdown or a quota.
- **Streaks track consistent engagement** over time and show up on your `/status` read-out alongside your level and XP.
- **History is permanent.** New mechanics that ship later never rewrite what you've already earned, and your existing XP is never re-scored retroactively — what you have, you keep, no matter how the System evolves around it.
- **Duplicate-proofing is built in.** Idempotent commands like `/awaken` and lifecycle-tracked actions like `/forge` and `/intake` guard against double-counting the same action twice.

The exact XP values, level thresholds, and any bonus mechanics are intentionally not published here — some content in The System stays sealed and is discovered by playing rather than by reading a spec. If you're curious about something you've noticed but that isn't documented anywhere in the plugin's own command descriptions, that's expected — ask the admin with `/petition` if you want to understand it better.

---

## Getting unstuck

- `/doctor` — full diagnostic pass, self-repairs local problems, escalates anything it can't fix itself.
- `/vitals` — see exactly what your current session can do (Notion connectivity, browser layer, mobile vs. desktop capability).
- `/petition` — anything else: bug, question, idea, or appeal.

See the README's [Troubleshooting](../README.md#troubleshooting) section for the most common setup snags.
