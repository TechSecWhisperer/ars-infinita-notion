#!/usr/bin/env node
// gate_audit — does each gate actually fail against the bug it was written for?
//
//   node tools/gate_audit.mjs            # audit every mutation
//   node tools/gate_audit.mjs --list     # names only, no work
//
// WHY THIS EXISTS. Every gate in this repository was added because something
// got through. None of them was ever checked for the property that makes a
// gate a gate: that it goes red when its invariant breaks. Two did not, and
// both were found by running this file for the first time:
//
//   - `release-metadata-check` compared marketplace.json against
//     `renderMarketplace(plugin, marketplace)` — a function that opens with
//     `...existing`. Four of the file's five top-level fields were being
//     compared against themselves. The marketplace `description` and `owner`
//     could be rewritten to anything with the battery green.
//   - The same check's feed comparison only warn()ed, and warnings do not
//     affect the exit code. Its text — "fine mid-release-train, stale
//     otherwise" — described a state indistinguishable from the healthy one,
//     which is how four consecutive releases shipped past it.
//
// A passing test suite is evidence about the code. THIS is evidence about the
// test suite. Run it whenever a gate is added or changed.
//
// SAFETY. Every mutation happens in a throwaway copy of `git archive HEAD`
// under the system temp directory, which is removed afterwards. Nothing is
// written to the working tree and no fixture is ever committed. The leak-gate
// mutations plant a synthetic marker phrase, never anything resembling a real
// sealed value — a fixture crafted to look like real sealed content would
// itself be the thing the gate exists to prevent.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PKG = 'packages/system-skills';

// A synthetic phrase the leak gate's NAME patterns match. Deliberately not a
// real sealed value — it is a category word, planted only to prove the gate
// reaches a given file.
//
// Assembled from fragments rather than written out, because leak_check.py
// scans tools/ and would otherwise flag this file on every run. The gate makes
// the same accommodation for its own source, but as a VALUE_ONLY_FILES entry —
// and every entry on that list is a hole, since it turns off the name checks
// for a whole file. Building the string at runtime costs one line and adds no
// hole at all.
const MARKER = `<!-- audit fixture: ${['hidden', 'quest'].join(' ')} -->`;

