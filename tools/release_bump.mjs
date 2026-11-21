#!/usr/bin/env node
// One-command release bump: writes every version file from the CHANGELOG entry.
//
// Usage: node tools/release_bump.mjs <version> [--type Patch|Minor|Major] [--title "<text>"] [--root <dir>]
//
// Refuses unless CHANGELOG.md already has "## v<version> — <date>" and <version> is
// greater than the current plugin version. Nothing is written unless every file can be
// updated. --root points at a repo-shaped directory (default: this repository).
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PLUGIN_FILES = [
  'plugins/the-system-player/.claude-plugin/plugin.json',
  'plugins/the-system-player/plugin.json',
];
const PACKAGE_JSON = 'packages/system-skills/package.json';
const PACKAGE_LOCK = 'packages/system-skills/package-lock.json';
const FEED = 'feed.json';
const CHANGELOG = 'CHANGELOG.md';
const MARKETPLACE_TEST = 'packages/system-skills/test/codex-marketplace.test.mjs';
const TYPES = ['Patch', 'Minor', 'Major'];
const VERSION_RE = /^\d+\.\d+\.\d+$/;

export class BumpError extends Error {}

function fail(message) {
  throw new BumpError(message);
}

export function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i += 1) {
    if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
  }
  return 0;
}

const escapeRe = (s) => s.replace(/[.*+?^$(){}|[\]\\]/g, '\\$&');

export function readChangelogSection(changelog, version) {
  const lines = changelog.split(/\r?\n/);
  const heading = new RegExp('^## v' + escapeRe(version) + ' [—–-] (\\d{4}-\\d{2}-\\d{2})\\s*$');
  const start = lines.findIndex((line) => heading.test(line));
  if (start === -1) fail('CHANGELOG.md has no section "## v' + version + ' — <date>"');
  const date = lines[start].match(heading)[1];
  const paragraph = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^## /.test(lines[i])) break;
    if (lines[i].trim() === '') {
      if (paragraph.length) break;
      continue;
    }
    paragraph.push(lines[i].trim());
  }
  if (!paragraph.length) fail('CHANGELOG.md section v' + version + ' has no first paragraph');
  const text = paragraph.join(' ');
  const lead = text.match(/^\*\*(.+?)\*\*/);
  return {
    date,
    summary: text.replace(/\*\*(.+?)\*\*/g, '$1'),
    leadTitle: lead ? lead[1].trim().replace(/\.$/, '') : null,
  };
}

const readJson = (root, rel) => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const serialize = (value) => JSON.stringify(value, null, 2) + '\n';

export function bump(root, version, { type = 'Patch', title } = {}) {
  if (!VERSION_RE.test(version ?? '')) fail('version must look like 2.0.26 (got "' + (version ?? '') + '")');
  if (!TYPES.includes(type)) fail('--type must be one of ' + TYPES.join(', ') + ' (got "' + type + '")');

  const current = readJson(root, PLUGIN_FILES[0]).version;
  if (!VERSION_RE.test(current ?? '')) fail('current plugin version is not x.y.z: ' + current);
  if (compareVersions(version, current) <= 0) {
    fail('version ' + version + ' must be greater than the current plugin version ' + current);
  }

  const section = readChangelogSection(readFileSync(path.join(root, CHANGELOG), 'utf8'), version);
  const patchTitle = title ?? section.leadTitle;
  if (!patchTitle) fail('CHANGELOG paragraph has no bold lead sentence; pass --title "<text>"');

  const outputs = new Map();
  for (const rel of PLUGIN_FILES) {
    const manifest = readJson(root, rel);
    manifest.version = version;
    outputs.set(rel, serialize(manifest));
  }
  const pkg = readJson(root, PACKAGE_JSON);
  pkg.version = version;
  outputs.set(PACKAGE_JSON, serialize(pkg));
  const lock = readJson(root, PACKAGE_LOCK);
  if (!lock.packages || !lock.packages['']) fail(PACKAGE_LOCK + ' has no packages[""] entry');
  lock.version = version;
  lock.packages[''].version = version;
  outputs.set(PACKAGE_LOCK, serialize(lock));

  const feed = readJson(root, FEED);
  if (feed.patches.some((p) => p.version === version)) fail('feed.json already has a patch for ' + version);
  feed.mechanics_version = version;
  feed.head = version;
  feed.generated = new Date().toISOString().slice(0, 10);
  feed.patches.push({
    version,
    date: section.date,
    type,
    applies_to: 'Forward-only',
    min_level: 0,
    title: 'v' + version + ' — ' + patchTitle,
    player_facing_summary: section.summary,
  });
  outputs.set(FEED, serialize(feed));

  const testSource = readFileSync(path.join(root, MARKETPLACE_TEST), 'utf8');
  const headAssert = /assert\.equal\(feed\.head, '[^']*'\);/;
  if (!headAssert.test(testSource)) fail(MARKETPLACE_TEST + ' has no feed.head assertion to update');
  outputs.set(
    MARKETPLACE_TEST,
    testSource.replace(headAssert, () => "assert.equal(feed.head, '" + version + "');"),
  );

  for (const [rel, content] of outputs) writeFileSync(path.join(root, rel), content);
  return [...outputs.keys()];
}

function parseArgs(argv) {
  const opts = {};
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--type' || arg === '--title' || arg === '--root') {
      if (i + 1 >= argv.length) fail(arg + ' needs a value');
      opts[arg.slice(2)] = argv[i + 1];
      i += 1;
    } else if (arg.startsWith('--')) {
      fail('unknown option ' + arg);
    } else {
      positional.push(arg);
    }
  }
  if (positional.length !== 1) fail('usage: release_bump.mjs <version> [--type Patch|Minor|Major] [--title "<text>"]');
  return { version: positional[0], opts };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { version, opts } = parseArgs(process.argv.slice(2));
    const here = path.dirname(fileURLToPath(import.meta.url));
    const root = path.resolve(opts.root ?? path.join(here, '..'));
    const changed = bump(root, version, { type: opts.type, title: opts.title });
    console.log('Bumped to ' + version + '. Changed files:');
    for (const rel of changed) console.log('  ' + rel);
  } catch (error) {
    if (!(error instanceof BumpError)) throw error;
    console.error('release_bump: ' + error.message);
    process.exit(1);
  }
}
