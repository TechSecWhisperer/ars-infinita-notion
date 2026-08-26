#!/usr/bin/env node
// resume_library — one canonical source for /armor's resume guidance.
//
//   node tools/resume_library.mjs build      # regenerate RESUME-LIBRARY.md
//   node tools/resume_library.mjs check      # verify the generated copy is in sync
//   node tools/resume_library.mjs sources    # check the upstream pages for drift
//   node tools/resume_library.mjs sections   # list section ids + aliases (lookup aid)
//
// WHY THIS EXISTS — and why it is a generator rather than two documents.
//
// This repository already carries five open issues labelled `zero-duplication`,
// and #20 names the exact shape of the problem: `template-schemas.md` is a
// hand-maintained mirror of a live source, so the two drift and nothing
// notices. Authoring a JSON library AND a markdown guide by hand would have
// reproduced that defect on a new surface, in the same week Will filed the
// issue about it.
//
// So there is one authored file — `resume-library.json` — and the markdown is
// a render of it. `check` is what makes that claim enforceable rather than
// aspirational: it regenerates in memory and compares, so a hand-edit of the
// generated file goes red instead of silently becoming a second source.
//
// The `sources` subcommand is the other half of the same principle applied
// upstream. The guidance was commissioned from a specific external page; that
// page can change without telling anyone. `sources` fetches each cited URL,
// normalises it to text, and compares a hash against the snapshot recorded in
// the library.
//
// HONEST FAILURE IS THE POINT OF `sources`. A drift probe that cannot reach
// the network and reports "no drift" is worse than no probe, because it
// manufactures confidence. Every outcome here is distinct and named:
// UNREACHABLE is not OK, and NEVER-READ is not UNCHANGED. Exit codes follow
// the same rule.

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REF_DIR = path.join(
  REPO_ROOT,
  'plugins/the-system-player/skills/armor/references',
);
const JSON_PATH = path.join(REF_DIR, 'resume-library.json');
const MD_PATH = path.join(REF_DIR, 'RESUME-LIBRARY.md');

const sha256 = (s) => createHash('sha256').update(s).digest('hex');
const readLib = () => JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

// ---------------------------------------------------------------------------
// render

const GENERATED_BANNER = [
  '<!-- GENERATED FILE — DO NOT EDIT BY HAND.',
  '     Source:    plugins/the-system-player/skills/armor/references/resume-library.json',
  '     Regenerate: node tools/resume_library.mjs build',
  '     Verify:     node tools/resume_library.mjs check',
  '     A hand-edit here is overwritten by the next build and fails `check`. -->',
].join('\n');

/** Provenance marker rendered next to a rule. Silent for general practice. */
function tag(rule) {
  if (rule.p === 'V') return ` _(verified: ${rule.src})_`;
  if (rule.p === 'S') return ` _(unverified — attributed to ${rule.src}, source page not read)_`;
  return '';
}

function renderRules(rules) {
  return rules.map((r) => `- ${r.t}${tag(r)}`).join('\n');
}

