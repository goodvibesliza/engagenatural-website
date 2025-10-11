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

export default function PostCardMobileLinkedIn({ post = {}, onLike, onComment, onViewTraining, onCardClick }) {
  const name = post.author || post.authorName || post.brand || 'User'
  const avatarUrl = post.authorAvatar || post.photoURL || null
  const byline = `${name} · ${timeAgo(post.timestamp || post.createdAt)}`
  const content = post.content || post.title || ''

  const handleCardActivate = () => {
    if (!onCardClick) return
    onCardClick(post)
  }

  return (
    <article
      className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm cursor-pointer"
      role="button"
      data-testid="mobile-linkedin-postcard"
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
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span>{name?.charAt(0)?.toUpperCase?.() || 'U'}</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">{name}</div>
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
          <img src={post.imageUrls[0]} alt="" className="w-full rounded-lg object-cover" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onLike?.(post); }}
          data-testid="mobile-linkedin-action-like"
          aria-label="Like post"
          className="flex-1 h-11 min-h-[44px] inline-flex items-center justify-center rounded-md text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary"
        >
          Like
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onComment?.(post); }}
          data-testid="mobile-linkedin-action-comment"
          aria-label="Comment on post"
          className="flex-1 h-11 min-h-[44px] inline-flex items-center justify-center rounded-md text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary"
        >
          Comment
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onViewTraining?.(post?.trainingId, post); }}
          data-testid="mobile-linkedin-action-training"
          aria-label="View related training"
          className="flex-1 h-11 min-h-[44px] inline-flex items-center justify-center rounded-md text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary"
        >
          View training
        </button>
      </div>
    </article>
  )
}
