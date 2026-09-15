# Job Application Flow — HLD + LLD

Architecture doc for the end-to-end flow that takes a job posting from *link* to *submitted application*. The chain below is derived from the skills themselves (`quest/SKILL.md`, `armor/SKILL.md`, `forge/SKILL.md`, `ghost/SKILL.md`), not from the intuitive reading — one important correction to the naive mental model comes out of that.

Related: [C4 overview](README.md) · [Status window](status-window.md) · [HTML deep dives](c4-deep-dives.html)

---

## 1. The real command chain

**The naive reading** — `/quest → /armor → /forge → /ghost` as four sequential commands — is wrong in two ways:

1. **`/ghost` is not a stage.** It is a *mandatory embedded pass* inside both `/armor` (step 4 of the armor procedure) and `/forge` (step 5). Players never invoke it in this flow; it exists standalone only for de-AIing arbitrary text.
2. **`/appraise` is the gate.** `/quest` explicitly ends with "ask if the player wants /appraise and/or /scout run next", and both builders pull the Current appraisal note as a primary input. Building armor on an un-appraised quest loses the strongest talking points.

**The real chain:**

```mermaid
flowchart LR
    Q["/quest — track posting"] --> A["/appraise — fit score + gaps\n(triggers /scout if no Gate Intel)"]
    A --> S["/scout — Gate Intel\n(via /browse)"]
    A --> B["/armor — tailored CV"]
    B -.->|mandatory embedded pass| G1[/ghost/]
    A --> F["/forge — cover letter\n(+ Forge Roulette, first forge only)"]
    F -.->|mandatory embedded pass| G2[/ghost/]
    B --> E["/engage — mark applied\n(+10 Armed for battle if a\nCurrent forged letter exists)"]
    F --> E
    E --> R["/report — inbound replies\n(stage + SLA clock updates)"]
```

