#!/usr/bin/env node
// Smoke test: feed each built skill to the *real* CLI non-interactively and
// assert the agent produced a usable, on-domain answer.
//
//   codex exec --sandbox read-only --skip-git-repo-check "<skill>\n\nSmoke check: ..."
//   agy --sandbox --print "<skill>\n\nSmoke check: ..."
//
// Kept deliberately cheap: at most SKILL_LIMIT skills, smallest first.
// Prompts and raw transcripts are written to evals/ — which is gitignored.
// Environment failures (missing CLI, auth, quota) SKIP with a warning; they
// never report a pass.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { DIST_DIR, EVALS_DIR, MANIFEST_PATH } from '../lib/paths.mjs';

const SKILL_LIMIT = Number(process.env.SMOKE_SKILL_LIMIT || 3);
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS || 300000);
const ONLY_AGENT = process.env.SMOKE_AGENT || '';

const SMOKE_TASK =
  'Smoke check: reply OK plus one sentence on what this skill does. ' +
  'Do not run any commands, read any files, or take any action — this is a dry read of the instructions above.';

// Substrings that mean "the environment is broken", not "the skill is broken".
const ENV_ERROR_PATTERNS = [
  /not logged in/i,
  /\bplease run .{0,20}login/i,
  /authentication/i,
  /unauthorized/i,
  /401|403/,
  /rate limit/i,
  /quota/i,
  /usage limit/i,
  /insufficient_quota/i,
  /network error/i,
  /connection refused/i,
  /dns error/i,
  /stream disconnected/i,
  /service unavailable|502|503|504/,
];

