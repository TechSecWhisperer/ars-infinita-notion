---
name: scout
description: Does deep research on a company the player's job-hunting at (strategy, recent news, culture signal, likely stakeholders) and writes it to the Gate Intel record in Notion. Use when the player says "scout this company", "research X for me", "what's the deal with this company", or as a natural follow-up after tracking or appraising a role there. This is analysis-heavy research work — take the time to actually search rather than guessing from prior knowledge, since company leadership and news change often.
---

Read `references/boot-card.md` first for IDs, query mechanics, and hard rules. This wants careful, unhurried research (boot card rule 7) — company leadership and news turn over fast, don't rely on stale training knowledge.

## What /scout does
Real web research on a company → 5 key insights written to its Gate Intel record, plus a Hunter Network stub for any publicly-known relevant stakeholder found (never scraped private data).

## Steps

1. **Identify the company.** From the Gate Intel database (data source `KERNEL:Gate Intel`) if it already has a stub (created by /quest), or create one if the player named a company with no quest yet.

2. **Research via web search**, aimed at:
   - Recent strategic moves, product launches, M&A, financial results — anything explaining *why this role/team exists right now*.
   - Who leads the relevant function (e.g. the central security/eng/whatever org this role sits under) — use public sources only (company org pages, press, sites like theorg.com). If leadership has recently changed, say so explicitly and flag names as needing re-verification rather than asserting a title-holder from a stale source.
   - Culture signal — check review sites (Glassdoor/Seek reviews) alongside the company's own claims; if they conflict, report both honestly rather than picking the flattering one.
   - Anything that connects to the player's own story (e.g. a shared technology, a growth narrative their experience speaks to).

3. **Write 5 key insights** to the Gate Intel page body (append, don't overwrite prior scout content unless it's explicitly stale — if re-scouting, mark the old section superseded with a date rather than deleting it, per the never-delete rule). Update `Research Status: Complete`, `date:Last Refreshed:start` = today, and `Glassdoor / Culture Notes`.

4. **Log any publicly-known relevant contact** to Hunter Network (data source `KERNEL:Hunter Network`) as a stub: `Name`, `Role / Title`, `Companies` = relation to this Gate Intel row, `Roles` = relation to the quest if one exists, `Type: Network`, `Warmth: Cold`, `Research Brief: Researched — see page`, and a `Notes` field that's explicit this is public-profile-only research, not yet contacted — never assert this person is definitely the hiring manager unless a source actually says so.

5. **Index it, don't dump it on the quest.** If there's a related quest, add a short pointer row in 🗒 Agent Notes (data source `KERNEL:Agent Notes`): `Note` = "<Company> — Scout Brief (pointer)", `Type: Scout`, `Status: Current`, `Related Quest` = the quest, `Summary` = the insights condensed to one line, noting the full scout is on Gate Intel (company-level, reusable across future quests at the same company) rather than duplicating the full brief per-quest.

6. **Report back**: the 5 insights as a tight list, and flag anything uncertain (e.g. "the FS leadership contact is unconfirmed post a recent exec transition — don't reference a name without re-checking").

## Sources: stay public and honest
Only use public sources (news, company sites, press releases, public professional profiles). Don't scrape private LinkedIn data or guess at people's roles. If you can't find something, say "not findable online" rather than filling the gap with a plausible-sounding guess.
