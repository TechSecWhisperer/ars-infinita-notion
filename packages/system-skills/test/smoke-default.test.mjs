import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

test('default smoke runner returns before invoking either CLI', (t) => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'ain-smoke-default-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const binDir = path.join(root, 'bin');
  mkdirSync(binDir, { mode: 0o700 });
  const marker = path.join(root, 'cli-invoked');
  const stub = `#!/bin/sh\nprintf invoked > "$SMOKE_CALL_MARKER"\nexit 0\n`;
  for (const command of ['codex', 'agy']) {
    const executable = path.join(binDir, command);
    writeFileSync(executable, stub, { mode: 0o700 });
    chmodSync(executable, 0o700);
  }

  const env = { ...process.env, PATH: binDir, SMOKE_CALL_MARKER: marker };
  delete env.AIN_RUN_LIVE_SMOKE;
  delete env.SMOKE_AGENT;
  delete env.SMOKE_SKILL_LIMIT;
  delete env.SMOKE_TIMEOUT_MS;
  const smokeScript = path.join(path.dirname(fileURLToPath(import.meta.url)), 'smoke.mjs');
  const result = spawnSync(process.execPath, [smokeScript], {
    env,
    encoding: 'utf8',
    timeout: 10_000,
    maxBuffer: 16 * 1024,
  });

  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /No prompts were sent\./);
  assert.equal(existsSync(marker), false);
});
