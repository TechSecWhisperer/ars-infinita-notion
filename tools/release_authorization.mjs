#!/usr/bin/env node
// Independent fail-closed authorization for the npm publisher. The Admin
// ritual is the only release creator; this gate proves its release event is
// still backed by the opted-in merged PR and current required checks.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { exactHeadReleaseReviewState } from './review_policy.mjs';

const REPOSITORY = 'TechSecWhisperer/ars-infinita-notion';
const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const REQUIRED_CHECK_POLICY = join(REPO_ROOT, 'release-check-policy.json');
const STATUS_CONTEXTS = new Set(['AIN/Thermo-Nuclear Review']);

export function validateRequiredCheckPolicy(value, repository = REPOSITORY) {
  if (!value || value.version !== 1 || value.repository !== repository
      || !Array.isArray(value.requiredChecks) || value.requiredChecks.length < 1
      || value.requiredChecks.length > 30) {
    throw new Error('BLOCKED_RELEASE_REQUIRED_CHECK_POLICY_INVALID');
  }
  const names = new Set();
  const required = value.requiredChecks.map((item) => {
    const context = String(item?.context || '').trim();
    const appId = item?.appId;
    if (!context || context.length > 120 || names.has(context)
        || !(Number.isSafeInteger(appId) && appId > 0 || appId === null && STATUS_CONTEXTS.has(context))) {
      throw new Error('BLOCKED_RELEASE_REQUIRED_CHECK_POLICY_INVALID');
    }
    names.add(context);
    return { context, app_id: appId };
  });
  return required;
}

export function readRequiredCheckPolicy(path = REQUIRED_CHECK_POLICY, repository = REPOSITORY) {
  let bytes;
  let value;
  try {
    bytes = readFileSync(path);
    value = JSON.parse(bytes.toString('utf8'));
  } catch {
    throw new Error('BLOCKED_RELEASE_REQUIRED_CHECK_POLICY_UNAVAILABLE');
  }
  return {
    required: validateRequiredCheckPolicy(value, repository),
    digest: createHash('sha256').update(bytes).digest('hex'),
  };
}

export function releaseAncestryContains(compare) {
  return compare?.behind_by === 0 && ['ahead', 'identical'].includes(compare?.status);
}

export function evaluateRequiredReleaseChecks(required, checkRuns, statuses) {
  if (!Array.isArray(required) || required.length === 0) return { passed: false, reason: 'required-check-policy-unavailable' };
  const names = required.map((item) => typeof item === 'string' ? { context: item, app_id: null } : item)
    .filter((item) => typeof item.context === 'string' && item.context.length > 0);
  if (names.length !== required.length) return { passed: false, reason: 'required-check-policy-invalid' };
  const outcomes = names.map((requirement) => {
    const runs = (requirement.app_id == null ? [] : (checkRuns || []).filter((run) => run.name === requirement.context
      && Number(run.app?.id) === Number(requirement.app_id)))
      .sort((a, b) => Date.parse(a.completed_at || a.started_at || '') - Date.parse(b.completed_at || b.started_at || ''));
    const run = runs.at(-1);
    if (run) return { context: requirement.context,
      passed: run.status === 'completed' && run.conclusion === 'success' };
    if (requirement.app_id != null) return { context: requirement.context, passed: false };
    const matching = (statuses || []).filter((status) => status.context === requirement.context)
      .sort((a, b) => Date.parse(a.updated_at || '') - Date.parse(b.updated_at || ''));
    return { context: requirement.context, passed: matching.at(-1)?.state === 'success' };
  });
  return { passed: outcomes.every((outcome) => outcome.passed), reason: outcomes.every((outcome) => outcome.passed)
    ? null : 'required-checks-not-green', outcomes };
}

