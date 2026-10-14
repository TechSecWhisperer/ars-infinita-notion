# The System — Skill Use-Case Inventory & Evaluation Specification

- **Document**: The System — Player Edition Specification
- **Scope**: 5-Dimensional Skill Activation & Boundary Evaluation Matrix
- **Foundational Invariant**: **Zero Running From Memory.** All actions and information must derive from deep research of authoritative sources (Notion Kernel, live database queries, official vendor documentation) and validate currency of work performed.

---

## 1. The 5-Dimensional Evaluation Standard

Every skill in The System is evaluated against a 5-part representative request inventory derived from the Codex skill-creator and production engineering benchmarks:

1. **Direct Requests (Explicit Activation)**: Explicit slash command invocations or direct calls that must activate the skill immediately without hesitation.
2. **Indirect Requests (Intent Equivalence)**: Natural language user prompts expressing the identical goal without naming the command. The agent must recognize the intent and map to the correct skill.
3. **Incomplete Inputs (Clarification Protocol)**: Underspecified or missing arguments. The skill must not invent parameters or guess; it must ask one targeted follow-up question.
4. **Negative Boundary Requests (Non-Activation)**: Out-of-domain requests or commands belonging to adjacent skills. The skill must strictly refuse activation or route cleanly to the correct owner.
5. **Edge Cases & Invariants (No Hallucination / Unsupported Actions)**: Hostile or degraded conditions (browser absent, CAPTCHAs, sealed game mechanics). The skill must avoid inventing facts, degrading gracefully and honoring security boundaries.

---

## 2. Core Skill Use-Case Matrix

### 1. `/status` (Player State & Progression)
| Dimension | Representative Prompt | Expected Behavior | Boundary Invariant |
| :--- | :--- | :--- | :--- |
| **Direct** | `/status` | Reads `KERNEL:Status Window`, `KERNEL:XP Ledger`, `KERNEL:Achievements`; reports level, rank, XP, streak, debuffs. | Read-only. Never modifies database. |
| **Indirect** | "What level am I and how much XP do I have left to level up?" | Activates `/status`, reads live Player Card, outputs level & remaining XP. | Never answers from stale chat memory; reads live Kernel. |
| **Incomplete** | "Status on my quests" | Clarifies whether the player wants their Hunter RPG status (`/status`) or a pipeline scan (`/grind`). | Does not guess intent when words collide. |
| **Negative** | "Can you check git status and resolve conflicts in branch main?" | Does NOT activate `/status`. Treats as git/code engineering request. | Out-of-domain rejection. |
| **Edge Case** | "What are the secret achievements for Level 10 and how does the admin formula calculate XP?" | Reports only next visible locked badge tier. Refuses to reveal sealed mechanics or future locked achievements. | Sealed mechanics protection (Hard rule 1). |

---

### 2. `/appraise` (Fit-Score & Gap Analysis)
| Dimension | Representative Prompt | Expected Behavior | Boundary Invariant |
| :--- | :--- | :--- | :--- |
| **Direct** | `/appraise https://jobs.example.com/sec-eng` | Evaluates job fit against player's Status Window and Stat Sheet; pulls talking points and suggests `/scout`. | Analysis-heavy reasoning; never rushes a score. |
| **Indirect** | "How good a fit is this role for my background? Here is the JD..." | Activates `/appraise`, matches criteria, calculates fit score (1-10) with rationale. | Grounds claims in player's actual experience. |
| **Incomplete** | "Appraise this role" (no link or JD provided) | Pauses and asks the player to provide the job posting URL or paste the job description text. | Never invents a hypothetical job description. |
| **Negative** | "I just submitted my application for the Security Lead role at Acme Corp." | Does NOT activate `/appraise`. Directs player to `/engage` to log the completed submission. | Route separation: appraisal is pre-application; engage is post-submission. |
| **Edge Case** | Given a JavaScript-rendered link with no browser available | Degrades gracefully: asks player to paste the JD text per `/browse` fallback policy. | Never hallucinates page contents without reading. |

---

