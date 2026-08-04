---
name: vitals
description: Probes what this session can actually do — Notion connector reachability, agent-browser presence and health, MCP-capable vs app-only, Patch Feed reachability — and reports a capability profile that drives command gating. Read-only, no writes. Use when the player says "/vitals", "what works here", "check my setup", "am I on desktop or mobile", "why can't I run /scout", or as the cheap probe the boot ritual and browser-required commands call to decide what can run.
---

Read the shared boot card `${CLAUDE_SKILL_DIR}/../../references/boot-card.md` first (see "Capability tiers & graceful degradation" and "/vitals and /doctor"). Read-only — `/vitals` never writes to Notion or disk.

## What /vitals does
A fast environment probe answering one question — "what can I do in THIS session?" — returning a capability profile. It does not diagnose game state or repair anything (that's `/doctor`). It's cheap enough to auto-run at boot so capability-gating messages reflect the real session, not a guess.

## Checks (quick, non-destructive)

1. **Notion connector** — probe with `self` as the PRIMARY test (it always works and needs no ID); optionally also read a known page. PASS if it returns, FAIL if the connector isn't available. Everything in The System depends on this, so a FAIL is reported first. If `self` shows query tools as `limited_free_trial` (free plan), note it in the profile so downstream commands expect the view-fetch fallback rather than discovering the quota mid-run.
2. **agent-browser** — is a browser-automation tool present and responsive? If a browser MCP is connected, note it available; if a trivial, safe health probe is available, use it. Report present-and-healthy / present-but-unhealthy / absent.
3. **Session class** — MCP-capable (tools/connectors beyond Notion present) vs app-only. Infer from which tool families actually exist this session; don't overclaim.
4. **Patch Feed / call-home** — is the Nexus Patch Feed reachable? Two ways in, **neither of which needs a browser**: the feed lives in **Notion**, so the connector reaches it directly; and the public `feed.json` mirror is a plain HTTPS GET of a static file —

   ```
   https://raw.githubusercontent.com/TechSecWhisperer/ars-infinita-notion/main/feed.json
   ```

   — which any agent that can make an HTTP request or run `curl` can read. Report reachable / unreachable, and say which path answered.

## Report — the capability profile
Give a short, plain profile framed by capability, never as a device-class verdict:
> `[VITALS]` Notion ✅ · agent-browser ✅ healthy · MCP-capable · Patch Feed ✅ — everything runs here, including /scout, live /quest, and the stats heartbeat.

or degraded:
> `[VITALS]` Notion ✅ · agent-browser ❌ not available · app-only — universal commands run here; browser-required ones (/scout, live /quest, /recruit & /gather research) need your desktop, or paste the page text and I'll work from that.

Other commands read this profile to decide whether to run, degrade, or offer the fallback (boot-card "Capability tiers"). If the player invoked `/vitals` directly, stop after reporting; if it was auto-run at boot, hold the profile in mind and continue to their actual request.
