#!/usr/bin/env node
// generate_catalog.mjs — the command catalog is generated, not hand-written.
//
// Closes #19: the enumeration of commands existed in three hand-maintained
// places (docs/COMMANDS.md tables, feed.json's commands array, and the skill
// directories themselves). The directories are the only source that is true.
// This generator reads every SKILL.md's frontmatter (name, description) and
// emits the derived forms.
//
// Usage:
//   node tools/generate_catalog.mjs --write   regenerate docs/COMMANDS.md + feed.json commands array
//   node tools/generate_catalog.mjs --check   exit 1 with a diff if either is stale (used by command-catalog-check)
//
// The section grouping lives in SECTIONS below — that is the one piece of
// curation this file owns. Row descriptions are the FIRST SENTENCE of each
// skill's frontmatter description, verbatim: "in the plugin's own words" is
// enforced mechanically instead of trusted by hand. Handover stays hidden
// (HIDDEN_SKILLS in packages/system-skills/lib/paths.mjs) and is never emitted.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../packages/system-skills/lib/transform.mjs';
import {
  REPO_ROOT,
  SOURCE_SKILLS_DIR,
  FEED_PATH,
  HIDDEN_SKILLS,
} from '../packages/system-skills/lib/paths.mjs';

const WRITE = process.argv.includes('--write');
const CHECK = process.argv.includes('--check');

// Curated grouping for docs/COMMANDS.md. Every public command must appear in
// exactly one section — command-catalog-check (via --check) enforces that too.
const SECTIONS = [
  ['Setting up and keeping it healthy', ['awaken', 'intake', 'vitals', 'doctor', 'patch', 'theme']],
  ['Chasing a role', ['quest', 'appraise', 'scout', 'raid', 'engage', 'report', 'respawn', 'grind']],
  ['Writing things', ['forge', 'armor', 'ghost', 'log']],
  ['People', ['gather', 'recruit', 'touch', 'party']],
  ["When it's too much", ['mercy']],
  ['Progress, and reaching the admin', ['status', 'levelup', 'browse', 'petition']],
];

const COMMANDS_DOC_PATH = path.join(REPO_ROOT, 'docs', 'COMMANDS.md');

function loadSkills() {
  const skills = new Map();
  for (const dir of fs.readdirSync(SOURCE_SKILLS_DIR, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const raw = fs.readFileSync(path.join(SOURCE_SKILLS_DIR, dir.name, 'SKILL.md'), 'utf8');
    const { data, hadFrontmatter } = parseFrontmatter(raw);
    if (!hadFrontmatter || !data.name || !data.description) {
      throw new Error(`${dir.name}/SKILL.md is missing name/description frontmatter`);
    }
    skills.set(data.name, data.description);
  }
  return skills;
}

// First sentence, verbatim from frontmatter: split on ". " but never inside an
// abbreviation we actually use. The source descriptions end their opening
// sentence with ". " or ".\n", so this is exact for every current skill.
function firstSentence(description) {
  const m = /^.*?(?:\.|\!|\?)(?=\s|$)/s.exec(description.trim());
  return (m ? m[0] : description.trim()).trim();
}

function renderCommandsDoc(skills) {
  const lines = [
    '# Command reference',
    '',
    "**[← README](../README.md)** · **[Player's Guide](PLAYERS-GUIDE.md)** · **[Troubleshooting](TROUBLESHOOTING.md)**",
    '',
    `All ${publicCommands(skills).length} commands, in the plugin's own words — **generated** from each skill's frontmatter by \`tools/generate_catalog.mjs\`. Do not hand-edit; run the generator with \`--write\` instead (command-catalog-check fails the build if this file is stale). Type the slash command, or just say what you want in plain language — the System understands both.`,
  ];
  for (const [heading, names] of SECTIONS) {
    lines.push('', `## ${heading}`, '', '| Command | What it does |', '|---|---|');
    for (const name of names) {
      const desc = skills.get(name);
      if (!desc) throw new Error(`SECTIONS lists "/${name}" but no skill directory provides it`);
      lines.push(`| \`/${name}\` | ${firstSentence(desc)} |`);
    }
  }
  lines.push(
    '',
    '---',
    '',
    '*Drafts are drafts. The System never sends anything on your behalf, and never deletes anything — your XP Ledger and Battle Log are append-only.*',
    '',
  );
  return lines.join('\n');
}

function publicCommands(skills) {
  const listed = SECTIONS.flatMap(([, names]) => names);
  const dupes = listed.filter((n, i) => listed.indexOf(n) !== i);
  if (dupes.length) throw new Error(`SECTIONS lists a command twice: ${dupes.join(', ')}`);
  const missing = [...skills.keys()].filter((n) => !HIDDEN_SKILLS.has(n) && !listed.includes(n));
  const extra = listed.filter((n) => HIDDEN_SKILLS.has(n));
  if (missing.length) throw new Error(`public skill(s) missing from SECTIONS: ${missing.join(', ')}`);
  if (extra.length) throw new Error(`hidden skill(s) must not appear in SECTIONS: ${extra.join(', ')}`);
  return listed;
}

// feed.json is regenerated on every patch by /broadcast and the nightly sync;
// this only rewrites the commands array, byte-preserving the rest of the file
// (a full JSON round-trip would reorder escapes in the long _comment string).
function renderFeedCommands(skills) {
  const order = publicCommands(skills);
  return `  "commands": [\n${order.map((n) => `    "/${n}"`).join(',\n')}\n  ]`;
}

function rewriteFeedCommands(feedText, block) {
  const re = /  "commands": \[\n(?:.*\n)*?  \]/;
  if (!re.test(feedText)) throw new Error('feed.json: could not locate the commands array');
  return feedText.replace(re, block);
}

function diffHint(file, before, after) {
  if (before === after) return null;
  return `${file} is stale — run: node tools/generate_catalog.mjs --write`;
}

const skills = loadSkills();
publicCommands(skills); // validates the section map before anything is written

const docBefore = fs.readFileSync(COMMANDS_DOC_PATH, 'utf8');
const docAfter = renderCommandsDoc(skills);
const feedBefore = fs.readFileSync(FEED_PATH, 'utf8');
const feedAfter = rewriteFeedCommands(feedBefore, renderFeedCommands(skills));

const stale = [
  diffHint('docs/COMMANDS.md', docBefore, docAfter),
  diffHint('feed.json (commands array)', feedBefore, feedAfter),
].filter(Boolean);

if (WRITE) {
  fs.writeFileSync(COMMANDS_DOC_PATH, docAfter);
  fs.writeFileSync(FEED_PATH, feedAfter);
  console.log(`generate_catalog: wrote ${skills.size - HIDDEN_SKILLS.size} public commands to docs/COMMANDS.md and feed.json`);
} else if (CHECK && stale.length) {
  console.error('command catalog is stale:');
  for (const s of stale) console.error(`  - ${s}`);
  process.exit(1);
} else {
  console.log(stale.length ? 'stale' : 'catalog up to date');
}
