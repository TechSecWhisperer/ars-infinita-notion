# Architecture

C4 model views of The System's two most intricate surfaces: the **Status Window** (the always-current player card that renders at the top of every new or stale chat) and the **Job Application Flow** (the command chain that takes a posting from link to submitted application).

| Document | What it covers |
|---|---|
| [status-window.md](status-window.md) | HLD + LLD of the rich status window: render spec, data sources, freshness rule, component + sequence diagrams |
| [job-application-flow.md](job-application-flow.md) | HLD + LLD of the application flow: the real command chain, application state machine, suggest-vs-auto-execute rules, per-stage sequences |
| [c4-deep-dives.html](c4-deep-dives.html) | Standalone HTML rendering of the diagrams that don't fit one mermaid block cleanly (open the raw view or download to view) |

## Level 1 — System Context

Who uses The System and what it touches. One player, one agent, one world.

```mermaid
C4Context
    title The System — System Context (Level 1)

    Person(player, "Player", "A job seeker playing The System inside their own Notion workspace. Talks to the agent in plain language or slash commands.")
    System(thesystem, "The System", "AI-agent skills + Notion template that gamify a job search. Runs entirely in the player's workspace — the agent orchestrates, Notion holds the world.")
    System_Ext(notion, "Notion Workspace", "The player's own Notion. Holds the Kernel, Quest Board, XP Ledger, Status Window, Gate Intel, Battle Log and the rest of the game databases.")
    System_Ext(web, "Job Boards & Company Sites", "LinkedIn, Seek, company career pages — read by /quest and /scout, never written to.")
    System_Ext(feed, "Patch Feed / feed.json mirror", "Public rules-and-patches channel the player's agent checks at boot.")
    System_Ext(github, "GitHub Issues", "The /petition channel to the Game Admin.")

    Rel(player, thesystem, "Issues commands (/quest, /armor, /status...) and answers interview questions")
    Rel(thesystem, notion, "Reads and writes game state via the Notion connector (MCP)")
    Rel(thesystem, web, "Reads postings via /browse (agent-browser), player-authenticated")
    Rel(thesystem, feed, "Version head-check at boot (HTTPS GET)")
    Rel(thesystem, github, "Files petitions via gh CLI")

    UpdateRelStyle(thesystem, notion, $offsetX="-40", $offsetY="-30")
```

**Key boundary:** everything the player can see lives in *their own* Notion workspace. The agent holds no game state; it is stateless between sessions except for what the Kernel records.

## Level 2 — Containers

The System decomposes into three containers: the skill set (the logic), the Notion workspace (the state), and the runtime services the skills reach.

```mermaid
C4Container
    title The System — Container view (Level 2)

    Person(player, "Player", "Issues commands in chat (CLI or desktop app)")

    System_Boundary(c, "The System") {
        ContainerDb(kernel, "🧬 Kernel", "Notion page", "Instance config: ID table for every entity, player facts, theme, versions, sharing toggles. Read first every session.")
        Container(skills, "Skill set", "Agent skills (SKILL.md)", "27 skills — /status, /quest, /armor, /forge, /ghost, /engage... The duty logic. Symbolic KERNEL:&lt;Entity&gt; references, never raw IDs.")
        ContainerDb(world, "Game world", "Notion databases + pages", "Quest Board, XP Ledger, Status Window, Gate Intel, Agent Notes, Battle Log, System Calendar, Achievements, Story Bank...")
        ContainerDb(cal, "📅 System Calendar", "Notion database", "Delivery/record channel for generated rows (briefings, reviews). Never a source of truth.")
    }

    System_Ext(connector, "Notion MCP connector", "query_data_sources / fetch / update tools")
    System_Ext(browser, "agent-browser", "CLI browser driver, invoked only by /browse")
    System_Ext(feed, "feed.json mirror", "Static HTTPS file")

    Rel(player, skills, "Slash commands / plain language")
    Rel(skills, kernel, "Resolve every KERNEL: reference, 1 read/boot")
    Rel(skills, world, "Narrow filtered reads; append-only writes to ledgers")
    Rel(skills, connector, "All Notion access")
    Rel(skills, browser, "Hands URLs to /browse only")
    Rel(skills, feed, "Boot head-check")

    UpdateRelStyle(skills, kernel, $offsetX="-60", $offsetY="10")
```

### The one-sentence shape

**Notion holds the world; the skills are the duty logic; the Kernel is the session's keyring.** Every skill reads the Kernel first, resolves symbolic references against the Kernel's Instance ID table, and does narrow filtered reads against the world — never a full-database pull. Nothing holds state outside the player's workspace.

### Reading the deep dives

- **[status-window.md](status-window.md)** starts with the *rich status window* design: what renders at the top of every new or >1-day-stale chat, how it differs between CLI (ANSI table) and desktop (markdown table), which four Notion surfaces feed it, and the freshness/staleness decision rules.
- **[job-application-flow.md](job-application-flow.md)** derives the *real* chain from the skills themselves — it is not the naive `/quest → /armor → /forge → /ghost` reading; `ghost` is embedded inside both `armor` and `forge` as a mandatory pass, and the actual gate before building is `/appraise`.
