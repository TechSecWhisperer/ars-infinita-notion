#!/usr/bin/env node
// Explicitly opted-in smoke: at most one prompt, one selected CLI, and one
// shared per-user four-hour reservation. Prompts and responses stay in memory
// except for Codex's short-lived output file in a private OS temp directory.
// Only a sanitized attempt receipt is retained in the user's state directory.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { homedir, tmpdir } from 'node:os';
import {
  DIST_DIR,
  MANIFEST_PATH,
} from '../lib/paths.mjs';
import {
  completeLiveSmokeAttempt,
  markLiveSmokeInvocationStarted,
  reserveLiveSmokeAttempt,
  resolveLiveSmokePolicy,
} from './live-smoke-policy.mjs';

const SMOKE_POLICY = resolveLiveSmokePolicy(process.env);
const TIMEOUT_MS = SMOKE_POLICY.enabled ? SMOKE_POLICY.timeoutMs : 30_000;
const STATE_HOME = process.env.XDG_STATE_HOME || path.join(homedir(), '.local', 'state');
const STATE_DIR = path.join(STATE_HOME, 'ars-infinita', 'live-smoke');
const SMOKE_TASK =
  'Smoke check: reply OK plus one sentence on what this skill does. ' +
  'Do not run any commands, read any files, or take any action — this is a dry read of the instructions above.';

const ENV_ERROR_PATTERNS = [
  /not logged in/i,
  /please run .{0,20}login/i,
  /authentication/i,
  /unauthorized/i,
  /\b401|403\b/,
  /rate limit/i,
  /quota/i,
  /usage limit/i,
  /insufficient_quota/i,
  /network error/i,
  /connection refused/i,
  /dns error/i,
  /stream disconnected/i,
  /service unavailable|502|503|504/i,
];

