#!/usr/bin/env node
// The public feed is a player release contract, not a place for private
// implementation annotations. Keep its top-level schema explicit so an
// internal note cannot be carried forward by the catalog generator.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertPlayerFeedContract, rewritePlayerFeedCommands } from '../lib/public-feed-contract.mjs';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(packageRoot, '../..');
const feed = JSON.parse(fs.readFileSync(path.join(repoRoot, 'feed.json'), 'utf8'));
assertPlayerFeedContract(feed);

const feedText = fs.readFileSync(path.join(repoRoot, 'feed.json'), 'utf8');
const generated = JSON.parse(rewritePlayerFeedCommands(feedText, feed.commands));
assertPlayerFeedContract(generated);
assert.deepEqual(generated, feed, 'catalog generation must preserve only valid player feed content');

const withRootNote = structuredClone(feed);
withRootNote[['_', 'comment'].join('')] = 'admin nightly sync';
assert.throws(() => assertPlayerFeedContract(withRootNote), /unsupported root fields/);
assert.throws(() => rewritePlayerFeedCommands(JSON.stringify(withRootNote, null, 2), feed.commands), /unsupported root fields/);

const withPatchNote = structuredClone(feed);
withPatchNote.patches.at(-1).operating_note = 'private source';
assert.throws(() => assertPlayerFeedContract(withPatchNote), /unsupported shape/);
assert.throws(() => rewritePlayerFeedCommands(JSON.stringify(withPatchNote, null, 2), feed.commands), /unsupported shape/);

const malformedPatch = structuredClone(feed);
malformedPatch.patches[0].date = 'next month';
assert.throws(() => assertPlayerFeedContract(malformedPatch), /invalid release identity/);

const withControlPlaneCopy = structuredClone(feed);
withControlPlaneCopy.patches.at(-1).player_facing_summary = 'n8n workflow runs this nightly.';
assert.throws(() => assertPlayerFeedContract(withControlPlaneCopy), /non-player release wording/);

const withInternalReleaseMechanics = structuredClone(feed);
withInternalReleaseMechanics.patches.at(-1).title = 'atomic installer';
withInternalReleaseMechanics.patches.at(-1).player_facing_summary =
  'The 8:00 AM cron promotes a living proctor persona and ambient skill overlay.';
assert.throws(() => assertPlayerFeedContract(withInternalReleaseMechanics), /non-player release wording/);

for (const phrase of ['boot card', 'capability tiers', 'agent runtimes', 'MCP', 'structural-gate', 'ASCII art']) {
  const candidate = structuredClone(feed);
  candidate.patches.at(-1).player_facing_summary = `This release updates the ${phrase}.`;
  assert.throws(() => assertPlayerFeedContract(candidate), /non-player release wording/, phrase);
}

console.log('public-feed-contract: PASS');
