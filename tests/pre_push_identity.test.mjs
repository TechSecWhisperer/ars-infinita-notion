import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hookSource = join(repo, '.github/hooks');
const identity = { name: 'TechSecWhisperer', email: '171330631+TechSecWhisperer@users.noreply.github.com' };

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'public-push-identity-'));
  const bare = join(root, 'remote.git');
  const work = join(root, 'work');
  execFileSync('git', ['init', '--bare', bare], { stdio: 'ignore' });
  execFileSync('git', ['init', work], { stdio: 'ignore' });
  const git = (args, options = {}) => execFileSync('git', args, { cwd: work, encoding: 'utf8', ...options }).trim();
  git(['config', 'user.name', identity.name]);
  git(['config', 'user.email', identity.email]);
  writeFileSync(join(work, 'README.md'), 'identity test\n');
  git(['add', 'README.md']);
  git(['commit', '-m', 'initial']);
  git(['remote', 'add', 'origin', bare]);
  git(['push', 'origin', 'HEAD:main']);
  git(['fetch', 'origin', 'main:refs/remotes/origin/main']);
  const hooks = join(work, '.github/hooks');
  mkdirSync(hooks, { recursive: true });
  cpSync(join(hookSource, 'pre-push'), join(hooks, 'pre-push'));
  cpSync(join(hookSource, 'pre-push-identity'), join(hooks, 'pre-push-identity'));
  cpSync(join(hookSource, 'pre-push-version-bump'), join(hooks, 'pre-push-version-bump'));
  cpSync(join(hookSource, 'approved-identities.json'), join(hooks, 'approved-identities.json'));
  git(['config', 'core.hooksPath', hooks]);
  return {
    root, work, git,
    push(args) { return spawnSync('git', ['push', 'origin', ...args], { cwd: work, encoding: 'utf8', input: '' }); },
    cleanup() { rmSync(root, { recursive: true, force: true }); },
  };
}

test('allows a new tag for an already identity-verified commit on main', () => {
  const f = fixture();
  try {
    f.git(['tag', 'v1.0.0']);
    const pushed = f.push(['refs/tags/v1.0.0']);
    assert.equal(pushed.status, 0, pushed.stderr || pushed.stdout);
  } finally { f.cleanup(); }
});

test('still rejects a new unapproved commit even when it is pushed under a tag', () => {
  const f = fixture();
  try {
    f.git(['config', 'user.name', 'Unapproved Identity']);
    f.git(['config', 'user.email', 'unapproved@example.invalid']);
    writeFileSync(join(f.work, 'README.md'), 'unapproved addition\n');
    f.git(['add', 'README.md']);
    f.git(['commit', '-m', 'unapproved']);
    f.git(['tag', 'v1.0.1']);
    const pushed = f.push(['refs/tags/v1.0.1']);
    assert.notEqual(pushed.status, 0);
    assert.match(pushed.stderr, /outside the approved allowlist/);
  } finally { f.cleanup(); }
});
