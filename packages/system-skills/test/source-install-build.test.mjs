import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(packageRoot, '../..');

test('source install rebuilds generated skills only when source is available', (t) => {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'system-skills-source-install-'));
  t.after(() => fs.rmSync(sandbox, { recursive: true, force: true }));
  const checkout = path.join(sandbox, 'checkout');
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

  const copyPackageRoot = path.join(checkout, 'packages/system-skills');
  const packageJson = JSON.parse(fs.readFileSync(path.join(copyPackageRoot, 'package.json'), 'utf8'));
  for (const target of ['unified', 'codex', 'agy']) {
    assert.match(packageJson.scripts[`install-${target}`], /fs\.existsSync\('builder\.mjs'\)/);
  }
  assert.ok(packageJson.files.includes('dist/'), 'published package must contain generated output');
  assert.ok(!packageJson.files.includes('builder.mjs'), 'published package must not depend on source builder');

  // Keep the test focused on package-script ordering without reading or writing a
  // real player's home directory. The stub reports the dist state after the wrapper.
  fs.writeFileSync(path.join(copyPackageRoot, 'install-codex.mjs'),
    "import fs from 'node:fs';\nconsole.log(JSON.stringify({hasSkill:fs.existsSync('dist/codex/appraise/SKILL.md')}));\n");
  const runInstallScript = () => execFileSync('npm', ['run', 'install-codex', '--', '--dry-run'], {
    cwd: copyPackageRoot,
    encoding: 'utf8',
    timeout: 120_000,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const generatedSkill = path.join(copyPackageRoot, 'dist/codex/appraise/SKILL.md');
  runInstallScript();
  assert.equal(fs.existsSync(generatedSkill), true, 'missing dist must be rebuilt from source');

  fs.appendFileSync(generatedSkill, '\nSTALE_DIST_PROBE_MARKER\n');
  runInstallScript();
  assert.doesNotMatch(fs.readFileSync(generatedSkill, 'utf8'), /STALE_DIST_PROBE_MARKER/,
    'a source checkout must replace stale generated output');

  fs.rmSync(path.join(copyPackageRoot, 'builder.mjs'));
  fs.appendFileSync(generatedSkill, '\nPACKED_DIST_MARKER\n');
  runInstallScript();
  assert.match(fs.readFileSync(generatedSkill, 'utf8'), /PACKED_DIST_MARKER/,
    'a packed install must use its shipped dist without trying to rebuild source');
});
