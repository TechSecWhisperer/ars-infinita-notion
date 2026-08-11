#!/usr/bin/env node
// Assert a release tag agrees with every version it claims to publish.
//
//   node tools/verify_release_tag.mjs v1.3.2
//   node tools/verify_release_tag.mjs            # reads GITHUB_REF_NAME
//   node tools/verify_release_tag.mjs --self-test
//
// Exit 0 = agree, 1 = disagree, 2 = BLOCKED (cannot determine — never a pass).
//
// This exists because the publish workflow is triggered BY the tag, so the tag
// is an independent assertion about what is being shipped. Nothing else checks
// it: `release-metadata-check` compares plugin.json to package.json, both of
// which are files in the commit being tagged, so a tag naming a third version
// would sail past it and publish content under a number nobody chose.
//
// Deliberately its own script rather than inline workflow YAML: workflow files
// are the one thing this repo's agent may not edit, so logic living there
// cannot be tested or fixed by the same process that fixes everything else.
// Keep the workflow thin and the checks here.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN = path.join(REPO_ROOT, 'plugins', 'the-system-player', '.claude-plugin', 'plugin.json');
const PKG = path.join(REPO_ROOT, 'packages', 'system-skills', 'package.json');

const PASS = 0;
const FAIL = 1;
const BLOCKED = 2;

// "v1.3.2" and "1.3.2" both name the same release; anything else is not a
// release tag and must not be treated as one.
export function normaliseTag(tag) {
  if (typeof tag !== 'string') return null;
  const m = /^v?(\d+\.\d+\.\d+)$/.exec(tag.trim());
  return m ? m[1] : null;
}

export function verdict({ tag, pluginVersion, pkgVersion }) {
  const wanted = normaliseTag(tag);
  if (!wanted) return { code: BLOCKED, reason: `"${tag}" is not a release tag (expected vX.Y.Z)` };
  const disagree = [];
  if (pluginVersion !== wanted) disagree.push(`plugin.json is ${pluginVersion}`);
  if (pkgVersion !== wanted) disagree.push(`package.json is ${pkgVersion}`);
  if (disagree.length) {
    return { code: FAIL, reason: `tag says ${wanted} but ${disagree.join(' and ')}` };
  }
  return { code: PASS, reason: `tag, plugin.json and package.json all say ${wanted}` };
}

function selfTest() {
  const cases = [
    { name: 'all three agree', input: { tag: 'v1.3.2', pluginVersion: '1.3.2', pkgVersion: '1.3.2' }, expect: PASS },
    { name: 'bare tag, no v prefix', input: { tag: '1.3.2', pluginVersion: '1.3.2', pkgVersion: '1.3.2' }, expect: PASS },
    { name: 'tag ahead of the manifests', input: { tag: 'v1.4.0', pluginVersion: '1.3.2', pkgVersion: '1.3.2' }, expect: FAIL },
    { name: 'package left behind', input: { tag: 'v1.3.2', pluginVersion: '1.3.2', pkgVersion: '0.1.0' }, expect: FAIL },
    { name: 'plugin left behind', input: { tag: 'v1.3.2', pluginVersion: '1.3.1', pkgVersion: '1.3.2' }, expect: FAIL },
    { name: 'not a release tag', input: { tag: 'nightly', pluginVersion: '1.3.2', pkgVersion: '1.3.2' }, expect: BLOCKED },
    { name: 'empty tag', input: { tag: '', pluginVersion: '1.3.2', pkgVersion: '1.3.2' }, expect: BLOCKED },
  ];
  let bad = 0;
  for (const c of cases) {
    const got = verdict(c.input).code;
    const okCase = got === c.expect;
    if (!okCase) bad += 1;
    console.log(`  ${okCase ? 'ok  ' : 'BAD '} ${c.name} — expected ${c.expect}, got ${got}`);
  }
  return bad === 0;
}

if (process.argv.includes('--self-test')) {
  console.log('verify-release-tag self-test');
  const okAll = selfTest();
  console.log(okAll ? 'PASS self-test' : 'FAIL self-test');
  process.exit(okAll ? PASS : FAIL);
}

const tag = process.argv[2] || process.env.GITHUB_REF_NAME || '';
let pluginVersion;
let pkgVersion;
try {
  pluginVersion = JSON.parse(fs.readFileSync(PLUGIN, 'utf8')).version;
  pkgVersion = JSON.parse(fs.readFileSync(PKG, 'utf8')).version;
} catch (err) {
  console.log('BLOCKED verify-release-tag');
  console.log(`  could not read a manifest: ${err.message}`);
  process.exit(BLOCKED);
}

const { code, reason } = verdict({ tag, pluginVersion, pkgVersion });
console.log(`${code === PASS ? 'PASS' : code === FAIL ? 'FAIL' : 'BLOCKED'} verify-release-tag`);
console.log(`  ${reason}`);
if (code !== PASS) {
  console.log('');
  console.log('  A tag triggers the publish, so it is an independent claim about what');
  console.log('  ships. Delete the tag, fix the versions, and re-tag — do not publish');
  console.log('  content under a number nobody chose.');
}
process.exit(code);
