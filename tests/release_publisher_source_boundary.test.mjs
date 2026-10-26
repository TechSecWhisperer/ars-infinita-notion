import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = (command, args, options = {}) => execFileSync(command, args, {
  cwd: options.cwd,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
});

test('two-commit fixture proves newer reviewed publisher can accept draft rejected by immutable tag tool', (t) => {
  const fixture = mkdtempSync(path.join(os.tmpdir(), 'publisher-generation-'));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  run('git', ['init', '-q', fixture]);
  run('git', ['config', 'user.name', 'Release test'], { cwd: fixture });
  run('git', ['config', 'user.email', 'release-test@example.invalid'], { cwd: fixture });
  mkdirSync(path.join(fixture, 'tools'), { recursive: true });
  writeFileSync(path.join(fixture, 'tools/release_authorization.mjs'),
    "const release={draft:true}; if(release.draft) process.exit(2); console.log('AUTHORIZED');\n");
  writeFileSync(path.join(fixture, 'package.json'), '{"version":"2.0.22"}\n');
  run('git', ['add', '.'], { cwd: fixture });
  run('git', ['commit', '-qm', 'immutable package tag with old publisher'], { cwd: fixture });
  run('git', ['tag', 'v2.0.22'], { cwd: fixture });
  writeFileSync(path.join(fixture, 'tools/release_authorization.mjs'),
    "const release={draft:true}; if(!release.draft) process.exit(2); console.log('AUTHORIZED');\n");
  run('git', ['add', 'tools/release_authorization.mjs'], { cwd: fixture });
  run('git', ['commit', '-qm', 'reviewed publisher accepts draft'], { cwd: fixture });
  const oldTool = run('git', ['show', 'v2.0.22:tools/release_authorization.mjs'], { cwd: fixture });
  const reviewedTool = run('git', ['show', 'HEAD:tools/release_authorization.mjs'], { cwd: fixture });
  assert.match(oldTool, /release\.draft\) process\.exit/);
  assert.match(reviewedTool, /!release\.draft/);

  const tagTool = path.join(fixture, 'tag-tool.mjs');
  const reviewedToolPath = path.join(fixture, 'reviewed-tool.mjs');
  writeFileSync(tagTool, oldTool);
  writeFileSync(reviewedToolPath, reviewedTool);
  assert.throws(() => run(process.execPath, [tagTool]), { status: 2 });
  assert.match(run(process.execPath, [reviewedToolPath]), /AUTHORIZED/);
});

test('publisher workflow runs reviewed tool SHA separately from immutable package tag', () => {
  const workflow = readFileSync(path.join(repositoryRoot, '.github/workflows/npm-publish.yml'), 'utf8');
  assert.match(workflow, /github\.ref\s*==\s*'refs\/heads\/main'/);
  assert.match(workflow, /ref:\s*\$\{\{\s*github\.sha\s*\}\}/);
  assert.match(workflow, /path:\s*publisher/);
  assert.match(workflow, /ref:\s*\$\{\{\s*inputs\.release_tag\s*\}\}/);
  assert.match(workflow, /path:\s*package-source/);
  assert.match(workflow, /working-directory:\s*publisher/);
  assert.match(workflow, /node tools\/release_authorization\.mjs "\$RELEASE_TAG" --allow-draft/);
  assert.match(workflow, /working-directory:\s*package-source\/packages\/system-skills/);
  assert.match(workflow, /publisher_tool_sha=/);
  assert.match(workflow, /package_source_sha=/);
  assert.match(workflow, /node-version-file:\s*publisher\/\.node-version/);
  assert.match(workflow, /npm@\$\(cat publisher\/\.npm-version\)/);
  assert.equal(readFileSync(path.join(repositoryRoot, '.node-version'), 'utf8').trim(), '22.23.4');
  assert.equal(readFileSync(path.join(repositoryRoot, '.npm-version'), 'utf8').trim(), '11.5.1');
});
