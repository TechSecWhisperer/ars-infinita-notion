#!/usr/bin/env node
// install-unified.mjs — one entry point for the desktop CLIs this package supports.
// Detects the Antigravity CLI and the OpenAI Codex CLI and runs each one's installer.
// Cross-client preflight runs before any modifications are made to disk: collisions
// on Codex abort the run before Antigravity is touched. Claude Code installs
// from the marketplace, not from here.
//
// Flags are passed through to the per-client installers (--dry-run, --force).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  DIST_AGY,
  DIST_CODEX,
  PLUGIN_SLUG,
  agyConfigRoot,
  codexHome,
  codexSkillsDir,
  codexManifestPath,
  codexBackupRoot,
} from './lib/paths.mjs';
import { classifyDestination, readManifest } from './lib/install-manifest.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const CLIENTS = {
  agy: { name: 'Antigravity CLI', script: './install-agy.mjs', aliases: ['agy', 'antigravity'] },
  codex: { name: 'Codex CLI', script: './install-codex.mjs', aliases: ['codex'] },
};

const targetIdx = process.argv.indexOf('--target');
const requested = targetIdx !== -1 ? process.argv[targetIdx + 1] : null;

console.log('The System (Player Edition) — Unified Client Installer\n');

let targetsToRun;
if (requested !== null) {
  const match = Object.values(CLIENTS).find((c) => c.aliases.includes(requested));
  if (!match) {
    console.error(`error: unknown --target "${requested ?? ''}". Use one of: agy, antigravity, codex.`);
    process.exit(1);
  }
  targetsToRun = [match];
} else {
  // agy is detected by its own config root, not by a bare ~/.gemini, which other
  // Gemini tools create too.
  targetsToRun = [];
  if (fs.existsSync(path.join(agyConfigRoot()))) targetsToRun.push(CLIENTS.agy);
  if (fs.existsSync(codexHome())) targetsToRun.push(CLIENTS.codex);
}

if (targetsToRun.length === 0) {
  console.log(`No supported CLI environments detected (looked for ${agyConfigRoot()} and ${codexHome()}).`);
  console.log('You can explicitly specify a target:');
  console.log('  npx @ars-infinita-notion/system-skills install --target agy');
  console.log('  npx @ars-infinita-notion/system-skills install --target codex\n');
  console.log('For Claude Code, install from marketplace:');
  console.log('  /plugin marketplace add TechSecWhisperer/ars-infinita-notion');
  console.log('  /plugin install the-system-player@ars-infinita-notion');
  process.exit(0);
}

console.log(`Detected targets: ${targetsToRun.map((t) => t.name).join(', ')}\n`);

const dryRun = process.argv.includes('--dry-run');
const force = process.argv.includes('--force');

// --- Cross-client preflight check -----------------------------------------
for (const target of targetsToRun) {
  if (target.aliases.includes('agy')) {
    const source = path.join(DIST_AGY, PLUGIN_SLUG);
    if (!fs.existsSync(source)) {
      console.error('error: dist/agy is missing — run `npm run build` first.');
      process.exit(1);
    }
    try {
      execFileSync('agy', ['plugin', 'validate', source], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (err) {
      if (err.code !== 'ENOENT') {
        const detail = (err.stderr || err.stdout || err.message || '').toString().trim();
        console.error(`error: agy plugin validate failed during preflight:\n${detail}`);
        process.exit(1);
      }
    }
  }

  if (target.aliases.includes('codex')) {
    if (!fs.existsSync(DIST_CODEX)) {
      console.error('error: dist/codex is missing — run `npm run build` first.');
      process.exit(1);
    }
    if (!force && !dryRun) {
      const skillsDir = codexSkillsDir();
      const manifest = readManifest(codexManifestPath());
      const names = fs
        .readdirSync(DIST_CODEX, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort();
      const collisions = [];
      for (const name of names) {
        const dest = path.join(skillsDir, name);
        if (classifyDestination(dest, name, manifest, skillsDir) === 'collision') {
          collisions.push({ name, dest });
        }
      }
      if (collisions.length > 0) {
        console.error(
          `\nrefusing to install: ${collisions.length} destination${collisions.length === 1 ? '' : 's'} ` +
            'already exist and were not installed by The System.',
        );
        for (const c of collisions) console.error(`  ${c.name} -> ${c.dest}`);
        console.error('\nNothing has been written to any client. All files are untouched. Either:');
        console.error('  - move or rename those directories yourself, then re-run; or');
        console.error('  - re-run with --force, which MOVES them aside (never deletes) to');
        console.error(`    ${codexBackupRoot()}/<timestamp>/ and prints the exact path.`);
        process.exit(1);
      }
    }
  }
}

// --- Execution phase ------------------------------------------------------
const forwardArgs = [];
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === '--target') {
    i++;
    continue;
  }
  if (arg.startsWith('--target=')) {
    continue;
  }
  forwardArgs.push(arg);
}

for (const target of targetsToRun) {
  console.log(`--- Installing for ${target.name} ---`);
  const scriptPath = path.resolve(HERE, target.script);
  try {
    execFileSync(process.execPath, [scriptPath, ...forwardArgs], { stdio: 'inherit' });
  } catch (err) {
    console.error(`\nerror: installation for ${target.name} failed with exit code ${err.status ?? 1}.`);
    process.exit(err.status ?? 1);
  }
  console.log('');
}

console.log('Unified installation complete.');
