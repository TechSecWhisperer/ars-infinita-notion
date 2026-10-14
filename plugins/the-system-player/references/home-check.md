# Home check (boot-time self-verification)

The home check answers whether this session can reach your Notion workspace and
whether the Kernel and published rule surfaces are available and agree. It is
read-only and side-effect-free: it does not repair, change, submit, or invoke
another workflow.

The packaged verifier accepts the evidence collected during the check and
returns one of three outcomes:

- `PASS`: every required check answered healthy.
- `FAIL`: a required check answered unhealthy.
- `UNKNOWN`: required evidence was unavailable.

The exit codes are 0, 1, and 2 respectively. Missing or unavailable evidence
is never treated as `PASS`. Run `npx @ars-infinita-notion/system-skills
home-check evidence.json`, or pipe the JSON evidence on stdin.

## What is checked

1. Your Notion workspace is reachable.
2. Your Kernel is present and has its required sections.
3. The published rule sources are reachable and present.
4. Your local rules agree with the published version.

The check compares what it can read. It does not guess when a value is missing
or cannot be verified.

## If the result is `FAIL` or `UNKNOWN`

Do not use an uncertain result as proof that your setup is healthy. The home-check
verifier itself is strictly read-only and never modifies your workspace or submits
reports.

When the check reports `FAIL` or `UNKNOWN`:
1. **Run `/doctor`** — its check battery (including check 6) is the authoritative
   drift decider to distinguish network/cache glitches from real rule drift.
2. **If `/doctor` confirms drift**: file a petition via `/petition` (category: Bug)
   with the mechanical facts (Kernel version vs feed version, mismatched properties)
   without disclosing sealed values.
3. **Fail-closed:** While a confirmed mismatch is unresolved, non-XP play (reading,
   drafting, researching) may continue, but halt XP-earning play and level advancement
   until the mismatch is resolved. Surfacing broken state loudly protects the XP Ledger.
