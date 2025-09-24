// src/lib/analytics.js
// Minimal, centralized analytics wrapper. Default: no-op.

export function track(eventName, payload = {}) {
  // Intentionally no-op by default.
  // Swap this implementation to wire a real SDK later (e.g., GA4, Segment).
}

export function communityView({ feedType }) {
  track('community_view', { feedType });
}

export function postOpen({ postId, feedType = 'unknown' }) {
  track('post_open', { postId, feedType });
}

export function postLike({ postId, liked }) {
  track('post_like', { postId, liked });
}

export function postComment({ postId, length }) {
  track('post_comment', { postId, length });
}

export function postOpenTraining({ postId, trainingId }) {
  track('post_open_training', { postId, trainingId });
}

export function filterApplied({ brands = [], tags = [], query = '' }) {
  track('filter_applied', { brands, tags, query });
}
