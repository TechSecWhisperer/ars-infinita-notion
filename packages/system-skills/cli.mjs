#!/usr/bin/env node
// The published entry point. One bin, so `npx @ars-infinita-notion/system-skills
// install-codex` runs this with the subcommand as an argument.
//
//   npx @ars-infinita-notion/system-skills install-codex [--dry-run]
//   npx @ars-infinita-notion/system-skills install-agy   [--dry-run]
//
// Claude Code is deliberately NOT a target here. It installs the native
// plugin from the marketplace, and giving it a second install path would
// mean two ways to get the same skills onto one machine, able to disagree.
// See the README.
//
// The installers are imported for their top-level effect rather than spawned:
// same process, so --dry-run and the exit code pass through untouched.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const TARGETS = {
  'install-codex': './install-codex.mjs',
  'install-agy': './install-agy.mjs',
};

function usage(problem) {
  if (problem) console.error(`error: ${problem}\n`);
  console.log('The System (Player Edition) — skills for the Codex and Antigravity CLIs\n');
  console.log('Before you install, two prerequisites:');
  console.log('  1. A paid AI agent subscription — any agent; The System works your');
  console.log('     account daily, so it needs a tier that permits that.');
  console.log('  2. Confirm your agent can run routines (scheduled, unattended tasks).');
  console.log('     A paid plan does NOT guarantee this. Without it The System still');
  console.log('     works — you ask for your daily briefing instead of it arriving.');
  console.log('  Notion\'s free plan is all you need; nothing here requires paid Notion.\n');
  console.log('Usage:');
  console.log('  npx @ars-infinita-notion/system-skills install-codex [--dry-run]');
  console.log('  npx @ars-infinita-notion/system-skills install-agy   [--dry-run]\n');
  console.log('Claude Code users: install the native plugin instead —');
  console.log('  /plugin marketplace add TechSecWhisperer/ars-infinita-notion');
  console.log('  /plugin install the-system-player@ars-infinita-notion\n');
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
if (!fs.existsSync(path.join(HERE, 'dist'))) {
  console.error('error: dist/ is missing from this package.');
  console.error('  A published copy ships prebuilt. From a source checkout, run:');
  console.error('    node builder.mjs');
  process.exit(1);
}

await import(TARGETS[command]);
