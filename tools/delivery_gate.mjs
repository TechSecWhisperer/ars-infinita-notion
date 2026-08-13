#!/usr/bin/env node
// delivery-freshness-gate — did the code we shipped actually reach a player?
//
//   node tools/delivery_gate.mjs [--self-test]
//
// Exit 0 = PASS, 1 = FAIL, 2 = BLOCKED (could not run — never treated as PASS).
//
// WHY THIS EXISTS.
//
// On 2026-08-10 three PRs merged, changing eight files inside the shipped
// player plugin — and no player received any of them. Every release surface
// agreed on 1.3.1 and had done since 2026-08-05, and a client that sees an
// unchanged version offers no update. Agreement between surfaces is therefore
// not the same question as delivery to a player, and this gate asks the
// second one.
//
// A player's client compares their installed version against the published
// one. Equal versions mean no update is offered, so none of those eight files
// reached anybody. The defect was found a day later by a human asking "do
// players actually get this?", which is not a control.
//
// The gap is structural: release-metadata-check compares surfaces to each
// other AT A POINT IN TIME. It has no concept of change, so it passes
// trivially whenever nothing moved — which is exactly the failing state. This
// gate is the only check in the repo that reads git history, and it asks the
// one question the others cannot: has shipped code changed since the version
// that announces it last moved?
//
// Deliberately NOT added to test/checks.mjs: that file documents itself as
// "no network, no CLIs, no dependencies", and this needs git. Keeping its
// contract intact is worth one extra file.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import {
  PKG_ROOT,
  REPO_ROOT,
  SOURCE_PLUGIN_DIR,
  SOURCE_PLUGIN_MANIFEST,
} from '../packages/system-skills/lib/paths.mjs';

const PASS = 0;
const FAIL = 1;
const BLOCKED = 2;

// `-c core.quotePath=false` matters for changedSince(): with the default, git
// escapes non-ASCII paths (e.g. "caf\303\251.md"), which then fails the
// startsWith() test in isWatched() and silently drops a shipped file from the
// watch set. Filtering in JS buys testability at the cost of this footgun; the
// flag is the price. All current paths are ASCII, so this is pre-emptive.
function git(args) {
  return execFileSync('git', ['-c', 'core.quotePath=false', ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  }).trim();
}

const rel = (p) => path.relative(REPO_ROOT, p).split(path.sep).join('/');
const MANIFEST_REL = rel(SOURCE_PLUGIN_MANIFEST);
const PLUGIN_REL = rel(SOURCE_PLUGIN_DIR);
const PKG_REL = rel(PKG_ROOT);

// WHAT COUNTS AS SHIPPED. Two channels reach players, and until 2026-08-12 this
// gate watched only the first:
//
//   plugins/the-system-player/  → the Claude Code marketplace
//   packages/system-skills/     → npm, for the Codex and Antigravity CLIs
//
// Both channels are watched, deliberately. The npm package's README.md and
// cli.mjs ARE the install instructions a codex/agy user reads, so a change to
// either is a change to what a player receives — and, exactly as on
// 2026-08-10, an unchanged version number means an update is never offered.
// Watching one channel would answer the delivery question for half the players.
//
// Two deliberate calls inside the package:
//   - `test/` is NOT watched. It is absent from package.json "files" and
//     cannot change what a player receives, so demanding a release for a
//     test-only edit would be noise, and a gate people route around is worse
//     than no gate.
//   - `builder.mjs` IS watched despite never being published, because it
//     generates the dist/ that ships. Unpublished is not the same as
//     undelivered.
const WATCHED = [PLUGIN_REL, PKG_REL];
const NOT_WATCHED = [`${PKG_REL}/test/`, `${PKG_REL}/.gitignore`];

function isWatched(file) {
  if (NOT_WATCHED.some((prefix) => file.startsWith(prefix))) return false;
  return WATCHED.some((root) => file === root || file.startsWith(`${root}/`));
}

function versionAt(commit) {
  try {
    return JSON.parse(git(['show', `${commit}:${MANIFEST_REL}`])).version || null;
  } catch {
    return null; // manifest absent at that commit — predates the plugin
  }
}

// The commit that INTRODUCED the current version: newest commit touching the
// manifest whose version equals the current one, and whose predecessor's does
// not. Walking manifest-touching commits (rather than diffing the whole log)
// keeps this cheap on a repo of any size.
function findBumpCommit(currentVersion) {
  const commits = git(['log', '--format=%H', '--', MANIFEST_REL]).split('\n').filter(Boolean);
  if (!commits.length) return null;
  let candidate = null;
  for (const commit of commits) {
    if (versionAt(commit) !== currentVersion) break;
    candidate = commit; // keep walking back while the version still matches
  }
  return candidate;
}