export function evaluatePublisherCadence(releases, { currentTag, emergency = false, now = new Date() } = {}) {
  const nowMs = new Date(now).getTime();
  if (!Array.isArray(releases) || !Number.isFinite(nowMs)) return { allowed: false, reason: 'release-history-unknown' };
  const prior = releases.filter((release) => release.tagName !== currentTag
    && release.isDraft !== true && release.isPrerelease !== true)
    .map((release) => Date.parse(release.publishedAt || ''))
    .filter((time) => Number.isFinite(time) && time <= nowMs)
    .sort((a, b) => b - a);
  if (emergency) return { allowed: true, reason: 'approved-emergency', recentCount: prior.filter((time) => nowMs - time < 168 * 3600_000).length };
  const recent = prior.filter((time) => nowMs - time < 168 * 3600_000);
  if (recent.length >= 4) return { allowed: false, reason: 'weekly-release-limit', recentCount: recent.length };
  if (recent.length && nowMs - recent[0] < 24 * 3600_000) {
    return { allowed: false, reason: 'minimum-release-interval', recentCount: recent.length };
  }
  return { allowed: true, reason: 'cadence-clear', recentCount: recent.length };
}

function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30_000 }).trim();
}

function readDetailedCommitStatuses(runGh, sha) {
  try {
    const pages = JSON.parse(runGh(['api', '--paginate', '--slurp',
      `repos/${REPOSITORY}/commits/${sha}/statuses?per_page=100`]));
    if (!Array.isArray(pages) || pages.length < 1 || pages.some((page) => !Array.isArray(page) || page.length > 100)) {
      return { sha, complete: false, statuses: [] };
    }
    const statuses = pages.flat();
    if (statuses.length > 10_000 || (pages.length === 100 && pages.at(-1).length === 100)) {
      return { sha, complete: false, statuses: [] };
    }
    return { sha, complete: true, statuses };
  } catch {
    return { sha, complete: false, statuses: [] };
  }
}

