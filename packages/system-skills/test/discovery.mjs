#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  evaluateDiscovery,
  normalizeTitle,
  extractEntityTitle,
  CANONICAL_DATABASES,
  CANONICAL_PAGES,
  CANONICAL_NEXUS_LINKS,
} from '../lib/discovery.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_DOC = path.resolve(
  HERE,
  '../../../plugins/the-system-player/skills/awaken/references/template-schemas.md',
);
const ROOT = { id: 'root-123', title: 'The System — Job Search HQ' };

// The authored schema is the authority. Everything below that touches a
// property name is derived from it, so the engine cannot drift from the
// template without this file going red.
function parseSchemaDoc() {
  const byName = new Map();
  for (const line of fs.readFileSync(SCHEMA_DOC, 'utf8').split('\n')) {
    const heading = line.match(/^\d+\.\s+\*\*([^*]+)\*\*/);
    if (!heading) continue;
    const props = [...line.matchAll(/"([^"]+)"\s+[A-Z_]{3,}/g)].map((m) => m[1]);
    byName.set(normalizeTitle(heading[1]), props);
  }
  return byName;
}
const schema = parseSchemaDoc();
assert.equal(schema.size, CANONICAL_DATABASES.length, 'schema doc and engine disagree on database count');

// 1. normalizeTitle strips decoration but keeps the characters that make a title unique
assert.equal(normalizeTitle('⚔️ Quest Board'), 'quest board');
assert.equal(normalizeTitle('📅 System Calendar '), 'system calendar');
assert.equal(normalizeTitle('🧬 Kernel'), 'kernel');
assert.equal(normalizeTitle('🗒 Agent Notes'), 'agent notes');
assert.equal(normalizeTitle('2026 Plan'), '2026 plan', 'digits must survive normalisation');
assert.equal(normalizeTitle('Questions & Feedback Log'), 'questions & feedback log');

// 2. Every property the engine requires exists in the authored schema, with a type.
for (const db of CANONICAL_DATABASES) {
  const authored = schema.get(normalizeTitle(db.name));
  assert.ok(authored, `${db.name}: not found in template-schemas.md`);
  for (const prop of db.requiredProps) {
    assert.ok(authored.includes(prop), `${db.name}: requires "${prop}", which template-schemas.md does not define`);
  }
}

// 3. UNAUTHORIZED on missing workspace root
assert.equal(evaluateDiscovery({ workspaceRoot: null, candidates: [] }).outcome, 'UNAUTHORIZED');

// 4. INCOMPLETE on empty candidates (the Hub is the root itself)
const incomplete = evaluateDiscovery({ workspaceRoot: ROOT, candidates: [] });
assert.equal(incomplete.outcome, 'INCOMPLETE');
assert.equal(incomplete.missing.length, CANONICAL_DATABASES.length + CANONICAL_PAGES.length - 1);

// 5. SCHEMA_CONFLICT on a missing required property
const schemaConflict = evaluateDiscovery({
  workspaceRoot: ROOT,
  candidates: [
    { id: 'db-qb-1', type: 'database', title: '⚔️ Quest Board', properties: { Role: {}, Company: {} }, parent_id: 'root-123' },
  ],
});
assert.equal(schemaConflict.outcome, 'SCHEMA_CONFLICT');
assert.ok(schemaConflict.conflicts.some((c) => c.issue === 'SCHEMA_CONFLICT' && c.entity === 'Quest Board'));

// 6. A workspace shaped like the real template resolves. Databases that the template
//    nests under Status Window, Guild Hall and Patch Notes are found through their
//    parents; they are not direct children of the root.
const NESTED_UNDER = {
  'story bank': 'page-status-window',
  'competency matrix': 'page-status-window',
  'xp ledger': 'page-status-window',
  achievements: 'page-status-window',
  'networking events': 'page-guild-hall',
  'questions & feedback log': 'page-patch-notes',
};
const PAGE_IDS = {
  'Status Window': 'page-status-window',
  'Guild Hall': 'page-guild-hall',
  'Patch Notes': 'page-patch-notes',
};
const databases = CANONICAL_DATABASES.map((db, idx) => ({
  id: `db-${idx}`,
  type: 'database',
  title: `⚔️ ${db.name}`,
  data_source_id: `ds-${idx}`,
  properties: Object.fromEntries(schema.get(normalizeTitle(db.name)).map((p) => [p, {}])),
  parent_id: NESTED_UNDER[normalizeTitle(db.name)] ?? 'root-123',
}));
const pages = CANONICAL_PAGES.filter((p) => p.name !== 'Hub').map((page, idx) => ({
  id: PAGE_IDS[page.name] ?? `page-${idx}`,
  type: 'page',
  title: page.name,
  parent_id: 'root-123',
}));