### 3. `/grind` (Pipeline Scan & SLA Check)
| Dimension | Representative Prompt | Expected Behavior | Boundary Invariant |
| :--- | :--- | :--- | :--- |
| **Direct** | `/grind` | Scans entire Quest Board for follow-ups due, stale quests, and upcoming SLAs. | Strictly read-only; never writes to databases. |
| **Indirect** | "What applications need my attention today or are going stale?" | Activates `/grind`, groups quests by SLA urgency, surfaces actionable next steps. | Computes SLAs in player's timezone using business days. |
| **Incomplete** | "Check" | Asks the player whether they want to check their job pipeline (`/grind`), network touches (`/touch`), or system health (`/doctor`). | One-at-a-time clarification. |
| **Negative** | "What is the status of my quest for Cloud Architect at Google?" | Does NOT run a full pipeline scan (`/grind`). Routes to single-quest briefing via `/quest`. | Single-quest vs whole-pipeline separation. |
| **Edge Case** | Quest Board has 0 quests post-contact | Clean zero-state report: reports no post-contact quests active, suggests pre-contact options, flags no false debuffs. | No false overdue alarms or urgency theatrics. |

---

### 4. `/armor` (Tailored CV Builder)
| Dimension | Representative Prompt | Expected Behavior | Boundary Invariant |
| :--- | :--- | :--- | :--- |
| **Direct** | `/armor for Staff Security Engineer quest` | Drafts tailored CV master in native Notion blocks from Status Window + STAR stories; runs `/ghost`; exports HTML/.docx. | Never overwrites master without player review. |
| **Indirect** | "Tailor my resume for the Stripe role on my board" | Activates `/armor`, pulls Stripe JD and appraisal, arranges modular sections for role focus. | Sections are modular and reorderable. |
| **Incomplete** | "Build my CV" | Asks which tracked quest on the Quest Board to tailor the CV for. | Refuses to generate an untargeted generic CV. |
| **Negative** | "Write a cover letter for the Stripe role" | Does NOT activate `/armor`. Routes to `/forge` (the cover letter builder). | Tool separation: armor = CV; forge = cover letter. |
| **Edge Case** | Target country is Germany / UK vs US | Automatically adapts conventions: page budget, work rights, spelling, and referee structure. | Country convention awareness. |

---

### 5. `/doctor` (System Diagnostics & Health)
| Dimension | Representative Prompt | Expected Behavior | Boundary Invariant |
| :--- | :--- | :--- | :--- |
| **Direct** | `/doctor` | Runs `/vitals`, executes full PASS/WARN/FAIL battery on Notion access, Kernel integrity, schedules, ledger sync. | No check in battery requires a browser. |
| **Indirect** | "Something seems broken with my setup, can you run a health check?" | Activates `/doctor`, inspects all 13 databases and system pages, reports PASS/WARN/FAIL. | Classifies failures strictly as Local vs Remote. |
| **Incomplete** | "Is it working?" | Asks whether to check system connectivity and health (`/doctor`) or probe session capabilities (`/vitals`). | Clarifies scope before running full battery. |
| **Negative** | "Diagnose why my React frontend is crashing on port 3000" | Does NOT activate `/doctor`. Routes to code debugging / devtools. | Domain scope discipline. |
| **Edge Case** | Public feed mirror raw URL is momentarily stale due to CDN caching | Re-reads authoritative Notion Patch Feed through connector before declaring drift. | Never reports false drift on cache lag. |

---

## 3. Strict Operating Invariant: Zero Running From Memory

To ensure zero drift, absolute data integrity, and compliance with Council standards:
1. **Never Answer From Memory**: An agent must never assert an XP total, level, streak, quest stage, or system ruling based on what was said earlier in chat. Every turn that reports state must query the authoritative Notion database or local file.
2. **Deep Primary Source Research**: When reporting on vendor capabilities or system architecture, the agent must cite authoritative source documentation (release notes, ADRs, test fixtures) rather than LLM parametric memory.
3. **Currency Validation**: Before declaring work complete, verify against live state: inspect git branch heads, run test scripts, query API status, and inspect on-disk build artifacts.
