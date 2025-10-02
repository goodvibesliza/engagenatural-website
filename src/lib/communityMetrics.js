// src/lib/communityMetrics.js
// Pure functions for community reporting metrics

/**
 * Get date range for metrics calculation
 * @param {number} days - Number of days back from now
 * @returns {Date} Date object representing the start of the range
 */
export function getDateRange(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Check if a timestamp is within the specified date range
 * @param {any} timestamp - Firebase timestamp or Date
 * @param {Date} rangeStart - Start date to compare against
 * @returns {boolean}
 */
export function isWithinRange(timestamp, rangeStart) {
  if (!timestamp) return false;
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date >= rangeStart;
}

/**
 * Calculate unique participating staff (users who liked or commented)
 * @param {Array} posts - Array of post objects
 * @param {Array} comments - Array of comment objects
 * @param {Array} likes - Array of like objects or posts with likes arrays
 * @param {number} days - Number of days to look back (7 or 30)
 * @returns {number} Count of unique participating users
 */
export function calcUniqueParticipants(posts = [], comments = [], likes = [], days = 30) {
  const rangeStart = getDateRange(days);
  const uniqueUsers = new Set();

  // Get users from comments within date range
  comments.forEach(comment => {
    if (comment.userId && isWithinRange(comment.createdAt, rangeStart)) {
      uniqueUsers.add(comment.userId);
    }
  });

  // Get users from likes - handle both individual like records and likes arrays on posts
  if (likes.length > 0 && likes[0].userId) {
    // Individual like records
    likes.forEach(like => {
      if (like.userId && isWithinRange(like.createdAt, rangeStart)) {
        uniqueUsers.add(like.userId);
      }
    });
  } else {
    // Likes embedded in posts - approximate by using posts within range
    posts.forEach(post => {
      if (isWithinRange(post.createdAt, rangeStart) && post.likes) {
        post.likes.forEach(userId => {
          uniqueUsers.add(userId);
        });
      }
    });
  }

  return uniqueUsers.size;
}

/**
 * Calculate training click-through rate from posts
 * @param {Array} posts - Array of post objects with analytics data
 * @param {number} days - Number of days to look back
 * @returns {Object} CTR data { ctr: number, opens: number, trainingClicks: number }
 */
export function calcCTR(posts = [], days = 30) {
  const rangeStart = getDateRange(days);
  
  let totalOpens = 0;
  let trainingClicks = 0;

  posts.forEach(post => {
    if (isWithinRange(post.publishedAt || post.createdAt, rangeStart)) {
      // Sum up post opens and training clicks from analytics data
      totalOpens += post.analytics?.post_open || 0;
      trainingClicks += post.analytics?.post_open_training || 0;
    }
  });

  const ctr = totalOpens > 0 ? (trainingClicks / totalOpens) * 100 : 0;

  return {
    ctr: Math.round(ctr * 100) / 100, // Round to 2 decimal places
    opens: totalOpens,
    trainingClicks
  };
}

/**
 * Bucket data by day for sparkline charts
 * @param {Array} items - Array of items with timestamps
 * @param {string} timestampField - Field name for timestamp (e.g., 'createdAt', 'publishedAt')
 * @param {string} valueField - Field name for value to sum (optional, defaults to count)
 * @param {number} days - Number of days to bucket
 * @returns {Array} Array of { date: Date, value: number }
 */
export function bucketByDay(items = [], timestampField = 'createdAt', valueField = null, days = 30) {
  const rangeStart = getDateRange(days);
  const buckets = new Map();

  // Initialize all days in range with 0
  for (let i = 0; i < days; i++) {
    const date = new Date(rangeStart);
    date.setDate(date.getDate() + i);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    buckets.set(dateKey, { date: new Date(date), value: 0 });
  }

  // Fill buckets with actual data
  items.forEach(item => {
    const timestamp = item[timestampField];
    if (!timestamp) return;

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (date >= rangeStart) {
      const dateKey = date.toISOString().split('T')[0];
      if (buckets.has(dateKey)) {
        const bucket = buckets.get(dateKey);
        if (valueField && typeof item[valueField] === 'number') {
          bucket.value += item[valueField];
        } else if (valueField && item[valueField] && typeof item[valueField].length === 'number') {
          bucket.value += item[valueField].length; // For arrays like likes, comments
        } else {
          bucket.value += 1; // Count items
        }
      }
    }
  });

  return Array.from(buckets.values()).sort((a, b) => a.date - b.date);
}

/**
 * Bucket data by week for bar charts
 * @param {Array} items - Array of items with timestamps
 * @param {string} timestampField - Field name for timestamp
 * @param {string} valueField - Field name for value to sum (optional, defaults to count)
 * @param {number} days - Number of days to look back
 * @returns {Array} Array of { week: string, value: number, startDate: Date }
 */
export function bucketByWeek(items = [], timestampField = 'createdAt', valueField = null, days = 30) {
  const rangeStart = getDateRange(days);
  const buckets = new Map();

  // Get start of first week (Sunday)
  const firstWeekStart = new Date(rangeStart);
  const dayOfWeek = firstWeekStart.getDay();
  firstWeekStart.setDate(firstWeekStart.getDate() - dayOfWeek);

  // Initialize weeks
  const numWeeks = Math.ceil(days / 7);
  for (let i = 0; i < numWeeks; i++) {
    const weekStart = new Date(firstWeekStart);
    weekStart.setDate(weekStart.getDate() + (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const weekKey = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
    buckets.set(weekKey, {
      week: weekKey,
      value: 0,
      startDate: new Date(weekStart),
      endDate: new Date(weekEnd)
    });
  }

  // Fill buckets with data
  items.forEach(item => {
    const timestamp = item[timestampField];
    if (!timestamp) return;

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (date >= rangeStart) {
      // Find which week this date belongs to
      for (const [weekKey, bucket] of buckets.entries()) {
        if (date >= bucket.startDate && date <= bucket.endDate) {
          if (valueField && typeof item[valueField] === 'number') {
            bucket.value += item[valueField];
          } else if (valueField && item[valueField] && typeof item[valueField].length === 'number') {
            bucket.value += item[valueField].length; // For arrays
          } else {
            bucket.value += 1; // Count items
          }
          break;
        }
      }
    }
  });

  return Array.from(buckets.values()).sort((a, b) => a.startDate - b.startDate);
}

/**
 * Calculate topline metrics for community reporting
 * @param {Array} posts - Array of post objects
 * @param {Array} comments - Array of comment objects  
 * @param {Array} likes - Array of like objects
 * @param {number} days - Number of days to look back
 * @returns {Object} Topline metrics object
 */
export function calcToplineMetrics(posts = [], comments = [], likes = [], days = 30) {
  const rangeStart = getDateRange(days);

  // Posts published in range
  const postsPublished = posts.filter(post => 
    post.status === 'published' && 
    isWithinRange(post.publishedAt || post.createdAt, rangeStart)
  ).length;

  // Unique participating staff
  const uniqueParticipants = calcUniqueParticipants(posts, comments, likes, days);

  // Total likes in range
  const totalLikes = comments.filter(comment => 
    isWithinRange(comment.createdAt, rangeStart)
  ).length;

  // Total comments in range
  const totalComments = comments.filter(comment => 
    isWithinRange(comment.createdAt, rangeStart)
  ).length;

  // Training CTR
  const ctrData = calcCTR(posts, days);

  return {
    postsPublished,
    uniqueParticipants,
    totalLikes: likes.length > 0 && likes[0].userId ? 
      likes.filter(like => isWithinRange(like.createdAt, rangeStart)).length :
      posts.filter(post => isWithinRange(post.createdAt, rangeStart))
        .reduce((sum, post) => sum + (post.likes?.length || 0), 0),
    totalComments,
    trainingCTR: ctrData.ctr,
    trainingClicks: ctrData.trainingClicks,
    postOpens: ctrData.opens
  };
}

/**
 * Generate simple sparkline coordinates for SVG
 * @param {Array} data - Array of { date, value } objects
 * @param {number} width - SVG width
 * @param {number} height - SVG height
 * @returns {string} SVG path string
 */
export function generateSparkline(data = [], width = 200, height = 50) {
  if (data.length === 0) return '';

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const valueRange = maxValue - minValue || 1;

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((point.value - minValue) / valueRange) * height;
    return `${x},${y}`;
  }).join(' ');

  return `M ${points.split(' ').join(' L ')}`;
}

/**
 * Format number with appropriate suffix (K, M)
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  } else {
    return num.toString();
  }
}

/**
 * Format percentage
 * @param {number} percent - Percentage to format
 * @returns {string} Formatted percentage string
 */
export function formatPercent(percent) {
  return `${percent.toFixed(1)}%`;
}