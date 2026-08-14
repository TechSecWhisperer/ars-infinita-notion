#!/usr/bin/env node
// Builds agent-neutral copies of The System (Player Edition) skills for the
// OpenAI Codex CLI and the Antigravity CLI (agy). Node stdlib only.
//
// Source of truth: plugins/the-system-player/skills/<name>/SKILL.md
//                  plugins/the-system-player/references/boot-card.md  (ONE copy)
//                  plugins/the-system-player/.claude-plugin/plugin.json (the only
//                    hand-set version anywhere in the repo)
// Output:
//   dist/codex/<name>/SKILL.md          (+ references/)   -> $CODEX_HOME/skills
//   dist/agy/the-system-player/...                        -> ~/.gemini/config/plugins
//   dist/manifest.json                                    (test + installer input)
//   .claude-plugin/marketplace.json     (TRACKED, generated from plugin.json)
//
// Boot-card fan-out: the repo tracks exactly one boot-card.md, at the plugin
// root. Claude skills point at it with `${CLAUDE_SKILL_DIR}/../../references/…`,
// which works because the whole plugin tree is materialised on install. The
// codex and agy CLIs install skills as standalone folders with no shared
// parent, so for those two targets — and only those two — this build stamps a
// per-skill copy and rewrites the reference to a local one. Those copies are
// build output in gitignored dist/, verified byte-identical by the
// `shared-reference-build-check` in test/checks.mjs.

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  AGENT_PROFILES,
  deriveDomainTerms,
  parseFrontmatter,
  residualClaudeMentions,
  stripClaudeIdioms,
} from './lib/transform.mjs';
import { renderReadme } from './lib/catalog.mjs';
import {
  BOOT_CARD_LOCAL_REF,
  BOOT_CARD_PATH,
  BOOT_CARD_REF,
  DIST_AGY,
  DIST_CODEX,
  DIST_DIR,
  MANIFEST_PATH,
  MARKETPLACE_PATH,
  README_PATH,
  PLUGIN_SLUG,
  REPO_ROOT,
  SOURCE_PLUGIN_MANIFEST,
  SOURCE_SKILLS_DIR,
} from './lib/paths.mjs';

const TEXT_EXT = new Set(['.md', '.markdown', '.txt', '.json', '.yaml', '.yml']);

