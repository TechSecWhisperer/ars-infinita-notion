#!/usr/bin/env python3
"""
leak_check.py — Admin leak-verification gate for ars-infinita-notion.

Scans every player-facing file in this repo (README.md, docs/**, and
plugins/the-system-player/**) for sealed-mechanics leaks: admin-only
terminology, exact formula values, admin agent names, and raw admin
page IDs that must never reach a published, player-facing surface.

Usage:
    python3 tools/leak_check.py

Exit code 0: clean (no hits, or all hits are allowlisted).
Exit code 1: one or more un-allowlisted hits found — listed as file:line.

Design intent (see tools/leak_allowlist.txt and MAINTAINERS.md):
  - Patterns target VALUES and DETAILS of sealed mechanics, not the mere
    concept that sealed content exists. A line like "some content stays
    sealed and is discovered by playing" must NOT trip this gate.
  - Every allowlisted hit needs a real justification comment in
    tools/leak_allowlist.txt, not a blanket suppression.
"""

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
ALLOWLIST_PATH = REPO_ROOT / "tools" / "leak_allowlist.txt"

# Player-facing surfaces this gate protects. Anything under these paths
# ships to players (directly, or via the marketplace/plugin install) and
# must never contain sealed admin mechanics.
SCAN_TARGETS = [
    REPO_ROOT / "README.md",
    REPO_ROOT / "docs",
    REPO_ROOT / "plugins" / "the-system-player",
]

# The sealed admin page IDs (Petition DB / Hunter Registry / Nexus and
# related admin-only Notion pages). Raw appearance of any of these IDs
# in a player-facing file is always a leak — these are not meant to be
# guessable or reachable by players.
SEALED_ADMIN_PAGE_IDS = [
    "3a356d8e806b81dc86e9c0e3ba21726e",
    "8b0087d0-3755-4a38-ad27-019c2b8067ab",
    "7939336c-8276-4d84-b3f8-18c843505806",
    "3a356d8e806b815087dcf42e0c07820c",
    "3a356d8e806b81409efdc8f4160535cb",
]

# Each entry: (category, compiled regex). Regexes are case-insensitive.
# These target specific VALUES/DETAILS/NAMES of sealed mechanics — see
# the module docstring for why generic "sealed content exists" language
# is intentionally NOT matched here.
PATTERNS = [
    (
        "sealed-codex-name",
        re.compile(r"\bsealed\s+codex\b", re.IGNORECASE),
    ),
    (
        "awakening-xp-split-sequence",
        re.compile(r"100\s*/\s*50\s*/\s*100\s*/\s*50\s*/\s*75\s*/\s*50\s*/\s*75"),
    ),
    (
        "awakening-xp-split-total",
        # "= 500" (or "=500") within ~80 chars of "awaken" in either order —
        # catches the total-XP tell for the awakening split without
        # flagging every unrelated "= 500" or "awaken" on its own.
        re.compile(
            r"(awaken\w*[\s\S]{0,80}=\s*500\b)|(=\s*500\b[\s\S]{0,80}awaken\w*)",
            re.IGNORECASE,
        ),
    ),
    (
        "hidden-quest-tier-details",
        re.compile(r"\bhidden[\s-]?quest\b", re.IGNORECASE),
    ),
    (
        "class-engine-internals",
        re.compile(r"\bclass\s+engine\b|\bclass\s+precondition\b", re.IGNORECASE),
    ),
    (
        "admin-agent-name",
        re.compile(r"\bwarden\b|\bcardinal\b", re.IGNORECASE),
    ),
    (
        "feature-flag-registry",
        re.compile(r"\bfeature[\s-]?flag\s+registry\b", re.IGNORECASE),
    ),
    (
        "trigger-insights",
        re.compile(r"\btrigger\s+insights\b", re.IGNORECASE),
    ),
    (
        "forge-roulette-odds-value",
        # The exact odds of a hidden bonus-XP roll. Naming "Forge Roulette"
        # as a mechanic is fine (players see it fire); the exact odds are
        # the detail this gate is after.
        re.compile(r"\b1-in-3\b", re.IGNORECASE),
    ),
    (
        "forge-roulette-bonus-xp-value",
        # "+15" or "XP: 15" specifically near "Forge Roulette" — narrow
        # enough to not catch unrelated +15 XP awards elsewhere (e.g. the
        # on-time follow-up bonus in /log, which is a different, plainly
        # documented, non-random game rule).
        re.compile(
            r"(forge\s+roulette[\s\S]{0,120}(\+15\b|XP:\s*15\b))"
            r"|((\+15\b|XP:\s*15\b)[\s\S]{0,120}forge\s+roulette)",
            re.IGNORECASE,
        ),
    ),
    (
        "engagement-watch-cadence-numbers",
        # A cadence number near the "Engagement Watch" name in either
        # direction — the bare mechanic name alone (no numbers nearby)
        # is not what this pattern is after.
        re.compile(
            r"(engagement\s+watch[\s\S]{0,60}\d)|(\d[\s\S]{0,60}engagement\s+watch)",
            re.IGNORECASE,
        ),
    ),
]

