import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SURFACES,
  RUNTIMES,
  detectSurface,
  detectProvider,
  renderSkillRadar,
  renderFitGapSpider,
  renderPipelineFunnel,
  renderModularSectionsPreview,
  renderNotionViewAffordance,
} from '../lib/visualization-adapter.mjs';

test('detectSurface strictly distinguishes Desktop App GUI from Terminal CLI', () => {
  // Desktop App GUI environments
  assert.equal(detectSurface({ CLAUDE_DESKTOP: '1' }), SURFACES.DESKTOP_GUI);
  assert.equal(detectSurface({ ANTIGRAVITY_IDE: '1' }), SURFACES.DESKTOP_GUI);
  assert.equal(detectSurface({ CURSOR_DESKTOP: '1' }), SURFACES.DESKTOP_GUI);
  assert.equal(detectSurface({ DESKTOP_APP: '1' }), SURFACES.DESKTOP_GUI);

  // Terminal CLI environments (even with Claude Code or agy)
  assert.equal(detectSurface({ CLAUDE_CODE: '1' }), SURFACES.TERMINAL_CLI);
  assert.equal(detectSurface({ AGY_CLI: '1' }), SURFACES.TERMINAL_CLI);
  assert.equal(detectSurface({ CODEX_CLI: '1' }), SURFACES.TERMINAL_CLI);
  assert.equal(detectSurface({ SSH_CONNECTION: '1' }), SURFACES.TERMINAL_CLI);
  assert.equal(detectSurface({}), SURFACES.TERMINAL_CLI);
});

test('detectProvider identifies host assistant provider', () => {
  assert.equal(detectProvider({ ANTIGRAVITY_IDE: '1' }), RUNTIMES.ANTIGRAVITY);
  assert.equal(detectProvider({ AGY_CLI: '1' }), RUNTIMES.ANTIGRAVITY);
  assert.equal(detectProvider({ CLAUDE_DESKTOP: '1' }), RUNTIMES.CLAUDE);
  assert.equal(detectProvider({ CLAUDE_CODE: '1' }), RUNTIMES.CLAUDE);
  assert.equal(detectProvider({ CODEX_CLI: '1' }), RUNTIMES.CODEX);
  assert.equal(detectProvider({}), RUNTIMES.GENERIC);
});

test('renderSkillRadar outputs rich widgets in Desktop App GUI and clean Unicode in Terminal CLI', () => {
  const stats = {
    level: 4,
    rank: 'D-Rank',
    totalXp: 955,
    nextLevelXp: 1000,
    currentLevelBaseXp: 500,
    streak: 5,
    achievementsCount: 3,
    badgesCount: 2,
  };

  // 1. Claude Desktop App GUI: rich HTML/SVG widget
  const claudeDesktop = renderSkillRadar(stats, {
    surface: SURFACES.DESKTOP_GUI,
    provider: RUNTIMES.CLAUDE,
  });
  assert.match(claudeDesktop, /```html/);
  assert.match(claudeDesktop, /class="the-system-status-card"/);
  assert.match(claudeDesktop, /Level 4 — D-Rank/);

  // 2. Claude Code CLI: MUST NEVER output raw HTML in a terminal
  const claudeCli = renderSkillRadar(stats, {
    surface: SURFACES.TERMINAL_CLI,
    provider: RUNTIMES.CLAUDE,
  });
  assert.doesNotMatch(claudeCli, /```html/);
  assert.doesNotMatch(claudeCli, /<div/);
  assert.match(claudeCli, /┌── \[SYSTEM\] LEVEL 4 \(D-Rank\)/);
  assert.match(claudeCli, /XP Progress: \[/);

  // 3. Antigravity IDE GUI: Mermaid diagram
  const agyGui = renderSkillRadar(stats, {
    surface: SURFACES.DESKTOP_GUI,
    provider: RUNTIMES.ANTIGRAVITY,
  });
  assert.match(agyGui, /```mermaid/);
  assert.match(agyGui, /xychart-beta/);

  // 4. agy Terminal CLI: Unicode ASCII gauge
  const agyCli = renderSkillRadar(stats, {
    surface: SURFACES.TERMINAL_CLI,
    provider: RUNTIMES.ANTIGRAVITY,
  });
  assert.doesNotMatch(agyCli, /```mermaid/);
  assert.match(agyCli, /┌── \[SYSTEM\] LEVEL 4 \(D-Rank\)/);
});

test('renderFitGapSpider strictly gates HTML to Desktop GUI', () => {
  const appraisal = {
    role: 'Senior Staff Engineer',
    company: 'Notion',
    score: 8,
    matches: ['Distributed Systems', 'TypeScript Architecture'],
    gaps: ['Rust Internals'],
  };

  // Desktop GUI gets rich interactive representation
  const desktop = renderFitGapSpider(appraisal, {
    surface: SURFACES.DESKTOP_GUI,
    provider: RUNTIMES.CLAUDE,
  });
  assert.match(desktop, /fit-gap-analysis/);
  assert.match(desktop, /Fit Score: 8\/10/);

  // Terminal CLI gets clean structured ASCII table
  const cli = renderFitGapSpider(appraisal, {
    surface: SURFACES.TERMINAL_CLI,
    provider: RUNTIMES.CLAUDE,
  });
  assert.doesNotMatch(cli, /<div/);
  assert.match(cli, /┌── APPRAISAL:/);
  assert.match(cli, /\[✓\] Distributed Systems/);
  assert.match(cli, /\[!\] Rust Internals/);
});

test('renderPipelineFunnel gates HTML to Desktop GUI', () => {
  const stages = {
    saved: 4,
    applied: 12,
    recruiter: 3,
    hiringManager: 1,
    finalRound: 1,
    offer: 0,
  };

  // Desktop GUI
  const desktop = renderPipelineFunnel(stages, {
    surface: SURFACES.DESKTOP_GUI,
    provider: RUNTIMES.CLAUDE,
  });
  assert.match(desktop, /pipeline-funnel/);

  // CLI
  const cli = renderPipelineFunnel(stages, {
    surface: SURFACES.TERMINAL_CLI,
    provider: RUNTIMES.CLAUDE,
  });
  assert.doesNotMatch(cli, /<div/);
  assert.match(cli, /\[Applied: 12\] ──▶/);
});

test('renderModularSectionsPreview gates carousels/HTML to Desktop GUI', () => {
  const sections = ['header', 'summary', 'experience', 'skills', 'education'];

  // Desktop GUI (Antigravity)
  const agyGui = renderModularSectionsPreview(sections, {
    surface: SURFACES.DESKTOP_GUI,
    provider: RUNTIMES.ANTIGRAVITY,
  });
  assert.match(agyGui, /````carousel/);

  // Terminal CLI (Antigravity or Claude)
  const cli = renderModularSectionsPreview(sections, {
    surface: SURFACES.TERMINAL_CLI,
    provider: RUNTIMES.ANTIGRAVITY,
  });
  assert.doesNotMatch(cli, /````carousel/);
  assert.match(cli, /\[1\] header/);
});

test('renderNotionViewAffordance provides database view guidance', () => {
  const board = renderNotionViewAffordance('Quest Board', 'Board');
  assert.match(board, /Pipeline Board view/);

  const gallery = renderNotionViewAffordance('Gate Intel', 'Gallery');
  assert.match(gallery, /Company Gallery view/);
});