function readSourceSkills() {
  const names = fs
    .readdirSync(SOURCE_SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((n) => fs.existsSync(path.join(SOURCE_SKILLS_DIR, n, 'SKILL.md')))
    .sort();

  return names.map((name) => {
    const dir = path.join(SOURCE_SKILLS_DIR, name);
    const raw = fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8');
    const { data, body, hadFrontmatter } = parseFrontmatter(raw);
    if (!hadFrontmatter || !data.name || !data.description) {
      throw new Error(`${name}/SKILL.md is missing name/description frontmatter`);
    }
    if (data.name !== name) {
      throw new Error(
        `${name}/SKILL.md frontmatter name is "${data.name}" but the directory is "${name}"`,
      );
    }
    return { name, dir, data, body, bytes: Buffer.byteLength(raw) };
  });
}

function listExtraFiles(dir) {
  const out = [];
  const walk = (rel) => {
    const abs = path.join(dir, rel);
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      const childRel = path.join(rel, entry.name);
      if (entry.isDirectory()) walk(childRel);
      else if (childRel !== 'SKILL.md') out.push(childRel);
    }
  };
  walk('.');
  return out.map((p) => p.replace(/^\.\//, '')).sort();
}

function yamlQuote(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function renderSkill(skill, profile) {
  const description = stripClaudeIdioms(skill.data.description, profile);
  const body = stripClaudeIdioms(skill.body, profile);
  const frontmatter = [
    '---',
    `name: ${skill.name}`,
    `description: ${yamlQuote(description)}`,
    '---',
    '',
  ].join('\n');
  return { text: frontmatter + body, description };
}

function emitSkillDir(skill, profile, targetDir, bootCard) {
  fs.mkdirSync(targetDir, { recursive: true });
  const { text: rendered, description } = renderSkill(skill, profile);

  // Point this target at its own stamped copy instead of the plugin-root file.
  // `${CLAUDE_SKILL_DIR}` is a Claude-harness substitution and means nothing to
  // codex or agy, so it must not survive into their output either way.
  const text = rendered.split(BOOT_CARD_REF).join(BOOT_CARD_LOCAL_REF);
  fs.writeFileSync(path.join(targetDir, 'SKILL.md'), text);

  // Stamp the single authored boot card into this skill's own references/.
  const bootCardDest = path.join(targetDir, BOOT_CARD_LOCAL_REF);
  fs.mkdirSync(path.dirname(bootCardDest), { recursive: true });
  fs.writeFileSync(bootCardDest, stripClaudeIdioms(bootCard, profile));

  const extras = listExtraFiles(skill.dir);
  for (const rel of extras) {
    const src = path.join(skill.dir, rel);
    const dest = path.join(targetDir, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (TEXT_EXT.has(path.extname(rel).toLowerCase())) {
      fs.writeFileSync(
        dest,
        stripClaudeIdioms(fs.readFileSync(src, 'utf8'), profile),
      );
    } else {
      fs.copyFileSync(src, dest);
    }
  }
  return { text, description, extras: [BOOT_CARD_LOCAL_REF, ...extras].sort() };
}

/**
 * Regenerate the repo-root marketplace.json from plugin.json.
 *
 * The plugin entry carries ONLY `name`, `source` and marketplace-level
 * classification. It deliberately does NOT repeat `version` or `description`:
 * Claude Code resolves the plugin's own manifest, so a second copy here never
 * wins — it just sits and disagrees, which is exactly how v1.3.1 shipped with
 * the marketplace still advertising 1.3.0 and no update prompt firing.
 *
 * Marketplace-level fields (its own name, owner and description — which
 * describe the marketplace, not the plugin) are preserved from the existing
 * file; only the `plugins` array is derived.
 */
export function renderMarketplace(sourcePlugin, existing) {
  return {
    ...existing,
    plugins: [
      {
        name: sourcePlugin.name,
        source: `./plugins/${PLUGIN_SLUG}`,
        category: 'productivity',
      },
    ],
  };
}

function writeMarketplace(sourcePlugin) {
  const existing = JSON.parse(fs.readFileSync(MARKETPLACE_PATH, 'utf8'));
  const next = JSON.stringify(renderMarketplace(sourcePlugin, existing), null, 2) + '\n';
  const before = fs.readFileSync(MARKETPLACE_PATH, 'utf8');
  if (before !== next) fs.writeFileSync(MARKETPLACE_PATH, next);
  return { changed: before !== next };
}

/**
 * Regenerate the README's featured-command teaser from skill frontmatter.
 * Same shape as writeMarketplace: derive, compare, write only on change, and
 * report whether the tracked file moved so the build log says "commit this".
 */
function writeReadme() {
  const before = fs.readFileSync(README_PATH, 'utf8');
  const next = renderReadme(before);
  if (before !== next) fs.writeFileSync(README_PATH, next);
  return { changed: before !== next };
}

function main() {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  fs.mkdirSync(DIST_CODEX, { recursive: true });

  const sourcePlugin = JSON.parse(
    fs.readFileSync(SOURCE_PLUGIN_MANIFEST, 'utf8'),
  );
  const bootCard = fs.readFileSync(BOOT_CARD_PATH, 'utf8');
  const skills = readSourceSkills();

  // Every skill must actually point at the one shared boot card. A skill that
  // silently lost the reference would boot without the universal rules.
  const missingRef = skills
    .filter((s) => !s.body.includes(BOOT_CARD_REF))
    .map((s) => s.name);
  if (missingRef.length) {
    throw new Error(
      `these skills do not reference the shared boot card (${BOOT_CARD_REF}): ${missingRef.join(', ')}`,
    );
  }

  const agyPluginDir = path.join(DIST_AGY, PLUGIN_SLUG);
  fs.mkdirSync(path.join(agyPluginDir, 'skills'), { recursive: true });

  // agy plugin manifest. Only `name` is meaningful per the Antigravity docs;
  // the rest is carried through for humans reading the directory.
  fs.writeFileSync(
    path.join(agyPluginDir, 'plugin.json'),
    JSON.stringify(
      {
        name: PLUGIN_SLUG,
        version: sourcePlugin.version,
        description: stripClaudeIdioms(
          sourcePlugin.description,
          AGENT_PROFILES.agy,
        ),
      },
      null,
      2,
    ) + '\n',
  );

  const manifestSkills = [];
  const residuals = [];

  for (const skill of skills) {
    const codex = emitSkillDir(
      skill,
      AGENT_PROFILES.codex,
      path.join(DIST_CODEX, skill.name),
      bootCard,
    );
    const agy = emitSkillDir(
      skill,
      AGENT_PROFILES.agy,
      path.join(agyPluginDir, 'skills', skill.name),
      bootCard,
    );

    for (const [agent, built] of [
      ['codex', codex],
      ['agy', agy],
    ]) {
      for (const hit of residualClaudeMentions(built.text)) {
        residuals.push(`${agent}/${skill.name}: ...${hit}...`);
      }
    }

    manifestSkills.push({
      name: skill.name,
      description: codex.description,
      sourceBytes: skill.bytes,
      builtBytes: Buffer.byteLength(codex.text),
      extras: codex.extras,
      domainTerms: deriveDomainTerms(skill.name, codex.description),
      outputs: {
        codex: path.relative(DIST_DIR, path.join(DIST_CODEX, skill.name, 'SKILL.md')),
        agy: path.relative(
          DIST_DIR,
          path.join(agyPluginDir, 'skills', skill.name, 'SKILL.md'),
        ),
      },
    });
  }

  const marketplace = writeMarketplace(sourcePlugin);
  const readme = writeReadme();

  fs.writeFileSync(
    MANIFEST_PATH,
    JSON.stringify(
      {
        generatedFrom: 'plugins/the-system-player',
        sourceVersion: sourcePlugin.version,
        pluginSlug: PLUGIN_SLUG,
        builtAt: new Date().toISOString(),
        agents: Object.keys(AGENT_PROFILES),
        // The one authored boot card, and the digest every stamped copy must
        // match. `shared-reference-build-check` in test/checks.mjs reads this.
        bootCard: {
          source: path.relative(REPO_ROOT, BOOT_CARD_PATH),
          sha256: createHash('sha256').update(bootCard).digest('hex'),
          bytes: Buffer.byteLength(bootCard),
          claudeRef: BOOT_CARD_REF,
          builtRef: BOOT_CARD_LOCAL_REF,
        },
        skills: manifestSkills,
      },
      null,
      2,
    ) + '\n',
  );

  console.log(
    `built ${manifestSkills.length} skills from ${path.relative(process.cwd(), SOURCE_SKILLS_DIR) || SOURCE_SKILLS_DIR}`,
  );
  console.log(`  codex -> ${DIST_CODEX} (one dir per skill, SKILL.md + references/)`);
  console.log(`  agy   -> ${agyPluginDir} (plugin.json + skills/<name>/SKILL.md)`);
  console.log(`  manifest -> ${MANIFEST_PATH}`);
  console.log(
    `  boot card -> 1 authored copy, ${manifestSkills.length * 2} stamped into dist/ (codex + agy)`,
  );
  console.log(
    `  marketplace -> ${MARKETPLACE_PATH}${marketplace.changed ? ' (REWRITTEN — commit this)' : ' (already in sync)'}`,
  );
  console.log(
    `  README teaser -> ${README_PATH}${readme.changed ? ' (REWRITTEN — commit this)' : ' (already in sync)'}`,
  );

  if (residuals.length) {
    console.error('\nresidual Claude-specific mentions survived the rewrite:');
    for (const r of residuals.slice(0, 20)) console.error(`  ${r}`);
    process.exitCode = 1;
  }
}

// Only build when run directly. test/checks.mjs imports `renderMarketplace`
// from here so the check and the generator can never drift apart.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
