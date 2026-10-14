// discovery.mjs — Zero-friction player workspace and database discovery engine.
// Implements the AIN-PX-001 specification: discovers and validates canonical
// Notion pages and databases within the player's workspace root without
// prompting the player for raw UUIDs or technical identifiers.
//
// Pure evaluator, like player-home-check.mjs: the agent gathers candidates from
// the player's own workspace and passes them in. This module never connects to
// Notion. The authored schema it validates against is
// plugins/the-system-player/skills/awaken/references/template-schemas.md, and
// test/discovery.mjs fails if a required property here is not defined there.

// Only links whose target can be verified. The Notion Patch Feed and Rule
// Manifest pages are NOT listed: their ids live in the player's own duplicated
// workspace, and a constant here would be written into every Kernel.
export const CANONICAL_NEXUS_LINKS = {
  feedMirror: 'https://raw.githubusercontent.com/TechSecWhisperer/ars-infinita-notion/main/feed.json',
  publicRepo: 'https://github.com/TechSecWhisperer/ars-infinita-notion',
};

export const CANONICAL_DATABASES = [
  { name: 'Quest Board', key: 'KERNEL:Quest Board', requiredProps: ['Role', 'Stage', 'Company'] },
  { name: 'Hunter Network', key: 'KERNEL:Hunter Network', requiredProps: ['Name', 'Company'] },
  { name: 'Battle Log', key: 'KERNEL:Battle Log', requiredProps: ['Subject / Summary', 'Date'] },
  { name: 'Gate Intel', key: 'KERNEL:Gate Intel', requiredProps: ['Company', 'Research Status'] },
  { name: 'Story Bank', key: 'KERNEL:Story Bank', requiredProps: ['Story', 'Competencies'] },
  { name: 'Competency Matrix', key: 'KERNEL:Competency Matrix', requiredProps: ['Competency', 'Category'] },
  { name: 'XP Ledger', key: 'KERNEL:XP Ledger', requiredProps: ['Action', 'Date', 'XP', 'Category'] },
  { name: 'Agent Notes', key: 'KERNEL:Agent Notes', requiredProps: ['Note', 'Status'] },
  { name: 'Daily Log', key: 'KERNEL:Daily Log', requiredProps: ['Day', 'Date'] },
  { name: 'Networking Events', key: 'KERNEL:Networking Events', requiredProps: ['Event', 'Date'] },
  { name: 'Achievements', key: 'KERNEL:Achievements', requiredProps: ['Achievement', 'Status'] },
  { name: 'Questions & Feedback Log', key: 'KERNEL:Questions & Feedback Log', requiredProps: ['Entry', 'Status'] },
  { name: 'System Calendar', key: 'KERNEL:System Calendar', requiredProps: ['Name', 'Date', 'Type'] },
];

export const CANONICAL_PAGES = [
  { name: 'Hub', key: 'KERNEL:Hub' },
  { name: 'Operating Manual', key: 'KERNEL:Operating Manual' },
  { name: 'Status Window', key: 'KERNEL:Status Window' },
  { name: 'Guild Hall', key: 'KERNEL:Guild Hall' },
  { name: 'Patch Notes', key: 'KERNEL:Patch Notes' },
  { name: 'Theme Registry', key: 'KERNEL:Theme Registry' },
  { name: 'Kernel', key: 'KERNEL:Kernel' },
];

export function extractEntityTitle(candidate) {
  if (candidate == null) return '';
  if (typeof candidate === 'string') return candidate;
  if (typeof candidate !== 'object') return String(candidate);

  if (typeof candidate.title === 'string' && candidate.title.trim()) {
    return candidate.title;
  }
  if (typeof candidate.name === 'string' && candidate.name.trim()) {
    return candidate.name;
  }
  if (Array.isArray(candidate.title)) {
    const text = candidate.title
      .map((t) => t?.plain_text || t?.text?.content || '')
      .join('')
      .trim();
    if (text) return text;
  }
  if (candidate.properties && typeof candidate.properties === 'object') {
    for (const prop of Object.values(candidate.properties)) {
      if (prop && prop.type === 'title' && Array.isArray(prop.title)) {
        const text = prop.title
          .map((t) => t?.plain_text || t?.text?.content || '')
          .join('')
          .trim();
        if (text) return text;
      }
    }
  }
  return '';
}

