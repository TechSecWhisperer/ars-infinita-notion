/**
 * visualization-adapter.mjs
 *
 * Multi-surface presentation adapter for The System (Player Edition).
 *
 * Architectural Invariant:
 * Rich inline visualizations (Claude beta HTML/SVG widgets, Antigravity Mermaid/carousels)
 * are DESKTOP APP NATIVE. Terminal CLIs (Claude Code CLI, agy CLI, Codex CLI, SSH, tmux)
 * do not render HTML/SVG or iframe widgets; dumping raw HTML into a CLI pollutes the
 * terminal with unrendered markup.
 *
 * Surfaces:
 * 1. DESKTOP_GUI: Claude Desktop App, Claude Web, Antigravity IDE (Electron).
 *    -> Renders native inline interactive visualizations, SVG widgets, and Mermaid.
 * 2. TERMINAL_CLI: Command-line interfaces, terminal emulators, headless runners.
 *    -> Strictly renders clean Unicode ASCII art, box-drawing characters, and progress bars.
 * 3. NOTION: Deep links and guidance for native Notion database views (Board, Gallery, Timeline).
 */

export const SURFACES = {
  DESKTOP_GUI: 'desktop_gui',
  TERMINAL_CLI: 'terminal_cli',
};

export const RUNTIMES = {
  CLAUDE: 'claude',
  ANTIGRAVITY: 'antigravity',
  CODEX: 'codex',
  GENERIC: 'generic',
};

/**
 * Detect host surface type (Desktop App GUI vs Terminal CLI).
 */
export function detectSurface(env = process.env, options = {}) {
  if (options.surface) {
    return options.surface === SURFACES.DESKTOP_GUI ? SURFACES.DESKTOP_GUI : SURFACES.TERMINAL_CLI;
  }

  // Explicit desktop indicators
  if (
    env.CLAUDE_DESKTOP === '1' ||
    env.ANTIGRAVITY_IDE === '1' ||
    env.CURSOR_DESKTOP === '1' ||
    env.DESKTOP_APP === '1' ||
    env.GUI_ENABLED === '1'
  ) {
    return SURFACES.DESKTOP_GUI;
  }

  // Explicit CLI indicators (e.g. Claude Code CLI, agy CLI, Codex CLI, SSH, or CI/scripts)
  if (
    env.CLAUDE_CODE ||
    env.AGY_CLI ||
    env.CODEX_CLI ||
    env.SSH_CONNECTION
  ) {
    return SURFACES.TERMINAL_CLI;
  }

  // Default: terminal CLI unless desktop GUI is positively detected
  return SURFACES.TERMINAL_CLI;
}

/**
 * Detect underlying model/assistant provider.
 */
export function detectProvider(env = process.env) {
  if (env.ANTIGRAVITY_AGENT || env.AGY_CLI || env.GEMINI_CLI || env.ANTIGRAVITY_IDE) {
    return RUNTIMES.ANTIGRAVITY;
  }
  if (env.CLAUDE_CODE || env.CLAUDE_PLUGIN_DIR || env.CLAUDE_SKILL_DIR || env.CLAUDE_DESKTOP) {
    return RUNTIMES.CLAUDE;
  }
  if (env.CODEX_HOME || env.CODEX_CLI) {
    return RUNTIMES.CODEX;
  }
  return RUNTIMES.GENERIC;
}

/**
 * 1. Skill & Progression Radar / Progress Gauge (for /status).
 */