export function verifyReleaseAuthorization(tag, { runGh = gh, policyPath = REQUIRED_CHECK_POLICY, allowDraft = false } = {}) {
  const api = (path) => JSON.parse(runGh(['api', `repos/${REPOSITORY}/${path}`]));
  if (!/^v\d+\.\d+\.\d+$/.test(String(tag || ''))) throw new Error('BLOCKED_RELEASE_TAG_INVALID');
  let release;
  if (allowDraft) {
    // GitHub's tag-specific release endpoint can return 404 for drafts even
    // when the same credential can list the repository's draft releases.
    const releasePages = JSON.parse(runGh(['api', '--paginate', '--slurp',
      `repos/${REPOSITORY}/releases?per_page=100`]));
    if (!Array.isArray(releasePages) || !releasePages.every(Array.isArray)) {
      throw new Error('BLOCKED_RELEASE_DESTINATION_UNVERIFIED');
    }
    const matches = releasePages.flat().filter((item) => item?.tag_name === tag);
    if (matches.length !== 1) throw new Error('BLOCKED_RELEASE_DESTINATION_UNVERIFIED');
    release = matches[0];
  } else {
    release = api(`releases/tags/${encodeURIComponent(tag)}`);
  }
  const releaseState = allowDraft ? 'draft' : 'published';
  const validReleaseState = allowDraft
    ? release.draft === true && !release.published_at
    : release.draft === false && Boolean(release.published_at);
  if (release.tag_name !== tag || !validReleaseState || release.prerelease !== false) {
    throw new Error('BLOCKED_RELEASE_DESTINATION_UNVERIFIED');
  }
  const commit = api(`commits/${encodeURIComponent(tag)}`);
  const releaseSha = commit?.sha;
  if (!/^[a-f0-9]{40}$/i.test(String(releaseSha || ''))) throw new Error('BLOCKED_RELEASE_TAG_SHA_UNKNOWN');

  const associated = api(`commits/${releaseSha}/pulls`);
  if (!Array.isArray(associated)) throw new Error('BLOCKED_RELEASE_PR_ASSOCIATION_UNKNOWN');
  const optedIn = associated.filter((pr) => pr.merged_at && String(pr.merge_commit_sha || '').toLowerCase() === releaseSha.toLowerCase()
    && (pr.labels || []).some((label) => ['release:player-facing', 'release:emergency'].includes(label.name)));
  if (optedIn.length !== 1) throw new Error('BLOCKED_RELEASE_PR_INTENT_UNKNOWN');

  const prNumber = Number(optedIn[0].number);
  const pr = JSON.parse(runGh(['pr', 'view', String(prNumber), '--repo', REPOSITORY,
    '--json', 'number,state,mergedAt,mergeCommit,headRefOid,author,labels']));
  if (pr.state !== 'MERGED' || !pr.mergedAt
      || String(pr.mergeCommit?.oid || '').toLowerCase() !== releaseSha.toLowerCase()
      || !/^[a-f0-9]{40}$/i.test(String(pr.headRefOid || ''))) throw new Error('BLOCKED_RELEASE_SOURCE_REVIEW_UNKNOWN');
  const reviewRows = JSON.parse(runGh(['api', '--paginate', '--slurp', `repos/${REPOSITORY}/pulls/${prNumber}/reviews?per_page=100`])).flat();
  const { required, digest: requiredCheckPolicyDigest } = readRequiredCheckPolicy(policyPath);
  const checkData = api(`commits/${pr.headRefOid}/check-runs?per_page=100`);
  const statusData = api(`commits/${pr.headRefOid}/status`);
  const detailedStatusData = readDetailedCommitStatuses(runGh, pr.headRefOid);
  const expectedTargetUrl = `https://github.com/${REPOSITORY}/pull/${prNumber}`;
  const reviewOutcome = exactHeadReleaseReviewState(reviewRows, pr.author?.login, pr.headRefOid,
    detailedStatusData, expectedTargetUrl);
  if (reviewOutcome.state !== 'APPROVED') throw new Error('BLOCKED_RELEASE_EXACT_HEAD_REVIEW_UNKNOWN');

  const checkResult = evaluateRequiredReleaseChecks(required, checkData.check_runs, statusData.statuses);
  if (!checkResult.passed) throw new Error(`BLOCKED_RELEASE_CHECKS:${checkResult.reason}`);

  const [latestPr, latestReviewRows, latestCheckData, latestStatusData] = [
    JSON.parse(runGh(['pr', 'view', String(prNumber), '--repo', REPOSITORY,
      '--json', 'state,mergedAt,mergeCommit,headRefOid,author'])),
    JSON.parse(runGh(['api', '--paginate', '--slurp', `repos/${REPOSITORY}/pulls/${prNumber}/reviews?per_page=100`])).flat(),
    api(`commits/${pr.headRefOid}/check-runs?per_page=100`),
    api(`commits/${pr.headRefOid}/status`),
  ];
  const latestDetailedStatusData = readDetailedCommitStatuses(runGh, latestPr.headRefOid);
  const latestReviewOutcome = exactHeadReleaseReviewState(latestReviewRows, latestPr.author?.login,
    latestPr.headRefOid, latestDetailedStatusData, expectedTargetUrl);
  const latestCheckResult = evaluateRequiredReleaseChecks(required, latestCheckData.check_runs, latestStatusData.statuses);
  if (latestPr.state !== 'MERGED' || !latestPr.mergedAt
      || latestPr.headRefOid !== pr.headRefOid
      || String(latestPr.mergeCommit?.oid || '').toLowerCase() !== releaseSha.toLowerCase()
      || latestPr.author?.login !== pr.author?.login
      || latestReviewOutcome.state !== 'APPROVED'
      || latestReviewOutcome.method !== reviewOutcome.method
      || !latestCheckResult.passed) {
    throw new Error('BLOCKED_RELEASE_SOURCE_CHANGED_DURING_CHECK');
  }

  const releases = JSON.parse(runGh(['release', 'list', '--repo', REPOSITORY, '--limit', '1000',
    '--json', 'tagName,publishedAt,isDraft,isPrerelease']));
  const emergency = (pr.labels || []).some((label) => label.name === 'release:emergency');
  const cadence = evaluatePublisherCadence(releases, { currentTag: tag, emergency });
  if (!cadence.allowed) throw new Error(`BLOCKED_RELEASE_CADENCE:${cadence.reason}`);
  return { tag, releaseSha, releaseState, pullRequest: prNumber, exactHeadSha: pr.headRefOid,
    sourceReviewMethod: reviewOutcome.method,
    requiredCheckCount: required.length, requiredCheckPolicyDigest, cadence };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = verifyReleaseAuthorization(process.argv[2] || process.env.GITHUB_REF_NAME, {
      allowDraft: process.argv.includes('--allow-draft'),
    });
    console.log(`RELEASE_AUTHORIZED ${JSON.stringify(result)}`);
  } catch (error) {
    console.error(String(error?.message || 'BLOCKED_RELEASE_AUTHORIZATION').slice(0, 200));
    process.exitCode = 2;
  }
}
