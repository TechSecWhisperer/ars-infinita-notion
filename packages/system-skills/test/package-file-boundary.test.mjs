import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

test('published package excludes release-control internals', () => {
  const packed = spawnSync(npm, ['pack', '--dry-run', '--ignore-scripts', '--json'], {
    cwd: packageRoot,
    encoding: 'utf8',
    timeout: 30_000,
    maxBuffer: 4 * 1024 * 1024,
  });
  assert.equal(packed.status, 0, packed.stderr || 'npm pack dry-run failed');
  const result = JSON.parse(packed.stdout);
  assert.equal(result.length, 1);
  const paths = new Set(result[0].files.map((file) => file.path));
  for (const internal of [
    'lib/live-smoke-ledger.mjs',
    'lib/live-smoke-policy.mjs',
    'lib/public-feed-contract.mjs',
  ]) assert.equal(paths.has(internal), false, `${internal} must not ship to players`);
  for (const runtimeModule of [
    'lib/discovery.mjs',
    'lib/install-manifest.mjs',
    'lib/paths.mjs',
    'lib/player-home-check.mjs',
    'lib/swap.mjs',
    'lib/transform.mjs',
    'lib/visualization-adapter.mjs',
  ]) assert.equal(paths.has(runtimeModule), true, `${runtimeModule} is required by the package`);
});
