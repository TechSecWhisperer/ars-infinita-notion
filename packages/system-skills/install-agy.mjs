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
  // Removing the whole plugin directory is safe in a way the codex path is not:
  // this location is namespaced to us, so nothing a player owns can be sitting
  // here by accident. Known and accepted behaviour, not an oversight: any edits
  // a player made INSIDE our plugin directory are replaced on update.
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(source, target, { recursive: true });
  console.log(`  ${existed ? 'replaced' : 'installed'} ${skills.length} skills`);
}

// NOT `agy plugin list`. That enumerates only the *imported* registry, which
// `agy plugin import`/`install` populate. Plugins auto-discovered from a
// standard customisation root — which ~/.gemini/config/ is — never appear
// there, so it reports "No imported plugins" on a completely correct install.
// Verified against agy's own validator passing and all 27 skills loading in a
// live session. Telling players to run a check that always looks like failure
// is worse than giving them no check at all.
console.log(
  dryRun
    ? 'dry run complete.'
    : 'done. Skills load on the next `agy` session — verify with `agy -p "list your skills"`.\n' +
        '(Auto-discovered plugins do not show up in `agy plugin list`; that is expected.)',
);
