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

test('public release guidance separates beta source from published packages without future release promises', () => {
  const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
  assert.match(readme, /Beta/i);
  assert.match(readme, /draft release.*not proof that npm has published/i);
  assert.match(readme, /Check the release availability table above before using a release tag/i);
  assert.doesNotMatch(readme, /--ref v2\.0\.23/);
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