export function renderSkillRadar(stats = {}, context = {}) {
  const {
    level = 1,
    rank = 'E-Rank',
    totalXp = 0,
    nextLevelXp = 100,
    currentLevelBaseXp = 0,
    streak = 0,
    achievementsCount = 0,
    badgesCount = 0,
  } = stats;

  const env = context.env || process.env;
  const surface = context.surface || detectSurface(env, context);
  const provider = context.provider || detectProvider(env);

  const xpProgress = Math.max(0, totalXp - currentLevelBaseXp);
  const xpNeeded = Math.max(1, nextLevelXp - currentLevelBaseXp);
  const percent = Math.min(100, Math.round((xpProgress / xpNeeded) * 100));

  // DESKTOP APP NATIVE RENDERING
  if (surface === SURFACES.DESKTOP_GUI) {
    if (provider === RUNTIMES.CLAUDE) {
      // Inline interactive visualization for Claude Desktop / Web GUI
      return [
        '```html',
        `<div class="the-system-status-card" style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #334155;">`,
        `  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">`,
        `    <span style="font-size: 1.25rem; font-weight: bold; color: #38bdf8;">[SYSTEM] Level ${level} — ${rank}</span>`,
        `    <span style="font-size: 0.875rem; background: #1e293b; padding: 4px 8px; border-radius: 4px; color: #fbbf24;">🔥 ${streak}-day streak</span>`,
        `  </div>`,
        `  <div style="margin-bottom: 8px;">`,
        `    <div style="display: flex; justify-content: space-between; font-size: 0.875rem; color: #94a3b8; margin-bottom: 4px;">`,
        `      <span>XP Progress</span>`,
        `      <span>${totalXp} / ${nextLevelXp} XP (${percent}%)</span>`,
        `    </div>`,
        `    <div style="background: #1e293b; height: 10px; border-radius: 5px; overflow: hidden;">`,
        `      <div style="background: linear-gradient(90deg, #38bdf8, #818cf8); width: ${percent}%; height: 100%;"></div>`,
        `    </div>`,
        `  </div>`,
        `  <div style="display: flex; gap: 16px; font-size: 0.875rem; color: #cbd5e1; margin-top: 12px;">`,
        `    <div>🏆 Achievements: <strong>${achievementsCount}/12</strong></div>`,
        `    <div>🎖️ Badges: <strong>${badgesCount}/6 forged</strong></div>`,
        `  </div>`,
        `</div>`,
        '```',
      ].join('\n');
    }

    if (provider === RUNTIMES.ANTIGRAVITY) {
      // Native Mermaid diagram for Antigravity IDE GUI
      return [
        '```mermaid',
        'xychart-beta',
        `    title "Hunter Progression: Level ${level} (${rank}) — ${percent}% to Level ${level + 1}"`,
        `    x-axis ["Current XP", "Next Level"]`,
        `    y-axis "XP Points" 0 --> ${Math.max(nextLevelXp, totalXp + 50)}`,
        `    bar [${totalXp}, ${nextLevelXp}]`,
        '```',
      ].join('\n');
    }
  }

  // TERMINAL CLI FALLBACK (Zero Slop, Pure Unicode Box Drawing)
  const totalBars = 20;
  const filledBars = Math.round((percent / 100) * totalBars);
  const emptyBars = Math.max(0, totalBars - filledBars);
  const bar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

  return [
    `┌── [SYSTEM] LEVEL ${level} (${rank}) ────────────────────────┐`,
    `│ XP Progress: [${bar}] ${percent}% (${totalXp}/${nextLevelXp} XP)`,
    `│ Streak: 🔥 ${streak} days | Badges: 🎖️ ${badgesCount}/6 | Achievements: 🏆 ${achievementsCount}/12`,
    `└────────────────────────────────────────────────────────┘`,
  ].join('\n');
}

/**
 * 2. Fit-Score & Gap Spider / Competency Matrix (for /appraise).
 */
