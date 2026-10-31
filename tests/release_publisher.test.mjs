import assert from 'node:assert/strict';
import test from 'node:test';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { exactHeadReleaseReviewState } from '../tools/review_policy.mjs';
import { verifyReleaseAuthorization } from '../tools/release_authorization.mjs';

const tag = 'v2.0.22';
const mergeSha = 'b'.repeat(40);
const headSha = 'a'.repeat(40);

test('combined status without trusted detailed identity cannot satisfy release review', () => {
  assert.equal(exactHeadReleaseReviewState([], 'TechSecWhisperer', headSha, {
    sha: headSha, complete: true,
    statuses: [{ context: 'AIN/Thermo-Nuclear Review', state: 'success', created_at: '2026-10-25T00:00:00Z' }],
  }).state, 'PENDING', 'combined status data cannot prove trusted creator or PR binding');
});

test('release review rejects stale and failed Thermo statuses and honors a human changes request', () => {
  assert.equal(exactHeadReleaseReviewState([], 'TechSecWhisperer', headSha, {
    sha: 'c'.repeat(40), complete: true,
    statuses: [{ context: 'AIN/Thermo-Nuclear Review', state: 'success' }],
  }, 'https://github.com/TechSecWhisperer/ars-infinita-notion/pull/119').state, 'PENDING');
  const targetUrl = 'https://github.com/TechSecWhisperer/ars-infinita-notion/pull/119';
  assert.equal(exactHeadReleaseReviewState([], 'TechSecWhisperer', headSha, {
    sha: headSha,
    statuses: [
      { id: 1, context: 'AIN/Thermo-Nuclear Review', state: 'success', creator: { id: 171330631 },
        target_url: targetUrl, description: `review-v1:${headSha}:${'a'.repeat(64)}`, created_at: '2026-10-25T00:00:00Z' },
      { id: 2, context: 'AIN/Thermo-Nuclear Review', state: 'failure', creator: { id: 171330631 },
        target_url: targetUrl, description: `review-v1:${headSha}:${'b'.repeat(64)}`, created_at: '2026-10-25T00:01:00Z' },
    ],
    complete: true,
  }, targetUrl).state, 'FAILED');
  assert.equal(exactHeadReleaseReviewState([{
    user: { login: 'reviewer' }, author_association: 'COLLABORATOR', state: 'CHANGES_REQUESTED',
    commit_id: headSha, submitted_at: '2026-10-25T00:00:00Z',
  }], 'TechSecWhisperer', headSha, {
    sha: headSha, complete: true,
    statuses: [{ context: 'AIN/Thermo-Nuclear Review', state: 'success' }],
  }).state, 'CHANGES_REQUESTED');
});

test('trusted status selection is current-head, writer, PR, digest, and newest-state bound', () => {
  const targetUrl = 'https://github.com/TechSecWhisperer/ars-infinita-notion/pull/119';
  const trusted = { id: 57291391882, context: 'AIN/Thermo-Nuclear Review', state: 'success',
    creator: { id: 171330631 }, target_url: targetUrl, description: `review-v1:${headSha}:${'d'.repeat(64)}`,
    updated_at: '2026-10-25T00:00:00Z' };
  const readback = (statuses, complete = true) => ({ sha: headSha, complete, statuses });
  assert.equal(exactHeadReleaseReviewState([], 'TechSecWhisperer', headSha,
    readback([trusted]), targetUrl).state, 'APPROVED');
  assert.equal(exactHeadReleaseReviewState([], 'TechSecWhisperer', headSha,
    readback([{ ...trusted, creator: { id: 1 } }]), targetUrl).state, 'PENDING');
  assert.equal(exactHeadReleaseReviewState([], 'TechSecWhisperer', headSha,
    readback([{ ...trusted, description: `review-v1:${'b'.repeat(40)}:${'d'.repeat(64)}` }]), targetUrl).state, 'PENDING');
  assert.equal(exactHeadReleaseReviewState([], 'TechSecWhisperer', headSha,
    readback([trusted, { ...trusted, id: trusted.id + 1, state: 'pending',
      description: `review-v1:${headSha}:pending`, updated_at: '2026-10-25T00:01:00Z' }]), targetUrl).state, 'PENDING');
  assert.equal(exactHeadReleaseReviewState([], 'TechSecWhisperer', headSha,
    readback([trusted], false), targetUrl).state, 'PENDING');
});

