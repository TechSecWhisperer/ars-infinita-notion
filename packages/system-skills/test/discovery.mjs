#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  evaluateDiscovery,
  normalizeTitle,
  CANONICAL_DATABASES,
  CANONICAL_PAGES,
  buildInstanceTableMarkdown,
} from '../lib/discovery.mjs';

// 1. normalizeTitle
assert.equal(normalizeTitle('⚔️ Quest Board'), 'quest board');
assert.equal(normalizeTitle('📅 System Calendar '), 'system calendar');
assert.equal(normalizeTitle('🧬 Kernel'), 'kernel');

// 2. UNAUTHORIZED on missing workspace root
const unauth = evaluateDiscovery({ workspaceRoot: null, candidates: [] });
assert.equal(unauth.outcome, 'UNAUTHORIZED');

// 3. INCOMPLETE on empty candidates
const incomplete = evaluateDiscovery({
  workspaceRoot: { id: 'root-123', title: 'The System — Job Search HQ' },
  candidates: [],
});
assert.equal(incomplete.outcome, 'INCOMPLETE');
assert.equal(incomplete.missing.length, CANONICAL_DATABASES.length + CANONICAL_PAGES.length - 1); // Hub matches root

// 4. SCHEMA_CONFLICT on missing required property
const schemaConflict = evaluateDiscovery({
  workspaceRoot: { id: 'root-123', title: 'The System — Job Search HQ' },
  candidates: [
    {
      id: 'db-qb-1',
      type: 'database',
      title: '⚔️ Quest Board',
      properties: { Role: {}, Company: {} }, // Missing 'Stage'
      parent_id: 'root-123',
    },
  ],
});
assert.equal(schemaConflict.outcome, 'SCHEMA_CONFLICT');
assert.ok(schemaConflict.conflicts.some((c) => c.issue === 'SCHEMA_CONFLICT' && c.entity === 'Quest Board'));

// 5. RESOLVED when all entities are present and pass validation
const fullCandidates = [
  ...CANONICAL_DATABASES.map((db, idx) => ({
    id: `db-${idx}`,
    type: 'database',
    title: `⚔️ ${db.name}`,
    data_source_id: `ds-${idx}`,
    properties: Object.fromEntries(db.requiredProps.map((p) => [p, {}])),
    parent_id: 'root-123',
  })),
  ...CANONICAL_PAGES.filter((p) => p.name !== 'Hub').map((page, idx) => ({
    id: `page-${idx}`,
    type: 'page',
    title: page.name,
    parent_id: 'root-123',
  })),
];

const resolved = evaluateDiscovery({
  workspaceRoot: { id: 'root-123', title: 'The System — Job Search HQ' },
  candidates: fullCandidates,
});

assert.equal(resolved.outcome, 'RESOLVED');
assert.ok(resolved.instanceTable.includes('| KERNEL:Quest Board |'));
assert.ok(resolved.instanceTable.includes('| KERNEL:Kernel |'));
assert.equal(resolved.nexusLinks.feedMirror, 'https://raw.githubusercontent.com/TechSecWhisperer/ars-infinita-notion/main/feed.json');

console.log('PASS discovery engine fixtures (RESOLVED, INCOMPLETE, UNAUTHORIZED, SCHEMA_CONFLICT)');