# NOTE on "petition db / hunter registry / nexus raw IDs": the sealed part
# of these is the raw admin page IDs (see SEALED_ADMIN_PAGE_IDS above), not
# the English names. The player plugin *intentionally* discloses to players,
# in plain language, that a stats heartbeat reaches an admin-side registry
# ("This is disclosed to the player in the Runebook; honour their toggles
# without argument.") — banning the bare name "Hunter Registry" would flag
# that legitimate privacy-transparency disclosure as a leak, which is
# exactly the false-positive failure mode this gate is designed to avoid.
# "Nexus" alone is even more clearly fine to name — the Patch Feed and Rule
# Manifest are Nexus-hosted and their *existence* is core, documented,
# player-facing plumbing (see README > Updating). What must never appear
# is the raw page ID that would let a player navigate directly to one of
# these admin pages — that's covered by SEALED_ADMIN_PAGE_IDS.


def load_allowlist():
    """Parse tools/leak_allowlist.txt.

    Format: one entry per non-comment, non-blank line:
        relative/path/to/file:line_number

    Lines starting with '#' are comments/justifications and are ignored
    for matching purposes (but keep them — that's the whole point of
    the file).
    """
    allowed = set()
    if not ALLOWLIST_PATH.exists():
        return allowed
    for raw_line in ALLOWLIST_PATH.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        # Strip inline trailing comments, e.g. "path:12  # why"
        line = line.split("#", 1)[0].strip()
        if not line:
            continue
        allowed.add(line)
    return allowed


def iter_scan_files():
    for target in SCAN_TARGETS:
        if target.is_file():
            yield target
        elif target.is_dir():
            for path in sorted(target.rglob("*")):
                if path.is_file():
                    yield path


def scan_file(path):
    """Return a list of (category, line_number, line_text) hits for one file."""
    hits = []
    try:
        text = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        return hits  # binary/unreadable files aren't player-readable text anyway

    lines = text.splitlines()

    for category, pattern in PATTERNS:
        for match in pattern.finditer(text):
            line_no = text.count("\n", 0, match.start()) + 1
            line_text = lines[line_no - 1] if 0 < line_no <= len(lines) else ""
            hits.append((category, line_no, line_text.strip()))

    for sealed_id in SEALED_ADMIN_PAGE_IDS:
        idx = 0
        while True:
            pos = text.find(sealed_id, idx)
            if pos == -1:
                break
            line_no = text.count("\n", 0, pos) + 1
            line_text = lines[line_no - 1] if 0 < line_no <= len(lines) else ""
            hits.append(("sealed-admin-page-id", line_no, line_text.strip()))
            idx = pos + len(sealed_id)

    return hits


def main():
    allowed = load_allowlist()
    all_hits = []  # (rel_path, category, line_no, line_text, allowlisted)

    for path in iter_scan_files():
        rel_path = path.relative_to(REPO_ROOT).as_posix()
        for category, line_no, line_text in scan_file(path):
            key = f"{rel_path}:{line_no}"
            allowlisted = key in allowed
            all_hits.append((rel_path, category, line_no, line_text, allowlisted))

    if not all_hits:
        print("leak_check: no hits at all. Clean.")
        return 0

    blocking = [h for h in all_hits if not h[4]]
    allowlisted_hits = [h for h in all_hits if h[4]]

    if allowlisted_hits:
        print(f"leak_check: {len(allowlisted_hits)} allowlisted hit(s):")
        for rel_path, category, line_no, line_text, _ in allowlisted_hits:
            print(f"  [ALLOWLISTED] {rel_path}:{line_no} ({category}): {line_text}")
        print()

    if blocking:
        print(f"leak_check: {len(blocking)} BLOCKING hit(s) — sealed mechanics leak detected:")
        for rel_path, category, line_no, line_text, _ in blocking:
            print(f"  {rel_path}:{line_no} ({category}): {line_text}")
        print()
        print(
            "Fix the leak, or if this is a knowingly-accepted exception pending "
            "an admin ruling, add 'path:line  # justification' to "
            "tools/leak_allowlist.txt (see MAINTAINERS.md)."
        )
        return 1

    print("leak_check: all hits are allowlisted. Passing.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
