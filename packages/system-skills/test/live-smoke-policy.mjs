import {
  chmodSync,
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

export const MAX_LIVE_SMOKE_PROMPTS = 1;
export const MAX_LIVE_SMOKE_TIMEOUT_MS = 30_000;
export const LIVE_SMOKE_COOLDOWN_MS = 4 * 60 * 60 * 1000;
export const LIVE_SMOKE_MAX_PROMPT_CHARS = 12_000;
export const LIVE_SMOKE_RECEIPT_FILENAME = 'live-smoke-receipt.json';
const LIVE_SMOKE_LOCK_DIRNAME = '.live-smoke-receipt.lock';
const LIVE_SMOKE_LOCK_OWNER_FILENAME = 'owner.json';
const EMPTY_LOCK_RECOVERY_DELAY_MS = 1_000;
const ALLOWED_AGENTS = new Set(['codex', 'agy']);
const ALLOWED_COMPLETIONS = new Set([
  'completed', 'failed', 'timed_out', 'environment_failure',
]);
const ALLOWED_INVOCATION_STATES = new Set(['not_started', 'started', 'finished']);

function fail(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function normalizeNow(now) {
  const value = now instanceof Date ? now.getTime() : Number(now ?? Date.now());
  if (!Number.isSafeInteger(value) || value < 0) throw fail('LIVE_SMOKE_CLOCK_INVALID');
  return value;
}

function directoryAt(pathname) {
  if (typeof pathname !== 'string' || pathname.length === 0) throw fail('LIVE_SMOKE_STATE_DIR_INVALID');
  mkdirSync(pathname, { recursive: true, mode: 0o700 });
  const stat = lstatSync(pathname);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw fail('LIVE_SMOKE_STATE_DIR_INVALID');
  chmodSync(pathname, 0o700);
}

function receiptPath(stateDir) {
  return path.join(stateDir, LIVE_SMOKE_RECEIPT_FILENAME);
}

function validateReceipt(value, now) {
  const expected = [
    'agent', 'attemptedAt', 'cooldownUntil', 'durationMs', 'invocationState',
    'reservationId', 'status', 'usageState', 'version',
  ];
  if (!value || typeof value !== 'object' || Array.isArray(value)
      || Object.keys(value).sort().join(',') !== expected.join(',')
      || value.version !== 1 || !ALLOWED_AGENTS.has(value.agent)
      || !/^[a-f0-9-]{36}$/i.test(String(value.reservationId || ''))
      || !['reserved', ...ALLOWED_COMPLETIONS].includes(value.status)
      || !ALLOWED_INVOCATION_STATES.has(value.invocationState)
      || value.usageState !== 'unknown'
      || typeof value.attemptedAt !== 'string' || !Number.isFinite(Date.parse(value.attemptedAt))
      || typeof value.cooldownUntil !== 'string' || !Number.isFinite(Date.parse(value.cooldownUntil))) {
    throw fail('LIVE_SMOKE_RECEIPT_INVALID');
  }
  const attemptedAt = Date.parse(value.attemptedAt);
  const cooldownUntil = Date.parse(value.cooldownUntil);
  if (attemptedAt > now + 60_000 || cooldownUntil !== attemptedAt + LIVE_SMOKE_COOLDOWN_MS
      || (value.status === 'reserved' ? value.durationMs !== null
        : !Number.isSafeInteger(value.durationMs) || value.durationMs < 0 || value.durationMs > 600_000)) {
    throw fail('LIVE_SMOKE_RECEIPT_INVALID');
  }
  return value;
}

export function readLiveSmokeReceipt({ stateDir, now = Date.now() } = {}) {
  const at = normalizeNow(now);
  if (typeof stateDir !== 'string' || stateDir.length === 0) throw fail('LIVE_SMOKE_STATE_DIR_INVALID');
  const file = receiptPath(stateDir);
  let stat;
  try { stat = lstatSync(file); }
  catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
  if (!stat.isFile() || stat.isSymbolicLink()) throw fail('LIVE_SMOKE_RECEIPT_INVALID');
  let receipt;
  try { receipt = JSON.parse(readFileSync(file, 'utf8')); }
  catch { throw fail('LIVE_SMOKE_RECEIPT_INVALID'); }
  return validateReceipt(receipt, at);
}

function processIsAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code !== 'ESRCH';
  }
}

function readLock(lockPath) {
  let stat;
  try { stat = lstatSync(lockPath); }
  catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
  if (!stat.isFile() || stat.isSymbolicLink()) throw fail('LIVE_SMOKE_LOCK_INVALID');
  try {
    const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
    if (!lock || !Number.isSafeInteger(lock.pid) || lock.pid < 1
        || !/^[a-f0-9-]{36}$/i.test(String(lock.nonce || ''))) throw new Error('invalid');
    return lock;
  } catch {
    throw fail('LIVE_SMOKE_LOCK_INVALID');
  }
}

