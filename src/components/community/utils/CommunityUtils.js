// Basic category definitions
export const postCategories = [
  {
    id: 'discussion',
    name: 'Discussion',
    icon: '💬',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'question',
    name: 'Question',
    icon: '❓',
    color: 'bg-purple-100 text-purple-800'
  },
  {
    id: 'product-drop',
    name: 'Product Drop',
    icon: '🆕',
    color: 'bg-green-100 text-green-800'
  },
  {
    id: 'review',
    name: 'Review',
    icon: '⭐',
    color: 'bg-yellow-100 text-yellow-800'
  }
];

// Basic reaction types
export const reactionTypes = [
  {
    id: 'like',
    emoji: '👍',
    label: 'Like',
    color: 'bg-blue-100'
  },
  {
    id: 'love',
    emoji: '❤️',
    label: 'Love',
    color: 'bg-red-100'
  }
];

// Basic badge definitions
export const badges = [
  {
    id: 'verified',
    name: 'Verified',
    icon: '✓',
    color: 'bg-blue-500 text-white'
  },
  {
    id: 'expert',
    name: 'Expert',
    icon: '🔬',
    color: 'bg-purple-500 text-white'
  }
];

// Format timestamp to relative time
export const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const seconds = Math.floor((now - date) / 1000);
  
  // Simple relative time format
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
};

// Calculate user level based on points
export const calculateLevel = (points) => {
  return {
    level: 1,
    title: 'Newcomer',
    currentPoints: points,
    nextLevelPoints: 100,
    pointsNeeded: 100 - points,
    progressPercent: Math.min(100, points)
  };
};

// Extract hashtags from post content
export const extractHashtags = (content) => {
  if (!content) return [];
  const matches = content.match(/#[\w-]+/g);
  return matches ? matches.map(tag => tag.substring(1)) : [];
};