function render(lib) {
  const out = [];
  const push = (...lines) => out.push(...lines, '');

  push(GENERATED_BANNER);
  push('# Resume Library');
  push(
    `Canonical guidance for \`/armor\`. Library version **${lib.libraryVersion}**.`,
    '',
    lib.summary,
  );

  // --- provenance -----------------------------------------------------------
  push('## How to read the provenance tags');
  push(
    Object.entries(lib.provenance.legend)
      .map(([k, v]) => `- **${k}** — ${v}`)
      .join('\n'),
  );
  push(`> ${lib.provenance.rule}`);
  push(`> **Authoring note.** ${lib.provenance.authoringNote}`);

  // --- sources --------------------------------------------------------------
  push('## Sources');
  push('| Source | Role | Last read | Status |', '|---|---|---|---|');
  out.pop();
  out.push(
    lib.sources
      .map(
        (s) =>
          `| [${s.label}](${s.url}) | ${s.role} | ${s.lastRead ?? '—'} | \`${s.lastReadStatus}\` |`,
      )
      .join('\n'),
    '',
  );
  push('Run `node tools/resume_library.mjs sources` to check these for drift.');

  // --- standards ------------------------------------------------------------
  push('## Formatting standards');
  push(renderRules(lib.standards.formatting));

  push('## Writing bullets');
  push(renderRules(lib.standards.bullets));

  push('## Applicant-tracking (ATS) rules');
  push(renderRules(lib.standards.ats));

  push('## Action verbs');
  push(`${lib.standards.actionVerbs.note}${tag(lib.standards.actionVerbs)}`);
  push(
    Object.entries(lib.standards.actionVerbs.groups)
      .map(([g, verbs]) => `- **${g}:** ${verbs.join(', ')}`)
      .join('\n'),
  );

  // --- sections -------------------------------------------------------------
  push('## Section library');
  push(
    'Every section below is an addressable feature. Refer to one by its **id** or any',
    'of its aliases — "move skills above experience", "drop the interests bit",',
    '"add work rights" all resolve through this table.',
  );
  push('| id | Section | Core | Movable | Also called |', '|---|---|---|---|---|');
  out.pop();
  out.push(
    lib.sections
      .map(
        (s) =>
          `| \`${s.id}\` | ${s.label} | ${s.core ? 'yes' : 'no'} | ${s.movable ? 'yes' : 'no'} | ${s.aliases.join(', ')} |`,
      )
      .join('\n'),
    '',
  );

  for (const s of lib.sections) {
    push(`### \`${s.id}\` — ${s.label}`);
    push(`**Purpose.** ${s.purpose}`);
    push(`**Also called:** ${s.aliases.join(', ')}`);
    push(renderRules(s.rules));
  }

  // --- layouts --------------------------------------------------------------
  push('## Layout presets');
  push(
    'A layout is nothing but an ordered list of section ids. Swapping layout',
    'never rewrites content — it reorders the same sections.',
  );
  for (const l of lib.layouts) {
    push(`### \`${l.id}\` — ${l.label}${l.default ? ' _(default)_' : ''}`);
    push(`**When to use.** ${l.whenToUse}`);
    push(`**Order:** ${l.order.map((id) => `\`${id}\``).join(' → ')}`);
  }

  // --- regions --------------------------------------------------------------
  push('## Regional conventions');
  push(
    'Resume convention is not universal, and applying one market\'s rules to',
    'another is a common and costly error in both directions — a photo that voids',
    'a US application, a missing consent clause that voids a Polish one.',
  );
  for (const r of lib.regions) {
    push(`### \`${r.id}\` — ${r.label}`);
    push(`**Countries:** ${r.countries.join(', ')}`);
    const facts = [
      `- **Document is called:** ${r.docName}`,
      `- **Length:** ${r.length}`,
      `- **Spelling:** ${r.spelling}`,
      `- **Dates:** ${r.dateFormat}`,
    ];
    if (r.require.length) {
      facts.push(`- **Requires:** ${r.require.map((x) => `\`${x}\``).join(', ')}`);
    }
    if (r.omit.length) {
      facts.push(`- **Omit:** ${r.omit.map((x) => `\`${x}\``).join(', ')}`);
    }
    push(facts.join('\n'));
    if (Object.keys(r.notes).length) {
      push(
        Object.entries(r.notes)
          .map(([id, note]) => `- \`${id}\` — ${note}`)
          .join('\n'),
      );
    }
    for (const w of r.warnings) push(`> ⚠️ ${w}`);
  }

  return `${out.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}

// ---------------------------------------------------------------------------
// validate — structural invariants the render would otherwise hide

function validate(lib) {
  const fails = [];
  const ids = new Set(lib.sections.map((s) => s.id));

  if (ids.size !== lib.sections.length) fails.push('duplicate section id');

  // An alias must resolve to exactly one section, or "move my skills up" is
  // ambiguous at the point of use. A section repeating its own id in its alias
  // list is redundant, not ambiguous — it still resolves to one section — so it
  // is allowed and deduped here rather than failed.
  const seenAlias = new Map();
  for (const s of lib.sections) {
    for (const a of new Set([s.id, ...s.aliases].map((x) => x.toLowerCase()))) {
      const owner = seenAlias.get(a);
      if (owner && owner !== s.id) {
        fails.push(`alias "${a}" is claimed by both ${owner} and ${s.id} — ambiguous at lookup`);
      }
      seenAlias.set(a, s.id);
    }
  }

  for (const l of lib.layouts) {
    for (const id of l.order) {
      if (!ids.has(id)) fails.push(`layout ${l.id} orders unknown section "${id}"`);
    }
    if (l.order[0] !== 'header') fails.push(`layout ${l.id} does not start with header`);
    if (new Set(l.order).size !== l.order.length) {
      fails.push(`layout ${l.id} lists a section twice`);
    }
  }
  const defaults = lib.layouts.filter((l) => l.default);
  if (defaults.length !== 1) fails.push(`expected exactly 1 default layout, found ${defaults.length}`);

  for (const r of lib.regions) {
    for (const id of [...r.require, ...r.omit, ...Object.keys(r.notes)]) {
      if (!ids.has(id)) fails.push(`region ${r.id} references unknown section "${id}"`);
    }
    for (const id of r.require) {
      if (r.omit.includes(id)) fails.push(`region ${r.id} both requires and omits "${id}"`);
    }
  }

  const srcIds = new Set(lib.sources.map((s) => s.id));
  const walk = (rules) => {
    for (const r of rules ?? []) {
      if (r.p === 'V' || r.p === 'S') {
        if (!r.src) fails.push(`rule tagged ${r.p} with no src: "${r.t.slice(0, 50)}…"`);
        else if (!srcIds.has(r.src)) fails.push(`rule cites unknown source "${r.src}"`);
      }
      if (r.p === 'V') {
        const src = lib.sources.find((s) => s.id === r.src);
        if (src && src.lastReadStatus === 'never-read') {
          fails.push(
            `rule claims V (verified) against "${r.src}", but that source has never been read. ` +
              'A verified tag on an unread source is exactly the provenance failure this repo gates against.',
          );
        }
      }
    }
  };
  walk(lib.standards.formatting);
  walk(lib.standards.bullets);
  walk(lib.standards.ats);
  walk([lib.standards.actionVerbs]);
  for (const s of lib.sections) walk(s.rules);

  return fails;
}

// ---------------------------------------------------------------------------
// upstream drift

/** Strip markup and collapse whitespace so cosmetic churn is not "drift". */
function toText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function checkSources({ write }) {
  const lib = readLib();
  const rows = [];
  let unreachable = 0;
  let drifted = 0;

  for (const src of lib.sources) {
    let res;
    try {
      const r = await fetch(src.url, {
        redirect: 'follow',
        headers: { 'user-agent': 'ars-infinita-resume-library/1.0 (+drift-probe)' },
        signal: AbortSignal.timeout(30_000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const text = toText(await r.text());
      // A 200 carrying almost no text is usually an interstitial, a consent
      // wall or a JS-only shell — not the page. Hashing it would record a
      // snapshot of the wall and report "unchanged" forever after. It is its
      // own outcome, though: calling it UNREACHABLE would misreport a reachable
      // host as a network failure and send the reader looking in the wrong place.
      if (text.length < 500) {
        unreachable += 1;
        rows.push({
          src,
          state: 'SHORT-BODY',
          detail: `HTTP 200 but only ${text.length} chars of text — interstitial or JS-only shell, not the page`,
        });
        continue;
      }
      res = { state: null, hash: sha256(text), chars: text.length };
    } catch (e) {
      unreachable += 1;
      rows.push({ src, state: 'UNREACHABLE', detail: String(e.message || e) });
      continue;
    }

    if (src.lastReadStatus === 'never-read' || !src.contentSha256) {
      res.state = 'FIRST-READ';
    } else if (src.contentSha256 === res.hash) {
      res.state = 'UNCHANGED';
    } else {
      res.state = 'DRIFTED';
      drifted += 1;
    }
    rows.push({ src, state: res.state, detail: `${res.chars} chars, sha ${res.hash.slice(0, 12)}…`, hash: res.hash });

    if (write && res.state !== 'UNCHANGED') {
      src.contentSha256 = res.hash;
      src.lastRead = new Date().toISOString();
      src.lastReadStatus = 'read';
    }
  }

  for (const r of rows) {
    console.log(`${r.state.padEnd(11)} ${r.src.id} — ${r.detail}`);
    console.log(`            ${r.src.url}`);
  }

  if (write && rows.some((r) => r.state !== 'UNREACHABLE')) {
    fs.writeFileSync(JSON_PATH, `${JSON.stringify(lib, null, 2)}\n`);
    console.log('\nSnapshots recorded in resume-library.json. Re-run `build` to regenerate the markdown.');
  }

  console.log('');
  if (unreachable === rows.length) {
    console.error(
      `NOT CHECKED — all ${rows.length} sources unreachable from this environment.\n` +
        'This is NOT a clean result. Nothing was compared, so nothing is known about\n' +
        'upstream drift. Re-run from an environment with outbound network access.',
    );
    process.exit(2);
  }
  if (unreachable) {
    console.error(`PARTIAL — ${unreachable} of ${rows.length} sources unreachable; those are unknown, not clean.`);
  }
  if (drifted) {
    console.error(
      `DRIFT — ${drifted} source(s) changed since the recorded snapshot.\n` +
        'Read the changed page and reconcile resume-library.json against it, then\n' +
        're-run with --write to record the new snapshot. Do NOT --write first:\n' +
        'that discards the evidence that anything moved.',
    );
    process.exit(1);
  }
  console.log(`OK — ${rows.length - unreachable} source(s) checked, no drift.`);
}

// ---------------------------------------------------------------------------

const cmd = process.argv[2] ?? 'check';
const lib = readLib();

if (cmd === 'sections') {
  for (const s of lib.sections) {
    console.log(`${s.id.padEnd(20)} ${s.label}`);
    console.log(`${' '.repeat(20)} aka: ${s.aliases.join(', ')}`);
  }
  console.log(`\n${lib.sections.length} sections, ${lib.layouts.length} layouts, ${lib.regions.length} regions.`);
  process.exit(0);
}

if (cmd === 'sources') {
  await checkSources({ write: process.argv.includes('--write') });
  process.exit(0);
}

const fails = validate(lib);
if (fails.length) {
  console.error(`resume-library.json is not internally consistent:\n`);
  for (const f of fails) console.error(`  - ${f}`);
  process.exit(1);
}

const rendered = render(lib);

if (cmd === 'build') {
  fs.writeFileSync(MD_PATH, rendered);
  console.log(
    `built RESUME-LIBRARY.md — ${lib.sections.length} sections, ` +
      `${lib.layouts.length} layouts, ${lib.regions.length} regions, ${rendered.length} bytes`,
  );
  process.exit(0);
}

if (cmd === 'check') {
  if (!fs.existsSync(MD_PATH)) {
    console.error('RESUME-LIBRARY.md is missing. Run: node tools/resume_library.mjs build');
    process.exit(1);
  }
  const onDisk = fs.readFileSync(MD_PATH, 'utf8');
  if (onDisk !== rendered) {
    console.error(
      'RESUME-LIBRARY.md is out of sync with resume-library.json.\n' +
        `  on disk:  ${onDisk.length} bytes, sha ${sha256(onDisk).slice(0, 12)}…\n` +
        `  expected: ${rendered.length} bytes, sha ${sha256(rendered).slice(0, 12)}…\n` +
        'Either the markdown was hand-edited (move the change into the JSON) or the\n' +
        'JSON changed without a rebuild. Run: node tools/resume_library.mjs build',
    );
    process.exit(1);
  }
  console.log(`resume-library OK — ${lib.sections.length} sections, generated copy in sync.`);
  process.exit(0);
}

console.error(`unknown command "${cmd}". Use: build | check | sources | sections`);
process.exit(1);
