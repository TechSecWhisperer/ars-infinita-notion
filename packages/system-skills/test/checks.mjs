#!/usr/bin/env node
// Structural gate for the zero-duplication invariants.
//
//   node test/checks.mjs
//
// No network, no CLIs, no dependencies — unlike test/smoke.mjs (which drives
// the real codex/agy binaries and skips when they are absent), everything here
// runs anywhere and is expected to actually run. It exits non-zero on any FAIL.
//
// Each check has a NAME, because the point of cutting a duplicate is that
// something catches its return. When one of these fires, it is naming the
// second copy that came back.
//
//   shared-reference-build-check — one authored boot card; every skill resolves
//       it; every build-stamped copy is byte-identical to it.
//   release-metadata-check      — plugin.json is the only hand-set version;
//       marketplace.json is generated and carries no duplicate of it; the
//       changelog agrees; the feed is compared but only WARNs.
//   command-catalog-check       — the skills/ directories are the catalog and
//       feed.json's command list is exactly the public subset of them.
//   single-surface-lint         — the specific duplicated instructions removed
//       in this release do not creep back into a SKILL.md.

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

import { renderMarketplace } from '../builder.mjs';
import { AGENT_PROFILES, parseFrontmatter, stripClaudeIdioms } from '../lib/transform.mjs';
import {
  BOOT_CARD_LOCAL_REF,
  BOOT_CARD_PATH,
  BOOT_CARD_REF,
  CHANGELOG_PATH,
  DIST_AGY,
  DIST_CODEX,
  FEED_PATH,
  HIDDEN_SKILLS,
  MANIFEST_PATH,
  MARKETPLACE_PATH,
  PKG_ROOT,
  PLUGIN_SLUG,
  REPO_ROOT,
  SOURCE_PLUGIN_DIR,
  SOURCE_PLUGIN_MANIFEST,
  SOURCE_SKILLS_DIR,
} from '../lib/paths.mjs';

const results = [];
let current = null;

function check(name, fn) {
  current = { name, fails: [], warns: [] };
  results.push(current);
  try {
    fn();
  } catch (err) {
    current.fails.push(`threw: ${err.message}`);
  }
  const { fails, warns } = current;
  const status = fails.length ? 'FAIL' : warns.length ? 'WARN' : 'PASS';
  console.log(`${status} ${name}`);
  for (const w of warns) console.log(`  warn: ${w}`);
  for (const f of fails) console.log(`  fail: ${f}`);
  current = null;
}

const fail = (msg) => current.fails.push(msg);
const warn = (msg) => current.warns.push(msg);
const ok = (cond, msg) => { if (!cond) fail(msg); };
const sha = (buf) => createHash('sha256').update(buf).digest('hex');
const rel = (p) => path.relative(REPO_ROOT, p);
const readJSON = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

