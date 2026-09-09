---
name: browse
description: Drive a live web page with agent-browser (the vercel-labs browser CLI) using its real interface — health-check, open, snapshot, click, fill — so browser work actually runs instead of being hallucinated or silently skipped. Use when a task needs to render a JS-heavy page, log into a site, read a live posting, or submit a web form, or when the player says "/browse", "open this page", "use the browser", or a browser-required command (/scout, live /quest, /recruit, /gather, form submission) needs a browser.
---

Read the shared boot card `${CLAUDE_SKILL_DIR}/../../references/boot-card.md` first for hard rules and the capability tiers. **The browser tool's interface is specified here and nowhere else** — the boot card points at this file rather than restating it, so this is the one place to fix when agent-browser changes.

## When this runs
`/browse` is the **sole route to a live web page**. Every duty that needs one calls it: a JS-heavy or LinkedIn posting for `/quest`, company research for `/scout`, the web-research half of `/recruit` and `/gather`, and the stats-heartbeat push. Those commands hand over a URL and what they need extracted; they never run the browser themselves. Universal (Notion-only) commands never need this — and neither do `/petition` or handle registration any more: those file a GitHub Issue via `gh`, which is a plain shell call, not a form.

## Do it in this order
1. **Probe, don't assume.** `agent-browser doctor --json` — checks install, Chrome, daemon, config, network, and runs a live headless launch test. Healthy → proceed. Broken → `agent-browser doctor --fix`. Not installed → explain why before installing anything ("browser commands like /scout and a live /quest need it, and it drives a browser on your behalf only when you run those"), then offer the player their choice of path: **npm** (`npm install -g agent-browser`), **Homebrew** on macOS (`brew install agent-browser`), or **Cargo** (`cargo install agent-browser`), each followed by `agent-browser install` (downloads Chrome for Testing on first run). Can't get it healthy, or the player would rather not → stop and degrade (step 5); never pretend.
2. **Pick the route before opening.** A clean session first. If the page is login-walled or bot-protected (LinkedIn is the usual one), prefer the player's **own already-authenticated browser** — a device-bridge Chrome or an existing logged-in tab — over a clean session, and ask them to clear any checkpoint themselves. Never solve a CAPTCHA or checkpoint yourself (hard rule 8). This routing decision lives here, so a caller cannot succeed or fail by a route the probe never tested.
3. **Open + snapshot.** `agent-browser open <url>`, then `agent-browser snapshot -i` for interactive elements with refs (`@e1`, …). Read the snapshot before acting.
4. **Act on refs.** `agent-browser click @e1`, `agent-browser fill @e2 "text"`, `agent-browser type @e3 "text"`, `agent-browser screenshot [path]` as needed. Refs persist — snapshot once, then act, don't re-query blindly. Prefer `agent-browser batch "open <url>" "snapshot -i" "click @e1"` to run a known sequence in one process. Typed tools with approval prompts are available via `agent-browser mcp --tools core,network,react`.
5. **Report one of three outcomes to the caller — always one of these, never silence.**
   - **`reached`** — the page loaded; hand back what was asked for.
   - **`no browser`** — agent-browser is absent or unhealthy here. Say so and offer the fallback: "This needs agent-browser, which isn't available here — run it from your desktop, or paste the page text and I'll work from that."
   - **`unreachable`** — the browser is healthy but the page is not readable: 404 or dead link, a login wall, a bot-detection block, or a checkpoint only the player can clear. Say which of those it was, because the fix differs, and offer the same paste-the-text fallback.
   Never report a browser action as done when it wasn't, and never let a caller infer success from an absent answer.

## Guardrails
Reads are free. Before any state-changing action (submitting a form, posting) confirm with the player — hard rule 1 (never act/send on their behalf without their ok; never auto-submit). Never solve a CAPTCHA/checkpoint (hard rule 8) — use the player's own authenticated tab and have them clear it. A login-gated or CAPTCHA-gated form is the player's to complete; you prep it, they submit.
