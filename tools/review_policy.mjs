export function exactHeadReviewState(reviews, authorLogin, headSha) {
  if (!Array.isArray(reviews) || !authorLogin || !/^[a-f0-9]{40}$/i.test(String(headSha || ''))) {
    return { state: 'UNKNOWN', approvedBy: [], changesRequestedBy: [] };
  }
  const latestByReviewer = new Map();
  for (const review of reviews) {
    const login = review?.user?.login;
    const association = String(review?.author_association || '').toUpperCase();
    const state = String(review?.state || '').toUpperCase();
    if (!login || login === authorLogin || review.dismissed_at
        || !['OWNER', 'MEMBER', 'COLLABORATOR'].includes(association)
        || !['APPROVED', 'CHANGES_REQUESTED', 'DISMISSED'].includes(state)
        || String(review.commit_id || '').toLowerCase() !== String(headSha).toLowerCase()) continue;
    const prior = latestByReviewer.get(login);
    const time = Date.parse(review.submitted_at || '');
    const priorTime = Date.parse(prior?.submitted_at || '');
    if (!prior || (Number.isFinite(time) ? time : 0) >= (Number.isFinite(priorTime) ? priorTime : 0)) {
      latestByReviewer.set(login, { ...review, state });
    }
  }
  const latest = [...latestByReviewer.values()];
  const approvedBy = latest.filter((review) => review.state === 'APPROVED').map((review) => review.user.login);
  const changesRequestedBy = latest.filter((review) => review.state === 'CHANGES_REQUESTED').map((review) => review.user.login);
  return {
    state: changesRequestedBy.length ? 'CHANGES_REQUESTED'
      : approvedBy.length ? 'APPROVED' : 'PENDING',
    approvedBy,
    changesRequestedBy,
  };
}

// The release publisher accepts the same formal-or-trusted policy as Admin.
// The combined commit-status view omits creator provenance, so callers must
// provide a complete paginated detailed-status readback for this exact PR.
const TRUSTED_REVIEW_CONTEXT = 'AIN/Thermo-Nuclear Review';
const TRUSTED_REVIEW_ACTOR_ID = 171330631;

function trustedReviewStatus(statusData, headSha, expectedTargetUrl) {
  if (statusData?.complete !== true || !Array.isArray(statusData.statuses)
      || String(statusData.sha || '').toLowerCase() !== String(headSha || '').toLowerCase()) return null;
  const latest = statusData.statuses
    .filter((status) => status?.context === TRUSTED_REVIEW_CONTEXT
      && Number(status?.creator?.id) === TRUSTED_REVIEW_ACTOR_ID
      && Number.isSafeInteger(Number(status?.id)) && Number(status.id) > 0)
    .sort((a, b) => {
      const at = Date.parse(a.updated_at || a.created_at || '');
      const bt = Date.parse(b.updated_at || b.created_at || '');
      return (Number.isFinite(at) ? at : 0) - (Number.isFinite(bt) ? bt : 0)
        || Number(a.id) - Number(b.id);
    }).at(-1);
  if (!latest) return null;
  const state = String(latest.state || '').toLowerCase();
  const digestBound = ['success', 'failure', 'error'].includes(state)
    ? new RegExp(`^review-v1:${String(headSha).toLowerCase()}:[a-f0-9]{64}$`).test(String(latest.description || ''))
    : latest.description === `review-v1:${String(headSha).toLowerCase()}:${state}`;
  const targetBound = Boolean(expectedTargetUrl)
    && latest.target_url === expectedTargetUrl
    && /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+$/.test(String(expectedTargetUrl));
  return digestBound && targetBound ? latest : null;
}

export function exactHeadReleaseReviewState(reviews, authorLogin, headSha, statusData, expectedTargetUrl) {
  if (!authorLogin || !/^[a-f0-9]{40}$/i.test(String(headSha || ''))) {
    return { state: 'UNKNOWN', approvedBy: [], changesRequestedBy: [], method: null };
  }
  const formal = exactHeadReviewState(reviews, authorLogin, headSha);
  if (formal.state === 'CHANGES_REQUESTED') return { ...formal, method: null };
  if (formal.state === 'APPROVED') return { ...formal, method: 'formal-review' };
  const status = trustedReviewStatus(statusData, headSha, expectedTargetUrl);
  if (status?.state === 'success') {
    return { state: 'APPROVED', approvedBy: [], changesRequestedBy: [], method: 'trusted exact-head review status' };
  }
  if (['failure', 'error'].includes(status?.state)) {
    return { state: 'FAILED', approvedBy: [], changesRequestedBy: [], method: null };
  }
  return { ...formal, method: null };
}
