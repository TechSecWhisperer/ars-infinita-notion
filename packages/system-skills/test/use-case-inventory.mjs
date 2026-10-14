#!/usr/bin/env node
// test/use-case-inventory.mjs
// Automated verification of the 5-Dimensional Skill Use-Case Inventory
// and the "Zero Running From Memory" authority-groundedness invariant.

import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import {
  REPO_ROOT,
  SOURCE_PLUGIN_DIR,
  SOURCE_SKILLS_DIR,
  SHARED_REFERENCES_DIR,
  BOOT_CARD_PATH,
} from '../lib/paths.mjs';

const INVENTORY_PATH = path.join(SHARED_REFERENCES_DIR, 'use-case-inventory.md');
const VENDOR_CAP_PATH = path.join(SHARED_REFERENCES_DIR, 'vendor-capabilities.md');

test('use-case inventory document exists and defines 5-dimensional rubric', () => {
  assert.ok(fs.existsSync(INVENTORY_PATH), 'use-case-inventory.md must exist in references/');
  const content = fs.readFileSync(INVENTORY_PATH, 'utf8');

  // Verify all 5 evaluation dimensions are formally defined
  assert.match(content, /Direct Requests/i, 'Must define Direct Requests');
  assert.match(content, /Indirect Requests/i, 'Must define Indirect Requests');
  assert.match(content, /Incomplete Inputs/i, 'Must define Incomplete Inputs');
  assert.match(content, /Negative Boundary Requests|Requests that should not activate/i, 'Must define Negative Requests');
  assert.match(content, /Edge Cases/i, 'Must define Edge Cases');
  assert.match(content, /Zero Running From Memory/i, 'Must enforce Zero Running From Memory invariant');
});

test('dimension 1 & 2: skills define direct and indirect activation triggers in frontmatter', () => {
  const skillsToAudit = ['status', 'appraise', 'grind', 'armor', 'doctor', 'forge', 'quest', 'ghost'];

  for (const name of skillsToAudit) {
    const skillPath = path.join(SOURCE_SKILLS_DIR, name, 'SKILL.md');
    assert.ok(fs.existsSync(skillPath), `${name}/SKILL.md must exist`);
    const content = fs.readFileSync(skillPath, 'utf8');

    // Extract frontmatter description
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    assert.ok(match, `${name}/SKILL.md must have valid YAML frontmatter`);
    const descMatch = match[1].match(/description:\s*(?:>-\s*)?(.*)/);
    assert.ok(descMatch, `${name} frontmatter must have description`);
    const description = descMatch[1].toLowerCase();

    // Verify presence of direct command trigger syntax
    assert.ok(
      description.includes(`/${name}`) || description.includes(name),
      `${name} description must include direct trigger /${name}`,
    );

    // Verify presence of indirect natural language trigger phrases
    assert.ok(
      description.includes('when the player says') ||
      description.includes('use when') ||
      description.includes('triggers on'),
      `${name} description must define user intent trigger phrases`,
    );
  }
});

test('dimension 3: skills enforce clarification on incomplete inputs without guessing', () => {
  // Skills requiring inputs must define fallback or prompting behavior
  const inputDemandingSkills = [
    { name: 'appraise', indicator: /link|posting|jd/i },
    { name: 'forge', indicator: /role|quest|tracked/i },
    { name: 'armor', indicator: /quest|role|tracked/i },
    { name: 'log', indicator: /message|person|contact/i },
    { name: 'awaken', indicator: /folder|project|path/i },
  ];

  for (const { name, indicator } of inputDemandingSkills) {
    const content = fs.readFileSync(path.join(SOURCE_SKILLS_DIR, name, 'SKILL.md'), 'utf8');
    assert.match(
      content,
      indicator,
      `${name} must specify required inputs and avoid guessing missing targets`,
    );
  }
});

test('dimension 4: negative boundaries cleanly separate adjacent tool responsibilities', () => {
  // Verify clean boundary demarcations:
  // appraise is pre-application; engage is post-submission
  const appraiseContent = fs.readFileSync(path.join(SOURCE_SKILLS_DIR, 'appraise', 'SKILL.md'), 'utf8');
  assert.match(appraiseContent, /engage/i, 'appraise must state boundary: submitted applications are /engage');

  // forge is cover letters; armor is CVs
  const forgeContent = fs.readFileSync(path.join(SOURCE_SKILLS_DIR, 'forge', 'SKILL.md'), 'utf8');
  assert.match(forgeContent, /armor/i, 'forge must state boundary: resumes/CVs belong to /armor');

  const armorContent = fs.readFileSync(path.join(SOURCE_SKILLS_DIR, 'armor', 'SKILL.md'), 'utf8');
  assert.match(armorContent, /forge/i, 'armor must state boundary: cover letters belong to /forge');

  // single-quest briefs vs multi-quest scans
  const questContent = fs.readFileSync(path.join(SOURCE_SKILLS_DIR, 'quest', 'SKILL.md'), 'utf8');
  assert.match(questContent, /grind/i, 'quest must state boundary: whole-pipeline scans belong to /grind');
});

test('dimension 5: edge cases enforce anti-hallucination and security boundaries', () => {
  const bootCard = fs.readFileSync(BOOT_CARD_PATH, 'utf8');

  // Hard Rule 8: Never solve CAPTCHAs or checkpoints
  assert.match(bootCard, /CAPTCHA|checkpoint/i, 'Boot card must prohibit CAPTCHA solving');

  // Sealed mechanics protection
  assert.match(bootCard, /sealed mechanics|locked tier/i, 'Must prohibit revealing sealed mechanics or locked future tiers');

  // Surface boundary discipline: Zero raw HTML in terminal CLIs
  assert.match(bootCard, /Terminal CLIs/i, 'Must define Terminal CLI surface boundaries');
  assert.match(bootCard, /never emit raw html/i, 'Must prohibit raw HTML in terminal streams');
});

test('foundational invariant: zero running from memory (all skills read live authoritative sources)', () => {
  const skillsToAudit = ['status', 'appraise', 'grind', 'armor', 'doctor', 'quest', 'touch', 'recruit'];

  for (const name of skillsToAudit) {
    const content = fs.readFileSync(path.join(SOURCE_SKILLS_DIR, name, 'SKILL.md'), 'utf8');

    // Every skill must reference the shared boot card and authoritative KERNEL: entities
    assert.ok(
      content.includes('boot-card.md'),
      `${name} must reference shared boot card for authoritative rules`,
    );
    assert.ok(
      content.includes('KERNEL:') || content.includes('Kernel'),
      `${name} must read state from live KERNEL: entities, never from memory`,
    );
  }
});
