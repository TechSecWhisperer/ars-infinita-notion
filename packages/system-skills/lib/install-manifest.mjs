// Install bookkeeping for the shared-namespace targets.
//
// WHY THIS EXISTS. `install-codex` writes 27 skills into `$CODEX_HOME/skills/`,
// a namespace the player also owns. Up to and including 1.3.5 it removed
// whatever sat at each destination before copying, so a player's own skill
// called `status`, `log` or `report` was destroyed with no warning, no prompt,
// no backup and exit 0. The rule that replaces that behaviour is:
//
//   NEVER REMOVE A DIRECTORY THIS INSTALLER DID NOT CREATE.
//
// Which means the installer has to be able to tell three cases apart before it
// writes anything: nothing there (install), our own previous install (update),
// or somebody else's directory (collision). This module is that classifier plus
// the manifest it reads from.
//
// The manifest lives at `$CODEX_HOME/.ars-infinita-install.json` — deliberately
// ONE LEVEL ABOVE `skills/`. "Codex ignores a stray JSON file in its scan
// directory" is an assumption nobody has verified, and the manifest records its
// own `target`, so nothing is lost by not relying on it.
//
// Node stdlib only, like the rest of lib/.

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const MANIFEST_SCHEMA_VERSION = 1;
export const PACKAGE_NAME = '@ars-infinita-notion/system-skills';

// The fingerprint for installs made BEFORE manifests existed. Its only job is
// recognising those, and every one of them is <= 1.3.5 with known boot-card
// content, so a content check is fully determined rather than a guess.
//
// It is deliberately CONTENT-based. The obvious structural fingerprint — "has a
// SKILL.md and a references/boot-card.md" — reintroduces the very bug this
// module exists to fix: that layout is the convention the repo documents and
// ships 27 examples of, so a player imitating it would be classified as our own
// install and silently overwritten. Reproduced, before this was written.
export const BOOT_CARD_SENTINEL = '# The System — shared boot reference (Player Edition)';

// sha256 of every boot card ever shipped by a version that had an installer.
// `install-codex.mjs` first appears at v1.3.3; the file is byte-identical
// across v1.3.3, v1.3.4 and v1.3.5, so the set has one member today. Append,
// never replace: an entry retired here would misread an older install as
// foreign and refuse to upgrade it.
export const KNOWN_BOOT_CARD_HASHES = new Set([
  '5998551fc29910630cbae8f84d2a9ddf5e986eecfa044b96feffedb0306aec2a',
]);

export const BOOT_CARD_RELATIVE = path.join('references', 'boot-card.md');

function walkRelative(dir, prefix = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
  )) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...walkRelative(path.join(dir, entry.name), rel));
    else if (entry.isFile()) out.push(rel);
  }
  return out;
}

// Deterministic content hash of a skill directory: sorted relative paths and
// their bytes, so it is stable across machines and filesystem orderings.
//
// This is what lets a future `uninstall` tell an untouched skill from one the
// player has customised. Without it, uninstall would delete their edits — the
// same data-loss class, one release later.
export function hashSkillDir(dir) {
  const h = createHash('sha256');
  for (const rel of walkRelative(dir)) {
    h.update(rel);
    h.update('\0');
    h.update(fs.readFileSync(path.join(dir, rel)));
    h.update('\0');
  }
  return h.digest('hex');
}

// Does this directory carry OUR boot card? Content match, not layout match.
export function carriesOurBootCard(dir) {
  const bootCard = path.join(dir, BOOT_CARD_RELATIVE);
  let raw;
  try {
    raw = fs.readFileSync(bootCard);
  } catch {
    return false;
  }
  if (KNOWN_BOOT_CARD_HASHES.has(createHash('sha256').update(raw).digest('hex'))) return true;
  // Forward compatibility: a boot card revised after this list was written is
  // still ours if it opens with the sentinel heading. A player's own
  // references/boot-card.md does not.
  return raw.toString('utf8').startsWith(BOOT_CARD_SENTINEL);
}

export function readManifest(manifestPath) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    return null;
  }
  // An unreadable or future-schema manifest is treated as absent rather than
  // trusted. Falling back to the content fingerprint is safe; guessing at a
  // schema we do not understand is not.
  if (!parsed || parsed.schemaVersion !== MANIFEST_SCHEMA_VERSION) return null;
  if (!Array.isArray(parsed.skills)) return null;
  return parsed;
}

// install | update | collision, decided before a single byte is written.
export function classifyDestination(dest, name, manifest, target) {
  if (!fs.existsSync(dest)) return 'install';
  if (!fs.statSync(dest).isDirectory()) return 'collision';

  const claimed =
    manifest &&
    manifest.target === target &&
    manifest.skills.some((s) => s.name === name && s.path === dest);
  if (claimed) return 'update';

  // No manifest entry: either an install from before manifests, or the
  // player's own directory. Only the content fingerprint separates those.
  return carriesOurBootCard(dest) ? 'update' : 'collision';
}

export function buildManifest({ target, packageVersion, skills, installedAt }) {
  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    package: PACKAGE_NAME,
    packageVersion,
    installedAt,
    target,
    skills,
  };
}

// Written LAST, after every copy has landed, so a failed copy can never leave a
// manifest claiming skills that are not on disk.
export function writeManifest(manifestPath, manifest) {
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

// --force does not destroy. It MOVES ASIDE, to a directory outside the scanned
// skills/ tree — put a backup inside skills/ and codex may discover the backup
// as a skill. Rename is atomic on one volume; the cpSync fallback covers the
// cross-device case a symlinked or mounted CODEX_HOME can produce.
export function moveAside(dest, backupDir) {
  fs.mkdirSync(backupDir, { recursive: true });
  const parked = path.join(backupDir, path.basename(dest));
  try {
    fs.renameSync(dest, parked);
  } catch (err) {
    if (err.code !== 'EXDEV') throw err;
    fs.cpSync(dest, parked, { recursive: true });
    fs.rmSync(dest, { recursive: true, force: true });
  }
  return parked;
}
