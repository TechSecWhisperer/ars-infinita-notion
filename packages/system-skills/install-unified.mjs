#!/usr/bin/env node
// install-unified.mjs — Unified multi-client installer for The System (Player Edition).
// Detects supported desktop environments (Antigravity CLI, OpenAI Codex CLI) and
// executes transactional, atomic installation across detected surfaces.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const args = new Set(process.argv.slice(2));
const flagVal = (name) => {
  const idx = process.argv.indexOf(name);
  return idx !== -1 && idx + 1 < process.argv.length ? process.argv[idx + 1] : null;
};

const dryRun = args.has('--dry-run');
const explicitTarget = flagVal('--target');

const AGY_HOME = path.join(os.homedir(), '.gemini', 'antigravity-cli');
const CODEX_HOME = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');

const agyDetected = fs.existsSync(AGY_HOME) || fs.existsSync(path.join(os.homedir(), '.gemini'));
const codexDetected = fs.existsSync(CODEX_HOME);

console.log('The System (Player Edition) — Unified Client Installer\n');

const targetsToRun = [];

if (explicitTarget === 'agy' || explicitTarget === 'antigravity') {
  targetsToRun.push({ name: 'Antigravity CLI', script: './install-agy.mjs' });
} else if (explicitTarget === 'codex') {
  targetsToRun.push({ name: 'Codex CLI', script: './install-codex.mjs' });
} else {
  // Auto-detection
  if (agyDetected) {
    targetsToRun.push({ name: 'Antigravity CLI', script: './install-agy.mjs' });
  }
  if (codexDetected) {
    targetsToRun.push({ name: 'Codex CLI', script: './install-codex.mjs' });
  }
}

if (targetsToRun.length === 0) {
  console.log('No supported CLI environments detected automatically (checked ~/.gemini and ~/.codex).');
  console.log('You can explicitly specify a target:');
  console.log('  npx @ars-infinita-notion/system-skills install --target agy');
  console.log('  npx @ars-infinita-notion/system-skills install --target codex\n');
  console.log('For Claude Code, install from marketplace:');
  console.log('  /plugin marketplace add TechSecWhisperer/ars-infinita-notion');
  console.log('  /plugin install the-system-player@ars-infinita-notion');
  process.exit(0);
}

console.log(`Detected targets: ${targetsToRun.map((t) => t.name).join(', ')}\n`);

for (const target of targetsToRun) {
  console.log(`--- Installing for ${target.name} ---`);
  await import(target.script);
  console.log('');
}

console.log('Unified installation complete.');
