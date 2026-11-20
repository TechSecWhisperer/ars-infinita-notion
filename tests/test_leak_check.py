#!/usr/bin/env python3
"""Tests for the backend-internals rule group in tools/leak_check.py.

Run with:  python3 tests/test_leak_check.py

This file is public and is scanned by the leak gate like any other. The real
backend vocabulary is stored in leak_check.py only as SHA-256 digests, and it
must never be written here either: these tests use a SYNTHETIC vocabulary made
of invented words, injected into the same rules the real digests feed. The
real digest sets are only checked for shape (non-empty, 64-hex strings).
"""

import hashlib
import importlib.util
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
_spec = importlib.util.spec_from_file_location("leak_check", ROOT / "tools" / "leak_check.py")
leak_check = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(leak_check)

HEX64 = re.compile(r"[0-9a-f]{64}")


def digest(value):
    return hashlib.sha256(value.lower().encode()).hexdigest()


# Invented vocabulary: none of these is a real term. Keys match
# leak_check.BACKEND_DIGEST_RULES.
SYNTHETIC = {
    "persona": {digest("Zorblax"), digest("Quibble")},
    "repo": {digest("ars-infinita-zorblax")},
    "config-dir": {digest("zorblax")},
    "runtime-name": {digest("frobnic")},
    "state-var": {digest("ZORBLAX_STATE_DIR")},
    "port": {digest("40404")},
    "journal-name": {digest("plinth")},
    "comment-key": {digest("_zorblax")},
}

# Synthetic identifiers (not real workflow or page IDs). The page-ID samples are
# assembled from fragments because any 32-hex token trips the gate's generic
# Notion-ID rule, which is exactly what these tests exercise.
WF_ID = "AbCdEfGhIjKlMnOp"
NOTION_ID = "1a2b3c4d" "5e6f4708" "9a0b1c2d" "3e4f5a6b"
NOTION_ID_DASHED = "1a2b3c4d-" "5e6f-" "4708-" "9a0b-" "1c2d3e4f5a6b"


def categories(text, vocabulary=None):
    return {category for category, _, _ in leak_check.backend_digest_hits(text, vocabulary)}


def all_categories(text):
    return {category for category, _, _ in leak_check.scan_text(text)}


class RealDigestSets(unittest.TestCase):
    def test_every_rule_has_a_non_empty_set(self):
        for _, key, _, _ in leak_check.BACKEND_DIGEST_RULES:
            with self.subTest(key=key):
                self.assertTrue(leak_check.BACKEND_DIGESTS.get(key))

    def test_only_64_hex_digests(self):
        for key, digests in leak_check.BACKEND_DIGESTS.items():
            for value in digests:
                with self.subTest(key=key, value=value):
                    self.assertRegex(value, HEX64)
                    self.assertEqual(len(value), 64)

    def test_no_unused_vocabulary_keys(self):
        used = {key for _, key, _, _ in leak_check.BACKEND_DIGEST_RULES}
        self.assertEqual(set(leak_check.BACKEND_DIGESTS), used)


class PersonaNames(unittest.TestCase):
    def test_synthetic_names_are_caught(self):
        for name in ("Zorblax", "Quibble"):
            with self.subTest(name=name):
                self.assertIn("backend-persona-name", categories(f"Ask the {name} about it.", SYNTHETIC))

    def test_case_sensitive_and_whole_word(self):
        self.assertNotIn("backend-persona-name", categories("zorblax of the gate", SYNTHETIC))
        self.assertNotIn("backend-persona-name", categories("Zorblaxship", SYNTHETIC))
        self.assertNotIn("backend-persona-name", categories("preZorblax", SYNTHETIC))

    def test_other_capitalised_words_pass(self):
        self.assertEqual(categories("Open the Runebook and visit Notion.", SYNTHETIC), set())


class PrivateRepos(unittest.TestCase):
    def test_synthetic_repo_is_caught(self):
        self.assertIn("backend-private-repo", categories("see ars-infinita-zorblax#12", SYNTHETIC))
        self.assertIn("backend-private-repo", categories("Org/Ars-Infinita-Zorblax", SYNTHETIC))

    def test_public_prefix_alone_and_other_repos_pass(self):
        self.assertEqual(categories("ars-infinita-notion is the public repo", SYNTHETIC), set())


