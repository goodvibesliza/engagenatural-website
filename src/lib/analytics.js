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

// Brand Manager Events
export function brandCommunitiesView() {
  track('brand_communities_view', {});
}

export function brandCommunityOpen({ communityId }) {
  track('brand_community_open', { communityId });
}

export function brandPostCreate({ communityId, postId }) {
  track('brand_post_create', { communityId, postId });
}

export function brandPostPublish({ postId }) {
  track('brand_post_publish', { postId });
}

export function brandPostUpdate({ postId }) {
  track('brand_post_update', { postId });
}

export function brandPostDelete({ postId }) {
  track('brand_post_delete', { postId });
}

export function brandReportView({ range }) {
  track('brand_report_view', { range });
}

// Training-related events for brand managers
export function brandPostAttachTraining({ postId, trainingId }) {
  track('brand_post_attach_training', { postId, trainingId });
}

export function brandTrainingPreview({ trainingId }) {
  track('brand_training_preview', { trainingId });
}

export function brandTrainingFilterToggle({ trainingId, enabled, postCount }) {
  track('brand_training_filter_toggle', { trainingId, enabled, postCount });
}

export function brandPostLinkTraining({ postId, trainingId }) {
  track('brand_post_link_training', { postId, trainingId });
}

export function brandPostUnlinkTraining({ postId, trainingId }) {
  track('brand_post_unlink_training', { postId, trainingId });
}
