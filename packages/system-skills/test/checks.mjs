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
//       marketplace.json's generated half is generated and its authored half is
//       pinned; the changelog agrees; every feed comparison is decidable and
//       hard-fails. This battery emits no advisory-only output: a warning does
//       not affect the exit code, so a check that only warns is a check that
//       cannot stop anything, and a check that reports success without running
//       is worse still — an unbuilt dist/ now fails rather than warns.
//   command-catalog-check       — the skills/ directories are the catalog and
//       feed.json's command list is exactly the public subset of them.
//   single-surface-lint         — the specific duplicated instructions removed
//       in this release do not creep back into a SKILL.md.
//   codex-install-guard         — install-codex never destroys a directory it
//       did not install. Behavioural, not structural: it runs the real
//       installer against a sandboxed CODEX_HOME. It lives here rather than in
//       smoke.mjs so `prepublishOnly` runs it and no workflow edit can skip it.
//   resume-library-check        — /armor's RESUME-LIBRARY.md is generated from
//       resume-library.json and stays that way. Without this, "generated" is a
//       comment in a header rather than a property: the markdown could be
//       hand-edited into a second, disagreeing source and nothing would notice
//       — which is the defect issue #20 describes on another surface.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

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
  // HARD FAIL, not a warning. This used to warn and return, which meant a tree
  // with no dist/ printed "passed" while verifying zero stamped copies. Every
  // legitimate caller builds first — prepublishOnly, gate_audit, both install
  // scripts, and now `npm test` — so an unbuilt dist here means the caller is
  // wrong, not that the check is inapplicable.
  if (!distBuilt) {
    fail('dist/ is not built — run `node builder.mjs`. This check cannot verify anything without it.');
    return;
  }
  const targets = [
    ['codex', AGENT_PROFILES.codex, (n) => path.join(DIST_CODEX, n, BOOT_CARD_LOCAL_REF)],
    ['agy', AGENT_PROFILES.agy, (n) =>
      path.join(DIST_AGY, PLUGIN_SLUG, 'skills', n, BOOT_CARD_LOCAL_REF)],
  ];
  let stamped = 0;
  for (const [label, profile, locate] of targets) {
    // If the boot card contains Claude-specific wording, this target's copy is
    // a rewrite of the source rather than a byte copy. That is intended, and
    // the per-copy assertion below verifies every copy against `expected`
    // either way — so there was nothing here to act on. It used to emit a
    // warning saying so; advisory output in a gate is what this battery now
    // refuses to carry, so the fact lives in this comment instead.
    const expected = stripClaudeIdioms(source, profile);
    const expectedHash = sha(expected);
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

  // marketplace.json: this assertion USED to claim it proved the file "was
  // regenerated and committed, not hand-edited". It proved no such thing.
  //
  // `renderMarketplace(plugin, existing)` opens with `...existing` and then
  // overwrites only `plugins` (builder.mjs). So comparing the file to
  // renderMarketplace(plugin, THE FILE ITSELF) compares four of its five
  // top-level fields against themselves. `name`, `owner`, `description` and
  // `$schema` could be edited to anything at all and this passed.
  //
  // Demonstrated 2026-08-13: rewriting `owner` to a different person left the
  // whole battery green. That matters — `description` is the copy shown on the
  // Claude Code marketplace, and `owner` carries a real email address.
  //
  // Fixed by asserting the two things that ARE derivable, and by narrowing the
  // claim to what is actually verified. `description` stays authored and is
  // called out as unverified rather than silently implied to be checked.
  const marketplace = readJSON(MARKETPLACE_PATH);
  const expected = renderMarketplace(plugin, marketplace);
  ok(
    JSON.stringify(marketplace.plugins) === JSON.stringify(expected.plugins),
    'marketplace.json plugins[] is not what `node builder.mjs` generates — rebuild and commit it',
  );
  // Derivable from the repository this file ships in.
  ok(
    marketplace.name === 'ars-infinita-notion',
    `marketplace.json name is ${JSON.stringify(marketplace.name)}, expected the repository name`,
  );

  // The rest — $schema, owner, description — is genuinely AUTHORED. Nothing
  // derives it, and inventing a derivation would be the check bending reality
  // to have something to assert. (The first draft of this asserted
  // owner.name === plugin.json author. That failed immediately: the manifests
  // read "William Moses" and "William Moses (Game Admin)". Making them equal
  // would have meant editing a public-facing name to satisfy a check written
  // minutes earlier. The divergence is filed for the owner to settle, not
  // normalised here.)
  //
  // What IS decidable is that authored copy cannot change SILENTLY. The subset
  // is pinned by content hash, the same idiom the build already uses for the
  // boot card. Editing any of it is fine — the edit just has to update this
  // pin, which puts the change in the diff where a reviewer sees it.
  const authored = JSON.stringify({
    $schema: marketplace.$schema,
    name: marketplace.name,
    owner: marketplace.owner,
    description: marketplace.description,
  });
  const AUTHORED_PIN = '88e6d4a0ddf3797985fd0ed9befcad8c';
  const authoredHash = createHash('sha256').update(authored).digest('hex').slice(0, 32);
  ok(
    authoredHash === AUTHORED_PIN,
    `marketplace.json authored fields changed (hash ${authoredHash}). This is allowed — update ` +
      `AUTHORED_PIN in test/checks.mjs to ${authoredHash} in the same commit, so the copy shown ` +
      'on the marketplace never moves without a reviewer seeing it.',
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
  // npm normalises bin paths when it builds the manifest it stores in the
  // registry, and says so as a warning mid-publish: `"bin[...]" script name
  // ./cli.mjs was invalid and removed`. The install still works — the tarball
  // keeps what was written — but the published manifest then disagrees with
  // this file, permanently, because a version cannot be republished.
  ok(
    Object.values(pkg.bin ?? {}).every((target) => !target.startsWith('./')),
    'package.json bin[] uses a ./ prefix — npm strips it when publishing, so the registry ' +
      'manifest would not match this file',
  );

  // The feed used to be compared against plugin.version and only WARN on a
  // mismatch, with the text "fine mid-release-train, stale otherwise".
  //
  // That comparison was UNDECIDABLE, by this repo's own documentation. The
  // CHANGELOG preamble states that a delivery-only release moves the plugin
  // version while the mechanics version legitimately stays put — so the two
  // numbers differing is a normal, healthy state, and the warning could not
  // distinguish it from a stale feed. It fired on every healthy delivery
  // release, which is exactly how FOUR consecutive releases walked past it
  // (1.3.2 through 1.3.5, feed head stuck at 1.3.1 the whole way).
  //
  // Two structural problems, either of which is disqualifying in a gate:
  //   1. Warnings do not affect the exit code. Nothing stops on them.
  //   2. The comparison had no correct answer, so no reader could act on it.
  //
  // A check that cannot fail is not a check, and a warning nobody can act on
  // trains every reader to walk past output. Both halves are now decidable
  // comparisons that hard-fail, and the undecidable one is gone rather than
  // downgraded. Nothing in this battery warns; unrunnable checks fail.
  const feed = readJSON(FEED_PATH);
  ok(!('feed_version' in feed), 'feed.json still carries feed_version — it has no consumer, drop it');
  for (const field of ['mechanics_version', 'head']) {
    ok(field in feed, `feed.json is missing "${field}" — the boot card and /doctor name it verbatim`);
  }

  // DECIDABLE 1: the feed's two version fields describe the same thing — the
  // rule-surface version — and the boot card reads both. They must agree.
  ok(
    feed.mechanics_version === feed.head,
    `feed.json mechanics_version (${feed.mechanics_version}) and head (${feed.head}) disagree — ` +
      'both name the rule-surface version and the boot card reads both',
  );

  // DECIDABLE 2: the head must name a patch entry that actually exists. This
  // is what makes the feed internally honest regardless of the release train.
  const newestPatch = (feed.patches || [])[feed.patches.length - 1];
  ok(
    newestPatch && newestPatch.version === feed.head,
    'feed.json head does not match the newest patch entry',
  );

  // DECIDABLE 3: the feed head and the plugin version must be EQUAL.
  //
  // This used to permit a divergence if the changelog declared it, because a
  // delivery-only release moved the plugin version while the mechanics version
  // stayed put. Will ruled on 2026-08-13 that the two series track each other,
  // which removes the divergence rather than documenting it — and removes the
  // failure it caused: a delivery-only release could not move the feed head, so
  // four consecutive releases reached nobody. One number, so shipping anything
  // always moves the head players compare against.
  //
  // No declaration escape hatch. A check that can be satisfied by writing a
  // sentence is satisfied by writing a sentence.
  ok(
    feed.head === plugin.version,
    `feed.json head is ${feed.head} but plugin.json is ${plugin.version}. These track each ` +
      'other (Will, 2026-08-13) — move the feed head, the Patch Feed entry and the Rule ' +
      'Manifest together with the release, or do not cut the release.',
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

check('resume-library-check', () => {
  // Delegates to the generator's own `check`, rather than re-implementing the
  // render here. A second renderer would be a second source of truth about what
  // the first one produces — the exact duplication this battery exists to cut.
  const tool = path.join(REPO_ROOT, 'tools/resume_library.mjs');
  if (!fs.existsSync(tool)) {
    fail('tools/resume_library.mjs is missing — /armor references a library nothing regenerates');
    return;
  }
  try {
    execFileSync(process.execPath, [tool, 'check'], { cwd: REPO_ROOT, stdio: 'pipe' });
  } catch (e) {
    const out = `${e.stdout ?? ''}${e.stderr ?? ''}`.trim();
    fail(`resume library is not self-consistent:\n${out.replace(/^/gm, '      ')}`);
  }

  // The skill must actually point at the generated file. A library nothing
  // reads is documentation, not behaviour.
  const armor = fs.readFileSync(path.join(SOURCE_SKILLS_DIR, 'armor', 'SKILL.md'), 'utf8');
  ok(
    armor.includes('references/RESUME-LIBRARY.md'),
    '/armor does not reference references/RESUME-LIBRARY.md',
  );
});

// ---------------------------------------------------------------------------

// Behavioural. Every assertion below corresponds to a way the pre-1.3.6
// installer destroyed player data, and the whole block was verified by negative
// control: run against that installer, it fails — a guard that passes against
// the bug it was written for is worthless.
check('codex-install-guard', () => {
  // HARD FAIL. This is the guard on a shipped data-loss bug, and it used to
  // warn-and-return when dist/ was absent — so `npm test` on a fresh clone
  // printed "5 passed" while this guard executed nothing at all. A gate that
  // reports success without running is worse than no gate, because the exit
  // code gets quoted as evidence.
  if (!distBuilt) {
    fail('dist/ is not built — run `node builder.mjs`. This guard cannot run without it, and it will not report success without running.');
    return;
  }

  const installer = path.join(PKG_ROOT, 'install-codex.mjs');
  const sandboxRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ars-install-guard-'));
  const NAME = 'status'; // one of ours, and an ordinary word a player would use

  // Runs the real installer with CODEX_HOME redirected. Never throws: the
  // failure cases are as interesting as the success ones.
  const run = (home, args = []) => {
    try {
      const stdout = execFileSync(process.execPath, [installer, ...args], {
        encoding: 'utf8',
        env: { ...process.env, CODEX_HOME: home },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      return { code: 0, stdout, stderr: '' };
    } catch (err) {
      return {
        code: err.status ?? 1,
        stdout: (err.stdout || '').toString(),
        stderr: (err.stderr || '').toString(),
      };
    }
  };

  const home = (label) => {
    const h = path.join(sandboxRoot, label);
    fs.mkdirSync(path.join(h, 'skills'), { recursive: true });
    return h;
  };

  const plantPlayerSkill = (h, name, bootCardBody) => {
    const dir = path.join(h, 'skills', name);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'SKILL.md'), '---\nname: status\n---\nMY OWN unrelated skill\n');
    fs.writeFileSync(path.join(dir, 'my-notes.md'), 'notes the player wrote\n');
    if (bootCardBody !== undefined) {
      fs.mkdirSync(path.join(dir, 'references'), { recursive: true });
      fs.writeFileSync(path.join(dir, 'references', 'boot-card.md'), bootCardBody);
    }
    return dir;
  };

  const survived = (dir) =>
    fs.existsSync(path.join(dir, 'my-notes.md')) &&
    fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8').includes('MY OWN unrelated skill');

  try {
    // 1. A plain collision aborts, says which path, and writes NOTHING.
    {
      const h = home('collision');
      const planted = plantPlayerSkill(h, NAME);
      const r = run(h);
      ok(r.code !== 0, 'collision run exited 0 — it must refuse');
      ok(survived(planted), `collision run destroyed the player's ${NAME} skill`);
      ok(r.stderr.includes(planted), 'collision run did not name the colliding path on stderr');
      const written = fs
        .readdirSync(path.join(h, 'skills'))
        .filter((n) => n !== NAME);
      ok(
        written.length === 0,
        `collision run wrote ${written.length} other skills before aborting — it must abort first`,
      );
      ok(
        !fs.existsSync(path.join(h, '.ars-infinita-install.json')),
        'collision run wrote a manifest despite installing nothing',
      );
    }

    // 2. False-positive regression. The obvious structural fingerprint (has a
    //    SKILL.md and a references/boot-card.md) classified THIS as ours and
    //    overwrote it. The repo documents that layout, so it is not exotic.
    {
      const h = home('lookalike');
      const planted = plantPlayerSkill(h, NAME, '# my own boot card\n');
      const r = run(h);
      ok(r.code !== 0, 'a player skill containing its own references/boot-card.md was not treated as a collision');
      ok(survived(planted), "a player's own references/boot-card.md was mistaken for ours and overwritten");
    }

    // 3. Clean install: manifest lands, lists every skill, sits outside skills/.
    let expectedCount = 0;
    {
      const h = home('clean');
      const r = run(h);
      ok(r.code === 0, `clean install failed: ${r.stderr.trim()}`);
      const manifestPath = path.join(h, '.ars-infinita-install.json');
      ok(fs.existsSync(manifestPath), 'clean install wrote no manifest');
      ok(
        !fs.existsSync(path.join(h, 'skills', '.ars-infinita-install.json')),
        'the manifest was written inside skills/, where codex scans',
      );
      const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expectedCount = fs.readdirSync(DIST_CODEX, { withFileTypes: true }).filter((d) => d.isDirectory()).length;
      ok(m.schemaVersion === 1, `manifest schemaVersion is ${m.schemaVersion}`);
      ok(
        m.skills.length === expectedCount,
        `manifest lists ${m.skills.length} skills, expected ${expectedCount}`,
      );
      ok(
        m.skills.every((s) => s.hash && s.path && s.name),
        'manifest entries are missing name/path/hash — uninstall could not tell edits from originals',
      );

      // 4. Re-running over our own install succeeds.
      const again = run(h);
      ok(again.code === 0, `second install over our own failed: ${again.stderr.trim()}`);

      // 5. Fingerprint-only upgrade: no manifest, but our boot card is there.
      fs.rmSync(manifestPath);
      const upgraded = run(h);
      ok(
        upgraded.code === 0,
        'a pre-manifest install of our own was misread as a collision — legacy installs cannot upgrade',
      );
    }

    // 6. --force moves aside instead of destroying, outside skills/.
    {
      const h = home('force');
      plantPlayerSkill(h, NAME);
      const r = run(h, ['--force']);
      ok(r.code === 0, `--force run failed: ${r.stderr.trim()}`);
      const backupRoot = path.join(h, '.ars-infinita-backup');
      ok(fs.existsSync(backupRoot), '--force did not create a backup root');
      const stamps = fs.readdirSync(backupRoot);
      ok(stamps.length === 1, `--force created ${stamps.length} backup directories, expected 1`);
      const parked = path.join(backupRoot, stamps[0], NAME);
      ok(fs.existsSync(parked), '--force did not park the colliding directory');
      ok(survived(parked), '--force lost the player\'s files instead of moving them');
      ok(
        !path.resolve(parked).startsWith(path.resolve(path.join(h, 'skills')) + path.sep),
        'the --force backup is inside skills/, where codex may discover it as a skill',
      );
      ok(
        fs.existsSync(path.join(h, 'skills', NAME, 'references', 'boot-card.md')),
        '--force moved the player skill aside but did not install ours in its place',
      );
    }

    // 7. --dry-run writes nothing at all.
    {
      const h = home('dry');
      const r = run(h, ['--dry-run']);
      ok(r.code === 0, `--dry-run failed: ${r.stderr.trim()}`);
      ok(
        fs.readdirSync(path.join(h, 'skills')).length === 0,
        '--dry-run wrote into skills/',
      );
      ok(
        !fs.existsSync(path.join(h, '.ars-infinita-install.json')),
        '--dry-run wrote a manifest',
      );
    }
  } finally {
    fs.rmSync(sandboxRoot, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------

const failed = results.filter((r) => r.fails.length);
const warned = results.filter((r) => !r.fails.length && r.warns.length);
console.log(
  `\n${results.length - failed.length} passed (${warned.length} with warnings), ${failed.length} failed`,
);
if (failed.length) process.exit(1);