export function renderFitGapSpider(appraisal = {}, context = {}) {
  const {
    role = 'Target Role',
    company = 'Company',
    score = 7,
    matches = [],
    gaps = [],
  } = appraisal;

  const env = context.env || process.env;
  const surface = context.surface || detectSurface(env, context);
  const provider = context.provider || detectProvider(env);

  // DESKTOP APP NATIVE RENDERING
  if (surface === SURFACES.DESKTOP_GUI) {
    if (provider === RUNTIMES.CLAUDE) {
      return [
        '```html',
        `<div class="fit-gap-analysis" style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #334155;">`,
        `  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">`,
        `    <span style="font-size: 1.1rem; font-weight: bold; color: #38bdf8;">${role} @ ${company}</span>`,
        `    <span style="font-size: 1.25rem; font-weight: bold; color: ${score >= 7 ? '#4ade80' : score >= 5 ? '#fbbf24' : '#f87171'};">Fit Score: ${score}/10</span>`,
        `  </div>`,
        `  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">`,
        `    <div style="background: #1e293b; padding: 10px; border-radius: 6px;">`,
        `      <div style="color: #4ade80; font-weight: 600; margin-bottom: 6px;">✓ Core Strengths (${matches.length})</div>`,
        ...matches.map((m) => `      <div style="font-size: 0.85rem; color: #cbd5e1; margin-bottom: 4px;">• ${m}</div>`),
        `    </div>`,
        `    <div style="background: #1e293b; padding: 10px; border-radius: 6px;">`,
        `      <div style="color: #f87171; font-weight: 600; margin-bottom: 6px;">⚠ Development Gaps (${gaps.length})</div>`,
        ...gaps.map((g) => `      <div style="font-size: 0.85rem; color: #cbd5e1; margin-bottom: 4px;">• ${g}</div>`),
        `    </div>`,
        `  </div>`,
        `</div>`,
        '```',
      ].join('\n');
    }

    if (provider === RUNTIMES.ANTIGRAVITY) {
      return [
        '```mermaid',
        'flowchart TD',
        `    subgraph Evaluation["Appraisal: ${role} @ ${company} (Fit: ${score}/10)"]`,
        `        direction TB`,
        `        subgraph Strengths["✓ Strengths"]`,
        ...matches.map((m, i) => `            s${i}["${m.replace(/["[\]()]/g, '')}"]`),
        `        end`,
        `        subgraph Gaps["⚠ Gaps"]`,
        ...gaps.map((g, i) => `            g${i}["${g.replace(/["[\]()]/g, '')}"]`),
        `        end`,
        `    end`,
        '```',
      ].join('\n');
    }
  }

  // TERMINAL CLI FALLBACK (Zero Slop, Pure Unicode Box Drawing)
  return [
    `┌── APPRAISAL: ${role} @ ${company} (Fit Score: ${score}/10) ────┐`,
    `│ Strengths (${matches.length}):`,
    ...matches.map((m) => `│   [✓] ${m}`),
    `│ Gaps (${gaps.length}):`,
    ...gaps.map((g) => `│   [!] ${g}`),
    `└────────────────────────────────────────────────────────┘`,
  ].join('\n');
}

/**
 * 3. Pipeline Funnel (for /grind).
 */
export function renderPipelineFunnel(stages = {}, context = {}) {
  const {
    saved = 0,
    applied = 0,
    recruiter = 0,
    hiringManager = 0,
    finalRound = 0,
    offer = 0,
  } = stages;

  const env = context.env || process.env;
  const surface = context.surface || detectSurface(env, context);
  const provider = context.provider || detectProvider(env);

  // DESKTOP APP NATIVE RENDERING
  if (surface === SURFACES.DESKTOP_GUI) {
    if (provider === RUNTIMES.CLAUDE) {
      return [
        '```html',
        `<div class="pipeline-funnel" style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #334155;">`,
        `  <div style="font-weight: bold; color: #38bdf8; margin-bottom: 12px;">Pipeline Funnel Overview</div>`,
        `  <div style="display: flex; gap: 8px; align-items: center; justify-content: space-between; font-size: 0.85rem;">`,
        `    <div style="background: #1e293b; padding: 8px; border-radius: 4px; text-align: center; flex: 1;">Saved<br><strong style="font-size: 1.1rem; color: #94a3b8;">${saved}</strong></div>`,
        `    <span>➔</span>`,
        `    <div style="background: #1e293b; padding: 8px; border-radius: 4px; text-align: center; flex: 1;">Applied<br><strong style="font-size: 1.1rem; color: #38bdf8;">${applied}</strong></div>`,
        `    <span>➔</span>`,
        `    <div style="background: #1e293b; padding: 8px; border-radius: 4px; text-align: center; flex: 1;">Screen<br><strong style="font-size: 1.1rem; color: #818cf8;">${recruiter}</strong></div>`,
        `    <span>➔</span>`,
        `    <div style="background: #1e293b; padding: 8px; border-radius: 4px; text-align: center; flex: 1;">HM Round<br><strong style="font-size: 1.1rem; color: #c084fc;">${hiringManager}</strong></div>`,
        `    <span>➔</span>`,
        `    <div style="background: #1e293b; padding: 8px; border-radius: 4px; text-align: center; flex: 1;">Final<br><strong style="font-size: 1.1rem; color: #f472b6;">${finalRound}</strong></div>`,
        `    <span>➔</span>`,
        `    <div style="background: #1e293b; padding: 8px; border-radius: 4px; text-align: center; flex: 1; border: 1px solid #4ade80;">Offer<br><strong style="font-size: 1.1rem; color: #4ade80;">${offer}</strong></div>`,
        `  </div>`,
        `</div>`,
        '```',
      ].join('\n');
    }

    if (provider === RUNTIMES.ANTIGRAVITY) {
      return [
        '```mermaid',
        'flowchart LR',
        `    Saved["Saved: ${saved}"] --> Applied["Applied: ${applied}"]`,
        `    Applied --> Screen["Screen: ${recruiter}"]`,
        `    Screen --> HM["HM Round: ${hiringManager}"]`,
        `    HM --> Final["Final: ${finalRound}"]`,
        `    Final --> Offer["Offer: ${offer}"]`,
        '```',
      ].join('\n');
    }
  }

  // TERMINAL CLI FALLBACK (Zero Slop, Pure Unicode Box Drawing)
  return [
    `[Saved: ${saved}] ──▶ [Applied: ${applied}] ──▶ [Screen: ${recruiter}] ──▶ [HM: ${hiringManager}] ──▶ [Final: ${finalRound}] ──▶ [Offer: ${offer}]`,
  ].join('\n');
}

