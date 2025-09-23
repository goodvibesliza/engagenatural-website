// src/components/community/config/communities.js
/**
 * System-defined communities configuration
 * These communities are built-in and cannot be deleted
 */

export const SYSTEM_COMMUNITIES = [
  {
    id: 'whats-good',
    name: "What's Good",
    slug: 'whats-good',
    description: 'Share product finds, drops, and wins.',
    rules: [
      'Be kind and constructive',
      'No spam or self-promotion without value',
      'Stay on-topic'
    ],
    icon: '🧪',
    coverImage: '',
    isSystem: true,
  },
  {
    id: 'supplement-scoop',
    name: 'Supplement Scoop',
    slug: 'supplement-scoop',
    description: 'Supplements, stacks, and science.',
    rules: [
      'Cite sources when making claims', 
      'No medical advice',
      'Share personal experiences respectfully'
    ],
    icon: '💊',
    coverImage: '',
    isSystem: true,
  },
  {
    id: 'movement-lab',
    name: 'Movement Lab',
    slug: 'movement-lab',
    description: 'Training, mobility, and performance.',
    rules: [
      'No form-shaming', 
      'Include context with videos',
      'Respect different fitness approaches'
    ],
    icon: '🏋️',
    coverImage: '',
    isSystem: true,
  },
  {
    id: 'mindset-corner',
    name: 'Mindset Corner',
    slug: 'mindset-corner',
    description: 'Habits, psychology, and discipline.',
    rules: [
      'Respect diverse viewpoints', 
      'No toxic content',
      'Focus on growth and support'
    ],
    icon: '🧠',
    coverImage: '',
    isSystem: true,
  },
];
