// Shared path helpers. Node stdlib only.
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PKG_ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
export const REPO_ROOT = path.resolve(PKG_ROOT, '../..');
export const SOURCE_PLUGIN_DIR = path.join(REPO_ROOT, 'plugins', 'the-system-player');
export const SOURCE_SKILLS_DIR = path.join(SOURCE_PLUGIN_DIR, 'skills');
export const SOURCE_PLUGIN_MANIFEST = path.join(
  SOURCE_PLUGIN_DIR,
  '.claude-plugin',
  'plugin.json',
);

// The ONE authored boot card. Every Claude skill reads this exact file via
// `${CLAUDE_SKILL_DIR}/../../references/boot-card.md`; the codex and agy targets
// get a build-stamped copy per skill because those CLIs install skills as
// standalone folders with no shared parent to point at.
export const SHARED_REFERENCES_DIR = path.join(SOURCE_PLUGIN_DIR, 'references');
export const BOOT_CARD_PATH = path.join(SHARED_REFERENCES_DIR, 'boot-card.md');
// The token skills use to reach it, and what each target rewrites it to.
export const BOOT_CARD_REF = '${CLAUDE_SKILL_DIR}/../../references/boot-card.md';
export const BOOT_CARD_LOCAL_REF = 'references/boot-card.md';

// Repo-root release metadata. marketplace.json is GENERATED from plugin.json —
// see builder.mjs. feed.json is the public projection of the Notion Patch Feed.
export const MARKETPLACE_PATH = path.join(REPO_ROOT, '.claude-plugin', 'marketplace.json');
export const FEED_PATH = path.join(REPO_ROOT, 'feed.json');
export const CHANGELOG_PATH = path.join(REPO_ROOT, 'CHANGELOG.md');
// The root README carries a GENERATED block: the curated featured-command
// teaser table, rendered from skill frontmatter by lib/catalog.mjs. Everything
// outside the markers is hand-written.
export const README_PATH = path.join(REPO_ROOT, 'README.md');

// The one deliberately non-public command: it exists as a skill but is kept out
// of the published command list. Anything else missing from feed.json is a bug.
export const HIDDEN_SKILLS = new Set(['handover']);

export const DIST_DIR = path.join(PKG_ROOT, 'dist');
export const DIST_CODEX = path.join(DIST_DIR, 'codex');
export const DIST_AGY = path.join(DIST_DIR, 'agy');
export const MANIFEST_PATH = path.join(DIST_DIR, 'manifest.json');
export const EVALS_DIR = path.join(PKG_ROOT, 'evals');

export const PLUGIN_SLUG = 'the-system-player';

// Codex reads user skills from $CODEX_HOME/skills (CODEX_HOME defaults to ~/.codex).
// Verified against the on-disk layout of the bundled skills in ~/.codex/skills/.system/.
export function codexHome() {
  return process.env.CODEX_HOME || path.join(homedir(), '.codex');
}

export function codexSkillsDir() {
  return path.join(codexHome(), 'skills');
}

// Both of these sit ONE LEVEL ABOVE skills/ on purpose. The manifest is not in
// the directory codex scans because nothing has verified codex ignores a stray
// JSON file there; the backup root is not in it because codex would otherwise
// be free to discover a moved-aside skill as a live one.
export function codexManifestPath() {
  return path.join(codexHome(), '.ars-infinita-install.json');
}

export function codexBackupRoot() {
  return path.join(codexHome(), '.ars-infinita-backup');
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
