// src/lib/communityAdapter.js
// Pure functions to compute community metrics from client-side data

/**
 * Find existing community for a brand from communities array
 * @param {Array} communities - Array of community objects
 * @param {string} brandId - Brand ID to search for
 * @returns {Object|null} First community found for the brand, or null
 */
export function findBrandCommunity(communities = [], brandId) {
  if (!brandId) return null;
  return communities.find(community => community.brandId === brandId) || null;
}

/**
 * Get date range boundaries for metrics calculation
 * @param {number} days - Number of days back from now
 * @returns {Date} Date object representing the boundary
 */
export function getDateBoundary(days) {
  const boundary = new Date();
  boundary.setDate(boundary.getDate() - days);
  boundary.setHours(0, 0, 0, 0);
  return boundary;
}

/**
 * Check if a timestamp is within the specified date range
 * @param {any} timestamp - Firebase timestamp or Date
 * @param {Date} boundary - Date boundary to compare against
 * @returns {boolean}
 */
export function isWithinDateRange(timestamp, boundary) {
  if (!timestamp) return false;
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date >= boundary;
}

/**
 * Compute post metrics for 7 and 30 day periods
 * @param {Array} posts - Array of post objects with createdAt timestamps
 * @returns {Object} Object with posts7d and posts30d counts
 */
export function computePostMetrics(posts = []) {
  const boundary7d = getDateBoundary(7);
  const boundary30d = getDateBoundary(30);
  
  const posts7d = posts.filter(post => isWithinDateRange(post.createdAt, boundary7d)).length;
  const posts30d = posts.filter(post => isWithinDateRange(post.createdAt, boundary30d)).length;
  
  return { posts7d, posts30d };
}

/**
 * Compute unique staff metrics for 7 and 30 day periods
 * @param {Array} posts - Array of post objects with userId and createdAt
 * @param {Array} comments - Array of comment objects with userId and createdAt
 * @returns {Object} Object with uniqueStaff7d and uniqueStaff30d counts
 */
export function computeUniqueStaffMetrics(posts = [], comments = []) {
  const boundary7d = getDateBoundary(7);
  const boundary30d = getDateBoundary(30);
  
  // Collect unique user IDs from posts and comments within date ranges
  const users7d = new Set();
  const users30d = new Set();
  
  // Add users from posts
  posts.forEach(post => {
    if (post.userId) {
      if (isWithinDateRange(post.createdAt, boundary7d)) {
        users7d.add(post.userId);
      }
      if (isWithinDateRange(post.createdAt, boundary30d)) {
        users30d.add(post.userId);
      }
    }
  });
  
  // Add users from comments
  comments.forEach(comment => {
    if (comment.userId) {
      if (isWithinDateRange(comment.createdAt, boundary7d)) {
        users7d.add(comment.userId);
      }
      if (isWithinDateRange(comment.createdAt, boundary30d)) {
        users30d.add(comment.userId);
      }
    }
  });
  
  return {
    uniqueStaff7d: users7d.size,
    uniqueStaff30d: users30d.size
  };
}

/**
 * Compute like metrics for 7 and 30 day periods
 * @param {Array} posts - Array of post objects with likeCount and createdAt
 * @param {Array} likes - Array of like objects with createdAt (if available)
 * @returns {Object} Object with likes7d and likes30d counts
 */
export function computeLikeMetrics(posts = [], likes = []) {
  const boundary7d = getDateBoundary(7);
  const boundary30d = getDateBoundary(30);
  
  let likes7d = 0;
  let likes30d = 0;
  
  // If we have individual like records with timestamps, use those
  if (likes.length > 0 && likes[0].createdAt) {
    likes7d = likes.filter(like => isWithinDateRange(like.createdAt, boundary7d)).length;
    likes30d = likes.filter(like => isWithinDateRange(like.createdAt, boundary30d)).length;
  } else {
    // Otherwise, sum like counts from posts within the date range
    posts.forEach(post => {
      const likeCount = post.likeCount || 0;
      if (isWithinDateRange(post.createdAt, boundary7d)) {
        likes7d += likeCount;
      }
      if (isWithinDateRange(post.createdAt, boundary30d)) {
        likes30d += likeCount;
      }
    });
  }
  
  return { likes7d, likes30d };
}

/**
 * Compute comment metrics for 7 and 30 day periods
 * @param {Array} comments - Array of comment objects with createdAt timestamps
 * @returns {Object} Object with comments7d and comments30d counts
 */
export function computeCommentMetrics(comments = []) {
  const boundary7d = getDateBoundary(7);
  const boundary30d = getDateBoundary(30);
  
  const comments7d = comments.filter(comment => isWithinDateRange(comment.createdAt, boundary7d)).length;
  const comments30d = comments.filter(comment => isWithinDateRange(comment.createdAt, boundary30d)).length;
  
  return { comments7d, comments30d };
}

/**
 * Get the most recent activity date from posts and comments
 * @param {Array} posts - Array of post objects with createdAt
 * @param {Array} comments - Array of comment objects with createdAt
 * @returns {Date|null} Most recent activity date or null if no activity
 */
export function getLastActivityDate(posts = [], comments = []) {
  const allDates = [];
  
  // Collect all post dates
  posts.forEach(post => {
    if (post.createdAt) {
      const date = post.createdAt.toDate ? post.createdAt.toDate() : new Date(post.createdAt);
      allDates.push(date);
    }
  });
  
  // Collect all comment dates
  comments.forEach(comment => {
    if (comment.createdAt) {
      const date = comment.createdAt.toDate ? comment.createdAt.toDate() : new Date(comment.createdAt);
      allDates.push(date);
    }
  });
  
  // Return most recent date or null if no dates
  return allDates.length > 0 ? new Date(Math.max(...allDates)) : null;
}

/**
 * Compute all community metrics from raw data arrays
 * @param {Object} data - Object containing posts, comments, likes arrays
 * @returns {Object} Complete metrics object for the community
 */
export function computeCommunityMetrics(data = {}) {
  const { posts = [], comments = [], likes = [] } = data;
  
  const postMetrics = computePostMetrics(posts);
  const staffMetrics = computeUniqueStaffMetrics(posts, comments);
  const likeMetrics = computeLikeMetrics(posts, likes);
  const commentMetrics = computeCommentMetrics(comments);
  const lastActivity = getLastActivityDate(posts, comments);
  
  return {
    ...postMetrics,
    ...staffMetrics,
    ...likeMetrics,
    ...commentMetrics,
    lastActivity
  };
}

/**
 * Format relative time for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted relative time string
 */
export function formatRelativeTime(date) {
  if (!date) return 'Never';
  
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 60) {
    return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffDays < 30) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}