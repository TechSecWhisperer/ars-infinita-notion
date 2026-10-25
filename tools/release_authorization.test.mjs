import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  evaluatePublisherCadence,
  evaluateRequiredReleaseChecks,
  readRequiredCheckPolicy,
  releaseAncestryContains,
  validateRequiredCheckPolicy,
} from './release_authorization.mjs';
import { exactHeadReviewState } from './review_policy.mjs';

test('publisher cadence excludes the release that triggered a retry', () => {
  const releases = [
    { tagName: 'v2.0.22', isDraft: false, isPrerelease: false, publishedAt: '2026-10-21T11:59:00Z' },
    { tagName: 'v2.0.21', isDraft: false, isPrerelease: false, publishedAt: '2026-10-20T00:00:00Z' },
  ];
  assert.equal(evaluatePublisherCadence(releases, {
    currentTag: 'v2.0.22', now: '2026-10-21T12:00:00Z',
  }).allowed, true);
  assert.equal(evaluatePublisherCadence(releases, {
    currentTag: 'v2.0.23', now: '2026-10-21T12:00:00Z',
  }).reason, 'minimum-release-interval');
});

test('publisher cadence honors the weekly limit and only an approved emergency exemption', () => {
  const releases = ['20', '19', '18', '17'].map((day) => ({
    tagName: `v2.0.${day}`, isDraft: false, isPrerelease: false,
    publishedAt: `2026-10-${day}T00:00:00Z`,
  }));
  assert.equal(evaluatePublisherCadence(releases, { currentTag: 'v2.0.21', now: '2026-10-21T12:00:00Z' }).reason,
    'weekly-release-limit');
  assert.equal(evaluatePublisherCadence(releases, {
    currentTag: 'v2.0.21', emergency: true, now: '2026-10-21T12:00:00Z',
  }).allowed, true);
});

test('publisher requires every protected check and binds app-scoped checks to the configured app', () => {
  const required = [
    { context: 'Build', app_id: 77 },
    { context: 'Security', app_id: null },
  ];
  const pass = evaluateRequiredReleaseChecks(required, [
    { name: 'Build', app: { id: 77 }, status: 'completed', conclusion: 'success', completed_at: '2026-10-21T00:00:00Z' },
  ], [{ context: 'Security', state: 'success', updated_at: '2026-10-21T00:00:00Z' }]);
  assert.equal(pass.passed, true);
  assert.equal(evaluateRequiredReleaseChecks(required, [
    { name: 'Build', app: { id: 9 }, status: 'completed', conclusion: 'success' },
  ], [{ context: 'Security', state: 'success' }]).passed, false);
  assert.equal(evaluateRequiredReleaseChecks(required, [
    { name: 'Security', app: { id: 999 }, status: 'completed', conclusion: 'success' },
  ], [{ context: 'Security', state: 'failure' }]).passed, false);
  assert.equal(evaluateRequiredReleaseChecks([], [], []).reason, 'required-check-policy-unavailable');
});

test('release ancestry is established by the GitHub comparison direction', () => {
  assert.equal(releaseAncestryContains({ status: 'ahead', ahead_by: 3, behind_by: 0 }), true);
  assert.equal(releaseAncestryContains({ status: 'identical', ahead_by: 0, behind_by: 0 }), true);
  assert.equal(releaseAncestryContains({ status: 'behind', ahead_by: 0, behind_by: 2 }), false);
  assert.equal(releaseAncestryContains(null), false);
});

test('release checks come from a reviewed repository policy and bind to the Actions app', () => {
  const policy = readRequiredCheckPolicy();
  assert.deepEqual(policy.required.map((item) => item.context), [
    'Delivery freshness', 'Sealed-mechanics leak check', 'Structural gate', 'AIN/Thermo-Nuclear Review',
  ]);
  assert.ok(policy.required.slice(0, 3).every((item) => item.app_id === 15368));
  assert.equal(policy.required[3].app_id, null);
  assert.match(policy.digest, /^[a-f0-9]{64}$/);
  assert.throws(() => validateRequiredCheckPolicy({
    version: 1, repository: 'TechSecWhisperer/ars-infinita-notion',
    requiredChecks: [{ context: 'Sealed-mechanics leak check', appId: 1 }, { context: 'Sealed-mechanics leak check', appId: 15368 }],
  }), /BLOCKED_RELEASE_REQUIRED_CHECK_POLICY_INVALID/);
  assert.throws(() => validateRequiredCheckPolicy({
    version: 1, repository: 'TechSecWhisperer/ars-infinita-notion',
    requiredChecks: [{ context: 'Sealed-mechanics leak check', appId: null }],
  }), /BLOCKED_RELEASE_REQUIRED_CHECK_POLICY_INVALID/);
});

test('Actions release policy names match actual workflow job check-runs', () => {
  const workflowJobs = [
    ['Delivery freshness', '.github/workflows/delivery-freshness.yml', 'delivery-gate'],
    ['Sealed-mechanics leak check', '.github/workflows/leak-check.yml', 'leak-check'],
    ['Structural gate', '.github/workflows/structural-gate.yml', 'structural-gate'],
  ];
  for (const [expected, file, jobId] of workflowJobs) {
    const lines = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8').split(/\r?\n/);
    const start = lines.findIndex((line) => line === `  ${jobId}:`);
    assert.notEqual(start, -1, `${file} must define job ${jobId}`);
    const endOffset = lines.slice(start + 1).findIndex((line) => /^  [A-Za-z0-9_-]+:\s*$/.test(line));
    const block = lines.slice(start + 1, endOffset < 0 ? undefined : start + 1 + endOffset);
    const declaredName = block.find((line) => /^    name:\s*/.test(line))?.replace(/^    name:\s*/, '').trim();
    const jobContext = declaredName || jobId;
    assert.equal(jobContext, expected, `${file} check-run name must match the release policy`);
  }
});

test('publisher requires an independent approval bound to the exact PR head', () => {
  const sha = 'a'.repeat(40);
  const author = 'change-author';
  const review = (login, state, commit_id = sha, submitted_at = '2026-10-21T00:00:00Z') => ({
    user: { login }, author_association: 'COLLABORATOR', state, commit_id, submitted_at,
  });
  assert.equal(exactHeadReviewState([review(author, 'APPROVED')], author, sha).state, 'PENDING');
  assert.equal(exactHeadReviewState([review('reviewer', 'APPROVED', 'b'.repeat(40))], author, sha).state, 'PENDING');
  assert.equal(exactHeadReviewState([
    review('reviewer-one', 'APPROVED'),
    review('reviewer-two', 'CHANGES_REQUESTED'),
  ], author, sha).state, 'CHANGES_REQUESTED');
  assert.equal(exactHeadReviewState([review('reviewer', 'APPROVED')], author, sha).state, 'APPROVED');
});
