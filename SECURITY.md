# Security Policy

## Reporting a vulnerability

**Please do not open a public issue for a security problem.** Public issues in
this repository are visible to everyone, including before anyone has had a
chance to look at what you found.

Use GitHub's private vulnerability reporting instead — the **Report a
vulnerability** button under this repository's **Security** tab. That opens a
private thread visible only to you and the maintainer.

If that route is unavailable to you for any reason, open a public issue saying
only *"security report, requesting a private channel"* — no detail, no
reproduction steps — and a private thread will be opened for the rest.

## What to include

As much as you have. A report is useful even when it is incomplete:

- what you observed, and what you expected instead
- how to reproduce it, if you can
- the version you are on (`/status`, or the `mechanics_version` in
  [`feed.json`](feed.json))
- whether any real data was exposed, and roughly how much

**Never paste credentials, tokens, or another person's data into a report** —
not even to demonstrate the problem. Describe what you were able to reach; that
is enough to act on.

## What happens next, and how long it takes

This project is run by one person with agent assistance, so these are honest
floors rather than guarantees:

| | |
| --- | --- |
| Acknowledgement | Same day. A report that has been seen is marked as seen. |
| First human assessment | Within two days. |
| Fix, or an explanation of why not | Depends entirely on what it is. You will be told which, not left waiting. |

If a report goes quiet for more than a week, that is a failure on this end —
please chase it, and say that you already reported it privately.

## Supported versions

**Only the current release is supported.** Rather than list version numbers
here, where they go stale and start lying, check the current one in
[`feed.json`](feed.json) — the field is `mechanics_version`. Anything older than
that gets security fixes only by updating.

Updating is the fix for most things: your agent checks the version on every
session and offers an update when one exists.

## Scope

**In scope:** this repository — the player plugin, the published npm package,
and the setup instructions. Anything that could expose one player's data to
another, or let something act on a player's behalf without their say-so.

**Out of scope:** vulnerabilities in Notion, GitHub, or the AI provider you run
this with — report those to them directly. Also out of scope: anything
requiring an attacker to already control your machine or your Notion account.

## What this project does with your data

Nothing. Your job-search data lives in your own Notion workspace and never
leaves it. There is no server, no telemetry, and no account. That is a design
property worth verifying rather than trusting — and if you find somewhere it
does not hold, that is exactly the kind of report this policy is for.