function acquireLock(stateDir, isAlive) {
  const lockDir = path.join(stateDir, LIVE_SMOKE_LOCK_DIRNAME);
  const ownerPath = path.join(lockDir, LIVE_SMOKE_LOCK_OWNER_FILENAME);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const lock = { pid: process.pid, nonce: randomUUID() };
    let created = false;
    try {
      mkdirSync(lockDir, { mode: 0o700 });
      created = true;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }

    if (created) {
      const temporary = path.join(lockDir, `.owner.${lock.pid}.${lock.nonce}.tmp`);
      let fd;
      try {
        fd = openSync(temporary, 'wx', 0o600);
        writeFileSync(fd, `${JSON.stringify(lock)}\n`);
        fsyncSync(fd);
        closeSync(fd);
        fd = undefined;
        renameSync(temporary, ownerPath);
        return { lockDir, ownerPath, lock };
      } catch (error) {
        if (fd !== undefined) {
          try { closeSync(fd); } catch {}
        }
        try { unlinkSync(temporary); } catch {}
        try { rmdirSync(lockDir); } catch {}
        throw error;
      }
    }

    let dirStat;
    try { dirStat = lstatSync(lockDir); }
    catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    if (!dirStat.isDirectory() || dirStat.isSymbolicLink()) throw fail('LIVE_SMOKE_LOCK_INVALID');

    let entries;
    try { entries = readdirSync(lockDir); }
    catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }

    if (!entries.includes(LIVE_SMOKE_LOCK_OWNER_FILENAME)) {
      const abandonedTemps = entries.filter((name) => /^\.owner\.\d+\.[a-f0-9-]{36}\.tmp$/i.test(name));
      for (const name of abandonedTemps) {
        const pid = Number(name.split('.')[2]);
        if (!Number.isSafeInteger(pid) || isAlive(pid)) return null;
      }
      const unexpected = entries.filter((name) => !abandonedTemps.includes(name));
      if (unexpected.length || Date.now() - dirStat.mtimeMs < EMPTY_LOCK_RECOVERY_DELAY_MS) return null;
      for (const name of abandonedTemps) {
        try { unlinkSync(path.join(lockDir, name)); }
        catch (error) { if (error.code !== 'ENOENT') throw error; }
      }
      try { rmdirSync(lockDir); }
      catch (error) { if (error.code !== 'ENOENT' && error.code !== 'ENOTEMPTY') throw error; }
      continue;
    }

    const existing = readLock(ownerPath);
    if (!existing) continue;
    if (isAlive(existing.pid)) return null;
    try { unlinkSync(ownerPath); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    try { rmdirSync(lockDir); }
    catch (error) { if (error.code !== 'ENOENT' && error.code !== 'ENOTEMPTY') throw error; }
  }
  return null;
}

function releaseLock({ lockDir, ownerPath, lock }) {
  const current = readLock(ownerPath);
  if (current?.nonce === lock.nonce && current.pid === lock.pid) {
    unlinkSync(ownerPath);
    rmdirSync(lockDir);
  }
}

function withStateLock(stateDir, action, isAlive = processIsAlive) {
  directoryAt(stateDir);
  const acquired = acquireLock(stateDir, isAlive);
  if (!acquired) return { locked: true };
  try { return { locked: false, value: action() }; }
  finally { releaseLock(acquired); }
}

