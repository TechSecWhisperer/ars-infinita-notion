import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const pluginRoot = path.join(repoRoot, 'plugins/the-system-player');
const source = JSON.parse(fs.readFileSync(path.join(pluginRoot, '.claude-plugin/plugin.json'), 'utf8'));
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'packages/system-skills/package.json'), 'utf8'));

test('Codex repo marketplace discovers the canonical player plugin', () => {
  const marketplace = JSON.parse(fs.readFileSync(path.join(repoRoot, '.agents/plugins/marketplace.json'), 'utf8'));
  assert.equal(marketplace.name, 'ars-infinita-notion');
  assert.equal(marketplace.plugins.length, 1);
  assert.equal(marketplace.plugins[0].name, source.name);
  assert.equal(marketplace.plugins[0].source.source, 'local');
  assert.equal(marketplace.plugins[0].source.path, './plugins/the-system-player');
  assert.equal(marketplace.plugins[0].policy.installation, 'AVAILABLE');
  assert.equal(marketplace.plugins[0].policy.authentication, 'ON_USE');
  assert.equal(path.resolve(repoRoot, marketplace.plugins[0].source.path), pluginRoot);
});

test('portable plugin metadata points to the authored onboarding skill and shares release versions', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(pluginRoot, 'plugin.json'), 'utf8'));
  const openai = manifest.extensions?.['com.openai'];
  const onboardingSkill = openai?.onboardingSkill;
  assert.equal(manifest.name, source.name);
  assert.equal(manifest.version, source.version);
  assert.equal(manifest.version, packageJson.version);
  assert.equal(manifest.author?.name, source.author.name);
  assert.ok(manifest.description);
  assert.ok(onboardingSkill?.startsWith('./skills/'));
  assert.ok(fs.existsSync(path.join(pluginRoot, onboardingSkill)));
  assert.equal(openai.interface.displayName, 'The System — Player Edition');
  assert.ok(openai.interface.shortDescription.length <= 30);
  assert.ok(openai.interface.longDescription.length <= 4000);
  assert.ok(openai.interface.developerName);
  assert.equal(openai.interface.category, 'Productivity');
  assert.ok(Array.isArray(openai.interface.capabilities));
});

test('portable plugin exposes every canonical skill without copying their source', () => {
  const skillsRoot = path.join(pluginRoot, 'skills');
  const names = fs.readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.ok(names.length > 0);
  for (const name of names) {
    assert.ok(fs.existsSync(path.join(skillsRoot, name, 'SKILL.md')), `${name} must be packaged`);
  }
});

test('public privacy copy distinguishes the Notion source of truth from AI-provider processing', () => {
  const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
  const bootCard = fs.readFileSync(path.join(pluginRoot, 'references/boot-card.md'), 'utf8');
  const awaken = fs.readFileSync(path.join(pluginRoot, 'skills/awaken/SKILL.md'), 'utf8');
  const pluginReadme = fs.readFileSync(path.join(pluginRoot, 'README.md'), 'utf8');
  const longDescription = JSON.parse(fs.readFileSync(path.join(pluginRoot, 'plugin.json'), 'utf8'))
    .extensions['com.openai'].interface.longDescription;
  for (const content of [readme, bootCard, awaken, pluginReadme, longDescription]) {
    assert.doesNotMatch(content, /job-search content (?:never|ever) leaves/i);
    assert.match(content, /provider/i, 'player-facing copy must disclose provider processing');
  }
  assert.match(readme, /Notion workspace is the source of truth/i);
});

test('public release guidance points to live destinations instead of stale version snapshots', () => {
  const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
  const feed = JSON.parse(fs.readFileSync(path.join(repoRoot, 'feed.json'), 'utf8'));
  const changelog = fs.readFileSync(path.join(repoRoot, 'CHANGELOG.md'), 'utf8');
  assert.match(readme, /Beta/i);
  assert.match(readme, /npmjs\.com\/package\/\@ars-infinita-notion\/system-skills/i);
  assert.match(readme, /github\.com\/TechSecWhisperer\/ars-infinita-notion\/releases/i);
  assert.match(readme, /mechanics badge at the top follows the repository's\s+`feed\.json` source on `main`/i);
  assert.doesNotMatch(readme, /Release availability \(checked \d{4}-\d{2}-\d{2}\)/i);
  assert.doesNotMatch(readme, /Latest version in the npm registry|still a draft and npm has no/i);
  assert.doesNotMatch(readme, /coming stable|stable target|v2\.1\.0/i);
  assert.equal(feed.head, '2.0.24');
  assert.equal(feed.mechanics_version, feed.head);
  assert.equal(feed.patches.at(-1).version, feed.head);
  assert.ok(!feed.patches.some((patch) => patch.version === '2.0.22'),
    'the unpublished v2.0.22 draft must not be presented as a shipped player patch');
  assert.doesNotMatch(changelog, /^## v2\.0\.22\b/m,
    'an unpublished v2.0.22 draft must not appear in player release notes');
  assert.match(changelog, /^## v2\.0\.24\b/m);
});

test('Codex marketplace updates select a new immutable release ref', () => {
  const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
  const guide = fs.readFileSync(path.join(repoRoot, 'docs/PLAYERS-GUIDE.md'), 'utf8');
  assert.match(readme, /codex plugin marketplace add TechSecWhisperer\/ars-infinita-notion --ref <release-tag>/);
  assert.match(readme, /marketplace upgrade[\s\S]{0,120}refreshes the configured\s+marketplace at its existing Git ref/i);
  assert.match(readme, /does not select a different release tag/i);
  assert.match(readme, /remove the current plugin and marketplace source/i);
  assert.match(readme, /codex plugin marketplace remove ars-infinita-notion/);
  assert.match(guide, /does not select a new tag/i);
  assert.doesNotMatch(readme, /marketplace upgrade ars-infinita-notion.*For another release/i);
});

test('standalone installer help describes host options without inventing account or schedule requirements', () => {
  const help = execFileSync(process.execPath, [path.join(repoRoot, 'packages/system-skills/cli.mjs'), '--help'], {
    encoding: 'utf8',
  });
  assert.match(help, /Node\.js 18\+/);
  assert.match(help, /Scheduled routines are optional/);
  assert.match(help, /Codex plugin installation routes/);
  assert.doesNotMatch(help, /paid AI agent subscription|Claude Code is deliberately NOT a target/i);
});
