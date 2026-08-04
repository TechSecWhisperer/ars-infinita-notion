// Shared path helpers. Node stdlib only.
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PKG_ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
export const REPO_ROOT = path.resolve(PKG_ROOT, '../..');
export const SOURCE_SKILLS_DIR = path.join(
  REPO_ROOT,
  'plugins',
  'the-system-player',
  'skills',
);
export const SOURCE_PLUGIN_MANIFEST = path.join(
  REPO_ROOT,
  'plugins',
  'the-system-player',
  '.claude-plugin',
  'plugin.json',
);

export const DIST_DIR = path.join(PKG_ROOT, 'dist');
export const DIST_CODEX = path.join(DIST_DIR, 'codex');
export const DIST_AGY = path.join(DIST_DIR, 'agy');
export const MANIFEST_PATH = path.join(DIST_DIR, 'manifest.json');
export const EVALS_DIR = path.join(PKG_ROOT, 'evals');

export const PLUGIN_SLUG = 'the-system-player';

// Codex reads user skills from $CODEX_HOME/skills (CODEX_HOME defaults to ~/.codex).
// Verified against the on-disk layout of the bundled skills in ~/.codex/skills/.system/.
export function codexSkillsDir() {
  const home = process.env.CODEX_HOME || path.join(homedir(), '.codex');
  return path.join(home, 'skills');
}

// agy (Antigravity CLI) discovers global customisations under ~/.gemini/config/.
// Plugins live at <root>/plugins/<name>/ with a plugin.json marker and skills/ inside.
// Verified against ~/.gemini/antigravity-cli/builtin/skills/agy-customizations/docs/.
export function agyConfigRoot() {
  const explicit = process.env.AGY_CONFIG_ROOT;
  if (explicit) return explicit;
  return path.join(homedir(), '.gemini', 'config');
}

export function agyPluginsDir() {
  return path.join(agyConfigRoot(), 'plugins');
}
