import React from 'react'

function timeAgo(ts) {
  try {
    const d = ts instanceof Date ? ts : (ts?.toDate?.() || new Date(ts))
    if (!d || Number.isNaN(d.getTime())) return ''
    const diff = Date.now() - d.getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'Just now'
    if (m < 60) return `${m}m`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h`
    const days = Math.floor(h / 24)
    return `${days}d`
  } catch {
    return ''
  }
}

export default function PostCardMobileLinkedIn({ post = {}, onLike, onComment, onViewTraining, onCardClick, dataTestId }) {
  // Extract author name with fallback chain
  const authorName = post.authorName || post.author?.name || post.brand || 'User'
  
  // Extract author photo URL with comprehensive fallback chain
  const authorPhotoURL = post.authorPhotoURL || post.author?.photoURL || post.author?.profileImage || post.author?.avatar || post.author?.avatarUrl || post.author?.image || post.photoURL || post.authorAvatar || null
  
  // Extract company/brand for byline
  const company = post.company || ''
  const brand = post.brand || 'General'
  const isGenericCompany = !company || /^(whats-?good|whatsgood|all|public|pro feed)$/i.test(String(company))
  const brandOrCompany = (!isGenericCompany && company) ? company : brand
  
  // Build byline with company/brand and timestamp
  const timestamp = timeAgo(post.timestamp || post.createdAt)
  const byline = brandOrCompany && brandOrCompany !== authorName
    ? `${brandOrCompany} · ${timestamp}`
    : timestamp

  const content = post.content || post.title || ''

  const handleCardActivate = () => {
    if (!onCardClick) return
    onCardClick(post)
  }

  return (
    <article
      className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm cursor-pointer"
      role="button"
      data-testid={dataTestId || 'mobile-linkedin-postcard'}
      aria-label="Post"
      onClick={handleCardActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleCardActivate()
        }
      }}
      tabIndex={0}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-sm font-semibold text-gray-700" aria-hidden="true">
          {authorPhotoURL ? (
            <img src={authorPhotoURL} alt="" className="w-full h-full object-cover" />
          ) : (
            <span>{authorName?.charAt(0)?.toUpperCase?.() || 'U'}</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">{authorName}</div>
          <div className="text-xs text-gray-500 truncate" aria-label="Byline">{byline}</div>
        </div>
      </div>

      {/* Body */}
      {content && (
        <div className="text-[15px] leading-5.5 text-gray-900 whitespace-pre-wrap mb-2">{content}</div>
      )}

      {/* Media (first image only, if any) */}
      {Array.isArray(post.imageUrls) && post.imageUrls[0] && (
        <div className="mt-2 mb-2">
          <img 
            src={post.imageUrls[0]} 
            alt={post.imageAlt || (authorName ? `Image shared by ${authorName}` : 'Posted image')} 
            className="w-full rounded-lg object-cover" 
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onLike?.(post); }}
          data-testid="mobile-linkedin-action-like"
          tabIndex={-1}
          aria-label="Like post"
          className="flex-1 h-11 min-h-[44px] inline-flex items-center justify-center rounded-md text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary"
        >
          Like
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onComment?.(post); }}
          data-testid="mobile-linkedin-action-comment"
          tabIndex={-1}
          aria-label="Comment on post"
          className="flex-1 h-11 min-h-[44px] inline-flex items-center justify-center rounded-md text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary"
        >
          Comment
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onViewTraining?.(post?.trainingId, post); }}
          data-testid="mobile-linkedin-action-training"
          tabIndex={-1}
          aria-label="View related training"
          className="flex-1 h-11 min-h-[44px] inline-flex items-center justify-center rounded-md text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary"
        >
          View training
        </button>
      </div>
    </article>
  )
}
