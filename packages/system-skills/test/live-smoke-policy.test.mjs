import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  completeLiveSmokeAttempt,
  LIVE_SMOKE_COOLDOWN_MS,
  LIVE_SMOKE_MAX_PROMPT_CHARS,
  LIVE_SMOKE_RECEIPT_FILENAME,
  markLiveSmokeInvocationStarted,
  readLiveSmokeReceipt,
  reserveLiveSmokeAttempt,
  resolveLiveSmokePolicy,
} from './live-smoke-policy.mjs';

function tempStateDir(t) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'ain-live-smoke-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('live smoke is disabled by default and makes no model calls', () => {
  assert.deepEqual(resolveLiveSmokePolicy({}), {
    enabled: false,
    reason: 'explicit opt-in is required',
  });
});

test('live smoke stays disabled in CI even when opt-in selectors are present', () => {
  assert.deepEqual(resolveLiveSmokePolicy({
    CI: 'true', AIN_RUN_LIVE_SMOKE: '1', SMOKE_AGENT: 'codex',
  }), {
    enabled: false,
    reason: 'live model smoke is disabled in CI',
  });
  assert.equal(resolveLiveSmokePolicy({
    CI: '1', AIN_RUN_LIVE_SMOKE: '1', SMOKE_AGENT: 'agy',
  }).enabled, false);
  assert.equal(resolveLiveSmokePolicy({
    GITHUB_ACTIONS: 'true', AIN_RUN_LIVE_SMOKE: '1', SMOKE_AGENT: 'agy',
  }).enabled, false);
});

test('explicit live smoke selects exactly one provider and one prompt', () => {
  assert.deepEqual(resolveLiveSmokePolicy({ AIN_RUN_LIVE_SMOKE: '1', SMOKE_AGENT: 'codex' }), {
    enabled: true,
    agent: 'codex',
    skillLimit: 1,
    timeoutMs: 30_000,
    cooldownMs: LIVE_SMOKE_COOLDOWN_MS,
    maxPromptChars: LIVE_SMOKE_MAX_PROMPT_CHARS,
  });
  assert.deepEqual(resolveLiveSmokePolicy({ AIN_RUN_LIVE_SMOKE: '1', SMOKE_AGENT: 'agy' }), {
    enabled: true,
    agent: 'agy',
    skillLimit: 1,
    timeoutMs: 30_000,
    cooldownMs: LIVE_SMOKE_COOLDOWN_MS,
    maxPromptChars: LIVE_SMOKE_MAX_PROMPT_CHARS,
  });
});

test('live smoke refuses ambiguous agents and multi-prompt batches', () => {
  assert.equal(resolveLiveSmokePolicy({ AIN_RUN_LIVE_SMOKE: '1' }).enabled, false);
  assert.equal(resolveLiveSmokePolicy({ AIN_RUN_LIVE_SMOKE: '1', SMOKE_AGENT: 'cli-agent' }).enabled, false);
  assert.equal(resolveLiveSmokePolicy({ AIN_RUN_LIVE_SMOKE: '1', SMOKE_AGENT: 'codex', SMOKE_SKILL_LIMIT: '2' }).enabled, false);
});

test('live smoke caps each request at thirty seconds', () => {
  assert.equal(resolveLiveSmokePolicy({
    AIN_RUN_LIVE_SMOKE: '1', SMOKE_AGENT: 'codex', SMOKE_TIMEOUT_MS: '30000',
  }).enabled, true);
  assert.equal(resolveLiveSmokePolicy({
    AIN_RUN_LIVE_SMOKE: '1', SMOKE_AGENT: 'codex', SMOKE_TIMEOUT_MS: '30001',
  }).enabled, false);
  assert.equal(resolveLiveSmokePolicy({
    AIN_RUN_LIVE_SMOKE: '1', SMOKE_AGENT: 'codex', SMOKE_TIMEOUT_MS: '120001',
  }).enabled, false);
});

