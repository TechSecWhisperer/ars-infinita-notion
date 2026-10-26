#!/usr/bin/env node
// The published entry point. One bin, so `npx @ars-infinita-notion/system-skills
// install-codex` runs this with the subcommand as an argument.
//
//   npx @ars-infinita-notion/system-skills install-codex [--dry-run]
//   npx @ars-infinita-notion/system-skills install-agy   [--dry-run]
//
// Claude Code uses its plugin marketplace route. Codex users can choose the
// repository plugin or this separate standalone-skills fallback. See README.
//
// The installers are imported for their top-level effect rather than spawned:
// same process, so --dry-run and the exit code pass through untouched.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const TARGETS = {
  'install': './install-unified.mjs',
  'install-codex': './install-codex.mjs',
  'install-agy': './install-agy.mjs',
  'home-check': './home-check.mjs',
};

function usage(problem) {
  if (problem) console.error(`error: ${problem}\n`);
  console.log('The System (Player Edition) — skills for the Codex and Antigravity CLIs\n');
  console.log('Requirements:');
  console.log('  - Node.js 18+ for the standalone-skill installer.');
  console.log('  - A supported AI host with Notion MCP access. Host account requirements vary.');
  console.log('  - Scheduled routines are optional; without them, request your briefing manually.');
  console.log('  Notion\'s free plan is enough.\n');
  console.log('Usage:');
  console.log('  npx @ars-infinita-notion/system-skills install       [--target agy|codex] [--dry-run] [--force]');
  console.log('  npx @ars-infinita-notion/system-skills install-codex [--dry-run] [--force]');
  console.log('  npx @ars-infinita-notion/system-skills install-agy   [--dry-run]\n');
  console.log('  npx @ars-infinita-notion/system-skills home-check <evidence.json>');
  console.log('install-codex writes into the shared skills folder, so it stops rather');
  console.log('than overwrite a skill you wrote yourself. --force moves yours aside to');
  console.log('$CODEX_HOME/.ars-infinita-backup/<timestamp>/ instead — never deletes.\n');
  console.log('For Claude Code, Claude desktop, and Codex plugin installation routes, see README.');
  return problem ? 1 : 0;
}

const command = process.argv[2];

if (!command || command === '--help' || command === '-h') {
  process.exit(usage());
}

if (!(command in TARGETS)) {
  process.exit(usage(`unknown command "${command}"`));
}

// A published tarball carries a prebuilt dist/. If it is missing, the package
// was installed from a source tree that has not been built — say which, rather
// than letting the installer report a bare missing-directory error.
if (command !== 'home-check' && !fs.existsSync(path.join(HERE, 'dist'))) {
  console.error('error: dist/ is missing from this package.');
  console.error('  A published copy ships prebuilt. From a source checkout, run:');
  console.error('    node builder.mjs');
  process.exit(1);
}

await import(TARGETS[command]);