class PathsAndPorts(unittest.TestCase):
    def test_each_path_port_and_variable(self):
        samples = [
            "~/.config/zorblax/state",
            "frobnic-runtime",
            "ZORBLAX_STATE_DIR=/x",
            "http://127.0.0.1:40404/run",
            "plinth-journal.jsonl",
        ]
        for sample in samples:
            with self.subTest(sample=sample):
                self.assertIn("backend-path-or-port", categories(sample, SYNTHETIC))

    def test_innocent_shapes_pass(self):
        samples = [
            "~/.config/nvim/init.lua",
            "node-runtime",
            "MY_STATE_DIR=/x",
            "http://localhost:51234/",
            "audit-journal.md",
            "frobnicx-runtime",
        ]
        for sample in samples:
            with self.subTest(sample=sample):
                self.assertEqual(categories(sample, SYNTHETIC), set())


class CommentKey(unittest.TestCase):
    def test_synthetic_key_is_caught(self):
        self.assertIn("backend-comment-key", categories('{"_zorblax": "note"}', SYNTHETIC))

    def test_other_keys_and_plain_words_pass(self):
        self.assertEqual(categories('{"_other": 1, "name": "x"}', SYNTHETIC), set())
        self.assertEqual(categories("leave a comment below", SYNTHETIC), set())


class WorkflowIds(unittest.TestCase):
    def test_after_workflow_word(self):
        self.assertIn("backend-workflow-id", all_categories(f"workflow {WF_ID}"))

    def test_after_workflow_id_key(self):
        self.assertIn("backend-workflow-id", all_categories(f'"workflowId": "{WF_ID}"'))

    def test_in_n8n_url(self):
        self.assertIn("backend-workflow-id", all_categories(f"http://localhost:5678/workflow/{WF_ID}"))
        self.assertIn("backend-workflow-id", all_categories(f"https://n8n.example.test/workflows/{WF_ID}"))

    def test_ordinary_text_is_not_a_workflow_id(self):
        self.assertNotIn("backend-workflow-id", all_categories("workflow documentation overview"))
        self.assertNotIn("backend-workflow-id", all_categories(".github/workflows/leak-check.yml"))
        self.assertNotIn("backend-workflow-id", all_categories("workflow " + WF_ID.lower()))


class NotionIds(unittest.TestCase):
    def test_undashed_and_dashed(self):
        self.assertIn("backend-notion-uuid", all_categories(f"page {NOTION_ID}"))
        self.assertIn("backend-notion-uuid", all_categories(f"page {NOTION_ID_DASHED}"))

    def test_mcp_json_is_exempt(self):
        with tempfile.TemporaryDirectory() as tmp:
            exempt = Path(tmp) / ".mcp.json"
            other = Path(tmp) / "notes.md"
            for path in (exempt, other):
                path.write_text(f"id {NOTION_ID}\n", encoding="utf-8")
            self.assertEqual(leak_check.scan_file(exempt), [])
            self.assertIn("backend-notion-uuid", {h[0] for h in leak_check.scan_file(other)})

    def test_longer_hex_runs_are_not_ids(self):
        self.assertNotIn("backend-notion-uuid", all_categories("a" * 64))


class CleanPlayerText(unittest.TestCase):
    def test_clean_player_string_passes(self):
        text = (
            "Log your applications, finish today's quests and watch your streak grow.\n"
            "Run /forge when you want a bonus roll, then check your Runebook.\n"
            "Ordinary capitalised words such as Runebook, Notion and Forge are fine.\n"
        )
        self.assertEqual(leak_check.scan_text(text), [])
        self.assertEqual(categories(text, SYNTHETIC), set())

    def test_clean_file_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "guide.md"
            path.write_text("Welcome, player. Open the Runebook.\n", encoding="utf-8")
            self.assertEqual(leak_check.scan_file(path), [])


class WholeRepository(unittest.TestCase):
    def test_repository_is_clean(self):
        result = subprocess.run(
            [sys.executable, str(ROOT / "tools" / "leak_check.py")],
            stdin=subprocess.DEVNULL, capture_output=True, text=True,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_text_mode_runs_clean_on_clean_input(self):
        result = subprocess.run(
            [sys.executable, str(ROOT / "tools" / "leak_check.py"), "--text", "test text"],
            input="Open the Runebook.", capture_output=True, text=True,
        )
        self.assertEqual(result.returncode, 0, result.stdout)


if __name__ == "__main__":
    unittest.main()
