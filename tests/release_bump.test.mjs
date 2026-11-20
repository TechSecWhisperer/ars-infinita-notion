import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tool = path.join(repoRoot, 'tools/release_bump.mjs');
const FILES = [
  'plugins/the-system-player/.claude-plugin/plugin.json',
  'plugins/the-system-player/plugin.json',
  'packages/system-skills/package.json',
  'packages/system-skills/package-lock.json',
  'feed.json',
  'packages/system-skills/test/codex-marketplace.test.mjs',
  'CHANGELOG.md',
];
const CHANGED = FILES.filter((rel) => rel !== 'CHANGELOG.md');

function tempCopy(t) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'release-bump-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const rel of FILES) {
    mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    cpSync(path.join(repoRoot, rel), path.join(dir, rel));
  }
  return dir;
}

const read = (dir, rel) => readFileSync(path.join(dir, rel), 'utf8');
const readJson = (dir, rel) => JSON.parse(read(dir, rel));
const run = (dir, ...args) =>
  spawnSync(process.execPath, [tool, ...args, '--root', dir], { encoding: 'utf8' });

function addChangelogSection(dir, version, date, body) {
  const file = path.join(dir, 'CHANGELOG.md');
  const text = readFileSync(file, 'utf8');
  const marker = text.indexOf('\n## v');
  writeFileSync(
    file,
    text.slice(0, marker) + '\n## v' + version + ' — ' + date + '\n\n' + body + '\n' + text.slice(marker),
  );
}

const BODY =
  '**Résumé drafts get smarter.** A **second** sentence, with “quotes”.\nSame paragraph.\n\nSecond paragraph.';

test('a bump writes all seven files consistently', (t) => {
  const dir = tempCopy(t);
  addChangelogSection(dir, '9.8.7', '2030-01-02', BODY);
  const before = Object.fromEntries(FILES.map((rel) => [rel, read(dir, rel)]));

  const result = run(dir, '9.8.7');
  assert.equal(result.status, 0, result.stderr);

  for (const rel of CHANGED) {
    assert.notEqual(read(dir, rel), before[rel], rel + ' should change');
    assert.ok(result.stdout.includes(rel), rel + ' should be listed');
  }
  assert.equal(read(dir, 'CHANGELOG.md'), before['CHANGELOG.md']);

  for (const rel of CHANGED.filter((r) => r.endsWith('.json'))) {
    const text = read(dir, rel);
    assert.equal(text, JSON.stringify(JSON.parse(text), null, 2) + '\n', rel + ' formatting');
  }
  for (const rel of CHANGED.slice(0, 4)) assert.equal(readJson(dir, rel).version, '9.8.7', rel);
  assert.equal(readJson(dir, 'packages/system-skills/package-lock.json').packages[''].version, '9.8.7');

  const feed = readJson(dir, 'feed.json');
  assert.equal(feed.mechanics_version, '9.8.7');
  assert.equal(feed.head, '9.8.7');
  assert.equal(feed.generated, new Date().toISOString().slice(0, 10));
  assert.deepEqual(feed.patches.at(-1), {
    version: '9.8.7',
    date: '2030-01-02',
    type: 'Patch',
    applies_to: 'Forward-only',
    min_level: 0,
    title: 'v9.8.7 — Résumé drafts get smarter',
    player_facing_summary: 'Résumé drafts get smarter. A second sentence, with “quotes”. Same paragraph.',
  });
  assert.equal(feed.patches.length, JSON.parse(before['feed.json']).patches.length + 1);
  assert.match(
    read(dir, 'packages/system-skills/test/codex-marketplace.test.mjs'),
    /assert\.equal\(feed\.head, '9\.8\.7'\);/,
  );
});

test('--type and --title override the defaults', (t) => {
  const dir = tempCopy(t);
  addChangelogSection(dir, '9.8.7', '2030-01-02', BODY);
  const result = run(dir, '9.8.7', '--type', 'Minor', '--title', 'Custom title');
  assert.equal(result.status, 0, result.stderr);
  const patch = readJson(dir, 'feed.json').patches.at(-1);
  assert.equal(patch.type, 'Minor');
  assert.equal(patch.title, 'v9.8.7 — Custom title');
});

test('a missing CHANGELOG section refuses and writes nothing', (t) => {
  const dir = tempCopy(t);
  const before = FILES.map((rel) => read(dir, rel));
  const result = run(dir, '9.8.7');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /CHANGELOG\.md has no section/);
  assert.deepEqual(FILES.map((rel) => read(dir, rel)), before);
});

test('a version not greater than the current one refuses and writes nothing', (t) => {
  const dir = tempCopy(t);
  const current = readJson(dir, FILES[0]).version;
  addChangelogSection(dir, '0.0.1', '2030-01-02', BODY);
  const before = FILES.map((rel) => read(dir, rel));
  for (const version of [current, '0.0.1']) {
    const result = run(dir, version);
    assert.notEqual(result.status, 0, version);
    assert.match(result.stderr, /must be greater than the current plugin version/);
  }
  assert.deepEqual(FILES.map((rel) => read(dir, rel)), before);
});
