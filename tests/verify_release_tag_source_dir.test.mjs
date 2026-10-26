import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { releaseVersions, verdict } from '../tools/verify_release_tag.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('release tag verification reads package manifests from the explicit immutable source directory', (t) => {
  const source = mkdtempSync(path.join(os.tmpdir(), 'release-source-dir-'));
  t.after(() => rmSync(source, { recursive: true, force: true }));
  const pluginDir = path.join(source, 'plugins/the-system-player/.claude-plugin');
  const packageDir = path.join(source, 'packages/system-skills');
  mkdirSync(pluginDir, { recursive: true });
  mkdirSync(packageDir, { recursive: true });
  writeFileSync(path.join(pluginDir, 'plugin.json'), JSON.stringify({ version: '2.0.23' }));
  writeFileSync(path.join(packageDir, 'package.json'), JSON.stringify({ version: '2.0.23' }));

  const versions = releaseVersions(source);
  assert.deepEqual(versions, { pluginVersion: '2.0.23', pkgVersion: '2.0.23' });
  assert.deepEqual(verdict({ tag: 'v2.0.23', ...versions }), {
    code: 0,
    reason: 'tag, plugin.json and package.json all say 2.0.23',
  });
  assert.equal(verdict({ tag: 'v2.0.24', ...versions }).code, 1,
    'a tag that disagrees with its immutable source manifests must fail');
});

test('CLI accepts an explicit release tag with default or explicit source directory', () => {
  const script = path.join(repositoryRoot, 'tools/verify_release_tag.mjs');
  const invocations = [
    ['v2.0.23'],
    ['v2.0.23', '--source-dir', repositoryRoot],
    ['--source-dir', repositoryRoot, 'v2.0.23'],
  ];
  for (const args of invocations) {
    const output = execFileSync(process.execPath, [script, ...args], {
      cwd: repositoryRoot, encoding: 'utf8',
    });
    assert.match(output, /PASS verify-release-tag/);
    assert.match(output, /tag, plugin\.json and package\.json all say 2\.0\.23/);
  }
});