const RUNNERS = {
  codex: {
    versionArgs: ['--version'],
    run(prompt, outputFile) {
      return spawnSync('codex', [
        'exec', '--ephemeral', '--sandbox', 'read-only', '--skip-git-repo-check',
        '--color', 'never', '--output-last-message', outputFile, '-',
      ], {
        encoding: 'utf8',
        timeout: TIMEOUT_MS,
        maxBuffer: 64 * 1024,
        input: prompt,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    },
  },
  agy: {
    versionArgs: ['--help'],
    run(prompt) {
      return spawnSync('agy', [
        '--sandbox', '--print', '--print-timeout', String(Math.ceil(TIMEOUT_MS / 1000)), prompt,
      ], {
        encoding: 'utf8',
        timeout: TIMEOUT_MS,
        maxBuffer: 64 * 1024,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    },
  },
};

function cliAvailable(cmd, args) {
  const result = spawnSync(cmd, args, {
    encoding: 'utf8',
    timeout: 10_000,
    maxBuffer: 32 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return !result.error && result.status === 0;
}

function environmentFailure(text) {
  return ENV_ERROR_PATTERNS.some((pattern) => pattern.test(text));
}

function chooseSmallestSkill(manifest, agent) {
  return [...manifest.skills]
    .sort((a, b) => a.builtBytes - b.builtBytes)
    .slice(0, 1)
    .map((skill) => ({ skill, output: skill.outputs[agent] }))[0] || null;
}

function evaluateAnswer(answer, domainTerms) {
  if (answer.length < 20) return false;
  const lower = answer.toLowerCase();
  return domainTerms.some((term) => lower.includes(term));
}

function main() {
  if (!SMOKE_POLICY.enabled) {
    console.log(`SKIP live model smoke: ${SMOKE_POLICY.reason}. No prompts were sent.`);
    return;
  }
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('BLOCKED live smoke: built skill manifest is missing.');
    process.exitCode = 2;
    return;
  }

  let reservation = null;
  let temporaryDir = null;
  let finalStatus = 'failed';
  const startedAt = Date.now();

  try {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    const chosen = chooseSmallestSkill(manifest, SMOKE_POLICY.agent);
    if (!chosen || typeof chosen.output !== 'string') {
      console.error('BLOCKED live smoke: no compatible built skill is available.');
      process.exitCode = 2;
      return;
    }

    const builtPath = path.join(DIST_DIR, chosen.output);
    const prompt = `${fs.readFileSync(builtPath, 'utf8')}\n\n${SMOKE_TASK}`;
    if (prompt.length > SMOKE_POLICY.maxPromptChars) {
      console.error('BLOCKED live smoke: prompt exceeds the configured size ceiling; no prompt was sent.');
      process.exitCode = 2;
      return;
    }

    const runner = RUNNERS[SMOKE_POLICY.agent];
    if (!cliAvailable(SMOKE_POLICY.agent, runner.versionArgs)) {
      console.log('BLOCKED live smoke: selected CLI is unavailable. No prompt was sent.');
      process.exitCode = 2;
      return;
    }

    const admission = reserveLiveSmokeAttempt({
      stateDir: STATE_DIR,
      agent: SMOKE_POLICY.agent,
      promptChars: prompt.length,
    });
    if (!admission.allowed) {
      const until = admission.retryAt ? ` Retry after ${admission.retryAt}.` : '';
      console.log(`BLOCKED live smoke: ${admission.reason}.${until} No prompt was sent.`);
      process.exitCode = 2;
      return;
    }
    reservation = admission.reservationId;

    temporaryDir = fs.mkdtempSync(path.join(tmpdir(), 'ain-live-smoke-'));
    fs.chmodSync(temporaryDir, 0o700);
    const outputFile = path.join(temporaryDir, 'answer.txt');
    markLiveSmokeInvocationStarted({ stateDir: STATE_DIR, reservationId: reservation });
    const result = runner.run(prompt, outputFile);

    if (result.error?.code === 'ETIMEDOUT') {
      finalStatus = 'timed_out';
      console.log('BLOCKED live smoke: selected CLI timed out.');
      process.exitCode = 2;
      return;
    }

    const stdout = typeof result.stdout === 'string' ? result.stdout : '';
    const stderr = typeof result.stderr === 'string' ? result.stderr : '';
    if (environmentFailure(`${stderr}\n${stdout}`)) {
      finalStatus = 'environment_failure';
      console.log('BLOCKED live smoke: selected CLI reported an environment or quota error.');
      process.exitCode = 2;
      return;
    }
    if (result.error || result.status !== 0) {
      finalStatus = 'failed';
      console.error('FAIL live smoke: selected CLI returned a nonzero result. Output was discarded.');
      process.exitCode = 1;
      return;
    }

    let answer = stdout.trim();
    if (fs.existsSync(outputFile)) {
      const answerStat = fs.lstatSync(outputFile);
      if (!answerStat.isFile() || answerStat.isSymbolicLink() || answerStat.size > 64 * 1024) {
        finalStatus = 'failed';
        console.error('FAIL live smoke: response artifact was invalid or exceeded its size ceiling. Output was discarded.');
        process.exitCode = 1;
        return;
      }
      answer = fs.readFileSync(outputFile, 'utf8').trim();
    }
    if (!evaluateAnswer(answer, chosen.skill.domainTerms || [])) {
      finalStatus = 'failed';
      console.error('FAIL live smoke: response did not satisfy the fixed behavior check. Output was discarded.');
      process.exitCode = 1;
      return;
    }

    finalStatus = 'completed';
    console.log('PASS live smoke: one bounded prompt completed the behavior check. Response was discarded.');
  } catch {
    finalStatus = 'failed';
    console.error('FAIL live smoke: smoke execution failed; details and response were discarded.');
    process.exitCode = 1;
  } finally {
    if (temporaryDir) {
      try { fs.rmSync(temporaryDir, { recursive: true, force: true }); }
      catch {
        console.error('FAIL live smoke: temporary response cleanup failed.');
        process.exitCode = 1;
      }
    }
    if (reservation) {
      try {
        completeLiveSmokeAttempt({
          stateDir: STATE_DIR,
          reservationId: reservation,
          status: finalStatus,
          durationMs: Math.min(600_000, Math.max(0, Date.now() - startedAt)),
        });
      } catch {
        console.error('FAIL live smoke: safe receipt update failed; cooldown remains reserved.');
        process.exitCode = 1;
      }
    }
  }
}

main();
