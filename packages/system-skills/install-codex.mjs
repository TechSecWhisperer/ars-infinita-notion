#!/usr/bin/env node
// Copies dist/codex/<skill>/ into $CODEX_HOME/skills/<skill>/.
// Verified layout: Codex's own bundled skills live at ~/.codex/skills/.system/<name>/SKILL.md,
// so user skills go one level up at ~/.codex/skills/<name>/SKILL.md.
//
// That target is a namespace THE PLAYER ALSO OWNS, and the 27 names we install
// are ordinary English words (status, log, report, browse, doctor, patch...).
// Up to 1.3.5 this file removed whatever was at each destination before
// copying, which destroyed a player's own same-named skill with no warning and
// exit 0. It no longer removes anything it did not install:
//
//   1. Classify every destination BEFORE the first write.
//   2. Any collision aborts the whole run, naming the paths. A partial install
//      would leave 26 System commands beside one player skill wearing a System
//      name — worse for the player than a clean refusal.
//   3. --force MOVES ASIDE rather than destroys, to a backup outside skills/.
//   4. The manifest is written LAST, so a failed copy cannot leave a manifest
//      claiming skills that are not on disk.

import fs from 'node:fs';
import path from 'node:path';
import {
  DIST_CODEX,
  PKG_ROOT,
  codexBackupRoot,
  codexManifestPath,
  codexSkillsDir,
} from './lib/paths.mjs';
import {
  buildManifest,
  classifyDestination,
  hashSkillDir,
  moveAside,
  readManifest,
  writeManifest,
} from './lib/install-manifest.mjs';

const dryRun = process.argv.includes('--dry-run');
const force = process.argv.includes('--force');

if (!fs.existsSync(DIST_CODEX)) {
  console.error('dist/codex is missing — run `npm run build` first.');
  process.exit(1);
}

const target = codexSkillsDir();
const manifestPath = codexManifestPath();
const names = fs
  .readdirSync(DIST_CODEX, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

let packageVersion = 'unknown';
try {
  packageVersion = JSON.parse(
    fs.readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf8'),
  ).version;
} catch {
  /* keep 'unknown' — the version is bookkeeping, not a precondition */
}

console.log(`installing ${names.length} skills for the Codex CLI`);
console.log(`  from: ${DIST_CODEX}`);
console.log(`  to:   ${target}`);
if (dryRun) console.log('  (dry run — nothing written)');

// --- classify everything first -------------------------------------------

const manifest = readManifest(manifestPath);
const plan = names.map((name) => {
  const dest = path.join(target, name);
  return { name, dest, action: classifyDestination(dest, name, manifest, target) };
});

const collisions = plan.filter((p) => p.action === 'collision');

if (collisions.length && !force) {
  console.error(
    `\nrefusing to install: ${collisions.length} destination${collisions.length === 1 ? '' : 's'} ` +
      'already exist and were not installed by The System.',
  );
  for (const c of collisions) console.error(`  ${c.name} -> ${c.dest}`);
  console.error('\nNothing has been written. Your files are untouched. Either:');
  console.error('  - move or rename those directories yourself, then re-run; or');
  console.error('  - re-run with --force, which MOVES them aside (never deletes) to');
  console.error(`    ${codexBackupRoot()}/<timestamp>/ and prints the exact path.`);
  process.exit(1);
}

if (dryRun) {
  for (const p of plan) {
    const label =
      p.action === 'collision' ? 'would move aside then install' : `would ${p.action}`;
    console.log(`  ${label} ${p.name} -> ${p.dest}`);
  }
  console.log('dry run complete.');
  process.exit(0);
}

// --- write ----------------------------------------------------------------

fs.mkdirSync(target, { recursive: true });

const backupDir = collisions.length
  ? path.join(codexBackupRoot(), new Date().toISOString().replace(/[:.]/g, '-'))
  : null;
const movedAside = [];
const installedSkills = [];

for (const { name, dest, action } of plan) {
  if (action === 'collision') {
    // force is guaranteed here: the non-force path exited above.
    const parked = moveAside(dest, backupDir);
    movedAside.push({ name, parked });
  } else if (action === 'update') {
    // Ours, by manifest entry or by boot-card content. Safe to replace.
    fs.rmSync(dest, { recursive: true, force: true });
  }

  fs.cpSync(path.join(DIST_CODEX, name), dest, { recursive: true });
  installedSkills.push({ name, path: dest, hash: hashSkillDir(dest) });

  const verb =
    action === 'update'
      ? 'updated our own previous install of'
      : action === 'collision'
        ? 'moved aside your own skill, then installed'
        : 'installed';
  console.log(`  ${verb} ${name} -> ${dest}`);
}

writeManifest(
  manifestPath,
  buildManifest({
    target,
    packageVersion,
    installedAt: new Date().toISOString(),
    skills: installedSkills,
  }),
);

if (movedAside.length) {
  console.log(`\n${movedAside.length} of your own skills were moved aside, not deleted:`);
  for (const m of movedAside) console.log(`  ${m.name} -> ${m.parked}`);
  console.log('That directory is yours to keep, restore or remove.');
}

console.log(`\nrecorded what was installed in ${manifestPath}`);
console.log(
  `done. Start a new \`codex\` session; the skills are available by name (e.g. "run /status").`,
);
