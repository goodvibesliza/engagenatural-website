// Content Moderation System for Community Posts

// Inappropriate content detection
const inappropriateWords = [
  // Profanity
  'damn', 'hell', 'crap', 'stupid', 'idiot', 'moron', 'dumb',
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'cunt',
  // Spam indicators
  'buy now', 'click here', 'free money', 'get rich quick', 'limited time',
  // Inappropriate health claims
  'cure cancer', 'miracle cure', 'guaranteed results', 'lose 50 pounds',
  // Offensive content
  'hate', 'racist', 'sexist', 'discrimination', 'porn', 'nsfw', 'xxx',
  // Competitor mentions (customize for your industry)
  'cvs pharmacy', 'walgreens', 'rite aid'
]

const spamPatterns = [
  /\b\d{3}-\d{3}-\d{4}\b/, // Phone numbers
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email addresses
  /https?:\/\/[^\s]+/, // URLs
  /\$\d+/, // Dollar amounts
  /\b(buy|sell|purchase|order)\s+(now|today|immediately)\b/i, // Sales pressure
  /\b(free|discount|sale|offer)\b.*\b(limited|expires|hurry)\b/i // Urgency tactics
]

export const moderateContent = (content) => {
  const result = {
    isAppropriate: true,
    confidence: 1.0,
    flags: [],
    suggestedAction: 'approve',
    moderatedContent: content
  }

  const lowerContent = content.toLowerCase()
  
  // Check for inappropriate words
  const foundWords = inappropriateWords.filter(word => 
    lowerContent.includes(word.toLowerCase())
  )
  
  if (foundWords.length > 0) {
    result.flags.push({
      type: 'inappropriate_language',
      details: `Contains: ${foundWords.join(', ')}`,
      severity: 'medium'
    })
    result.confidence -= 0.3
  }

  // Check for spam patterns
  spamPatterns.forEach((pattern, index) => {
    if (pattern.test(content)) {
      result.flags.push({
        type: 'spam_pattern',
        details: `Matches spam pattern ${index + 1}`,
        severity: 'high'
      })
      result.confidence -= 0.4
    }
  })

  // Check for excessive caps (shouting)
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length
  if (capsRatio > 0.5 && content.length > 20) {
    result.flags.push({
      type: 'excessive_caps',
      details: 'More than 50% capital letters',
      severity: 'low'
    })
    result.confidence -= 0.1
  }

  // Check for repetitive content
  const words = content.split(/\s+/)
  const uniqueWords = new Set(words.map(w => w.toLowerCase()))
  const repetitionRatio = 1 - (uniqueWords.size / words.length)
  
  if (repetitionRatio > 0.7 && words.length > 10) {
    result.flags.push({
      type: 'repetitive_content',
      details: 'High repetition of words',
      severity: 'medium'
    })
    result.confidence -= 0.2
  }

  // Determine final decision
  if (result.confidence < 0.3) {
    result.isAppropriate = false
    result.suggestedAction = 'block'
  } else if (result.confidence < 0.7) {
    result.isAppropriate = false
    result.suggestedAction = 'review'
  }

  // Auto-moderate content if needed
  if (result.suggestedAction === 'block') {
    result.moderatedContent = '[Content removed by moderator]'
  } else if (result.suggestedAction === 'review') {
    result.moderatedContent = content + ' [Under review]'
  }

  return result
}

// Enhanced moderation for natural health retail context
export const moderateHealthContent = (content) => {
  const healthClaims = [
    'cures', 'treats', 'prevents', 'heals', 'fixes',
    'guaranteed to work', 'miracle', 'breakthrough',
    'fda approved' // Unless actually FDA approved
  ]

  const result = moderateContent(content)
  const lowerContent = content.toLowerCase()

  // Check for inappropriate health claims
  const foundClaims = healthClaims.filter(claim => 
    lowerContent.includes(claim.toLowerCase())
  )

  if (foundClaims.length > 0) {
    result.flags.push({
      type: 'inappropriate_health_claims',
      details: `Contains health claims: ${foundClaims.join(', ')}`,
      severity: 'high'
    })
    // Force review for health-claim content to ensure DSHEA compliance
    result.isAppropriate = false
    result.suggestedAction = 'review'
    result.moderatedContent = content + ' [Health claims under review]'
  }

  return result
}

// Real-time content filtering for posts
export const filterPostContent = async (postData) => {
  const moderation = moderateHealthContent(postData.content)
  
  return {
    ...postData,
    moderation: moderation,
    content: moderation.moderatedContent,
    needsReview: moderation.suggestedAction === 'review',
    isBlocked: moderation.suggestedAction === 'block',
    moderationFlags: moderation.flags
  }
}

// Admin moderation dashboard data
export const getModerationStats = (posts) => {
  const stats = {
    total: posts.length,
    approved: 0,
    underReview: 0,
    blocked: 0,
    flagged: 0
  }

  posts.forEach(post => {
    if (post.isBlocked) {
      stats.blocked++
    } else if (post.needsReview) {
      stats.underReview++
    } else {
      stats.approved++
    }
    
    if (post.moderationFlags && post.moderationFlags.length > 0) {
      stats.flagged++
    }
  })

  return stats
}

