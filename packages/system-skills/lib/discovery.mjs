// discovery.mjs — Zero-friction player workspace and database discovery engine.
// Implements the AIN-PX-001 specification: discovers and validates canonical
// Notion pages and databases within the player's workspace root without
// prompting the player for raw UUIDs, seed links, or technical identifiers.

export const CANONICAL_NEXUS_LINKS = {
  feedMirror: 'https://raw.githubusercontent.com/TechSecWhisperer/ars-infinita-notion/main/feed.json',
  publicRepo: 'https://github.com/TechSecWhisperer/ars-infinita-notion',
  patchFeedNotion: 'https://notion.so/Patch-Feed-3a056d8e806b81',
  ruleManifestNotion: 'https://notion.so/Rule-Manifest-3a156d8e806b81',
};

export const CANONICAL_DATABASES = [
  { name: 'Quest Board', key: 'KERNEL:Quest Board', requiredProps: ['Stage', 'Role', 'Company'] },
  { name: 'Hunter Network', key: 'KERNEL:Hunter Network', requiredProps: ['Name', 'Company'] },
  { name: 'Battle Log', key: 'KERNEL:Battle Log', requiredProps: ['Date', 'Stage'] },
  { name: 'Gate Intel', key: 'KERNEL:Gate Intel', requiredProps: ['Company', 'Role'] },
  { name: 'Story Bank', key: 'KERNEL:Story Bank', requiredProps: ['Title', 'Competency'] },
  { name: 'Competency Matrix', key: 'KERNEL:Competency Matrix', requiredProps: ['Competency', 'Target Level'] },
  { name: 'XP Ledger', key: 'KERNEL:XP Ledger', requiredProps: ['Date', 'XP', 'Category', 'Action'] },
  { name: 'Agent Notes', key: 'KERNEL:Agent Notes', requiredProps: ['Note', 'Status'] },
  { name: 'Daily Log', key: 'KERNEL:Daily Log', requiredProps: ['Date'] },
  { name: 'Networking Events', key: 'KERNEL:Networking Events', requiredProps: ['Event Name', 'Date'] },
  { name: 'Achievements', key: 'KERNEL:Achievements', requiredProps: ['Achievement', 'Status'] },
  { name: 'Questions & Feedback Log', key: 'KERNEL:Questions & Feedback Log', requiredProps: ['Question / Item', 'Status'] },
  { name: 'System Calendar', key: 'KERNEL:System Calendar', requiredProps: ['Date', 'Type'] },
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

export function normalizeTitle(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\p{Emoji}\p{Emoji_Component}\p{Extended_Pictographic}]/gu, '')
    .replace(/[^\w\s&]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Evaluates candidate Notion entities against canonical specifications.
 * 
 * Outcome states:
 * - RESOLVED: All required entities found, validated against root and schema.
 * - INCOMPLETE: Candidate list is missing expected entities (indexing delay or uncreated).
 * - UNAUTHORIZED: Root or permission grant missing/inaccessible.
 * - AMBIGUOUS: Multiple conflicting candidates pass validation.
 * - SCHEMA_CONFLICT: Matched title has mismatched property schemas.
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

  const rootId = String(workspaceRoot.id).replaceAll('-', '');
  const rootNormalized = normalizeTitle(workspaceRoot.title || '');

  // Filter candidates that belong to this root or declare this root as parent
  const scopedCandidates = candidates.filter((item) => {
    if (!item) return false;
    const parentId = String(item.parent_id || item.parent?.page_id || item.parent?.workspace_id || '').replaceAll('-', '');
    const parentMatches = !parentId || parentId === rootId;
    return parentMatches;
  });

  const resolved = {};
  const missing = [];
  const conflicts = [];

  // Match databases
  for (const dbSpec of CANONICAL_DATABASES) {
    const specNorm = normalizeTitle(dbSpec.name);
    const matches = scopedCandidates.filter((c) => {
      if (c.object !== 'database' && c.type !== 'database' && c.type !== 'data_source') return false;
      const titleNorm = normalizeTitle(c.title || c.name || '');
      return titleNorm === specNorm || titleNorm.includes(specNorm);
    });

    if (matches.length === 0) {
      missing.push({ entity: dbSpec.name, type: 'database' });
    } else if (matches.length > 1) {
      conflicts.push({ entity: dbSpec.name, type: 'database', issue: 'AMBIGUOUS', candidates: matches.map((m) => m.id) });
    } else {
      const match = matches[0];
      // Schema property validation
      if (dbSpec.requiredProps && match.properties) {
        const propKeys = Object.keys(match.properties).map((k) => k.trim().toLowerCase());
        const missingProps = dbSpec.requiredProps.filter(
          (req) => !propKeys.includes(req.trim().toLowerCase())
        );
        if (missingProps.length > 0) {
          conflicts.push({
            entity: dbSpec.name,
            type: 'database',
            issue: 'SCHEMA_CONFLICT',
            id: match.id,
            missingProps,
          });
          continue;
        }
      }

      resolved[dbSpec.key] = {
        name: dbSpec.name,
        id: match.id,
        data_source_id: match.data_source_id || match.id,
        type: 'database',
      };
    }
  }

  // Match pages
  for (const pageSpec of CANONICAL_PAGES) {
    const specNorm = normalizeTitle(pageSpec.name);
    const matches = scopedCandidates.filter((c) => {
      if (c.object === 'database' || c.type === 'database') return false;
      const titleNorm = normalizeTitle(c.title || c.name || '');
      return titleNorm === specNorm;
    });

    if (matches.length === 0) {
      // The root itself might be the Hub
      if (specNorm === 'hub' && rootNormalized.includes('job search hq')) {
        resolved[pageSpec.key] = {
          name: pageSpec.name,
          id: workspaceRoot.id,
          type: 'page',
        };
      } else {
        missing.push({ entity: pageSpec.name, type: 'page' });
      }
    } else if (matches.length > 1) {
      conflicts.push({ entity: pageSpec.name, type: 'page', issue: 'AMBIGUOUS', candidates: matches.map((m) => m.id) });
    } else {
      resolved[pageSpec.key] = {
        name: pageSpec.name,
        id: matches[0].id,
        type: 'page',
      };
    }
  }

  // Decide outcome
  if (conflicts.some((c) => c.issue === 'SCHEMA_CONFLICT')) {
    return { outcome: 'SCHEMA_CONFLICT', conflicts, resolved, missing };
  }
  if (conflicts.some((c) => c.issue === 'AMBIGUOUS')) {
    return { outcome: 'AMBIGUOUS', conflicts, resolved, missing };
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
  const rows = [
    '| Entity | Data Source ID | Page ID |',
    '| :--- | :--- | :--- |',
  ];

  for (const [key, item] of Object.entries(resolved)) {
    const dsId = item.data_source_id || '-';
    const pageId = item.id || '-';
    rows.push(`| ${key} | \`${dsId}\` | \`${pageId}\` |`);
  }

  return rows.join('\n');
}
