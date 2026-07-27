#!/usr/bin/env python3
"""
leak_check.py — Admin leak-verification gate for ars-infinita-notion.

Scans every player-facing file in this repo (README.md, feed.json, docs/**, and
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
  - THIS FILE IS PUBLIC. A pattern-based detector has to describe what it
    detects, so the standing rule is: it may contain NAMES, never VALUES.
    Sealed page IDs are stored as SHA-256 digests; sealed numeric mechanics
    are matched by shape (e.g. "<n>-in-<n>") rather than by literal value.
    If you are about to paste a real secret in here to make a check work,
    hash it or generalise the pattern instead.
"""

import hashlib
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
ALLOWLIST_PATH = REPO_ROOT / "tools" / "leak_allowlist.txt"

# Player-facing surfaces this gate protects. Anything under these paths
# ships to players (directly, or via the marketplace/plugin install) and
# must never contain sealed admin mechanics.
#
# tools/ is included even though it never ships to players: this repo is
# public and MIT-licensed, so anything committed here is world-readable
# regardless of whether it reaches a plugin zip.
SCAN_TARGETS = [
    REPO_ROOT / "README.md",
    REPO_ROOT / "MAINTAINERS.md",
    REPO_ROOT / "CHANGELOG.md",
    REPO_ROOT / "feed.json",
    REPO_ROOT / "docs",
    REPO_ROOT / "plugins" / "the-system-player",
    REPO_ROOT / "tools",
]

# The gate's own source cannot be scanned by itself: a pattern-based
# detector must name the things it detects, so scanning these two files
# would flag the detector's own vocabulary on every run. This exclusion is
# safe ONLY because no sealed VALUE is stored in either file any more —
# page IDs are hashed (below) and numeric mechanics are matched by shape.
# If you ever put a literal sealed value back into one of these files,
# this exclusion becomes a hole. Don't.
SELF_EXCLUDE = {
    REPO_ROOT / "tools" / "leak_check.py",
    REPO_ROOT / "tools" / "leak_allowlist.txt",
}

# The sealed admin page IDs (Petition DB / Hunter Registry / Nexus and
# related admin-only Notion pages). Raw appearance of any of these IDs
# in a player-facing file is always a leak — these are not meant to be
# guessable or reachable by players.
#
# Stored as SHA-256 of the normalised ID (dashes stripped, lowercased) so
# that this public file does not itself publish the very IDs it protects.
# Detection extracts every UUID-shaped candidate from the scanned text,
# normalises it the same way, and compares digests — which also makes the
# check form-insensitive, catching both the dashed and undashed spellings
# of every sealed ID. The previous literal-substring version only caught
# whichever single spelling happened to be listed here.
#
# To add an ID:  python3 -c "import hashlib;print(hashlib.sha256('<id>'.replace('-','').lower().encode()).hexdigest())"
SEALED_ADMIN_PAGE_ID_HASHES = {
    "a7b307d9a0a924807e1f9a2cc82301010186616846ba82e35bfa47c4cc750378",
    "76e0c8f105a6f6d7adf5e6f159086b941ef46d573153b471b64061d02660d233",
    "42e5cfef1f51fe90242668f0224e9e6cec174ec71cc29d638b63687705629eb9",
    "85747f0bd04b37ba75c781cdb8b499b4be9ae6fbd9a3b9f641573c8ec40567e2",
    "1fb82b88b0a4921a3c9a0c7ef3eb74ea210eebfb44e08d5d502ab35870c55af3",
}

# Any 32-hex Notion ID, dashed or undashed. Deliberately broad — it is a
# candidate extractor, not a matcher; the hash comparison decides.
NOTION_ID_CANDIDATE = re.compile(
    r"\b[0-9a-fA-F]{8}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?"
    r"[0-9a-fA-F]{4}-?[0-9a-fA-F]{12}\b"
)


def _id_digest(raw):
    """Normalise a Notion ID (strip dashes, lowercase) and return its SHA-256."""
    return hashlib.sha256(raw.replace("-", "").lower().encode()).hexdigest()

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
        # Matched by SHAPE, not by value: any run of six or more 2-3 digit
        # numbers joined by slashes. The literal split used to live here,
        # which meant this public file published the sequence it existed to
        # suppress. The shape is specific enough to be a reliable tell and
        # carries no secret.
        re.compile(r"\b\d{2,3}(?:\s*/\s*\d{2,3}){5,}\b"),
    ),
    (
        "awakening-xp-split-total",
        # A 3-4 digit total within ~80 chars of "awaken" in either order.
        # Generalised from the exact total for the same reason as above:
        # catches the tell without naming the number.
        re.compile(
            r"(awaken\w*[\s\S]{0,80}=\s*\d{3,4}\b)|(=\s*\d{3,4}\b[\s\S]{0,80}awaken\w*)",
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
        # The odds of a hidden bonus-XP roll. Naming "Forge Roulette" as a
        # mechanic is fine (players see it fire); any stated odds are the
        # detail this gate is after. Matched as "<n>-in-<n>" by shape so the
        # real odds are not written down here.
        re.compile(r"\b\d+\s*-\s*in\s*-\s*\d+\b", re.IGNORECASE),
    ),
    (
        "forge-roulette-bonus-xp-value",
        # Any "+<n>" or "XP: <n>" near "Forge Roulette". Proximity to the
        # mechanic name keeps this narrow enough not to catch unrelated XP
        # awards elsewhere (e.g. the on-time follow-up bonus in /log, which
        # is a different, plainly documented, non-random game rule).
        # Generalised from the exact payout so the value isn't stored here.
        re.compile(
            r"(forge\s+roulette[\s\S]{0,120}(\+\d+\b|XP:\s*\d+\b))"
            r"|((\+\d+\b|XP:\s*\d+\b)[\s\S]{0,120}forge\s+roulette)",
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
    seen = set()
    for target in SCAN_TARGETS:
        candidates = [target] if target.is_file() else (
            sorted(target.rglob("*")) if target.is_dir() else []
        )
        for path in candidates:
            if not path.is_file() or path in SELF_EXCLUDE or path in seen:
                continue
            if "__pycache__" in path.parts or path.suffix == ".pyc":
                continue
            seen.add(path)
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

    # Hash-compare every UUID-shaped candidate rather than substring-searching
    # for literal IDs, so this file never has to contain them. Normalisation
    # means a sealed ID is caught in either its dashed or undashed spelling.
    for match in NOTION_ID_CANDIDATE.finditer(text):
        if _id_digest(match.group(0)) in SEALED_ADMIN_PAGE_ID_HASHES:
            line_no = text.count("\n", 0, match.start()) + 1
            line_text = lines[line_no - 1] if 0 < line_no <= len(lines) else ""
            hits.append(("sealed-admin-page-id", line_no, line_text.strip()))

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
