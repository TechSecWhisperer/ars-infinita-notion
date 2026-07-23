---
name: browse
description: Drive a live web page with agent-browser (the vercel-labs browser CLI) using its real interface — health-check, open, snapshot, click, fill — so browser work actually runs instead of being hallucinated or silently skipped. Use when a task needs to render a JS-heavy page, log into a site, read a live posting, or submit a web form, or when the player says "/browse", "open this page", "use the browser", or a browser-required command (/scout, live /quest, /recruit, /gather, form submission) needs a browser.
---

Read `references/boot-card.md` first — the "Using agent-browser" and "Capability tiers" sections are the ground truth for the tool's interface. This skill exists so an agent doing web work uses agent-browser's REAL commands instead of guessing an API or giving up.

## When this runs
Any duty that needs a live browser: a JS-heavy or LinkedIn posting for `/quest`, company research for `/scout`, the web-research half of `/recruit` and `/gather`, submitting the petition / handle / heartbeat form. Universal (Notion-only) commands never need this.

## Do it in this order
1. **Probe, don't assume.** `agent-browser doctor --json`. Healthy → proceed. Not installed → `npm install -g agent-browser && agent-browser install`. Broken → `agent-browser doctor --fix`. Can't get it healthy → stop and degrade (step 4); never pretend.
2. **Open + snapshot.** `agent-browser open <url>`, then `agent-browser snapshot -i` for interactive elements with refs (`@e1`, …). Read the snapshot before acting.
3. **Act on refs.** `agent-browser click @e1`, `agent-browser fill @e2 "text"`, `agent-browser screenshot` as needed. Prefer `agent-browser batch "open <url>" "snapshot -i" "click @e1"` to run a known sequence in one process.
4. **Degrade honestly if there's no browser.** Say so and offer the fallback: "This needs agent-browser, which isn't available here — run it from your desktop, or paste the page text and I'll work from that." Never report a browser action as done when it wasn't.

## Guardrails
Reads are free. Before any state-changing action (submitting a form, posting) confirm with the player — hard rule 1 (never act/send on their behalf without their ok; never auto-submit). Never solve a CAPTCHA/checkpoint (hard rule 8) — use the player's own authenticated tab and have them clear it. A login-gated or CAPTCHA-gated form is the player's to complete; you prep it, they submit.
