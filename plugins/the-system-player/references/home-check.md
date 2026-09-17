# Call-home check (boot-time self-verification)

Added 2026-09 (public #18). This is the standing rule every skill honours at
boot, in one place, so no skill carries its own copy of the version or rule
values — the thing that would drift. The two rulings this implements:

- **Rules ship via the plugin build + a Patch Feed entry** (the existing
  release flow). Nothing about this check changes how a rule is published.
- **Skills READ the rules at boot (call-home)** — values are never inlined
  into skill files at build time. A generated mirror needs its own drift
  check and a second copy always eventually disagrees; reading one authored
  file each boot needs neither.

## The check (every boot, after the Kernel read)

1. **Fetch the feed.** Plain HTTPS GET of the public mirror —
   `https://raw.githubusercontent.com/TechSecWhisperer/ars-infinita-notion/main/feed.json`
   — no browser and no connector required. This is the same raw path the
   version head-check already documents; use whatever HTTP capability the
   session has (`curl`, fetch tool, connector).
2. **Verify the version.** The Kernel's Mechanics Version must equal the
   feed's `mechanics_version`. (`feed.head` may briefly lead `mechanics_version`
   during a release window — that is the ordinary head-check situation and is
   handled by the boot ritual's step 2, not this rule.)
3. **Verify the rule values you are about to use.** Any rule value a command
   reads this session (XP amounts from the table above, level thresholds,
   slash-command behaviour) must match the published authority: the
   Nexus Rule Manifest / the Patch Feed entry that shipped it. Compare
   mechanically — exact numbers, exact wording where the rule states wording.
   Do not guess or reconstruct a value that disagrees; a rule value that has
   to be inferred is a value that has drifted.
4. **Verify the boot card itself is current.** The feed's latest patch entry
   title names the release that produced this card. If the Kernel's version
   is newer than what this card's stamped copy says it is, the local copy is
   stale — treat as drift, not as truth.

## Fail-closed — what a mismatch means

If the fetch fails, times out, or any verification in steps 2–4 disagrees:

1. **Run `/doctor`** — its check 6 (Mechanics Version vs Patch-Feed head) and
   the Sigil Check are the authoritative drift tests. Remember the mirror is
   cache-unreliable: a mismatch seen on the `/main/` raw URL alone is stale
   cache first, not drift. `/doctor`'s multi-path comparison decides.
2. **If `/doctor` confirms drift** (not stale cache, not a release window):
   file a petition with the existing `/petition` skill — **category: Bug** —
   describing the mismatch **mechanically**: which version the Kernel holds,
   which version the feed reports, which rule value disagreed and where the
   published value can be read. **No sealed values** — quote only what the
   player's instance already has access to; a mismatch report never needs
   unreleased mechanics, and leaking them is the one way this safety check
   becomes a leak.
3. **If `/doctor` says the local instance is the drifted side**, repair locally
   via the idempotent `/awaken` repair path (restore FROM the published
   authority), as the Sigil Check already orders.
4. **Do not continue rule-earning play on a confirmed mismatch.** The point of
   fail-closed is that a silently wrong XP table or level threshold corrupts a
   ledger that is never re-scored. Surfacing the broken state loudly is the
   correct outcome; working around it quietly is not.

Until the mismatch resolves: non-XP play (reading, drafting, research) may
continue; anything that awards XP, advances a level threshold, or applies a
patched rule waits.

## Expected noise — this is intended

A confirmed drift produces a player-filed issue on the public repo. That is
the design, not a malfunction: a small number of automated, mechanical,
category-Bug petitions that say "these two numbers disagree" is exactly the
early-warning signal the admin asked for — problems surface within one boot
of appearing, instead of whenever a human next looks. Keep each report to the
mechanical facts above so the admin can triage a stack of them quickly.
