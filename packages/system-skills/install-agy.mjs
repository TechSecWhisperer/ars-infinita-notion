#!/usr/bin/env node
// Copies dist/agy/the-system-player/ into the agy global customisation root
// (~/.gemini/config/plugins/the-system-player), which is where the Antigravity
// CLI discovers global plugins. Layout verified against the bundled
// agy-customizations docs (plugins/<name>/plugin.json + skills/<name>/SKILL.md).

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { DIST_AGY, PLUGIN_SLUG, agyPluginsDir } from './lib/paths.mjs';

const dryRun = process.argv.includes('--dry-run');
const source = path.join(DIST_AGY, PLUGIN_SLUG);

if (!fs.existsSync(source)) {
  console.error('dist/agy is missing — run `npm run build` first.');
  process.exit(1);
}

// `agy plugin validate <path>` is the CLI's own conformance check. Run it first
// so we never install something agy would reject.
try {
  const out = execFileSync('agy', ['plugin', 'validate', source], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  console.log(`agy plugin validate: ${out.trim() || 'ok'}`);
} catch (err) {
  const detail = (err.stderr || err.stdout || err.message || '').toString().trim();
  if (err.code === 'ENOENT') {
    console.warn('agy not on PATH — skipping `agy plugin validate`.');
  } else {
    console.error(`agy plugin validate failed:\n${detail}`);
    process.exit(1);
  }
}

const target = path.join(agyPluginsDir(), PLUGIN_SLUG);
const skills = fs.existsSync(path.join(source, 'skills'))
  ? fs.readdirSync(path.join(source, 'skills')).sort()
  : [];

console.log(`installing plugin ${PLUGIN_SLUG} (${skills.length} skills) for agy`);
console.log(`  from: ${source}`);
console.log(`  to:   ${target}`);
if (dryRun) {
  console.log('  (dry run — nothing written)');
} else {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const existed = fs.existsSync(target);
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(source, target, { recursive: true });
  console.log(`  ${existed ? 'replaced' : 'installed'} ${skills.length} skills`);
}

// NOT `agy plugin list`. That subcommand enumerates agy's *imported* plugin
// registry, populated by `agy plugin import` / `agy plugin install`. A plugin
// discovered from a standard customisation root — which is exactly what we
// install into, and what agy's own docs say requires no registration — never
// appears there. It reports "No imported plugins" on a perfectly good install,
// so telling a player to check that way sends them chasing a failure that did
// not happen. Verified: files present, `agy plugin validate` [ok] on the
// installed copy, and all 27 skills loading in a live session, while
// `agy plugin list` still said there was nothing.
console.log(
  dryRun
    ? 'dry run complete.'
    : 'done. Skills load on the next `agy` session — verify with:\n' +
      '  agy -p "list your skills"\n' +
      '(`agy plugin list` will NOT show this plugin: it lists imported plugins\n' +
      ' only, and this one is auto-discovered from ~/.gemini/config/.)',
);