const resolved = evaluateDiscovery({ workspaceRoot: ROOT, candidates: [...databases, ...pages] });
assert.equal(resolved.outcome, 'RESOLVED', JSON.stringify(resolved.conflicts ?? resolved.missing));
assert.ok(resolved.instanceTable.includes('| KERNEL:Quest Board |'));
assert.ok(resolved.instanceTable.includes('| KERNEL:Kernel |'));
assert.equal(
  resolved.nexusLinks.feedMirror,
  'https://raw.githubusercontent.com/TechSecWhisperer/ars-infinita-notion/main/feed.json',
);

// 7. Scope: a look-alike database inside someone else's page, or with no parent at
//    all, is not part of this player's workspace.
const stranger = {
  id: 'db-stranger',
  type: 'database',
  title: 'Quest Board',
  properties: Object.fromEntries(schema.get('quest board').map((p) => [p, {}])),
  parent_id: 'some-other-page',
};
const orphan = { ...stranger, id: 'db-orphan', parent_id: undefined };
const scoped = evaluateDiscovery({
  workspaceRoot: ROOT,
  candidates: [...databases, ...pages, stranger, orphan],
});
assert.equal(scoped.outcome, 'RESOLVED', 'an out-of-scope look-alike must not make the real one ambiguous');
assert.equal(scoped.resolved['KERNEL:Quest Board'].id, 'db-0');

// 8. Two real candidates under the root are AMBIGUOUS, never silently picked.
const dupe = { ...databases[0], id: 'db-dupe', title: 'Quest Board (old)' };
const ambiguous = evaluateDiscovery({ workspaceRoot: ROOT, candidates: [...databases, ...pages, dupe] });
assert.equal(ambiguous.outcome, 'AMBIGUOUS');

// 8b. A match whose properties were never fetched cannot be called resolved.
const { properties: _dropped, ...noProps } = databases[0];
const unverified = evaluateDiscovery({ workspaceRoot: ROOT, candidates: [noProps, ...databases.filter((d) => d.id !== 'db-0'), ...pages] });
assert.equal(unverified.outcome, 'UNVERIFIED');
assert.notEqual(unverified.outcome, 'RESOLVED', 'unverifiable schema must never read as healthy');

// 8c. A match with valid properties but missing data_source_id must not resolve.
const { data_source_id: _droppedDs, ...noDsId } = databases[0];
const unverifiedDs = evaluateDiscovery({ workspaceRoot: ROOT, candidates: [noDsId, ...databases.filter((d) => d.id !== 'db-0'), ...pages] });
assert.equal(unverifiedDs.outcome, 'UNVERIFIED');
assert.ok(unverifiedDs.unverified.some((u) => u.issue === 'MISSING_DATA_SOURCE_ID' && u.entity === 'Quest Board'));

// 8d. extractEntityTitle handles raw Notion rich-text arrays and page title properties.
assert.equal(
  extractEntityTitle({ title: [{ plain_text: '⚔️ Quest Board' }] }),
  '⚔️ Quest Board',
);
assert.equal(
  extractEntityTitle({ properties: { Title: { type: 'title', title: [{ plain_text: '🪟 Status Window' }] } } }),
  '🪟 Status Window',
);
assert.equal(
  normalizeTitle({ title: [{ plain_text: '⚔️ Quest Board' }] }),
  'quest board',
);
assert.equal(
  normalizeTitle({ properties: { Name: { type: 'title', title: [{ plain_text: '🪟 Status Window' }] } } }),
  'status window',
);

// 8e. A workspace where Notion returns raw rich-text arrays and page properties resolves cleanly.
const rawDatabases = databases.map((db) => ({
  ...db,
  title: [{ plain_text: db.title }],
}));
const rawPages = pages.map((p) => ({
  ...p,
  title: undefined,
  properties: {
    title: { type: 'title', title: [{ plain_text: p.title }] },
  },
}));
const rawResolved = evaluateDiscovery({ workspaceRoot: ROOT, candidates: [...rawDatabases, ...rawPages] });
assert.equal(rawResolved.outcome, 'RESOLVED', 'raw Notion API response structures must resolve cleanly');

// 9. Nexus links: only values that can be verified. A Notion URL in this table would
//    be written into every player's Kernel, so each must be a real 32-hex id.
for (const [name, url] of Object.entries(CANONICAL_NEXUS_LINKS)) {
  assert.ok(url.startsWith('https://'), `${name} is not an https URL`);
  const notion = url.match(/notion\.so\/.*?([0-9a-f]+)$/i);
  if (notion) assert.equal(notion[1].length, 32, `${name}: "${url}" does not end in a 32-hex Notion id`);
}
assert.ok(!('patchFeedNotion' in CANONICAL_NEXUS_LINKS), 'Notion feed link must come from the player workspace, not a constant');
assert.ok(!('ruleManifestNotion' in CANONICAL_NEXUS_LINKS), 'Notion manifest link must come from the player workspace, not a constant');

console.log('PASS discovery engine (template-derived schema, nested scope, ambiguity, links)');