/**
 * 4. Moveable Modular CV Sections Preview (for /armor).
 */
export function renderModularSectionsPreview(sections = [], context = {}) {
  const env = context.env || process.env;
  const surface = context.surface || detectSurface(env, context);
  const provider = context.provider || detectProvider(env);

  // DESKTOP APP NATIVE RENDERING
  if (surface === SURFACES.DESKTOP_GUI) {
    if (provider === RUNTIMES.ANTIGRAVITY) {
      return [
        '````carousel',
        '### Active CV Section Layout',
        sections.map((s, i) => `${i + 1}. **${s}**`).join('\n'),
        '<!-- slide -->',
        '### Section Reordering Guide',
        'Use natural phrasing to reorder sections, e.g.:',
        '- *"Move skills above experience"*',
        '- *"Put certifications at the top"*',
        '- *"Switch to UK standard layout"*',
        '````',
      ].join('\n');
    }

    if (provider === RUNTIMES.CLAUDE) {
      return [
        '```html',
        `<div class="armor-layout-preview" style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 14px; border-radius: 6px; border: 1px solid #334155;">`,
        `  <div style="font-weight: 600; color: #38bdf8; margin-bottom: 8px;">Active CV Layout Blocks (${sections.length})</div>`,
        `  <div style="display: flex; flex-direction: column; gap: 6px;">`,
        ...sections.map((s, i) => `    <div style="background: #1e293b; padding: 6px 12px; border-radius: 4px; font-size: 0.85rem; display: flex; justify-content: space-between;"><span>${i + 1}. <strong>${s}</strong></span><span style="color: #64748b;">☰ Moveable</span></div>`),
        `  </div>`,
        `</div>`,
        '```',
      ].join('\n');
    }
  }

  // TERMINAL CLI FALLBACK (Zero Slop, Pure Unicode Box Drawing)
  return [
    'CV Section Order:',
    ...sections.map((s, i) => `  [${i + 1}] ${s}`),
  ].join('\n');
}

/**
 * 5. Notion Surface View Affordance Helper.
 */
export function renderNotionViewAffordance(databaseName, viewType = 'Board') {
  const hints = {
    'Quest Board': {
      Board: 'Use the ⚔️ Pipeline Board view for visual drag-and-drop between stages.',
      Calendar: 'Use the 📆 Next Actions view to see deadlines aligned on your calendar.',
    },
    'Gate Intel': {
      Gallery: 'Use the 🏢 Company Gallery view for visual company dossier cards.',
    },
    'Hunter Network': {
      Gallery: 'Use the 👥 Network Gallery view to inspect contacts with recent touch signals.',
    },
    'Raids & Gatherings': {
      Timeline: 'Use the 🗺️ Event Timeline view to track upcoming networking dates.',
    },
  };

  const dbHints = hints[databaseName] || {};
  return dbHints[viewType] || `Open the native Notion ${viewType} view on ${databaseName} for an enhanced visual workspace.`;
}