test('an eligible exact-head formal approval remains an allowed release review route', () => {
  assert.equal(exactHeadReleaseReviewState([{
    user: { login: 'reviewer' }, author_association: 'COLLABORATOR', state: 'APPROVED',
    commit_id: headSha, submitted_at: '2026-10-25T00:00:00Z',
  }], 'TechSecWhisperer', headSha, { complete: false, statuses: [] },
  'https://github.com/TechSecWhisperer/ars-infinita-notion/pull/119').method, 'formal-review');
});

function authorizationFixture({ draft = true, detailedStatusPages } = {}) {
  const policyPath = join(mkdtempSync(join(tmpdir(), 'release-policy-')), 'policy.json');
  writeFileSync(policyPath, JSON.stringify({
    version: 1,
    repository: 'TechSecWhisperer/ars-infinita-notion',
    requiredChecks: [
      { context: 'Delivery freshness', appId: 15368 },
      { context: 'Sealed-mechanics leak check', appId: 15368 },
      { context: 'Structural gate', appId: 15368 },
      { context: 'AIN/Thermo-Nuclear Review', appId: null },
    ],
  }));
  const release = { tag_name: tag, draft, prerelease: false, published_at: draft ? null : '2026-10-25T00:00:00Z' };
  const pull = {
    number: 119,
    state: 'MERGED',
    mergedAt: '2026-10-25T00:00:00Z',
    mergeCommit: { oid: mergeSha },
    headRefOid: headSha,
    author: { login: 'TechSecWhisperer' },
    labels: [{ name: 'release:player-facing' }],
  };
  const associated = [{ number: 119, merged_at: pull.mergedAt, merge_commit_sha: mergeSha,
    labels: [{ name: 'release:player-facing' }] }];
  const checkData = { check_runs: ['Delivery freshness', 'Sealed-mechanics leak check', 'Structural gate']
    .map((name) => ({ name, app: { id: 15368 }, status: 'completed', conclusion: 'success', completed_at: '2026-10-25T00:00:00Z' })) };
  const targetUrl = 'https://github.com/TechSecWhisperer/ars-infinita-notion/pull/119';
  const trustedStatus = { id: 57257156935, context: 'AIN/Thermo-Nuclear Review', state: 'success',
    creator: { id: 171330631, login: 'TechSecWhisperer' }, target_url: targetUrl,
    description: `review-v1:${headSha}:${'c'.repeat(64)}`, updated_at: '2026-10-25T00:00:00Z' };
  const statusData = { sha: headSha, statuses: [{ context: 'AIN/Thermo-Nuclear Review', state: 'success',
    updated_at: '2026-10-25T00:00:00Z' }] };
  const statusPages = detailedStatusPages || [[trustedStatus]];
  let pullReads = 0;
  const runGh = (args) => {
    if (args[0] === 'api') {
      const route = args.at(-1);
      if (args.includes('--paginate') && args.includes('--slurp')
          && route === 'repos/TechSecWhisperer/ars-infinita-notion/releases?per_page=100') {
        return JSON.stringify([[release]]);
      }
      if (route.endsWith(`/releases/tags/${tag}`)) return JSON.stringify(release);
      if (route.endsWith(`/commits/${tag}`)) return JSON.stringify({ sha: mergeSha });
      if (route.endsWith(`/commits/${mergeSha}/pulls`)) return JSON.stringify(associated);
      if (route.endsWith(`/commits/${headSha}/check-runs?per_page=100`)) return JSON.stringify(checkData);
      if (route.endsWith(`/commits/${headSha}/status`)) return JSON.stringify(statusData);
      if (args.includes('--paginate') && args.includes('--slurp')
          && route.endsWith(`/commits/${headSha}/statuses?per_page=100`)) return JSON.stringify(statusPages);
      if (route.includes(`/pulls/119/reviews?per_page=100`)) return JSON.stringify([[]]);
    }
    if (args[0] === 'pr' && args[1] === 'view') {
      pullReads += 1;
      return JSON.stringify(pull);
    }
    if (args[0] === 'release' && args[1] === 'list') {
      return JSON.stringify([{ tagName: 'v2.0.21', publishedAt: '2026-10-15T00:00:00Z', isDraft: false, isPrerelease: false }]);
    }
    throw new Error(`Unexpected GitHub call: ${args.join(' ')}`);
  };
  return { policyPath, release, runGh, cleanup: () => rmSync(join(policyPath, '..'), { recursive: true, force: true }) };
}

