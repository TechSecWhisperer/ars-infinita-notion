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
