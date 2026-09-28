// Deterministic, read-only verifier for the player's boot health evidence.
// The agent gathers the evidence from the player's own Notion workspace and
// passes it here. This module never connects, writes, repairs, or infers.

const OUTCOMES = new Set(['PASS', 'FAIL', 'UNKNOWN']);
const PRESENT = new Set(['present', 'missing', 'unknown']);
const REACHABILITY = new Set(['reachable', 'unreachable', 'unknown']);

function valueAt(value, allowed) {
  return typeof value === 'string' && allowed.has(value) ? value : 'unknown';
}

function check(name, outcome, detail) {
  return { name, outcome, detail };
}

function fromReachability(name, value, detail) {
  const state = valueAt(value, REACHABILITY);
  if (state === 'reachable') return check(name, 'PASS', detail);
  if (state === 'unreachable') return check(name, 'FAIL', `${detail} is unreachable`);
  return check(name, 'UNKNOWN', `${detail} could not be verified`);
}

function fromPresence(name, value, detail) {
  const state = valueAt(value, PRESENT);
  if (state === 'present') return check(name, 'PASS', detail);
  if (state === 'missing') return check(name, 'FAIL', `${detail} is missing`);
  return check(name, 'UNKNOWN', `${detail} could not be verified`);
}

function kernelSurfaces(kernel) {
  const surfaces = kernel && typeof kernel.surfaces === 'object' ? kernel.surfaces : {};
  const required = ['instanceIds', 'player', 'versions', 'links'];
  const missing = required.filter((key) => valueAt(surfaces[key], PRESENT) === 'missing');
  const unknown = required.filter((key) => valueAt(surfaces[key], PRESENT) === 'unknown');
  if (missing.length) return check('kernel-surfaces', 'FAIL', `missing: ${missing.join(', ')}`);
  if (unknown.length) return check('kernel-surfaces', 'UNKNOWN', `unverified: ${unknown.join(', ')}`);
  return check('kernel-surfaces', 'PASS', 'required Kernel sections are present');
}

function ruleSurfaces(rules) {
  const manifest = fromPresence('rule-manifest', rules?.manifest, 'Rule Manifest');
  const feed = fromPresence('patch-feed', rules?.feed, 'Patch Feed');
  const checks = [manifest, feed];
  if (checks.some((item) => item.outcome === 'FAIL')) {
    return check('rule-surfaces', 'FAIL', 'one or more required rule surfaces are missing');
  }
  if (checks.some((item) => item.outcome === 'UNKNOWN')) {
    return check('rule-surfaces', 'UNKNOWN', 'one or more required rule surfaces are unverified');
  }
  return check('rule-surfaces', 'PASS', 'Rule Manifest and Patch Feed are present');
}

function versionAgreement(rules) {
  if (rules?.versionMatches === true) {
    return check('version-agreement', 'PASS', 'local rules match the published version');
  }
  if (rules?.versionMatches === false) {
    return check('version-agreement', 'FAIL', 'local rules do not match the published version');
  }
  return check('version-agreement', 'UNKNOWN', 'version agreement could not be verified');
}

/**
 * Verify one evidence object. Missing fields are UNKNOWN, never healthy.
 * @param {object} evidence
 * @returns {{outcome: string, exitCode: number, checks: Array<object>}}
 */
export function evaluatePlayerHomeCheck(evidence) {
  const input = evidence && typeof evidence === 'object' ? evidence : {};
  const notion = fromReachability('notion-reachability', input.notion?.status, 'Notion');
  const kernel = fromPresence('kernel-presence', input.kernel?.status, 'Kernel');
  const checks = [notion, kernel];

  if (kernel.outcome === 'PASS') checks.push(kernelSurfaces(input.kernel));
  else checks.push(check('kernel-surfaces', kernel.outcome, 'Kernel must be verified first'));

  if (notion.outcome === 'PASS') {
    const ruleReachability = fromReachability('rule-reachability', input.rules?.status, 'rule sources');
    checks.push(ruleReachability);
    if (ruleReachability.outcome === 'PASS') {
      checks.push(ruleSurfaces(input.rules));
      checks.push(versionAgreement(input.rules));
    } else {
      checks.push(check('rule-surfaces', ruleReachability.outcome,
        'rule sources must be reachable first'));
      checks.push(check('version-agreement', ruleReachability.outcome,
        'rule sources must be reachable first'));
    }
  } else {
    checks.push(check('rule-reachability', notion.outcome, 'Notion must be reachable first'));
    checks.push(check('rule-surfaces', notion.outcome, 'Notion must be reachable first'));
    checks.push(check('version-agreement', notion.outcome, 'Notion must be reachable first'));
  }

  const outcome = checks.some((item) => item.outcome === 'FAIL')
    ? 'FAIL'
    : checks.some((item) => item.outcome === 'UNKNOWN')
      ? 'UNKNOWN'
      : 'PASS';
  return { outcome, exitCode: outcome === 'PASS' ? 0 : outcome === 'FAIL' ? 1 : 2, checks };
}

export function assertOutcome(result) {
  if (!result || !OUTCOMES.has(result.outcome)) throw new Error('invalid home-check result');
  return result;
}