// gate: which gate must go red. mutate: runs with cwd = the sandbox root.
const MUTATIONS = [
  { gate: 'checks', name: 'boot-card stamped copy edited',
    mutate: (w) => append(w, `${PKG}/dist/codex/status/references/boot-card.md`, '\nTAMPERED\n') },
  { gate: 'checks', name: 'plugin.json and package.json disagree',
    mutate: (w) => editJSON(w, 'plugins/the-system-player/.claude-plugin/plugin.json',
      (d) => { d.version = '9.9.9'; }) },
  { gate: 'checks', name: 'plugin.json description over 500 chars',
    mutate: (w) => editJSON(w, 'plugins/the-system-player/.claude-plugin/plugin.json',
      (d) => { d.description = 'x'.repeat(501); }) },
  { gate: 'checks', name: 'marketplace.json owner rewritten',
    mutate: (w) => editJSON(w, '.claude-plugin/marketplace.json',
      (d) => { d.owner = { name: 'somebody else', email: 'nobody@example.invalid' }; }) },
  { gate: 'checks', name: 'marketplace.json description rewritten',
    mutate: (w) => editJSON(w, '.claude-plugin/marketplace.json',
      (d) => { d.description = 'a different pitch entirely'; }) },
  { gate: 'checks', name: 'feed head and mechanics_version disagree',
    mutate: (w) => editJSON(w, 'feed.json', (d) => { d.head = '9.9.9'; }) },
  { gate: 'checks', name: 'feed head names a patch that does not exist',
    mutate: (w) => editJSON(w, 'feed.json',
      (d) => { d.head = '9.9.9'; d.mechanics_version = '9.9.9'; }) },
  // Replaced 2026-08-13. This slot used to strip a changelog sentence declaring
  // a plugin/feed version divergence, back when a declared divergence was
  // legal. Will ruled the two versions track each other, so the declaration
  // stopped existing — and this mutation went from testing an invariant to
  // testing nothing, silently. It survived a publish run and blocked the
  // release, which is the audit working: a mutation nothing catches is a
  // mutation whose invariant is gone.
  //
  // The lesson is not "update the list". `MUTATIONS` is a hand-maintained
  // enumeration auditing a hand-maintained battery, and nothing links a check
  // to the mutation that proves it. Filed as the known weakness of this file.
  { gate: 'checks', name: 'feed head behind the plugin version',
    mutate: (w) => editJSON(w, 'feed.json', (d) => {
      // Keep the feed internally consistent so the ONLY thing broken is the
      // head-equals-plugin-version rule — otherwise a pass proves nothing
      // about which assertion caught it.
      d.head = '1.0.0';
      d.mechanics_version = '1.0.0';
      d.patches[d.patches.length - 1].version = '1.0.0';
    }) },
  { gate: 'checks', name: 'a public command dropped from feed.json',
    mutate: (w) => editJSON(w, 'feed.json', (d) => { d.commands = d.commands.slice(0, -1); }) },
  { gate: 'checks', name: 'hidden /handover published in feed.json',
    mutate: (w) => editJSON(w, 'feed.json', (d) => { d.commands.push('/handover'); }) },
  { gate: 'checks', name: 'skill frontmatter name mismatched',
    mutate: (w) => {
      const p = path.join(w, 'plugins/the-system-player/skills/status/SKILL.md');
      fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/^name: status$/m, 'name: not-status'));
    } },
  { gate: 'checks', name: '/petition loses its gh route',
    mutate: (w) => {
      const p = path.join(w, 'plugins/the-system-player/skills/petition/SKILL.md');
      fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/gh issue create/g, 'gh nope create'));
    } },
  // Needs the v1.3.5 tag. A default `actions/checkout@v4` clone has no tags, so
  // in CI this mutation would always skip — meaning the negative control for
  // the installer guard would never actually run in the one place the audit
  // runs automatically. A skip that happens every time is not a skip, it is a
  // hole with a label on it.
  //
  // So fetch the tag first and only skip if that fails too (no network, no
  // remote). The skip is still counted and named rather than swallowed, because
  // silent coverage loss is the thing this file exists to catch.
  { gate: 'checks', name: 'installer reverted to remove-then-copy',
    mutate: (w) => {
      const read = () => execFileSync(
        'git', ['-C', REPO_ROOT, 'show', `v1.3.5:${PKG}/install-codex.mjs`],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
      );
      let old;
      try {
        old = read();
      } catch {
        try {
          execFileSync('git', ['-C', REPO_ROOT, 'fetch', '--depth=1', 'origin', 'tag', 'v1.3.5'],
            { stdio: 'ignore' });
          old = read();
        } catch {
          return 'SKIP: tag v1.3.5 unavailable and could not be fetched (offline or no remote)';
        }
      }
      fs.writeFileSync(path.join(w, PKG, 'install-codex.mjs'), old);
      return undefined;
    } },

  // Leak gate. The last two are the ones that matter: they assert the gate
  // covers surfaces that are not in any hand-written list, which is the defect
  // class that put `packages/`, `.github/` and `.claude-plugin/` outside it in
  // three separate incidents.
  { gate: 'leak', name: 'marker in a player SKILL.md',
    mutate: (w) => append(w, 'plugins/the-system-player/skills/status/SKILL.md', MARKER) },
  { gate: 'leak', name: 'marker in the marketplace manifest',
    mutate: (w) => append(w, '.claude-plugin/marketplace.json', `\n${MARKER}\n`) },
  { gate: 'leak', name: 'marker in AGENTS.md',
    mutate: (w) => append(w, 'AGENTS.md', MARKER) },
  { gate: 'leak', name: 'marker in a brand-new top-level directory',
    mutate: (w) => {
      fs.mkdirSync(path.join(w, 'site'), { recursive: true });
      fs.writeFileSync(path.join(w, 'site', 'index.md'), `${MARKER}\n`);
    } },
];

