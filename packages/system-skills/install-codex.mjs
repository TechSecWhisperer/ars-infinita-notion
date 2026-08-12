#!/usr/bin/env node
// Copies dist/codex/<skill>/ into $CODEX_HOME/skills/<skill>/.
// Verified layout: Codex's own bundled skills live at ~/.codex/skills/.system/<name>/SKILL.md,
// so user skills go one level up at ~/.codex/skills/<name>/SKILL.md.
//
// That target is a SHARED namespace — the player's own skills live there too,
// and our 27 names are ordinary words (status, log, report, browse, doctor,
// patch). An earlier version removed whatever sat at each destination before
// copying, which silently destroyed a player-authored skill that happened to
// share a name. Nothing warned, and the summary line said "replaced", which
// reads like it replaced our own previous install.
//
// So: never delete a directory we did not put there. What we installed is
// recorded in a manifest next to the skills, and anything present but absent
// from that manifest is treated as the player's until proven otherwise. The
// run aborts before writing anything if a collision is found, because a
// partial install that has already eaten one skill is worse than no install.

import fs from 'node:fs';
import path from 'node:path';
import { DIST_CODEX, codexSkillsDir } from './lib/paths.mjs';

const dryRun = process.argv.includes('--dry-run');
const force = process.argv.includes('--force');

if (!fs.existsSync(DIST_CODEX)) {
  console.error('dist/codex is missing — run `npm run build` first.');
  process.exit(1);
}

const target = codexSkillsDir();
const MANIFEST = path.join(target, '.ars-infinita-install.json');

const names = fs
  .readdirSync(DIST_CODEX, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

// What a previous run of THIS installer put here. Missing manifest means either
// a first install or one from before manifests existed; the fingerprint below
// covers the second case so upgrading does not look like a collision.
function priorInstall() {
  try {
    const m = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
    return new Set(Array.isArray(m.skills) ? m.skills : []);
  } catch {
    return new Set();
  }
}

// Recognises a directory this package installed before manifests existed. Our
// skills always carry a build-stamped references/boot-card.md alongside
// SKILL.md — a player-authored skill of the same name will not.
function looksLikeOurs(dir) {
  return (
    fs.existsSync(path.join(dir, 'SKILL.md')) &&
    fs.existsSync(path.join(dir, 'references', 'boot-card.md'))
  );
}

const prior = priorInstall();
const plan = [];
const collisions = [];

for (const name of names) {
  const dest = path.join(target, name);
  if (!fs.existsSync(dest)) {
    plan.push({ name, dest, action: 'install' });
  } else if (prior.has(name) || looksLikeOurs(dest)) {
    plan.push({ name, dest, action: 'update' });
  } else {
    collisions.push({ name, dest });
  }
}

if (collisions.length && !force) {
  console.error(`refusing to install: ${collisions.length} name collision(s) in ${target}`);
  console.error('');
  for (const c of collisions) {
    console.error(`  ${c.name} — a skill already exists here and this installer did not create it`);
    console.error(`    ${c.dest}`);
  }
  console.error('');
  console.error('  Nothing has been written. These look like your own skills, and');
  console.error('  overwriting them would lose their contents. Rename or move them,');
  console.error('  or re-run with --force to overwrite (there is no backup).');
  process.exit(1);
}

// --force still reports what it is about to destroy, so the loss is never silent.
for (const c of collisions) {
  console.warn(`WARNING: --force will overwrite a skill this installer did not create: ${c.dest}`);
  plan.push({ name: c.name, dest: c.dest, action: 'overwrite' });
}
plan.sort((a, b) => a.name.localeCompare(b.name));

console.log(`installing ${plan.length} skills for the Codex CLI`);
console.log(`  from: ${DIST_CODEX}`);
console.log(`  to:   ${target}`);
if (dryRun) console.log('  (dry run — nothing written)');

if (!dryRun) fs.mkdirSync(target, { recursive: true });

for (const { name, dest, action } of plan) {
  if (!dryRun) {
    fs.rmSync(dest, { recursive: true, force: true });
    fs.cpSync(path.join(DIST_CODEX, name), dest, { recursive: true });
  }
  console.log(`  ${action === 'install' ? 'installed' : action === 'update' ? 'updated' : 'OVERWROTE'} ${name} -> ${dest}`);
}

// Written last so a failed copy does not leave a manifest claiming skills that
// are not there. This is also what a future uninstall reads to remove only what
// we put on the machine.
if (!dryRun) {
  const manifest = {
    installedBy: '@ars-infinita-notion/system-skills',
    installedAt: new Date().toISOString(),
    target,
    skills: plan.map((p) => p.name).sort(),
  };
  fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
}

console.log(
  dryRun
    ? 'dry run complete.'
    : `done. Start a new \`codex\` session; the skills are available by name (e.g. "run /status").`,
);