export function normalizeTitle(value) {
  const str = typeof value === 'string' ? value : extractEntityTitle(value);
  return str
    // Pictographs and their joiners only. \p{Emoji} is deliberately not used: it
    // includes the digits, '#' and '*', which would corrupt ordinary titles.
    .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '')
    .replace(/[^\p{L}\p{N}\s&]/gu, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

const stripDashes = (value) => String(value ?? '').replaceAll('-', '');

function parentIdOf(item) {
  const p = item.parent;
  return stripDashes(item.parent_id || item.parent_page_id || p?.page_id || p?.database_id || p?.block_id || '');
}

// A candidate belongs to the player's workspace only if its parent chain reaches
// the workspace root. Notion search returns every accessible match, including
// look-alikes elsewhere, so scoping by "parent is the root" is both too strict
// (the template nests six databases under Status Window, Guild Hall and Patch
// Notes) and, when a parent is simply absent, too loose.
function scopeToRoot(rootId, candidates) {
  const inScope = new Set([rootId]);
  const scoped = [];
  let pending = candidates.filter(Boolean);
  let progressed = true;
  while (progressed) {
    progressed = false;
    const next = [];
    for (const item of pending) {
      if (inScope.has(parentIdOf(item))) {
        scoped.push(item);
        inScope.add(stripDashes(item.id));
        progressed = true;
      } else {
        next.push(item);
      }
    }
    pending = next;
  }
  return scoped;
}

/**
 * Evaluates candidate Notion entities against canonical specifications.
 *
 * Outcome states, in the order they take precedence:
 * - UNAUTHORIZED: Root or permission grant missing/inaccessible.
 * - SCHEMA_CONFLICT: Matched title has mismatched property schemas.
 * - AMBIGUOUS: Multiple conflicting candidates pass validation.
 * - UNVERIFIED: A match was found but its properties were not supplied or
 *   its data_source_id is missing. Never treated as resolved.
 * - INCOMPLETE: Candidate list is missing expected entities (indexing delay or uncreated).
 * - RESOLVED: All required entities found, scoped to the root and schema-valid.
 *
 * @param {object} params
 * @param {object} params.workspaceRoot - The root page { id, title }
 * @param {Array<object>} params.candidates - List of raw Notion entities
 * @returns {object} { outcome, resolved, missing, conflicts, instanceTable }
 */
export function evaluateDiscovery({ workspaceRoot, candidates = [] }) {
  if (!workspaceRoot || !workspaceRoot.id) {
    return {
      outcome: 'UNAUTHORIZED',
      detail: 'Workspace root "The System — Job Search HQ" is unreachable or lacks integration grant.',
      instanceTable: null,
    };
  }

  const rootId = stripDashes(workspaceRoot.id);
  const rootNormalized = normalizeTitle(extractEntityTitle(workspaceRoot) || workspaceRoot.title || '');
  const scopedCandidates = scopeToRoot(rootId, candidates);

  const resolved = {};
  const missing = [];
  const conflicts = [];
  const unverified = [];

  for (const dbSpec of CANONICAL_DATABASES) {
    const specNorm = normalizeTitle(dbSpec.name);
    const matches = scopedCandidates.filter((c) => {
      if (c.object !== 'database' && c.type !== 'database' && c.type !== 'data_source') return false;
      const titleNorm = normalizeTitle(extractEntityTitle(c) || c.title || c.name || '');
      return titleNorm === specNorm || titleNorm.includes(specNorm);
    });

    if (matches.length === 0) {
      missing.push({ entity: dbSpec.name, type: 'database' });
    } else if (matches.length > 1) {
      conflicts.push({ entity: dbSpec.name, type: 'database', issue: 'AMBIGUOUS', candidates: matches.map((m) => m.id) });
    } else {
      const match = matches[0];
      if (!match.properties) {
        unverified.push({ entity: dbSpec.name, type: 'database', id: match.id, issue: 'UNFETCHED_PROPERTIES' });
        continue;
      }
      const propKeys = Object.keys(match.properties).map((k) => k.trim().toLowerCase());
      const missingProps = dbSpec.requiredProps.filter((req) => !propKeys.includes(req.trim().toLowerCase()));
      if (missingProps.length > 0) {
        conflicts.push({ entity: dbSpec.name, type: 'database', issue: 'SCHEMA_CONFLICT', id: match.id, missingProps });
        continue;
      }
      if (!match.data_source_id) {
        unverified.push({
          entity: dbSpec.name,
          type: 'database',
          id: match.id,
          issue: 'MISSING_DATA_SOURCE_ID',
        });
        continue;
      }
      resolved[dbSpec.key] = {
        name: dbSpec.name,
        id: match.id,
        data_source_id: match.data_source_id,
        type: 'database',
      };
    }
  }

  for (const pageSpec of CANONICAL_PAGES) {
    const specNorm = normalizeTitle(pageSpec.name);
    const matches = scopedCandidates.filter((c) => {
      if (c.object === 'database' || c.type === 'database' || c.type === 'data_source') return false;
      const titleNorm = normalizeTitle(extractEntityTitle(c) || c.title || c.name || '');
      return titleNorm === specNorm;
    });

    if (matches.length === 0) {
      // The root itself is the Hub
      if (specNorm === 'hub' && rootNormalized.includes('job search hq')) {
        resolved[pageSpec.key] = { name: pageSpec.name, id: workspaceRoot.id, type: 'page' };
      } else {
        missing.push({ entity: pageSpec.name, type: 'page' });
      }
    } else if (matches.length > 1) {
      conflicts.push({ entity: pageSpec.name, type: 'page', issue: 'AMBIGUOUS', candidates: matches.map((m) => m.id) });
    } else {
      resolved[pageSpec.key] = { name: pageSpec.name, id: matches[0].id, type: 'page' };
    }
  }

  if (conflicts.some((c) => c.issue === 'SCHEMA_CONFLICT')) {
    return { outcome: 'SCHEMA_CONFLICT', conflicts, resolved, missing, unverified };
  }
  if (conflicts.some((c) => c.issue === 'AMBIGUOUS')) {
    return { outcome: 'AMBIGUOUS', conflicts, resolved, missing, unverified };
  }
  if (unverified.length > 0) {
    return { outcome: 'UNVERIFIED', unverified, resolved, missing, conflicts };
  }
  if (missing.length > 0) {
    return { outcome: 'INCOMPLETE', missing, resolved, conflicts };
  }

  return {
    outcome: 'RESOLVED',
    resolved,
    nexusLinks: CANONICAL_NEXUS_LINKS,
    instanceTable: buildInstanceTableMarkdown(resolved),
  };
}

/**
 * Builds the canonical markdown table for the 🧬 Kernel instance table block.
 */
export function buildInstanceTableMarkdown(resolved) {
  const sanitize = (val) => String(val ?? '-').replace(/[`|\r\n]/g, '').trim();
  const rows = [
    '| Entity | Data Source ID | Page ID |',
    '| :--- | :--- | :--- |',
  ];

  for (const [key, item] of Object.entries(resolved)) {
    const safeKey = sanitize(key);
    const dsId = sanitize(item.data_source_id);
    const pageId = sanitize(item.id);
    rows.push(`| ${safeKey} | \`${dsId}\` | \`${pageId}\` |`);
  }

  return rows.join('\n');
}