function skillNames() {
  return fs
    .readdirSync(SOURCE_SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((n) => fs.existsSync(path.join(SOURCE_SKILLS_DIR, n, 'SKILL.md')))
    .sort();
}

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const names = skillNames();
const distBuilt = fs.existsSync(MANIFEST_PATH);

// ---------------------------------------------------------------------------

check('shared-reference-build-check', () => {
  // 1. Exactly one authored boot card in the whole tracked plugin tree. This is
  //    the check that fails the day someone re-adds a per-skill copy "just for
  //    this one skill" — which is precisely how 27 of them accumulated.
  const authored = walk(SOURCE_PLUGIN_DIR).filter((p) => path.basename(p) === 'boot-card.md');
  ok(
    authored.length === 1,
    `expected exactly 1 authored boot-card.md, found ${authored.length}: ${authored.map(rel).join(', ')}`,
  );
  ok(fs.existsSync(BOOT_CARD_PATH), `the one boot card must live at ${rel(BOOT_CARD_PATH)}`);
  if (!fs.existsSync(BOOT_CARD_PATH)) return;

  const source = fs.readFileSync(BOOT_CARD_PATH, 'utf8');
  const sourceHash = sha(source);

  // 2. Every skill references it, and the reference actually resolves on disk
  //    from that skill's own directory.
  for (const name of names) {
    const skillDir = path.join(SOURCE_SKILLS_DIR, name);
    const body = fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf8');
    if (!body.includes(BOOT_CARD_REF)) {
      fail(`${name}/SKILL.md does not reference the shared boot card (${BOOT_CARD_REF})`);
      continue;
    }
    // ${CLAUDE_SKILL_DIR} is the skill's own directory; resolve the rest of the
    // path relative to it exactly as an agent following the instruction would.
    const resolved = path.resolve(skillDir, BOOT_CARD_REF.replace('${CLAUDE_SKILL_DIR}/', ''));
    if (resolved !== BOOT_CARD_PATH) {
      fail(`${name}: reference resolves to ${rel(resolved)}, not the shared boot card`);
    } else if (!fs.existsSync(resolved)) {
      fail(`${name}: reference resolves to a file that does not exist`);
    }
  }

  // 3. Build-stamped copies. codex and agy install skills as standalone folders
  //    with no shared parent, so those copies are the one sanctioned mirror —
  //    generated only, and byte-identical to the single source after that
  //    target's own text rewrite. A hand-edited copy dies here.
  if (!distBuilt) {
    warn('dist/ not built — run `node builder.mjs` to verify the stamped copies');
    return;
  }
  const targets = [
    ['codex', AGENT_PROFILES.codex, (n) => path.join(DIST_CODEX, n, BOOT_CARD_LOCAL_REF)],
    ['agy', AGENT_PROFILES.agy, (n) =>
      path.join(DIST_AGY, PLUGIN_SLUG, 'skills', n, BOOT_CARD_LOCAL_REF)],
  ];
  let stamped = 0;
  for (const [label, profile, locate] of targets) {
    const expected = stripClaudeIdioms(source, profile);
    const expectedHash = sha(expected);
    if (expectedHash !== sourceHash) {
      warn(
        `${label}: the boot card now contains Claude-specific wording, so its copy is a ` +
          'rewrite of the source rather than a byte copy — intended, but worth knowing',
      );
    }
    for (const name of names) {
      const copy = locate(name);
      if (!fs.existsSync(copy)) {
        fail(`${label}/${name}: no stamped boot card at ${rel(copy)}`);
        continue;
      }
      if (sha(fs.readFileSync(copy, 'utf8')) !== expectedHash) {
        fail(`${label}/${name}: stamped boot card DRIFTED from ${rel(BOOT_CARD_PATH)}`);
      } else {
        stamped += 1;
      }
    }
  }
  ok(
    stamped === names.length * 2,
    `expected ${names.length * 2} identical stamped copies, got ${stamped}`,
  );

  // 4. The built SKILL.md files must point at their local stamped copy, not at
  //    a plugin-root path that does not exist in those layouts.
  for (const [label, , ] of targets) {
    const dir = label === 'codex' ? DIST_CODEX : path.join(DIST_AGY, PLUGIN_SLUG, 'skills');
    for (const name of names) {
      const built = path.join(dir, name, 'SKILL.md');
      if (!fs.existsSync(built)) { fail(`${label}/${name}: no built SKILL.md`); continue; }
      const text = fs.readFileSync(built, 'utf8');
      if (text.includes(BOOT_CARD_REF)) {
        fail(`${label}/${name}: built SKILL.md still carries the Claude-only plugin-root path`);
      }
      if (!text.includes(BOOT_CARD_LOCAL_REF)) {
        fail(`${label}/${name}: built SKILL.md does not reference its stamped boot card`);
      }
    }
  }

  const manifest = readJSON(MANIFEST_PATH);
  ok(
    manifest.bootCard && manifest.bootCard.sha256 === sourceHash,
    'dist/manifest.json bootCard.sha256 does not match the authored boot card — stale build',
  );
});

// ---------------------------------------------------------------------------

check('release-metadata-check', () => {
  const plugin = readJSON(SOURCE_PLUGIN_MANIFEST);

  ok(/^\d+\.\d+\.\d+$/.test(plugin.version || ''), `plugin.json version is not semver: ${plugin.version}`);
  ok(
    (plugin.description || '').length <= 500,
    `plugin.json description is ${(plugin.description || '').length} chars (max 500)`,
  );

  // marketplace.json must be exactly what the builder generates — i.e. it was
  // regenerated and committed, not hand-edited.
  const marketplace = readJSON(MARKETPLACE_PATH);
  const expected = renderMarketplace(plugin, marketplace);
  ok(
    JSON.stringify(marketplace) === JSON.stringify(expected),
    'marketplace.json is not what `node builder.mjs` generates — rebuild and commit it',
  );

  const entry = (marketplace.plugins || []).find((p) => p.name === PLUGIN_SLUG);
  ok(entry, `marketplace.json has no plugin entry named ${PLUGIN_SLUG}`);
  if (entry) {
    ok(
      entry.source === `./plugins/${PLUGIN_SLUG}`,
      `marketplace.json source is ${entry.source}, expected ./plugins/${PLUGIN_SLUG}`,
    );
    // The whole point: no second copy of a fact plugin.json already owns.
    // Claude Code resolves the plugin's own manifest, so a duplicate here
    // never wins — it just disagrees silently, which is how the 1.3.1 release
    // shipped with no update prompt.
    for (const field of ['version', 'description', 'author', 'license']) {
      ok(
        !(field in entry),
        `marketplace.json plugin entry duplicates "${field}" — plugin.json owns it, drop it here`,
      );
    }
  }

  // CHANGELOG is the release history; its newest version heading must be the
  // version we are actually shipping. Hard failure — these are both hand-owned
  // surfaces in this repo and a gap between them means a release was not logged.
  const changelog = fs.readFileSync(CHANGELOG_PATH, 'utf8');
  const heading = /^##\s+v(\d+\.\d+\.\d+)\b/m.exec(changelog);
  ok(heading, 'CHANGELOG.md has no `## vX.Y.Z` heading');
  if (heading) {
    ok(
      heading[1] === plugin.version,
      `CHANGELOG newest entry is v${heading[1]} but plugin.json is ${plugin.version}`,
    );
  }

  // This package is published to npm carrying a prebuilt copy of the skills,
  // so its version is what a codex/agy user actually receives. It must equal
  // the plugin version or the two distribution channels silently ship
  // different content under different numbers — the 2026-08-10 failure with an
  // extra registry involved. Hard failure, same as the CHANGELOG.
  const pkg = readJSON(path.join(PKG_ROOT, 'package.json'));
  ok(
    pkg.version === plugin.version,
    `package.json is ${pkg.version} but plugin.json is ${plugin.version} — the npm ` +
      'package ships the skills, so it may not carry its own version',
  );
  ok(
    Array.isArray(pkg.files) && pkg.files.includes('dist/'),
    'package.json files[] omits dist/ — the tarball would ship installers with nothing to install',
  );
  ok(
    pkg.bin && Object.keys(pkg.bin).length === 1,
    'package.json needs exactly one bin, or `npx @ars-infinita-notion/system-skills <cmd>` stops resolving',
  );

  // The feed is compared but only WARNs. During a release train the Patch Feed
  // legitimately announces a rules change before the build implementing it
  // lands (see MAINTAINERS.md, "Cutting a release") — the warning exists so the
  // gap is a decision rather than an oversight.
  const feed = readJSON(FEED_PATH);
  ok(!('feed_version' in feed), 'feed.json still carries feed_version — it has no consumer, drop it');
  for (const field of ['mechanics_version', 'head']) {
    ok(field in feed, `feed.json is missing "${field}" — the boot card and /doctor name it verbatim`);
    if (feed[field] && feed[field] !== plugin.version) {
      warn(
        `feed.json ${field} is ${feed[field]} but plugin.json is ${plugin.version} — ` +
          'fine mid-release-train, stale otherwise',
      );
    }
  }
  const newestPatch = (feed.patches || [])[feed.patches.length - 1];
  ok(
    newestPatch && newestPatch.version === feed.head,
    'feed.json head does not match the newest patch entry',
  );
});

// ---------------------------------------------------------------------------

check('command-catalog-check', () => {
  for (const name of names) {
    const raw = fs.readFileSync(path.join(SOURCE_SKILLS_DIR, name, 'SKILL.md'), 'utf8');
    const { data, hadFrontmatter } = parseFrontmatter(raw);
    ok(hadFrontmatter, `${name}/SKILL.md has no YAML frontmatter`);
    ok(data.name === name, `${name}/SKILL.md frontmatter name is "${data.name}"`);
    ok(Boolean(data.description), `${name}/SKILL.md has no description`);
  }

  const publicSkills = names.filter((n) => !HIDDEN_SKILLS.has(n));
  const feed = readJSON(FEED_PATH);
  const feedCommands = [...(feed.commands || [])].map((c) => c.replace(/^\//, '')).sort();
  const missing = publicSkills.filter((n) => !feedCommands.includes(n));
  const extra = feedCommands.filter((n) => !publicSkills.includes(n));
  ok(!missing.length, `feed.json is missing public commands: ${missing.join(', ')}`);
  ok(!extra.length, `feed.json lists commands with no skill: ${extra.join(', ')}`);
  for (const hidden of HIDDEN_SKILLS) {
    ok(
      !feedCommands.includes(hidden),
      `/${hidden} is a hidden route but is published in feed.json`,
    );
  }
});

// ---------------------------------------------------------------------------

check('single-surface-lint', () => {
  // Regression guards for the duplicate write-paths cut in this release. Each
  // one is a literal that only ever appeared in the instruction being removed.
  const offenders = [];
  for (const name of names) {
    const p = path.join(SOURCE_SKILLS_DIR, name, 'SKILL.md');
    const text = fs.readFileSync(p, 'utf8');
    if (text.includes('`Type: Follow-up Due`')) {
      offenders.push(
        `${name}: writes a Follow-up Due row to 📅 System Calendar — Next Action Due lives on ` +
          'the Quest Board only, surfaced by its native 📆 Next Actions view',
      );
    }
    if (/Petition form/i.test(text)) {
      offenders.push(`${name}: still routes to the Notion Petition form — /petition files a GitHub Issue`);
    }
  }
  for (const o of offenders) fail(o);

  // /petition must actually carry the route it claims.
  const petition = fs.readFileSync(path.join(SOURCE_SKILLS_DIR, 'petition', 'SKILL.md'), 'utf8');
  ok(petition.includes('gh issue create'), '/petition does not call `gh issue create`');
  ok(
    petition.includes('TechSecWhisperer/ars-infinita-notion'),
    '/petition does not name the repo it files against',
  );
  ok(
    petition.includes('https://github.com/TechSecWhisperer/ars-infinita-notion/issues/new'),
    '/petition has no manual-URL fallback for sessions without `gh`',
  );

  // The feed mirror is a plain HTTPS read. Nothing may re-gate it on a browser.
  for (const name of ['doctor', 'vitals']) {
    const text = fs.readFileSync(path.join(SOURCE_SKILLS_DIR, name, 'SKILL.md'), 'utf8');
    if (/feed\.json[^.]{0,200}?(needs a browser|browser-gated)/is.test(text)) {
      fail(`/${name} still describes the feed.json mirror as browser-gated`);
    }
    ok(
      text.includes('raw.githubusercontent.com'),
      `/${name} does not give the raw feed URL any agent can fetch`,
    );
  }
});

// ---------------------------------------------------------------------------

const failed = results.filter((r) => r.fails.length);
const warned = results.filter((r) => !r.fails.length && r.warns.length);
console.log(
  `\n${results.length - failed.length} passed (${warned.length} with warnings), ${failed.length} failed`,
);
if (failed.length) process.exit(1);
