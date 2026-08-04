#!/usr/bin/env node
// Builds agent-neutral copies of The System (Player Edition) skills for the
// OpenAI Codex CLI and the Antigravity CLI (agy). Node stdlib only.
//
// Source of truth: plugins/the-system-player/skills/<name>/SKILL.md
// Output:
//   dist/codex/<name>/SKILL.md          (+ references/)   -> $CODEX_HOME/skills
//   dist/agy/the-system-player/...                        -> ~/.gemini/config/plugins
//   dist/manifest.json                                    (test + installer input)

import fs from 'node:fs';
import path from 'node:path';
import {
  AGENT_PROFILES,
  deriveDomainTerms,
  parseFrontmatter,
  residualClaudeMentions,
  stripClaudeIdioms,
} from './lib/transform.mjs';
import {
  DIST_AGY,
  DIST_CODEX,
  DIST_DIR,
  MANIFEST_PATH,
  PLUGIN_SLUG,
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

function emitSkillDir(skill, profile, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  const { text, description } = renderSkill(skill, profile);
  fs.writeFileSync(path.join(targetDir, 'SKILL.md'), text);

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
  return { text, description, extras };
}

function main() {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  fs.mkdirSync(DIST_CODEX, { recursive: true });

  const sourcePlugin = JSON.parse(
    fs.readFileSync(SOURCE_PLUGIN_MANIFEST, 'utf8'),
  );
  const skills = readSourceSkills();
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
    );
    const agy = emitSkillDir(
      skill,
      AGENT_PROFILES.agy,
      path.join(agyPluginDir, 'skills', skill.name),
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

  fs.writeFileSync(
    MANIFEST_PATH,
    JSON.stringify(
      {
        generatedFrom: 'plugins/the-system-player',
        sourceVersion: sourcePlugin.version,
        pluginSlug: PLUGIN_SLUG,
        builtAt: new Date().toISOString(),
        agents: Object.keys(AGENT_PROFILES),
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

  if (residuals.length) {
    console.error('\nresidual Claude-specific mentions survived the rewrite:');
    for (const r of residuals.slice(0, 20)) console.error(`  ${r}`);
    process.exitCode = 1;
  }
}

main();
