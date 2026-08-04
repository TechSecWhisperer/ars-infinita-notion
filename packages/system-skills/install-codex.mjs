#!/usr/bin/env node
// Copies dist/codex/<skill>/ into $CODEX_HOME/skills/<skill>/.
// Verified layout: Codex's own bundled skills live at ~/.codex/skills/.system/<name>/SKILL.md,
// so user skills go one level up at ~/.codex/skills/<name>/SKILL.md.

import fs from 'node:fs';
import path from 'node:path';
import { DIST_CODEX, codexSkillsDir } from './lib/paths.mjs';

const dryRun = process.argv.includes('--dry-run');

if (!fs.existsSync(DIST_CODEX)) {
  console.error('dist/codex is missing — run `npm run build` first.');
  process.exit(1);
}

const target = codexSkillsDir();
const names = fs
  .readdirSync(DIST_CODEX, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

console.log(`installing ${names.length} skills for the Codex CLI`);
console.log(`  from: ${DIST_CODEX}`);
console.log(`  to:   ${target}`);
if (dryRun) console.log('  (dry run — nothing written)');

if (!dryRun) fs.mkdirSync(target, { recursive: true });

for (const name of names) {
  const dest = path.join(target, name);
  const existed = fs.existsSync(dest);
  if (!dryRun) {
    fs.rmSync(dest, { recursive: true, force: true });
    fs.cpSync(path.join(DIST_CODEX, name), dest, { recursive: true });
  }
  console.log(`  ${existed ? 'replaced' : 'installed'} ${name} -> ${dest}`);
}

console.log(
  dryRun
    ? 'dry run complete.'
    : `done. Start a new \`codex\` session; the skills are available by name (e.g. "run /status").`,
);
