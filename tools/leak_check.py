#!/usr/bin/env python3
"""
leak_check.py — Admin leak-verification gate for ars-infinita-notion.

Scans the whole repository (see SCAN_ROOT) for sealed-mechanics leaks: admin-only
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

# WHAT THIS GATE SCANS: the whole repository, minus a short exclusion list.
#
# It used to be the other way round — an allowlist of "player-facing surfaces",
# enumerated by hand. That list was extended twice, each time *after* the gap
# had already shipped, and each time with a comment explaining why skipping
# that path had been wrong all along:
#
#   - `packages/` was unscanned until 2026-08-11. It builds and ships the
#     skills to npm, so its dist/ is a distribution surface carrying
#     transformed copies of player content. Transformed, not byte-identical —
#     so proving the source is clean does not prove the artifact is.
#   - `.github/` was unscanned until 2026-08-12. Issue forms and the pull
#     request template are authored prose rendered into every filed issue and
#     every PR description.
#
# A third audit (2026-08-13) found four tracked files still outside the list,
# including `.claude-plugin/marketplace.json` — the marketplace listing, which
# is among the most public surfaces this repo has — and `AGENTS.md`, an
# instruction file for agents and therefore exactly the prose most likely to
# name admin machinery. Neither contained a hit at the time; the defect was
# that nothing would have caught one.
#
# Three instances of the same failure in one list is a design answer, not three
# oversights. The premise of the allowlist was wrong: this repository is public
# and MIT-licensed, so EVERY committed file is world-readable whether or not it
# reaches a player. There is no such thing as an unpublished path here, and a
# gate whose coverage must be remembered is a gate that will be forgotten.
#
# So the default is now "scan it". Adding a directory to this repo puts it in
# scope automatically. Exclusions must be justified in place, and the only ones
# that qualify are paths whose contents this repository does not author.
SCAN_ROOT = REPO_ROOT

# Directory NAMES excluded at any depth. Keep this list short and boring —
# every entry is a hole, and the point of the inversion above is that holes are
# now deliberate rather than inherited.
EXCLUDED_DIR_NAMES = {
    # Object storage: content is unreachable prose in packed form, and the
    # working tree it was built from is scanned directly anyway.
    ".git",
    # Third-party code this repo does not author or publish. (The package
    # declares no dependencies today; this is here so that adding one does not
    # turn the gate into a scan of the npm ecosystem.)
    "node_modules",
    # Local interpreter environments.
    ".venv",
    "venv",
    "env",
}

# Paths that were covered before the inversion. Asserted at startup so a future
# refactor of the walk cannot silently shrink coverage back to where it was —
# the regression this change exists to prevent is *narrowing*, not widening.
COVERAGE_FLOOR = [
    REPO_ROOT / "README.md",
    REPO_ROOT / "MAINTAINERS.md",
    REPO_ROOT / "CHANGELOG.md",
    REPO_ROOT / "feed.json",
    REPO_ROOT / "docs",
    REPO_ROOT / "plugins" / "the-system-player",
    REPO_ROOT / "tools",
    REPO_ROOT / "packages",
    REPO_ROOT / ".github",
    # Added by the inversion, and named explicitly so that dropping them again
    # is a visible edit rather than an accident of the walk.
    REPO_ROOT / ".claude-plugin",
    REPO_ROOT / "AGENTS.md",
]

# The gate's own source cannot be fully scanned by itself: a pattern-based
# detector must name the things it detects, so the NAME patterns would flag
# the detector's own vocabulary on every run.
#
# These two files are therefore scanned in VALUE-ONLY mode, not skipped.
# Skipping them outright was a real, demonstrated hole: the allowlist is
# exactly where a maintainer quotes a sealed value "as justification", and
# the allowlist on main did precisely that. Value checks (hashed IDs +
# numeric shapes) are safe to run here because neither the digest constants
# nor the regex sources match themselves.
# leak_allowlist.txt gets the full VALUE battery. It is prose, contains no
# regex source, and is the file where a maintainer is most likely to quote a
# secret "as justification" — the copy on main literally did exactly that.
VALUE_ONLY_FILES = {
    REPO_ROOT / "tools" / "leak_allowlist.txt",
}

# leak_check.py gets the ID-hash check ONLY. It cannot be scanned with the
# numeric shape patterns, because it *contains those patterns as source text*
# and a shape pattern reliably matches its own definition — that produced a
# self-trip that failed CI on a clean tree. The hash check is immune (a 64-hex
# digest is not a 32-hex Notion ID) and is the check that actually matters
# here: it is what stops a live admin ID being pasted back into this file.
HASH_ONLY_FILES = {
    REPO_ROOT / "tools" / "leak_check.py",
}

# Categories that describe a sealed VALUE rather than a mere NAME. Only these
# run against value-only files and against binaries.
VALUE_CATEGORIES = frozenset({
    "awakening-xp-split-sequence",
    "awakening-xp-split-total",
    "engagement-watch-cadence-numbers",
})
# Retired 2026-07-31 (Forge ruling C): "forge-roulette-odds-value", "sealed-odds-as-code", and
# "forge-roulette-bonus-xp-value". Under ruling C the Forge Roulette carries
# no sealed value — the 1-in-3 odds and +15 payout live openly in forge/SKILL.md
# by design, so guarding them here would flag the intended state as a leak.
# Only this value class is unsealed; every other seal above stands unchanged.

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
    # Added 2026-08-13. A System Log row ID was being cited in plain text in
    # this file and in the allowlist, and its digest was NOT in this set — so
    # the gate that exists to stop admin IDs reaching a public surface would
    # never have flagged one sitting inside its own source. The citations are
    # now by date; this entry stops the ID coming back. It remains in merged
    # commit history, which is not rewritable at acceptable cost — rotating
    # the ID is the only remedy that actually settles it, and that is ruled
    # and pending.
    "12bb4020d85fe6315be33c3c8987d093976ab2452db7059508db8b8bfbf0807a",
}

# Any 32-hex Notion ID, dashed or undashed. Deliberately broad — it is a
# candidate extractor, not a matcher; the hash comparison decides.
_ID_BODY = (
    r"[0-9a-fA-F]{8}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?"
    r"[0-9a-fA-F]{4}-?[0-9a-fA-F]{12}"
)
NOTION_ID_CANDIDATE = re.compile(r"\b" + _ID_BODY + r"\b")

# Binary variant: no word boundaries, and a lookahead so matches may overlap.
# Compiled bytecode packs string constants against length prefixes and against
# each other, so a sealed ID frequently sits inside a longer run of word
# characters where \b never holds — the anchored regex found ZERO candidates in
# a real .pyc that demonstrably contained an ID. Non-overlapping matching would
# also stride past an ID starting mid-run, hence the lookahead.
NOTION_ID_CANDIDATE_BINARY = re.compile(r"(?=(" + _ID_BODY + r"))")


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
        # Matched by SHAPE, not by value: a run of six or more 2-3 digit
        # numbers joined by slashes. The literal split used to live here,
        # which meant this public file published the sequence it existed to
        # suppress.
        #
        # Context-gated, because the bare shape matches ordinary tabular data
        # — "12 / 15 / 18 / 22 / 25 / 30 applications" and "01/02/03/04/05/06"
        # both tripped an earlier ungated version and would have blocked CI on
        # a harmless docs edit.
        re.compile(
            r"((?:awaken\w*|\bxp\b|milestone|split|grant|award)[\s\S]{0,160}\b\d{2,3}(?:\s*/\s*\d{2,3}){5,}\b)"
            r"|(\b\d{2,3}(?:\s*/\s*\d{2,3}){5,}\b[\s\S]{0,160}(?:awaken\w*|\bxp\b|milestone|split|grant|award))",
            re.IGNORECASE,
        ),
    ),
    (
        "awakening-xp-split-total",
        # A 3-4 digit total within ~80 chars of "awaken" in either order.
        # Generalised from the exact total for the same reason as above:
        # catches the tell without naming the number.
        # Requires an XP context within 40 chars of the number as well, so an
        # ordinary "after you awaken, target = 400 items" does not block CI.
        re.compile(
            r"(awaken\w*[\s\S]{0,80}=\s*\d{3,4}\b(?=[\s\S]{0,40}\bxp\b))"
            r"|(\bxp\b[\s\S]{0,40}=\s*\d{3,4}\b[\s\S]{0,80}awaken\w*)",
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
    # RETIRED 2026-07-31 — Forge ruling C, 2026-07-31. Three patterns previously lived here guarding the
    # Forge Roulette odds and payout: "forge-roulette-odds-value" (the
    # "<n>-in-<n>" shape near a roll/odds word), "sealed-odds-as-code" (a
    # modulus literal near "roulette"), and "forge-roulette-bonus-xp-value"
    # (a "+<n>"/"XP: <n>" near "forge roulette"). Ruling C redesigned the
    # mechanic to need no sealed value — the 1-in-3 odds and +15 payout are
    # deliberately open in forge/SKILL.md — so these three now flag the
    # intended state. Removed rather than allowlisted, because the values are
    # no longer secret at all. This unseals ONLY the Forge value class; the
    # awakening-XP split, engagement-watch cadence, class-engine name, hidden-
    # quest, sealed-codex-name, admin-agent-name, and sealed-page-ID checks
    # are all untouched.
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


def _walk_scan_root():
    """Every file under SCAN_ROOT, minus EXCLUDED_DIR_NAMES, sorted."""
    out = []
    stack = [SCAN_ROOT]
    while stack:
        current = stack.pop()
        try:
            entries = sorted(current.iterdir())
        except (NotADirectoryError, PermissionError, FileNotFoundError):
            continue
        for entry in entries:
            if entry.is_symlink():
                # Do not follow: a symlink out of the tree is not this repo's
                # content, and following one can loop.
                continue
            if entry.is_dir():
                if entry.name not in EXCLUDED_DIR_NAMES:
                    stack.append(entry)
            elif entry.is_file():
                out.append(entry)
    return sorted(out)


def assert_coverage_floor(files):
    """Fail loudly if the walk covers less than the old allowlist did.

    The inversion above widened coverage. The regression worth guarding is the
    opposite one — a future refactor of the walk quietly narrowing it back. A
    gate whose coverage silently shrinks is worse than one that never widened,
    because the exit code still reads as proof.
    """
    covered = set(files)
    missing = []
    for required in COVERAGE_FLOOR:
        if required.is_file():
            if required not in covered:
                missing.append(required)
        elif required.is_dir():
            if not any(required in path.parents for path in covered):
                missing.append(required)
        # A path that exists in neither form is not asserted: the floor lists
        # what must be scanned IF present, and this repo's shape may change.
    return missing


def iter_scan_files():
    """Yield (path, mode) for every file in the repository.

    Scan-by-default: everything under SCAN_ROOT except EXCLUDED_DIR_NAMES. See
    the note on SCAN_ROOT for why the previous hand-enumerated allowlist was
    the wrong shape — three separate gaps, each found only after it shipped.

    Nothing else is skipped. Compiled bytecode in particular MUST be scanned:
    a .pyc built from an older revision of this very file embeds the old
    plaintext constants, so skipping binaries would let the gate certify a
    tree that republishes every secret it was written to suppress.
    """
    files = _walk_scan_root()

    missing = assert_coverage_floor(files)
    if missing:
        rels = ", ".join(str(p.relative_to(REPO_ROOT)) for p in missing)
        raise SystemExit(
            f"leak_check: coverage regression — the walk no longer reaches: {rels}\n"
            "This gate's coverage may widen, never narrow. Fix the walk, do not "
            "shorten COVERAGE_FLOOR."
        )

    for path in files:
        if path in HASH_ONLY_FILES:
            mode = "hash"
        elif path in VALUE_ONLY_FILES:
            mode = "values"
        else:
            mode = "full"
        yield path, mode


# ---------------------------------------------------------------------------
# Coverage disclosure (Will's ruling, 2026-08-13)
#
# Product defects that affect players are told in full — the CHANGELOG, the
# package README and feed.json's player_facing_summary are all deliberately
# candid, and must stay that way. What is NOT public is the state of our own
# verification: which surfaces a check does or does not reach, and how a
# payload could be shaped to satisfy one. Those are internal.
#
# This exists because the rule was set, applied correctly to a pull request
# body, and then broken eight minutes later in a workflow comment inside the
# same change. A rule that lives only in the author's head binds nobody. The
# repository is public and git history is not rewritable at acceptable cost,
# so a public artifact is WRITE-ONCE: there is no retraction, only a diff on
# top of something people can still read. That makes a pre-merge check the
# only mechanism that can actually hold.
#
# The phrases below were chosen empirically, not guessed — every candidate was
# run against the whole tree first, and anything that collided with legitimate
# player-facing defect language was dropped rather than allowlisted, because a
# check that cries wolf gets ignored and is worse than no check.
#
# They are assembled from split literals so this file cannot trip its own
# check while defining it. That is deliberate and not cosmetic: on 2026-08-13
# a raw sealed admin ID was found sitting inside THIS file, unnoticed, because
# nothing scanned the scanner. Exempting the checker's own source is precisely
# the hole a tired maintainer walks through at one in the morning.
COVERAGE_DISCLOSURE_PATTERNS = [
    (
        "coverage-disclosure",
        re.compile(pattern, re.IGNORECASE),
    )
    for pattern in [
        # EVERY fragment is r"" — including the second and third. An adjacent
        # non-raw fragment makes its backslash escapes invalid (SyntaxWarning
        # today, SyntaxError on a future Python), which would take the whole
        # gate down at import time rather than failing a single pattern.
        r"(?:went|goes|going|would go)\s+gr" r"een",
        r"pass(?:ed|es|ing)\s+the\s+(?:gate|batt" r"ery)",
        r"noth" r"ing\s+(?:ran|checked|verified|caught)",
        r"no\s+(?:check|gate|test)\s+(?:ran|reads|covers|watches|sees)",
        r"hand-sc" r"an|scan\s+(?:them|it|these)\s+by\s+h" r"and",
        r"(?:would|will|could|does|did)\s+not\s+ca" r"tch",
        r"wave(?:s|d)?\s+it\s+thro" r"ugh",
        r"structurally\s+can" r"not",
        r"bl" r"ind\s+spot",
        r"tauto" r"log",
        r"no\s+agent\s+can\s+(?:fix|write|reach|correct)",
        r"cover" r"age\s+gap",
    ]
]


def scan_text(text, patterns=None):
    """Scan an arbitrary string. Used for surfaces that are not files.

    A pull request body and a commit message are as public as any committed
    file, and the 2026-08-13 incident put disclosure in both. A file scanner
    cannot see either, so CI pipes them through here.
    """
    hits = []
    lines = text.splitlines()
    # Default MUST include the disclosure patterns. The first draft defaulted to
    # PATTERNS alone, so `--text` silently ran only the sealed-value checks and
    # reported the very comment that prompted this whole check as clean. It was
    # caught by replaying the real 2026-08-13 text instead of a synthetic
    # sample — which is the only reason it is not still true.
    default = PATTERNS + COVERAGE_DISCLOSURE_PATTERNS
    for category, pattern in (patterns if patterns is not None else default):
        for match in pattern.finditer(text):
            line_no = text.count("\n", 0, match.start()) + 1
            line_text = lines[line_no - 1] if 0 < line_no <= len(lines) else ""
            hits.append((category, line_no, line_text.strip()))
    for match in NOTION_ID_CANDIDATE.finditer(text):
        if _id_digest(match.group(0)) in SEALED_ADMIN_PAGE_ID_HASHES:
            line_no = text.count("\n", 0, match.start()) + 1
            line_text = lines[line_no - 1] if 0 < line_no <= len(lines) else ""
            hits.append(("sealed-admin-page-id", line_no, line_text.strip()))
    return hits


def scan_file(path, mode="full"):
    """Return a list of (category, line_number, line_text) hits for one file.

    mode: "full"   — every pattern plus the ID check (normal files)
          "values" — sealed-VALUE patterns plus the ID check
          "hash"   — the ID check only (this file; see HASH_ONLY_FILES)

    Binary files are decoded latin-1 rather than skipped, so ASCII constants
    embedded in compiled bytecode are still compared, and are demoted to
    value-level checks since NAME patterns are meaningless there.
    """
    hits = []
    binary = False
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        try:
            text = path.read_bytes().decode("latin-1")
            binary = True
        except OSError:
            return hits
    except OSError:
        return hits

    lines = text.splitlines()
    if mode == "hash":
        active = []
    elif mode == "values" or binary:
        active = [(c, p) for c, p in PATTERNS if c in VALUE_CATEGORIES]
    else:
        active = list(PATTERNS)

    # Coverage disclosure applies in EVERY mode, including "hash" (this file)
    # and binaries. HASH_ONLY_FILES exists so that files which must legitimately
    # contain sealed-value vocabulary are not tripped by it — that exemption has
    # nothing to do with disclosure, and extending it here would exempt the
    # checker's own source from the one rule it is being taught to enforce.
    # Safe to run unconditionally because the patterns are split-literal.
    if not binary:
        active = active + COVERAGE_DISCLOSURE_PATTERNS

    for category, pattern in active:
        for match in pattern.finditer(text):
            line_no = text.count("\n", 0, match.start()) + 1
            line_text = lines[line_no - 1] if 0 < line_no <= len(lines) else ""
            hits.append((category, line_no, line_text.strip()))

    # Hash-compare every UUID-shaped candidate rather than substring-searching
    # for literal IDs, so this file never has to contain them. Normalisation
    # means a sealed ID is caught in either its dashed or undashed spelling.
    id_rx = NOTION_ID_CANDIDATE_BINARY if binary else NOTION_ID_CANDIDATE
    for match in id_rx.finditer(text):
        candidate = match.group(1) if binary else match.group(0)
        if _id_digest(candidate) in SEALED_ADMIN_PAGE_ID_HASHES:
            line_no = text.count("\n", 0, match.start()) + 1
            line_text = lines[line_no - 1] if 0 < line_no <= len(lines) else ""
            if binary:
                line_text = f"<compiled bytecode: sealed ID embedded as a constant in {path.name}>"
            hits.append(("sealed-admin-page-id", line_no, line_text.strip()))

    return hits


def main_text(label):
    """Scan stdin as one public artifact (a PR body, a commit message range).

    No allowlist applies here. An allowlist is keyed by path:line, and neither
    of these surfaces has a stable one — but more to the point, both are
    composed fresh by whoever is opening the change, so the right response to a
    hit is always to reword before publishing, never to record an exception.
    """
    text = sys.stdin.read()
    hits = scan_text(text)
    if not hits:
        print(f"leak_check: {label} clean.")
        return 0
    print(f"leak_check: {len(hits)} BLOCKING hit(s) in {label}:")
    for category, line_no, line_text in hits:
        if len(line_text) > 200:
            line_text = line_text[:200] + " …[truncated]"
        print(f"  line {line_no} ({category}): {line_text}")
    print()
    print(
        "This text is public the moment it is pushed, and stays readable "
        "afterwards — editing it later does not unpublish it. Reword it before "
        "publishing.\n"
        "  sealed-*            — a sealed value or admin ID; strip it.\n"
        "  coverage-disclosure — describes what our own checks do or do not\n"
        "                        reach. Player-affecting defects are told in\n"
        "                        full; the state of our verification is not.\n"
        "                        Say what the change does, not what was\n"
        "                        previously unguarded."
    )
    return 1


def main():
    if len(sys.argv) > 2 and sys.argv[1] == "--text":
        return main_text(sys.argv[2])

    allowed = load_allowlist()
    all_hits = []  # (rel_path, category, line_no, line_text, allowlisted)
    bytecode = []

    for path, mode in iter_scan_files():
        rel_path = path.relative_to(REPO_ROOT).as_posix()
        if path.suffix == ".pyc" or "__pycache__" in path.parts:
            bytecode.append(rel_path)
        for category, line_no, line_text in scan_file(path, mode):
            key = f"{rel_path}:{line_no}"
            allowlisted = key in allowed
            # Bytecode "lines" can be enormous; keep output readable.
            if len(line_text) > 200:
                line_text = line_text[:200] + " …[truncated]"
            all_hits.append((rel_path, category, line_no, line_text, allowlisted))

    if bytecode:
        print(
            f"leak_check: WARNING — {len(bytecode)} compiled bytecode file(s) present "
            "under the scan targets. These are scanned, but they should not be "
            "committed at all (see .gitignore). If one is tracked, remove it with "
            "`git rm --cached <path>`:"
        )
        for rel_path in bytecode:
            print(f"  {rel_path}")
        print()

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