// A PR branch cut before a release still carries the OLD version, so the gate
// would report every file that release delivered as "undelivered" — a verdict
// that is true of the branch's tree and false about what merging it does. That
// is the misleading-FAIL that teaches people to ignore a gate, so name it
// instead: the branch is stale, not the repo. Returns null when not applicable
// or undeterminable; callers treat null as "carry on normally".
function baseBranchDrift() {
  const base = process.env.GITHUB_BASE_REF; // set only on pull_request events
  if (!base) return null;
  try {
    git(['fetch', '--quiet', 'origin', base]);
    const baseSha = git(['rev-parse', 'FETCH_HEAD']);
    try {
      // Base already contained in HEAD → branch is current, nothing to report.
      execFileSync('git', ['merge-base', '--is-ancestor', baseSha, 'HEAD'], { cwd: REPO_ROOT });
      return null;
    } catch {
      return { base, baseSha, baseVersion: versionAt(baseSha) };
    }
  } catch {
    return null; // no network or no such ref — fall through to the normal verdict
  }
}

// The npm channel can strand work the same way the marketplace channel did on
// 2026-08-10: a release lands, `npm publish` is forgotten, and codex/agy users
// keep getting the old skills with nothing saying so.
//
// ADVISORY, and that is a deliberate choice rather than an oversight. Failing
// here would deadlock the repo between merge and publish: the release commit
// has to be on main BEFORE it can be published, so a hard failure would block
// every other PR during that window — and a gate that must be bypassed
// routinely is worse than one that reports. The publish itself is gated by
// prepublishOnly; this is the thing that says out loud that it has not happened.
function npmChannelStatus(version) {
  const pkgPath = path.join(REPO_ROOT, 'packages', 'system-skills', 'package.json');
  if (!fs.existsSync(pkgPath)) return null;
  const name = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).name;
  try {
    const published = execFileSync('npm', ['view', name, 'version'], {
      encoding: 'utf8',
      timeout: 30_000,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    if (published === version) return `  npm: ${name}@${published} published — channel current`;
    return `  npm: registry has ${published}, repo has ${version} — run \`npm publish\` from packages/system-skills`;
  } catch (err) {
    const stderr = String(err.stderr || '');
    if (stderr.includes('E404') || stderr.includes('404 Not Found')) {
      return `  npm: ${name} has never been published — codex/agy users cannot npm install yet`;
    }
    return `  npm: registry unreachable, channel state unknown (not treated as current)`;
  }
}

// Diff the whole tree and filter in JS rather than passing a git pathspec, so
// isWatched() is the single definition of "shipped" and the self-test below
// exercises the same function the verdict uses. A pathspec would be a second
// copy of the rule, free to disagree with the one under test.
function changedSince(commit) {
  return git(['diff', '--name-only', `${commit}..HEAD`])
    .split('\n')
    .filter(Boolean)
    .filter(isWatched);
}

// A gate that cannot fail is not a gate. Before issuing any verdict we prove
// the verdict function still discriminates — Fable's fixture rule, in the
// smallest form that fits one check.
function verdict(changedFiles) {
  return changedFiles.length ? FAIL : PASS;
}

function selfTest({ quiet = false } = {}) {
  const cases = [
    { name: 'clean tree after a bump', input: [], expect: PASS },
    { name: 'shipped file changed since bump', input: [`${PLUGIN_REL}/skills/awaken/SKILL.md`], expect: FAIL },
    { name: 'the 2026-08-10 regression, replayed', input: [
      `${PLUGIN_REL}/references/boot-card.md`,
      `${PLUGIN_REL}/skills/doctor/SKILL.md`,
      `${PLUGIN_REL}/skills/vitals/SKILL.md`,
    ], expect: FAIL },
    // The 2026-08-12 case, replayed: install copy on the npm channel changed
    // while the version stood still. Must FAIL, or the second channel is
    // watched in name only.
    { name: 'npm-channel install copy changed', input: [
      `${PKG_REL}/README.md`,
      `${PKG_REL}/cli.mjs`,
    ], expect: FAIL },
    { name: 'npm-channel builder changed (unpublished, but generates dist/)', input: [`${PKG_REL}/builder.mjs`], expect: FAIL },
    // The other half of the scoping rule. Without these the watch set could
    // widen to the whole repo and every case above would still pass.
    { name: 'test-only change is not a delivery', input: [`${PKG_REL}/test/checks.mjs`], expect: PASS },
    { name: 'unshipped repo file is not a delivery', input: ['docs/PLAYERS-GUIDE.md', 'feed.json'], expect: PASS },
  ];
  let bad = 0;
  for (const c of cases) {
    // Route through isWatched() so the self-test exercises the scoping rule
    // and the verdict together — the same pipeline changedSince() uses.
    const got = verdict(c.input.filter(isWatched));
    const okCase = got === c.expect;
    if (!okCase) bad += 1;
    if (!quiet || !okCase) {
      console.log(`  ${okCase ? 'ok  ' : 'BAD '} ${c.name} — expected ${c.expect}, got ${got}`);
    }
  }
  return bad === 0;
}

function main() {
  if (process.argv.includes('--self-test')) {
    console.log('delivery-freshness-gate self-test');
    const okAll = selfTest();
    console.log(okAll ? 'PASS self-test' : 'FAIL self-test');
    process.exit(okAll ? PASS : FAIL);
  }

  if (!fs.existsSync(path.join(REPO_ROOT, '.git'))) {
    console.log('BLOCKED delivery-freshness-gate');
    console.log('  no .git — this gate reads history and cannot run from an export');
    process.exit(BLOCKED);
  }
  if (git(['rev-parse', '--is-shallow-repository']) === 'true') {
    console.log('BLOCKED delivery-freshness-gate');
    console.log('  shallow clone — fetch full history (actions/checkout fetch-depth: 0)');
    process.exit(BLOCKED);
  }
  if (!selfTest({ quiet: true })) {
    console.log('BLOCKED delivery-freshness-gate');
    console.log('  self-test failed — the gate cannot discriminate, so its verdict means nothing');
    process.exit(BLOCKED);
  }

  const version = JSON.parse(fs.readFileSync(SOURCE_PLUGIN_MANIFEST, 'utf8')).version;
  const bump = findBumpCommit(version);
  if (!bump) {
    console.log('BLOCKED delivery-freshness-gate');
    // The common case by far, and it looks like history corruption if unnamed:
    // you are mid-release, the bump is staged but not committed, so there is no
    // commit to measure from yet. Still BLOCKED, never PASS — delivery of a
    // version that does not exist in history cannot be verified.
    if (versionAt('HEAD') !== version) {
      console.log(`  version ${version} exists only in the working tree — commit the release, then re-run`);
    } else {
      console.log(`  could not locate the commit that set version ${version}`);
    }
    process.exit(BLOCKED);
  }

  const changed = changedSince(bump);
  const when = git(['log', '-1', '--format=%ad', '--date=short', bump]);

  if (verdict(changed) === PASS) {
    console.log('PASS delivery-freshness-gate');
    console.log(`  v${version} cut ${when} (${bump.slice(0, 7)}); no shipped file has changed since`);
    const npmLine = npmChannelStatus(version);
    if (npmLine) console.log(npmLine);
    process.exit(PASS);
  }

  // Before blaming this branch, check whether it is simply behind a base that
  // already shipped a newer version. Only a DIFFERENT base version means that:
  // if the versions match, the files really are stranded on the base too and
  // the FAIL below is the honest answer.
  const drift = baseBranchDrift();
  if (drift && drift.baseVersion && drift.baseVersion !== version) {
    console.log('BLOCKED delivery-freshness-gate');
    console.log(`  this branch is behind ${drift.base}, which is on v${drift.baseVersion} while the branch carries v${version}.`);
    console.log(`  the ${changed.length} file(s) below were delivered by that release, so this is a stale branch,`);
    console.log('  not undelivered work. Update the branch from ' + drift.base + ' and re-run.');
    for (const f of changed) console.log(`    ${f}`);
    process.exit(BLOCKED);
  }

  console.log('FAIL delivery-freshness-gate');
  console.log(`  ${changed.length} shipped file(s) changed since v${version} was cut ${when} (${bump.slice(0, 7)}):`);
  for (const f of changed) console.log(`    ${f}`);
  console.log('');
  console.log('  plugin.json still reads ' + version + ', so a player\'s client sees no update');
  console.log('  and receives none of the above. Bump the version and log the release,');
  console.log('  or revert the changes — but they cannot sit on main undelivered.');
  process.exit(FAIL);
}

main();
