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

Do not use an uncertain result as proof that your setup is healthy. Use the
separate player-facing diagnostic or setup workflow for the next step; the home
check itself never makes changes or submits anything.

While a confirmed mismatch is unresolved, continue reading, drafting, or
researching if you wish, but wait before using a mismatched rule to earn XP or
advance a level. Resume XP-affecting play only after the separate workflow
confirms that the mismatch is resolved.