const RUNNERS = {
  codex: {
    label: 'OpenAI Codex CLI',
    versionArgs: ['--version'],
    run(prompt, outFile) {
      // The prompt starts with `---` (YAML frontmatter), which codex's arg
      // parser rejects as a flag, so feed it on stdin and pass `-` instead.
      return spawnSync(
        'codex',
        [
          'exec',
          '--sandbox',
          'read-only',
          '--skip-git-repo-check',
          '--color',
          'never',
          '--output-last-message',
          outFile,
          '-',
        ],
        {
          encoding: 'utf8',
          timeout: TIMEOUT_MS,
          input: prompt,
          stdio: ['pipe', 'pipe', 'pipe'],
        },
      );
    },
  },
  agy: {
    label: 'Antigravity CLI (agy)',
    versionArgs: ['--help'],
    run(prompt, outFile) {
      const res = spawnSync('agy', ['--sandbox', '--print', prompt], {
        encoding: 'utf8',
        timeout: TIMEOUT_MS,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      if (typeof res.stdout === 'string') fs.writeFileSync(outFile, res.stdout);
      return res;
    },
  },
};

function cliAvailable(cmd, args) {
  const res = spawnSync(cmd, args, {
    encoding: 'utf8',
    timeout: 30000,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return !(res.error && res.error.code === 'ENOENT');
}

function classifyEnvError(text) {
  for (const re of ENV_ERROR_PATTERNS) {
    const m = re.exec(text);
    if (m) {
      const at = text.indexOf(m[0]);
      return text.slice(Math.max(0, at - 120), at + 200).trim();
    }
  }
  return null;
}

function main() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('dist/manifest.json is missing — run `node builder.mjs` first.');
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

  const chosen = [...manifest.skills]
    .sort((a, b) => a.builtBytes - b.builtBytes)
    .slice(0, SKILL_LIMIT);

  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const runDir = path.join(EVALS_DIR, runId);
  fs.mkdirSync(runDir, { recursive: true });

  const agents = Object.keys(RUNNERS).filter((a) => !ONLY_AGENT || a === ONLY_AGENT);

  console.log(
    `smoke: ${chosen.length} skills x ${agents.length} agents (${chosen.map((s) => s.name).join(', ')})`,
  );
  console.log(`transcripts: ${runDir}\n`);

  const results = [];

  for (const agent of agents) {
    const runner = RUNNERS[agent];
    if (!cliAvailable(agent, runner.versionArgs)) {
      console.warn(`SKIP ${agent}: \`${agent}\` is not on PATH.`);
      for (const skill of chosen)
        results.push({ agent, skill: skill.name, status: 'skip', detail: 'CLI not installed' });
      continue;
    }

    for (const skill of chosen) {
      const built = path.join(DIST_DIR, skill.outputs[agent]);
      const skillText = fs.readFileSync(built, 'utf8');
      const prompt = `${skillText}\n\n${SMOKE_TASK}`;
      const base = path.join(runDir, `${agent}-${skill.name}`);
      fs.writeFileSync(`${base}.prompt.eval.md`, prompt);

      const started = Date.now();
      const res = runner.run(prompt, `${base}.answer.eval.txt`);
      const secs = ((Date.now() - started) / 1000).toFixed(1);

      const stdout = res.stdout || '';
      const stderr = res.stderr || '';
      fs.writeFileSync(`${base}.raw.eval.txt`, `--- stdout ---\n${stdout}\n--- stderr ---\n${stderr}`);

      const answerFile = `${base}.answer.eval.txt`;
      const answer = (
        fs.existsSync(answerFile) ? fs.readFileSync(answerFile, 'utf8') : stdout
      ).trim();

      if (res.error && res.error.code === 'ETIMEDOUT') {
        console.warn(`SKIP ${agent}/${skill.name}: timed out after ${TIMEOUT_MS}ms.`);
        results.push({ agent, skill: skill.name, status: 'skip', detail: 'timeout' });
        continue;
      }

      const envError = classifyEnvError(`${stderr}\n${stdout}`);
      if (res.status !== 0 || (!answer && envError)) {
        if (envError) {
          console.warn(
            `SKIP ${agent}/${skill.name}: environment failure — ${envError.split('\n')[0]}`,
          );
          results.push({ agent, skill: skill.name, status: 'skip', detail: envError });
        } else {
          console.error(
            `FAIL ${agent}/${skill.name}: exit ${res.status}\n${(stderr || stdout).slice(0, 500)}`,
          );
          results.push({
            agent,
            skill: skill.name,
            status: 'fail',
            detail: `exit ${res.status}`,
          });
        }
        continue;
      }

      const lower = answer.toLowerCase();
      const problems = [];
      if (answer.length < 20) problems.push(`answer too short (${answer.length} chars)`);
      const hits = skill.domainTerms.filter((t) => lower.includes(t));
      if (hits.length === 0)
        problems.push(`no domain term matched (expected one of: ${skill.domainTerms.join(', ')})`);

      if (problems.length) {
        console.error(`FAIL ${agent}/${skill.name} (${secs}s): ${problems.join('; ')}`);
        console.error(`  answer: ${answer.slice(0, 300).replace(/\n/g, ' ')}`);
        results.push({ agent, skill: skill.name, status: 'fail', detail: problems.join('; ') });
      } else {
        console.log(
          `PASS ${agent}/${skill.name} (${secs}s, ${answer.length} chars, matched: ${hits.slice(0, 4).join(', ')})`,
        );
        console.log(`  ${answer.slice(0, 220).replace(/\s+/g, ' ')}`);
        results.push({ agent, skill: skill.name, status: 'pass', detail: `matched ${hits.length}` });
      }
    }
  }

  fs.writeFileSync(
    path.join(runDir, 'summary.eval.json'),
    JSON.stringify({ runId, results }, null, 2) + '\n',
  );

  const pass = results.filter((r) => r.status === 'pass').length;
  const fail = results.filter((r) => r.status === 'fail').length;
  const skip = results.filter((r) => r.status === 'skip').length;
  console.log(`\n${pass} passed, ${fail} failed, ${skip} skipped`);
  if (fail > 0) process.exit(1);
  if (pass === 0) {
    console.warn('no checks actually ran — treating as inconclusive, not a pass.');
    process.exit(2);
  }
}

main();