Player-observable shorthand: **track → appraise → build → submit → respond.** `/armor` and `/forge` are independent siblings after appraisal (either can go first; a player can apply without one of them — `/engage` only *bonuses* for a Current forged letter, it doesn't require it).

## 2. HLD — container view of the flow

```mermaid
C4Container
    title Job application flow — containers and artefacts (HLD)
    Person(player, "Player", "Drives the flow; the System suggests, never auto-submits")
    Container_Boundary(sys, "The System (skill set)") {
        Container(quest, "/quest", "skill", "Tracks posting: Quest Board row (Stage: Saved), Gate Intel company row, +10 XP, SLA clock starts")
        Container(appraise, "/appraise", "skill", "Fit score + gap analysis vs Status Window/Stat Sheet; writes 🗒 Agent Notes (Type: Appraisal); hands company to /scout")
        Container(scout, "/scout", "skill", "Deep company research → Gate Intel record. Browser-gated (via /browse).")
        Container(armor, "/armor", "skill", "CV master as native Notion blocks in 🗒 Agent Notes (Type: CV); /ghost pass; HTML + .docx exports attached to quest; +20 XP once per version")
        Container(forge, "/forge", "skill", "Cover letter note (Type: Cover Letter, Status: Current); /ghost pass; +15 Forge Roulette on first forge only (≤2 drops per 7 days)")
        Container(ghost, "/ghost", "skill", "Voice pass — embedded, not a stage. Draft-only, never sends.")
        Container(engage, "/engage", "skill", "Stage → Applied, dates, Battle Log row, +50 XP (+10 bonus if forged letter Current)")
    }
    ContainerDb(qb, "Quest Board", "Notion DB", "Stage, Last Activity, Next Action, CV Version Sent")
    ContainerDb(gi, "Gate Intel", "Notion DB", "Company research, one row per company")
    ContainerDb(an, "🗒 Agent Notes", "Notion DB", "Appraisals, CV masters, cover letters — Status: Current/Superseded")
    ContainerDb(xp, "XP Ledger", "Notion DB", "Append-only XP rows; every award pre-checked (hard rule 2)")
    ContainerDb(bl, "Battle Log", "Notion DB", "Stage-change traces, sent messages")

    Rel(player, quest, "paste link + 'quest'")
    Rel(quest, qb, "create row")
    Rel(quest, gi, "find-or-create company")
    Rel(quest, xp, "+10 (dedup-checked)")
    Rel(appraise, an, "Appraisal note")
    Rel(scout, gi, "write research")
    Rel(armor, an, "CV master (Current)")
    Rel(armor, qb, "CV Version Sent")
    Rel(forge, an, "Cover Letter note")
    Rel(engage, qb, "Stage → Applied")
    Rel(engage, bl, "trace row")
    Rel(engage, xp, "+50 (+10 bonus)")
    Rel(forge, xp, "+15 roulette (first forge only)")
```

## 3. Application state machine (LLD)

One tracked quest moves through the Quest Board's `Stage` property. The flow commands are the transitions; `/report` and `/respawn` are the event-driven branches.

```mermaid
stateDiagram-v2
    [*] --> Saved: /quest (link pasted)
    Saved --> Saved: /quest continue (briefing, no write)
    Saved --> Appraised: /appraise (+ /scout Gate Intel)
    Appraised --> CVBuilt: /armor (+20, once per version)
    Appraised --> CoverLetterForged: /forge (roulette on first forge)
    CVBuilt --> CoverLetterForged: /forge
    CoverLetterForged --> CVBuilt: /armor
    CVBuilt --> Applied: /engage (+50)
    CoverLetterForged --> Applied: /engage (+50 +10 armed bonus)
    Applied --> RecruiterScreen: /report (inbound)
    RecruiterScreen --> HiringManager: /report
    HiringManager --> Panel: /report
    Panel --> FinalRound: /report
    FinalRound --> Offer: /report (+1000 full clear)
    Applied --> ClosedNoResponse: 14+ days silent
    RecruiterScreen --> ClosedNoResponse: rejection logged
    ClosedNoResponse --> Applied: /respawn (fresh angle)
    ClosedNoResponse --> [*]: stays on board — nothing is deleted
    Offer --> [*]

    note right of ClosedNoResponse
        "Quest failed — effort banked" +25 XP,
        "Lesson logged" +25 bonus
    end note
```

**Invariants held across all transitions:**
- Every XP award is **pre-checked against the Ledger** for the same (action, quest) key — reruns never double-award (hard rule 2).
- Every stage change writes a **Battle Log trace** and updates `Last Activity` (hard rule 9).
- Every active quest keeps `Next Action` / `Next Action Due` populated.
- Nothing is ever deleted; supersession (old CV/letter notes → `Status: Superseded`) is the only form of "replace".
- The System **never submits** anything — `/engage` records a submission the *player* made (hard rule 1).

## 4. Suggest vs auto-execute — decision rules

The flow's contract: **suggest the next step, never silently run it** — with one bounded auto-execute exception. Derived from the skills' own handoff language ("ask if the player wants /appraise and/or /scout run next", "don't run them automatically unless they've already asked for the full sequence in the same message"):

```mermaid
flowchart TD
    X[Command completes] --> Y{Player asked for\nthe full sequence in\nthis same message?}
    Y -- yes --> AUTO[Auto-run the next named stage\ne.g. 'track and appraise this']
    Y -- no --> SUG[SUGGEST only — one line,\nphrased as an offer]
    SUG --> R{Next action obvious\nfrom Stage + gaps?}
    R -- yes --> L["Suggest the one natural next command:
        Saved + no Fit Score → /appraise
        appraised + no Current letter → /forge
        appraised + no CV → /armor
        Applied + 2+ business days → nudge /log
        Screen+ stage, no Raid Prep → /raid"]
    R -- no --> Q[Ask one question — never batch]
    AUTO --> DONE[Report back with next-step offer]
    L --> DONE
```

**Hard bounds on auto-execution:**
1. Same-message intent only ("run the whole chain on this") unlocks auto-run of the *named* stages; each stage still reports its own result.
2. Never auto-execute anything that writes employer-facing documents without showing the draft first (`/armor`, `/forge` always end in "only export once they're happy").
3. Never auto-execute browser-gated stages (`/scout`) when `/vitals` reports no browser — offer the fallback wording instead.
4. The status window's **Next action** line (see [status-window §2](status-window.md#2-data-sources--one-number-one-home)) is always a *suggestion* — an offer, never an order, never an overdue item for pre-contact quests (no SLA flags at `Saved`/`Applied`).

## 5. Sequence diagrams per stage

### 5.1 `/quest` (track)

```mermaid
sequenceDiagram
    autonumber
    participant P as Player
    participant Q as /quest
    participant B as /browse
    participant QB as Quest Board
    participant GI as Gate Intel
    participant XP as XP Ledger
    P->>Q: paste link + "quest"
    Q->>B: fetch posting — player-authenticated, no CAPTCHAs
    B-->>Q: role, company, location, JD text
    Q->>GI: narrow probe for company row
    alt new company
        Q->>GI: create basics (Research Status: Not Started)
    end
    Q->>QB: create row (Stage: Saved, Last Activity = today, SLA clock on)
    Q->>QB: page body: [SYSTEM] summary + raw JD verbatim
    Q->>XP: +10 "Quest tracked" (dedup-checked)
    Q->>P: [SYSTEM] Quest tracked: role — company (+10 XP) · offer /appraise / /scout
```

### 5.2 `/appraise` (+ `/scout`)

```mermaid
sequenceDiagram
    autonumber
    participant P as Player
    participant A as /appraise
    participant SW as Status Window / Stat Sheet
    participant GI as Gate Intel
    participant AN as Agent Notes
    P->>A: appraise this role
    A->>SW: read positioning, metrics, competencies
    A->>GI: read company record
    alt no research yet
        A->>A: trigger /scout (browser-gated)
        Note over A: no browser → plain fallback offer
    end
    A->>A: careful fit analysis (reasoning-heavy, hard rule 7)
    A->>AN: write Appraisal note (Current) — fit score, gaps, talking points
    A-->>P: honest read + gaps — offer /armor and /forge
```

### 5.3 `/armor` (CV)

```mermaid
sequenceDiagram
    autonumber
    participant P as Player
    participant V as /armor
    participant G as /ghost (embedded)
    participant AN as Agent Notes
    participant QB as Quest Board
    participant XP as XP Ledger
    P->>V: build my CV for this quest
    V->>V: gather — Status Window, Stat Sheet, Story Bank, JD, Appraisal, Gate Intel, confidential filtered per hard rule 4
    V->>V: target market from quest location, then layout preset chosen
    V->>AN: draft CV master — native Notion blocks, ATS-clean
    V->>G: mandatory voice pass on draft
    G-->>V: de-AI'd draft
    V->>P: show master + layout + section order — invite edits/reorder
    P->>V: happy — after optional edits
    V->>V: export HTML (attached to quest) + .docx (probe first, degrade honestly)
    V->>QB: set CV Version Sent
    V->>XP: +20 "Tailored CV built" (once per version, dedup-checked)
```

### 5.4 `/forge` (cover letter)

```mermaid
sequenceDiagram
    autonumber
    participant P as Player
    participant F as /forge
    participant G as /ghost (embedded)
    participant AN as Agent Notes
    participant XP as XP Ledger
    P->>F: forge the letter
    F->>AN: probe for existing Cover Letter notes (this quest)
    alt none exist — first forge
        F->>F: gather JD + Gate Intel + Status Window + Appraisal
        F->>F: draft 250–350 words, evidence-backed only
        F->>G: mandatory voice pass
        F->>AN: file note (Current), deliver docx
        F->>XP: roulette: cadence gate (≤2 drops/7d), then 1-in-3 real roll
        opt drop
            F->>XP: +15 "Forge Roulette drop"
            F-->>P: ⚒️ The Forge hums — bonus XP granted (+15)
        end
    else one exists — redraft
        F->>G: voice pass on new draft
        F->>AN: new note (Current), old note → Superseded
        Note over F,XP: no roulette — redrafts never re-roll
    end
    F-->>P: angle used + where filed + suggest /engage after submitting
```

### 5.5 `/engage` (submit + close the loop)

```mermaid
sequenceDiagram
    autonumber
    participant P as Player
    participant E as /engage
    participant QB as Quest Board
    participant BL as Battle Log
    participant AN as Agent Notes
    participant XP as XP Ledger
    P->>E: I submitted it
    E->>AN: check for Current Cover Letter note on this quest
    E->>QB: Stage → Applied, dates set, Next Action populated
    E->>BL: "Application submitted" trace row
    E->>XP: +50 "Application submitted" (dedup-checked)
    opt Current forged letter found
        E->>XP: +10 "Armed for battle"
    end
    E-->>P: report + note /report for when a reply lands
```

## 6. Handoffs and failure edges

| Edge | Behaviour |
|---|---|
| `/forge` or `/armor` on an untracked role | Offer `/quest` first — never build for untracked roles |
| `/forge` on a quest with no Current appraisal | Proceed, but note the appraisal would sharpen it; offer `/appraise` |
| `/scout` needed but no browser | `/browse`'s exact fallback wording — paste the page text instead; never invent research |
| `.docx` builder absent | Say so plainly, deliver HTML; never fall back to an arbitrary library (public #64 lesson) |
| Player goes quiet mid-flow | The status window's Next-action line re-offers the interrupted stage next session |
| Quest goes 14+ days silent | Stage → `Closed – No Response`; `/respawn` offered; +25 effort-banked XP, nothing deleted |