test('publisher authorization accepts a draft only for the pre-publication dispatch path', () => {
  const fixture = authorizationFixture({ draft: true });
  try {
    const result = verifyReleaseAuthorization(tag, { runGh: fixture.runGh, policyPath: fixture.policyPath, allowDraft: true });
    assert.equal(result.tag, tag);
    assert.equal(result.releaseState, 'draft');
    assert.equal(result.pullRequest, 119);
    assert.equal(result.sourceReviewMethod, 'trusted exact-head review status');
  } finally { fixture.cleanup(); }
});

test('publisher authorization rejects same-name status with wrong actor, digest, PR, or incomplete pages', () => {
  const valid = { id: 57257156935, context: 'AIN/Thermo-Nuclear Review', state: 'success',
    creator: { id: 171330631 }, target_url: 'https://github.com/TechSecWhisperer/ars-infinita-notion/pull/119',
    description: `review-v1:${headSha}:${'c'.repeat(64)}`, updated_at: '2026-10-25T00:00:00Z' };
  const invalidPages = [
    [[{ ...valid, creator: { id: 1 } }]],
    [[{ ...valid, id: 0 }]],
    [[{ ...valid, description: 'unbound review status' }]],
    [[{ ...valid, description: `review-v1:${'b'.repeat(40)}:${'c'.repeat(64)}` }]],
    [[{ ...valid, target_url: 'https://github.com/example/elsewhere/pull/1' }]],
    [[]],
    [[valid], null],
  ];
  for (const pages of invalidPages) {
    const fixture = authorizationFixture({ detailedStatusPages: pages });
    try {
      assert.throws(() => verifyReleaseAuthorization(tag, {
        runGh: fixture.runGh, policyPath: fixture.policyPath, allowDraft: true,
      }), /BLOCKED_RELEASE_EXACT_HEAD_REVIEW_UNKNOWN/);
    } finally { fixture.cleanup(); }
  }
});

test('draft release authorization reads the paginated list when the tag endpoint hides drafts', () => {
  const fixture = authorizationFixture({ draft: true });
  const requests = [];
  const runGh = (args) => {
    requests.push(args);
    if (args[0] === 'api' && args.at(-1) === `repos/TechSecWhisperer/ars-infinita-notion/releases/tags/${tag}`) {
      throw new Error('gh: Not Found (HTTP 404)');
    }
    if (args[0] === 'api' && args.at(-1) === 'repos/TechSecWhisperer/ars-infinita-notion/releases?per_page=100') {
      return JSON.stringify([[fixture.release]]);
    }
    return fixture.runGh(args);
  };
  try {
    const result = verifyReleaseAuthorization(tag, { runGh, policyPath: fixture.policyPath, allowDraft: true });
    assert.equal(result.releaseState, 'draft');
    assert.ok(requests.some((args) => args.includes('--paginate') && args.includes('--slurp')));
  } finally { fixture.cleanup(); }
});

test('draft dispatch cannot authorize an already published release', () => {
  const fixture = authorizationFixture({ draft: false });
  try {
    assert.throws(() => verifyReleaseAuthorization(tag, {
      runGh: fixture.runGh, policyPath: fixture.policyPath, allowDraft: true,
    }), /BLOCKED_RELEASE_DESTINATION_UNVERIFIED/);
  } finally { fixture.cleanup(); }
});

test('published-event authorization still requires an already published GitHub Release', () => {
  const fixture = authorizationFixture({ draft: true });
  try {
    assert.throws(() => verifyReleaseAuthorization(tag, {
      runGh: fixture.runGh, policyPath: fixture.policyPath, allowDraft: false,
    }), /BLOCKED_RELEASE_DESTINATION_UNVERIFIED/);
  } finally { fixture.cleanup(); }
});

test('publisher workflow exposes the explicit tag dispatch and checks out the requested release ref', async () => {
  const { readFileSync } = await import('node:fs');
  const workflow = readFileSync(new URL('../.github/workflows/npm-publish.yml', import.meta.url), 'utf8');
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /release_tag:/);
  assert.match(workflow, /ref:\s*\$\{\{\s*inputs\.release_tag\s*\}\}/);
  assert.match(workflow, /node tools\/release_authorization\.mjs "\$RELEASE_TAG" --allow-draft/);
  assert.match(workflow, /run-name:\s*Publish player release/);
});