test('live smoke reserves one shared attempt across both CLIs for four hours', (t) => {
  const stateDir = tempStateDir(t);
  const now = Date.parse('2026-10-23T00:00:00Z');
  const first = reserveLiveSmokeAttempt({ stateDir, agent: 'codex', promptChars: 100, now });
  assert.equal(first.allowed, true);

  const concurrent = reserveLiveSmokeAttempt({ stateDir, agent: 'agy', promptChars: 100, now: now + 1 });
  assert.deepEqual(concurrent, {
    allowed: false,
    reason: 'cooldown_active',
    retryAt: new Date(now + LIVE_SMOKE_COOLDOWN_MS).toISOString(),
  });

  const afterCooldown = reserveLiveSmokeAttempt({
    stateDir, agent: 'agy', promptChars: 100, now: now + LIVE_SMOKE_COOLDOWN_MS,
  });
  assert.equal(afterCooldown.allowed, true);
  assert.notEqual(afterCooldown.reservationId, first.reservationId);
});

test('live smoke reserves before the provider call and keeps only a sanitized receipt', (t) => {
  const stateDir = tempStateDir(t);
  const now = Date.parse('2026-10-23T00:00:00Z');
  const reservation = reserveLiveSmokeAttempt({ stateDir, agent: 'codex', promptChars: 100, now });
  assert.equal(readLiveSmokeReceipt({ stateDir }).status, 'reserved');
  assert.equal(readLiveSmokeReceipt({ stateDir }).invocationState, 'not_started');
  assert.equal(readLiveSmokeReceipt({ stateDir }).usageState, 'unknown');

  markLiveSmokeInvocationStarted({ stateDir, reservationId: reservation.reservationId, now });

  completeLiveSmokeAttempt({
    stateDir, reservationId: reservation.reservationId, status: 'completed', durationMs: 1234,
    now: now + 1234,
  });

  const receipt = readLiveSmokeReceipt({ stateDir });
  assert.deepEqual(Object.keys(receipt).sort(), [
    'agent', 'attemptedAt', 'cooldownUntil', 'durationMs', 'invocationState',
    'reservationId', 'status', 'usageState', 'version',
  ]);
  assert.equal(receipt.status, 'completed');
  assert.equal(receipt.invocationState, 'finished');
  assert.equal(receipt.usageState, 'unknown');
  assert.equal(receipt.durationMs, 1234);
  assert.doesNotMatch(readFileSync(path.join(stateDir, LIVE_SMOKE_RECEIPT_FILENAME), 'utf8'), /prompt|response|transcript|skill text/i);
});

test('live smoke crash receipt preserves started invocation with unknown provider usage', (t) => {
  const stateDir = tempStateDir(t);
  const reservation = reserveLiveSmokeAttempt({ stateDir, agent: 'agy', promptChars: 100 });
  markLiveSmokeInvocationStarted({ stateDir, reservationId: reservation.reservationId });

  const receipt = readLiveSmokeReceipt({ stateDir });
  assert.equal(receipt.status, 'reserved');
  assert.equal(receipt.invocationState, 'started');
  assert.equal(receipt.usageState, 'unknown');
});

test('live smoke blocks oversized prompts before reserving the cooldown', (t) => {
  const stateDir = tempStateDir(t);
  const result = reserveLiveSmokeAttempt({
    stateDir, agent: 'codex', promptChars: LIVE_SMOKE_MAX_PROMPT_CHARS + 1,
  });
  assert.deepEqual(result, { allowed: false, reason: 'prompt_too_large' });
  assert.equal(readLiveSmokeReceipt({ stateDir }), null);
});

