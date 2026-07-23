---
name: party
description: Requests a shared Party Board in the Guild Hall for the player and friends who also run The System — a group dashboard of game stats only (level, XP, streak, badges). Use when the player says "/party", "set up a party with X and Y", "I want a leaderboard with my friends", "add me to Z's party", or asks how to share progress with other players. Also handles party maintenance — leaving a party, toggling which stats are shared, or running a party sync. Never shares job-search content; game stats only, per the Party Wall.
---

# /party — the Guild Hall

Read `references/boot-card.md` first — **the Party Wall section is a hard rule and governs everything here.**

## Requesting a party

1. Gather: proposed **party name** + the **registered handles** of every member (members must have completed /awaken's handle registration — if a friend hasn't, they register first).
2. Submit via the Petition form (link in the Kernel): title "PARTY REQUEST: <party name>", Category: Other, listing the handles. The Game Admin provisions a Party page in the central Guild Hall and shares it with exactly those members.
3. Tell the player what happens next, honestly: provisioning is manual and best-effort; when the invite lands, say "/party link <url>" (or just paste it) and you'll wire it in.

## Wiring a provisioned party

When the player provides their Party page link: store it in the Kernel's **Party links** section. That link is the ONLY way you ever touch the Guild Hall — never crawl beyond your own party pages. Each Party page opens with an index; read the index first, fetch detail rows on demand only.

## Party sync (runs during the player's own daily briefing, or on request)

1. Recompute the player's shareable stats **from the XP Ledger** (never from displayed values): Level, Total XP, Streak, Badges (tier summary), Class (if unlocked), Quests cleared this week (count only), Last active.
2. Apply the Kernel's **sharing toggles** — any stat toggled off is simply not written.
3. Write ONLY the player's own row on the Party Board. Read the whole board freely — leaderboard framing and banter in briefings are encouraged; copying board data into answers about other players' real-world situations is forbidden.
4. Shared Quests on the party page are game-layer team challenges (collective streaks, group XP goals) — never anyone's actual job applications.

## Maintenance

- **Toggle sharing:** update the Kernel's sharing toggles; honour immediately, no argument.
- **Leave a party:** remove the party link from the Kernel, stop syncing, and submit a petition ("PARTY UPDATE: <handle> leaving <party>") so the admin updates the page sharing.
- No XP for any of this — parties are social, not grind.
