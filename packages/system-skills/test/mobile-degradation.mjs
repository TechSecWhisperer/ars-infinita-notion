#!/usr/bin/env node
// Deterministic, read-only contract checks for app-only/mobile sessions.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const fixture = (name) => JSON.parse(fs.readFileSync(path.join(HERE, 'fixtures', name), 'utf8'));

const cases = [
  ['mobile-browser-absent.json', 'plugins/the-system-player/skills/browse/SKILL.md'],
  ['mobile-pasted-input.json', 'plugins/the-system-player/skills/quest/SKILL.md'],
  ['mobile-file-export-deferred.json', 'plugins/the-system-player/skills/armor/SKILL.md'],
  ['mobile-shell-unavailable.json', 'plugins/the-system-player/skills/petition/SKILL.md'],
];

for (const [fixtureName, documentPath] of cases) {
  const evidence = fixture(fixtureName);
  const document = read(documentPath);
  assert.equal(typeof evidence.expected, 'string');
  assert.ok(document.toLowerCase().includes(evidence.expected), `${fixtureName}: expected outcome ${evidence.expected} is not documented`);
  for (const phrase of evidence.required) {
    assert.ok(document.includes(phrase), `${fixtureName}: ${documentPath} is missing ${JSON.stringify(phrase)}`);
  }
}

const boot = read('plugins/the-system-player/references/boot-card.md');
for (const outcome of ['completed', 'prepared', 'deferred', 'unavailable', 'unknown']) {
  assert.ok(boot.includes(`**${outcome}**`), `boot outcome contract is missing ${outcome}`);
}

console.log('PASS mobile degradation fixtures (browser absent, pasted input, file export, shell submission)');