test('live smoke recovers a stale lock only after its owner process is gone', (t) => {
  const stateDir = tempStateDir(t);
  const lockDir = path.join(stateDir, '.live-smoke-receipt.lock');
  mkdirSync(lockDir, { mode: 0o700 });
  writeFileSync(path.join(lockDir, 'owner.json'), JSON.stringify({
    pid: 321, nonce: '00000000-0000-4000-8000-000000000001',
  }));
  const result = reserveLiveSmokeAttempt({
    stateDir, agent: 'agy', promptChars: 100, now: Date.parse('2026-10-23T00:00:00Z'),
    isProcessAlive: () => false,
  });
  assert.equal(result.allowed, true);
});

test('live smoke recovers an abandoned empty lock directory after its startup grace', (t) => {
  const stateDir = tempStateDir(t);
  const lockDir = path.join(stateDir, '.live-smoke-receipt.lock');
  mkdirSync(lockDir, { mode: 0o700 });
  const stale = new Date(Date.now() - 2_000);
  utimesSync(lockDir, stale, stale);

  const result = reserveLiveSmokeAttempt({ stateDir, agent: 'agy', promptChars: 100 });
  assert.equal(result.allowed, true);
});

test('live smoke blocks while another process owns the reservation lock', (t) => {
  const stateDir = tempStateDir(t);
  const lockDir = path.join(stateDir, '.live-smoke-receipt.lock');
  mkdirSync(lockDir, { mode: 0o700 });
  writeFileSync(path.join(lockDir, 'owner.json'), JSON.stringify({
    pid: 321, nonce: '00000000-0000-4000-8000-000000000001',
  }));
  const result = reserveLiveSmokeAttempt({
    stateDir, agent: 'codex', promptChars: 100, isProcessAlive: () => true,
  });
  assert.deepEqual(result, { allowed: false, reason: 'attempt_in_progress' });
});

test('parallel processes can reserve only one shared smoke attempt', async (t) => {
  const stateDir = tempStateDir(t);
  const moduleUrl = new URL('./live-smoke-policy.mjs', import.meta.url).href;
  const invoke = (agent) => new Promise((resolve, reject) => {
    const program = `import { reserveLiveSmokeAttempt } from ${JSON.stringify(moduleUrl)};\n` +
      `console.log(JSON.stringify(reserveLiveSmokeAttempt({ stateDir: ${JSON.stringify(stateDir)}, agent: ${JSON.stringify(agent)}, promptChars: 100 })));`;
    const child = spawn(process.execPath, ['--input-type=module', '-e', program], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', (chunk) => { stdout += chunk; });
    child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr += chunk; });
    child.once('error', reject);
    child.once('close', (code) => {
      if (code !== 0) return reject(new Error(stderr || `child exited ${code}`));
      try { resolve(JSON.parse(stdout.trim())); }
      catch { reject(new Error('child returned invalid reservation JSON')); }
    });
  });

  const attempts = await Promise.all([invoke('codex'), invoke('agy')]);
  assert.equal(attempts.filter((attempt) => attempt.allowed).length, 1);
  assert.equal(attempts.filter((attempt) => !attempt.allowed).length, 1);
  assert.ok(['attempt_in_progress', 'cooldown_active'].includes(
    attempts.find((attempt) => !attempt.allowed).reason,
  ));
});

test('live smoke fails closed on a corrupt receipt or unknown completion state', (t) => {
  const stateDir = tempStateDir(t);
  writeFileSync(path.join(stateDir, LIVE_SMOKE_RECEIPT_FILENAME), '{bad json');
  assert.throws(() => reserveLiveSmokeAttempt({
    stateDir, agent: 'codex', promptChars: 100,
  }), { code: 'LIVE_SMOKE_RECEIPT_INVALID' });

  rmSync(path.join(stateDir, LIVE_SMOKE_RECEIPT_FILENAME));
  const reservation = reserveLiveSmokeAttempt({ stateDir, agent: 'codex', promptChars: 100 });
  assert.throws(() => completeLiveSmokeAttempt({
    stateDir, reservationId: reservation.reservationId, status: 'response text', durationMs: 1,
  }), { code: 'LIVE_SMOKE_COMPLETION_INVALID' });
});
