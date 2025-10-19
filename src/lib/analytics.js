// src/lib/analytics.js
// Centralized analytics wrapper with lightweight dev logging.
import { getFlag } from './featureFlags.js'

const COMMUNITY_EVENTS = new Set([
  'community_view',
  'post_open',
  'post_like',
  'post_comment',
  'post_open_training',
  'filter_applied',
])

function isMobileViewport() {
  if (typeof window === 'undefined') return false
  try {
    if (typeof window.matchMedia === 'function') {
      return window.matchMedia('(max-width: 767.98px)').matches
    }
    return window.innerWidth < 768
  } catch {
    return false
  }
}

function computeUiVariant() {
  const skin = (getFlag('EN_MOBILE_FEED_SKIN') || '').toString().toLowerCase()
  const isMobile = isMobileViewport()
  return isMobile && skin === 'linkedin' ? 'mobile_linkedin' : 'default'
}

export function track(eventName, payload = {}) {
  const augmented = COMMUNITY_EVENTS.has(eventName)
    ? { ...payload, ui_variant: computeUiVariant() }
    : payload

  // Dev console log for visibility
  if (typeof window !== 'undefined' && import.meta?.env?.DEV) {
    try { console.log('[analytics]', eventName, augmented) } catch (err) { void err }
  }

  // No-op placeholder for real SDK wiring (e.g., GA4, Segment)
}

export function communityView({ feedType, via, brandId, subtab }) {
  const payload = { feedType };
  if (via) payload.via = via;
  if (brandId) payload.brandId = brandId;
  if (subtab) payload.subtab = subtab;
  track('community_view', payload);
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
