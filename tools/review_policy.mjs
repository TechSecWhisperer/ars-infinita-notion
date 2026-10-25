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

// The repository's required-check policy names its trusted automated review
// status explicitly. Where branch protection permits zero formal approvals,
// an exact-head passing Thermo review satisfies that policy. Human changes
// requests still veto release authorization.
export function exactHeadReleaseReviewState(reviews, authorLogin, headSha, statusData) {
  const formal = exactHeadReviewState(reviews, authorLogin, headSha);
  if (formal.state === 'CHANGES_REQUESTED') return { ...formal, method: null };

  const validSha = /^[a-f0-9]{40}$/i.test(String(headSha || ''));
  const exactStatus = validSha
    && String(statusData?.sha || '').toLowerCase() === String(headSha).toLowerCase();
  if (!exactStatus) return { state: 'UNKNOWN', approvedBy: [], changesRequestedBy: [], method: null };
  const latestThermo = (Array.isArray(statusData.statuses) ? statusData.statuses : [])
    .filter((status) => status.context === 'AIN/Thermo-Nuclear Review')
    .sort((a, b) => Date.parse(a.updated_at || a.created_at || '') - Date.parse(b.updated_at || b.created_at || '')).at(-1);

  if (formal.state === 'APPROVED') return { ...formal, method: 'formal-review' };
  if (latestThermo?.state === 'success') {
    return { state: 'APPROVED', approvedBy: [], changesRequestedBy: [], method: 'thermo-review' };
  }
  if (latestThermo?.state && latestThermo.state !== 'success') {
    return { state: 'FAILED', approvedBy: [], changesRequestedBy: [], method: null };
  }
  return { ...formal, method: null };
}
