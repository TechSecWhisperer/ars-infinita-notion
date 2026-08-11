#!/usr/bin/env node
// delivery-freshness-gate — did the code we shipped actually reach a player?
//
//   node tools/delivery_gate.mjs [--self-test]
//
// Exit 0 = PASS, 1 = FAIL, 2 = BLOCKED (could not run — never treated as PASS).
//
// WHY THIS EXISTS, and why release-metadata-check did not catch it.
//
// On 2026-08-10 three PRs merged, changing eight files inside the shipped
// player plugin. `release-metadata-check` passed, because every surface it
// compares agreed: plugin.json 1.3.1, marketplace generated from it, CHANGELOG
// newest heading v1.3.1, feed.json head 1.3.1. All true, all consistent, and
// all stale — the version had not moved since 2026-08-05.
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
  REPO_ROOT,
  SOURCE_PLUGIN_DIR,
  SOURCE_PLUGIN_MANIFEST,
} from '../packages/system-skills/lib/paths.mjs';

const PASS = 0;
const FAIL = 1;
const BLOCKED = 2;

function git(args) {
  return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
}

const rel = (p) => path.relative(REPO_ROOT, p).split(path.sep).join('/');
const MANIFEST_REL = rel(SOURCE_PLUGIN_MANIFEST);
const PLUGIN_REL = rel(SOURCE_PLUGIN_DIR);

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

function changedSince(commit) {
  return git(['diff', '--name-only', `${commit}..HEAD`, '--', PLUGIN_REL])
    .split('\n')
    .filter(Boolean);
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
  ];
  let bad = 0;
  for (const c of cases) {
    const got = verdict(c.input);
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
    process.exit(PASS);
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