function append(w, rel, text) {
  fs.appendFileSync(path.join(w, rel), text);
}
function editJSON(w, rel, fn) {
  const p = path.join(w, rel);
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  fn(d);
  fs.writeFileSync(p, `${JSON.stringify(d, null, 2)}\n`);
}

function sandbox() {
  const w = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-audit-'));
  // Two steps through a temp file rather than one `bash -c` with the paths
  // interpolated into a pipeline. Same result, and it removes this file's only
  // shell-injection surface — a mktemp path is benign, but a gate auditor that
  // builds shell strings out of paths is a poor advertisement for itself.
  const tarball = path.join(w, '.repo.tar');
  fs.writeFileSync(tarball, execFileSync('git', ['-C', REPO_ROOT, 'archive', 'HEAD'],
    { maxBuffer: 256 * 1024 * 1024, encoding: 'buffer' }));
  execFileSync('tar', ['-xf', tarball, '-C', w]);
  fs.rmSync(tarball);
  execFileSync('node', ['builder.mjs'], { cwd: path.join(w, PKG), stdio: 'ignore' });
  return w;
}

// Returns true when the gate went RED, which is what a mutation must produce.
function runGate(gate, w) {
  try {
    if (gate === 'checks') {
      execFileSync('node', ['test/checks.mjs'], { cwd: path.join(w, PKG), stdio: 'pipe' });
    } else {
      execFileSync('python3', ['tools/leak_check.py'], { cwd: w, stdio: 'pipe' });
    }
    return false;
  } catch {
    return true;
  }
}

if (process.argv.includes('--list')) {
  for (const m of MUTATIONS) console.log(`${m.gate.padEnd(6)} ${m.name}`);
  process.exit(0);
}

console.log('gate_audit — every mutation below MUST turn its gate red.\n');

// Baseline first. If an unmutated tree is already red, every result after it is
// meaningless, so this is a hard stop rather than a line of output.
{
  const w = sandbox();
  const checksRed = runGate('checks', w);
  const leakRed = runGate('leak', w);
  fs.rmSync(w, { recursive: true, force: true });
  if (checksRed || leakRed) {
    console.error(
      `BASELINE IS ALREADY RED (checks:${checksRed ? 'red' : 'green'} ` +
        `leak:${leakRed ? 'red' : 'green'}) — fix HEAD before auditing.`,
    );
    process.exit(2);
  }
  console.log('PASS baseline — an unmutated tree is green on both gates\n');
}

// `git archive HEAD` is what gets audited, so uncommitted edits are NOT in
// scope. Say so rather than let someone read a green run as covering work they
// have not committed.
try {
  if (execFileSync('git', ['-C', REPO_ROOT, 'status', '--porcelain'], { encoding: 'utf8' }).trim()) {
    console.log('NOTE working tree is dirty — this audits committed HEAD, not your edits.\n');
  }
} catch { /* not a git tree; the archive step will say so */ }

const survived = [];
const skipped = [];
for (const m of MUTATIONS) {
  const w = sandbox();
  let red;
  let skip;
  try {
    skip = m.mutate(w);
    if (!skip) red = runGate(m.gate, w);
  } finally {
    fs.rmSync(w, { recursive: true, force: true });
  }
  if (skip) {
    console.log(`SKIP [${m.gate}] ${m.name} — ${String(skip).replace(/^SKIP:\s*/, '')}`);
    skipped.push(m);
    continue;
  }
  console.log(`${red ? 'PASS' : 'FAIL'} [${m.gate}] ${m.name}`);
  if (!red) survived.push(m);
}

const ran = MUTATIONS.length - skipped.length;
console.log(`\n${ran - survived.length}/${ran} mutations were caught` +
  (skipped.length ? `, ${skipped.length} skipped (NOT verified).` : '.'));
if (survived.length) {
  console.error('\nThese broke an invariant and NOTHING went red:');
  for (const m of survived) console.error(`  [${m.gate}] ${m.name}`);
  console.error(
    '\nEach one is a gate that cannot fail. Either the gate is wrong, or the\n' +
      'invariant it claims to protect is not the one it actually tests.',
  );
  process.exit(1);
}
