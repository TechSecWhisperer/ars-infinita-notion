# Vendor Capabilities & Multi-Surface Presentation Guide

- **Document**: The System — Player Edition Reference
- **Version**: 2.0.18
- **Scope**: Multi-Runtime Client Gating, Vendor Beta Feature Mapping, and Visual Affordances

---

## 1. Executive Summary

The System adapts its presentation dynamically based on the player's active client runtime. While core game logic, XP banking, and Notion database operations are universal across all environments, visual affordances are strictly segmented:

- **Desktop App Native GUIs** (Claude Desktop, Claude Web, Antigravity IDE Electron GUI) render rich interactive widgets, vector SVG charts, and live dynamic layouts.
- **Terminal CLIs** (Claude Code CLI, agy CLI, Codex CLI, headless terminals) strictly receive clean Unicode ASCII frames, aligned tables, and block progress meters—preventing raw unrendered HTML tags or broken markdown artifacts from polluting terminal output.
- **Notion Native Views** (Board, Calendar, Gallery) provide persistent, interactive drag-and-drop workflow surfaces in the player's own workspace.

---

## 2. Tracked Vendor Capabilities & Beta Radar

The following capabilities are tracked and audited against primary vendor releases (March–October 2026). They govern how agents format and present player data:

| Vendor & Feature | Current Status | Supported Surface | Player-Side Application | Presentation Mode |
| :--- | :--- | :--- | :--- | :--- |
| **Anthropic Inline Visualizations** | Beta (March 2026) | Claude Desktop & Claude Web | Dynamic XP gauges in `/status`, fit-gap matrices in `/appraise`, stage funnels in `/grind` | Interactive SVG / HTML / JS whiteboard widget in conversation stream |
| **Anthropic Claude Dashboards** | Beta (Oct 8, 2026) | Claude Desktop & Claude Web (Artifacts Drawer) | Live Quest Analytics & Pipeline Health querying `KERNEL:Quest Board` via Notion MCP | Persistent multi-metric interactive dashboard with auditable SQL / filter views |
| **OpenAI Intelligent UI** | Expanding (2026) | Desktop App GUI & Web | Dynamic CV section reordering in `/armor`, interactive preference adjustment in `/intake` | Inline interactive sliders, toggle forms, and moveable components |
| **OpenAI ChatGPT Canvas** | General Availability (2025–2026) | Desktop App GUI & Web | Collaborative editing of CV masters (`KERNEL:Agent Notes`) and tailored cover letters (`/forge`) | Side-by-side live document workspace with inline comments and revision history |
| **Google Antigravity Artifacts** | Active Standard (2026) | Antigravity IDE (Electron GUI) | Quest progression flowcharts, `/raid` assault playbooks, and `/armor` layout carousels | Rendered Mermaid diagrams (`flowchart TD`, `stateDiagram`) and markdown carousels |
| **Notion Formulas 2.0** | General Availability (2025–2026) | Notion Client & Web App | Deterministic progress bars and verified business-day SLA computations | Native formula-driven Unicode meters (`[████████░░]`) in database views |
| **Sovereign Local Reach** | Research Architecture | Local CLI & Assisted Browser | Structured ingestion of candidate leads and postings into `KERNEL:Quest Board` | Local script / browser helper following anti-scraping and privacy invariants |

---

## 3. The Multi-Surface Contract: Surface Gating Rules

Agents running The System skills must adhere to the following strict boundary invariants:

### Rule 1: Zero-Slop Terminal Output
When executing in any command-line environment (`Claude Code CLI`, `agy CLI`, `Codex CLI`, or an SSH/tmux terminal), the agent **must never output raw HTML tags** (`<div>`, `<svg>`, `<canvas>`, `<iframe>`, `<style>`). Dumping raw markup into a CLI is classified as agent slop. 

Terminal sessions strictly receive:
- Unicode box-drawing frames (`┌───┐`, `│`, `└───┘`)
- Unicode block progress meters (`[████████░░ 80%]`)
- Plain Markdown tables and bulleted outlines

### Rule 2: Rich Desktop Presentation
When executing in a desktop application or web interface capable of visual rendering, the agent enriches responses with visual components:
- **Claude Desktop / Web**: Inline HTML/SVG visual widgets or dedicated Artifacts.
- **Antigravity IDE**: Native Mermaid diagrams and markdown carousels.

### Rule 3: Native Notion Views Over Fake UI
Agents must never attempt to build pseudo-databases or clunky text spreadsheets in chat when Notion already provides native visual views. Agents direct players to:
- **⚔️ Quest Board**: Use the **Board view** for drag-and-drop stage progression (Saved → Applied → Interviewing → Offer).
- **📆 Next Actions**: Use the **Calendar view** for follow-up SLAs and upcoming deadlines.
- **🏢 Gate Intel & 🏰 Hunter Network**: Use the **Gallery view** for company profiles and contact cards.

---

## 4. Skill Presentation Mapping

### `/status` (Player State & Progression)
- **Desktop App GUI**: Emits an interactive XP and rank progress radar showing current Level, XP to next level, active streak, and badge progress.
- **Terminal CLI**: Emits an aligned Unicode card:
  ```text
  ┌────────────────────────────────────────────────────────┐
  │ 🗡️  HUNTER STATUS: LEVEL 4 (D-RANK)                    │
  ├────────────────────────────────────────────────────────┤
  │ XP: [████████████████████░░░░░] 955 / 1000 (45 to L5)  │
  │ Streak: 🔥 1 Day  |  Debuffs: None                     │
  │ Achievements: 0/12 unlocked  |  Badges: 0/6 forged     │
  └────────────────────────────────────────────────────────┘
  ```

### `/appraise` (Job Fit-Score & Gap Analysis)
- **Desktop App GUI**: Emits a comparative fit-gap spider chart visualizing domain match, seniority alignment, and compensation overlap.
- **Terminal CLI**: Emits an aligned markdown evaluation table and bulleted talking points.

### `/grind` (Pipeline Scan & SLA Check)
- **Desktop App GUI**: Emits a visual pipeline stage funnel showing quest distribution across stages and flagging overdue SLA dates.
- **Terminal CLI**: Emits a clean numbered list grouped by SLA urgency (Immediate Action, Approaching Due, Stale).

### `/armor` (Tailored CV Builder)
- **Desktop App GUI**: Emits moveable section preview blocks allowing the player to inspect layout rhythm before export.
- **Terminal CLI**: Emits a structured section hierarchy outline with page-budget counts.
