// The command catalog is derived, never hand-written.
//
// Issue #19 ruled (Will, 2026-08-12): the skill directories are the catalog, and
// curation is just data — so the README's curated teaser table is generated from
// a per-skill marker in the skill's own frontmatter rather than maintained as a
// seventh copy of the command list.
//
// `featured` carries a RANK (1, 2, 3, …), not a boolean. The ruling says
// `featured: true`, but the same ruling is explicit that the teaser is curated
// and "not a prefix of the full list" — and a boolean cannot express order, so
// generating from one would have to fall back to alphabetical and would rewrite
// player-facing copy as a side effect of a tooling change. A rank keeps the
// curated order the ruling wants to preserve. Disclosed for veto; reverting to a
// boolean means dropping the sort and accepting the reordering.
//
// `tagline` is the teaser cell. It is deliberately NOT the frontmatter
// `description`: that field is agent trigger text ("use when the player says …")
// and is written for a model, not a reader.
//
// Node stdlib only, in keeping with the rest of lib/.
import fs from 'node:fs';
import path from 'node:path';

import { parseFrontmatter } from './transform.mjs';
import { HIDDEN_SKILLS, SOURCE_SKILLS_DIR } from './paths.mjs';

// The guard on the teaser's size. An exact-10 check was rejected in the ruling
// as arbitrary rigidity; the range still catches the failure that matters — a
// teaser quietly collapsing to three rows.
export const FEATURED_MIN = 8;
export const FEATURED_MAX = 12;

// Markers in README.md. The generator owns everything between them.
export const TEASER_BEGIN = '<!-- BEGIN generated: featured-commands -->';
export const TEASER_END = '<!-- END generated: featured-commands -->';

function skillDirs() {
  return fs
    .readdirSync(SOURCE_SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((n) => fs.existsSync(path.join(SOURCE_SKILLS_DIR, n, 'SKILL.md')))
    .sort();
}

/**
 * Every skill carrying a `featured` rank, in rank order.
 * Returns `{ name, rank, tagline }`. Malformed entries are returned as-is so
 * the caller (checks.mjs) can report them rather than silently dropping a row.
 */
export function featuredSkills() {
  const out = [];
  for (const name of skillDirs()) {
    const raw = fs.readFileSync(path.join(SOURCE_SKILLS_DIR, name, 'SKILL.md'), 'utf8');
    const { data } = parseFrontmatter(raw);
    if (data.featured === undefined) continue;
    const rank = Number(data.featured);
    out.push({
      name,
      rank: Number.isInteger(rank) ? rank : NaN,
      tagline: data.tagline ?? '',
      hidden: HIDDEN_SKILLS.has(name),
    });
  }
  out.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
  return out;
}

/** The teaser table exactly as it must appear in README.md, no trailing newline. */
export function renderTeaserTable(skills = featuredSkills()) {
  const rows = skills.map((s) => `| \`/${s.name}\` | ${s.tagline} |`);
  return ['| Command | What it does |', '|---|---|', ...rows].join('\n');
}

/**
 * Replace the marked block in `readme` with the freshly rendered table.
 * Throws if the markers are absent or out of order — a silent no-op here would
 * mean the generator reports success while the README keeps drifting.
 */
export function renderReadme(readme, table = renderTeaserTable()) {
  const begin = readme.indexOf(TEASER_BEGIN);
  const end = readme.indexOf(TEASER_END);
  if (begin === -1 || end === -1 || end < begin) {
    throw new Error(
      `README.md is missing the featured-commands markers (${TEASER_BEGIN} … ${TEASER_END})`,
    );
  }
  const head = readme.slice(0, begin + TEASER_BEGIN.length);
  const tail = readme.slice(end);
  return `${head}\n${table}\n${tail}`;
}