function writeReceipt(stateDir, receipt) {
  const target = receiptPath(stateDir);
  try {
    const stat = lstatSync(target);
    if (!stat.isFile() || stat.isSymbolicLink()) throw fail('LIVE_SMOKE_RECEIPT_INVALID');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const temporary = path.join(stateDir, `.${LIVE_SMOKE_RECEIPT_FILENAME}.${process.pid}.${randomUUID()}.tmp`);
  try {
    const fd = openSync(temporary, 'wx', 0o600);
    try {
      writeFileSync(fd, `${JSON.stringify(receipt)}\n`);
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
    renameSync(temporary, target);
    chmodSync(target, 0o600);
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary);
  }
}

export function reserveLiveSmokeAttempt({
  stateDir,
  agent,
  promptChars,
  now = Date.now(),
  isProcessAlive = processIsAlive,
} = {}) {
  const at = normalizeNow(now);
  if (!ALLOWED_AGENTS.has(agent)) throw fail('LIVE_SMOKE_AGENT_INVALID');
  if (!Number.isSafeInteger(promptChars) || promptChars < 1) return { allowed: false, reason: 'prompt_invalid' };
  if (promptChars > LIVE_SMOKE_MAX_PROMPT_CHARS) return { allowed: false, reason: 'prompt_too_large' };
  if (typeof stateDir !== 'string' || stateDir.length === 0) throw fail('LIVE_SMOKE_STATE_DIR_INVALID');

  const transaction = withStateLock(stateDir, () => {
    const current = readLiveSmokeReceipt({ stateDir, now: at });
    const cooldownUntil = current ? Date.parse(current.cooldownUntil) : 0;
    if (current && at < cooldownUntil) {
      return { allowed: false, reason: 'cooldown_active', retryAt: current.cooldownUntil };
    }
    const reservationId = randomUUID();
    const receipt = {
      version: 1,
      reservationId,
      agent,
      attemptedAt: new Date(at).toISOString(),
      cooldownUntil: new Date(at + LIVE_SMOKE_COOLDOWN_MS).toISOString(),
      status: 'reserved',
      invocationState: 'not_started',
      usageState: 'unknown',
      durationMs: null,
    };
    writeReceipt(stateDir, receipt);
    return { allowed: true, reservationId, cooldownUntil: receipt.cooldownUntil };
  }, isProcessAlive);
  return transaction.locked ? { allowed: false, reason: 'attempt_in_progress' } : transaction.value;
}

export function markLiveSmokeInvocationStarted({ stateDir, reservationId, now = Date.now() } = {}) {
  const at = normalizeNow(now);
  if (typeof reservationId !== 'string' || !/^[a-f0-9-]{36}$/i.test(reservationId)) {
    throw fail('LIVE_SMOKE_RESERVATION_INVALID');
  }

  const transaction = withStateLock(stateDir, () => {
    const current = readLiveSmokeReceipt({ stateDir, now: at });
    if (!current || current.reservationId !== reservationId || current.status !== 'reserved'
        || current.invocationState !== 'not_started') {
      throw fail('LIVE_SMOKE_RESERVATION_NOT_OPEN');
    }
    const receipt = { ...current, invocationState: 'started' };
    writeReceipt(stateDir, receipt);
    return receipt;
  });
  if (transaction.locked) throw fail('LIVE_SMOKE_LOCK_BUSY');
  return transaction.value;
}

export function completeLiveSmokeAttempt({
  stateDir,
  reservationId,
  status,
  durationMs,
  now = Date.now(),
} = {}) {
  const at = normalizeNow(now);
  if (!ALLOWED_COMPLETIONS.has(status) || !Number.isSafeInteger(durationMs)
      || durationMs < 0 || durationMs > 600_000) throw fail('LIVE_SMOKE_COMPLETION_INVALID');
  if (typeof reservationId !== 'string' || !/^[a-f0-9-]{36}$/i.test(reservationId)) {
    throw fail('LIVE_SMOKE_RESERVATION_INVALID');
  }

  const transaction = withStateLock(stateDir, () => {
    const current = readLiveSmokeReceipt({ stateDir, now: at });
    if (!current || current.reservationId !== reservationId || current.status !== 'reserved') {
      throw fail('LIVE_SMOKE_RESERVATION_NOT_OPEN');
    }
    const receipt = {
      ...current,
      status,
      invocationState: current.invocationState === 'started' ? 'finished' : current.invocationState,
      durationMs,
    };
    writeReceipt(stateDir, receipt);
    return receipt;
  });
  if (transaction.locked) throw fail('LIVE_SMOKE_LOCK_BUSY');
  return transaction.value;
}

export function resolveLiveSmokePolicy(env = process.env) {
  const isCi = ['true', '1'].includes(String(env.CI || '').toLowerCase())
    || String(env.GITHUB_ACTIONS || '').toLowerCase() === 'true';
  if (isCi) {
    return { enabled: false, reason: 'live model smoke is disabled in CI' };
  }
  if (env.AIN_RUN_LIVE_SMOKE !== '1') {
    return { enabled: false, reason: 'explicit opt-in is required' };
  }

  const agent = String(env.SMOKE_AGENT || '').trim().toLowerCase();
  if (!ALLOWED_AGENTS.has(agent)) {
    return { enabled: false, reason: 'choose exactly one SMOKE_AGENT: codex or agy' };
  }

  const promptLimit = Number(env.SMOKE_SKILL_LIMIT ?? MAX_LIVE_SMOKE_PROMPTS);
  if (!Number.isSafeInteger(promptLimit) || promptLimit !== MAX_LIVE_SMOKE_PROMPTS) {
    return { enabled: false, reason: `SMOKE_SKILL_LIMIT must be ${MAX_LIVE_SMOKE_PROMPTS}` };
  }

  const timeoutMs = Number(env.SMOKE_TIMEOUT_MS ?? 30_000);
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > MAX_LIVE_SMOKE_TIMEOUT_MS) {
    return { enabled: false, reason: `SMOKE_TIMEOUT_MS must be between 1 and ${MAX_LIVE_SMOKE_TIMEOUT_MS}` };
  }

  return {
    enabled: true,
    agent,
    skillLimit: promptLimit,
    timeoutMs,
    cooldownMs: LIVE_SMOKE_COOLDOWN_MS,
    maxPromptChars: LIVE_SMOKE_MAX_PROMPT_CHARS,
  };
}
