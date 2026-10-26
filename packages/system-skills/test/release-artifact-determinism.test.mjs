import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(packageRoot, '../..');
const run = (command, args, cwd) => execFileSync(command, args, {
  cwd,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
  timeout: 180_000,
});

test('delivery freshness builds generated package files before running package checks', () => {
  const workflow = fs.readFileSync(path.join(repositoryRoot, '.github/workflows/delivery-freshness.yml'), 'utf8');
  const buildIndex = workflow.indexOf('run: node builder.mjs');
  const checkIndex = workflow.indexOf('run: npm run check --prefix packages/system-skills');
  assert.ok(buildIndex >= 0 && checkIndex > buildIndex,
    'delivery freshness must build generated files before structural checks inspect dist/');
});

test('clean builds of identical source produce byte-identical package and generated marketplace metadata', (t) => {
  const expectedNode = fs.readFileSync(path.join(repositoryRoot, '.node-version'), 'utf8').trim();
  const expectedNpm = fs.readFileSync(path.join(repositoryRoot, '.npm-version'), 'utf8').trim();
  assert.match(expectedNode, /^\d+\.\d+\.\d+$/);
  assert.match(expectedNpm, /^\d+\.\d+\.\d+$/);
  if (process.env.AIN_VERIFY_PINNED_NPM === '1') {
    assert.equal(process.version, `v${expectedNode}`, 'release artifact CI must use the pinned Node version');
    assert.equal(run('npm', ['--version'], repositoryRoot).trim(), expectedNpm,
      'release artifact CI must use the pinned npm packer');
  }
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'release-artifact-determinism-'));
  t.after(() => fs.rmSync(sandbox, { recursive: true, force: true }));
  const artifacts = [];
  for (const name of ['first', 'second']) {
    const checkout = path.join(sandbox, name);
    fs.cpSync(repositoryRoot, checkout, {
      recursive: true,
      filter: (sourcePath) => {
        const relative = path.relative(repositoryRoot, sourcePath).split(path.sep).join('/');
        return !['.git', 'node_modules', '.worktrees'].some((directory) =>
          relative === directory || relative.startsWith(`${directory}/`))
          && relative !== 'packages/system-skills/dist'
          && !relative.startsWith('packages/system-skills/dist/');
      },
    });
    const copiedPackage = path.join(checkout, 'packages/system-skills');
    run(process.execPath, ['builder.mjs'], copiedPackage);
    const generated = JSON.parse(fs.readFileSync(path.join(copiedPackage, 'dist/manifest.json'), 'utf8'));
    assert.equal(Object.hasOwn(generated, 'builtAt'), false,
      'shipped manifest must not contain wall-clock build time');
    const packDirectory = path.join(sandbox, `${name}-pack`);
    fs.mkdirSync(packDirectory);
    const pack = JSON.parse(run('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', packDirectory], copiedPackage))[0];
    const archive = fs.readFileSync(path.join(packDirectory, pack.filename));
    artifacts.push({
      archive,
      integrity: `sha512-${createHash('sha512').update(archive).digest('base64')}`,
      generated: fs.readFileSync(path.join(copiedPackage, 'dist/manifest.json')),
      codexMarketplace: fs.readFileSync(path.join(checkout, '.agents/plugins/marketplace.json')),
      claudeMarketplace: fs.readFileSync(path.join(checkout, '.claude-plugin/marketplace.json')),
      codexPlugin: fs.readFileSync(path.join(checkout, 'plugins/the-system-player/plugin.json')),
    });
  }
  assert.deepEqual(artifacts[0].archive, artifacts[1].archive, 'npm archives differ for identical source');
  assert.equal(artifacts[0].integrity, artifacts[1].integrity);
  for (const key of ['generated', 'codexMarketplace', 'claudeMarketplace', 'codexPlugin']) {
    assert.deepEqual(artifacts[0][key], artifacts[1][key], `${key} differs across clean builds`);
  }
});
