// src/components/community/PostCard.jsx
import React from 'react';
import { postOpenTraining } from '../../lib/analytics';
import COPY from '../../i18n/community.copy';

function formatRelativeTime(input) {
  try {
    let d = input;
    if (!d) return '';
    if (typeof d?.toDate === 'function') d = d.toDate();
    if (typeof d === 'number') d = new Date(d);
    if (typeof d === 'string') {
      const parsed = new Date(d);
      if (!isNaN(parsed)) d = parsed;
    }
    if (!(d instanceof Date)) return String(input || '');
    const diff = Date.now() - d.getTime();
    const s = Math.max(1, Math.floor(diff / 1000));
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  } catch {
    return '';
  }
}

export default function PostCard({ post, onLike, onComment, onViewTraining, onCardClick, dataTestId }) {
  const likes = Number.isFinite(post?.likeCount)
    ? post.likeCount
    : (Array.isArray(post?.likeIds) ? post.likeIds.length : 0);
  const comments = Number.isFinite(post?.commentCount)
    ? post.commentCount
    : (Array.isArray(post?.commentIds) ? post.commentIds.length : 0);
  const liked = post?.likedByMe === true;
  const brand = post?.brand || 'General';
  const company = post?.company || '';
  const isGenericCompany = !company || /^(whats-?good|whatsgood|all|public|pro feed)$/i.test(String(company));
  const brandPillText = (!isGenericCompany && company) ? company : brand;
  const title = post?.title || post?.author?.name || (brandPillText ? `${brandPillText} update` : 'Update');
  const snippet = post?.snippet || post?.content || '';
  const time = post?.timeAgo || formatRelativeTime(post?.createdAt);
  const hasTraining = !!post?.trainingId;

  const handleCardClick = (e) => {
    // Don't navigate if clicking on a button
    if (e.target.closest('button')) return;
    onCardClick?.(post);
  };

  const handleKeyDown = (e) => {
    // Only handle Enter and Space keys
    if (e.key !== 'Enter' && e.key !== ' ') return;
    
    // Don't navigate if focusing on a button
    if (e.target.closest('button')) return;
    
    // Prevent default space key scrolling
    if (e.key === ' ') {
      e.preventDefault();
    }
    
    onCardClick?.(post);
  };

  const authorName = post?.authorName || post?.author?.name || '';
  const authorPhotoURL = post?.authorPhotoURL || post?.author?.photoURL || post?.author?.profileImage || post?.author?.avatar || post?.author?.avatarUrl || post?.author?.image || '';

  return (
    <article
      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm min-h-[140px] cursor-pointer hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-deep-moss focus:ring-offset-2"
      data-testid={dataTestId || 'postcard'}
      aria-label={title}
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center px-3 h-7 min-h-[28px] rounded-full text-xs font-medium border border-deep-moss/30 text-deep-moss bg-white"
            aria-label={`Brand ${brandPillText}`}
          >
            {brandPillText}
          </span>
          {(authorName || authorPhotoURL) && (
            <div className="flex items-center gap-2 text-xs text-gray-600" aria-label={`Posted by ${authorName || 'user'}`}>
              {authorPhotoURL ? (
                <img src={authorPhotoURL} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-600">
                  {(authorName || 'U').slice(0,1).toUpperCase()}
                </div>
              )}
              <span className="truncate max-w-[140px]" title={authorName}>{authorName}</span>
              {!isGenericCompany && company && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="truncate max-w-[160px]" title={company}>{company}</span>
                </>
              )}
            </div>
          )}
        </div>
        {time && (
          <time className="text-xs text-warm-gray" aria-label={`Posted ${time}`}>
            {time}
          </time>
        )}
      </header>

      <div className="mt-3">
        <h3 className="text-base font-semibold text-gray-900 leading-snug truncate" title={title}>
          {title}
        </h3>
        {snippet && (
          <p
            className="mt-1 text-sm text-gray-700 overflow-hidden"
            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
          >
            {snippet}
          </p>
        )}
        {Array.isArray(post?.imageUrls) && post.imageUrls.length > 0 && (
          <div className="mt-3">
            {post.imageUrls.length === 1 ? (
              <img
                src={post.imageUrls[0]}
                alt="Post attachment"
                className="w-full max-h-80 rounded-lg object-cover border border-gray-200"
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {post.imageUrls.slice(0, 4).map((url, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={url}
                      alt={`Attachment ${idx + 1}`}
                      className="w-full h-36 object-cover rounded-lg border border-gray-200"
                    />
                    {idx === 3 && post.imageUrls.length > 4 && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center text-white font-medium">
                        +{post.imageUrls.length - 4}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => onLike?.(post)}
          className={`inline-flex items-center justify-center px-3 h-11 min-h-[44px] rounded-md border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
            liked ? 'border-rose-500 text-rose-600 bg-rose-50' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
          aria-pressed={liked ? 'true' : 'false'}
          aria-label={liked ? `Unlike post (${likes} likes)` : `Like post (${likes} likes)`}
          data-testid="like-button"
        >
          <span className="mr-1" aria-hidden>
            {liked ? '❤️' : '🤍'}
          </span>
          <span>{COPY.buttons.like}</span>
          <span className="ml-2 text-gray-500">{likes}</span>
        </button>

        <button
          type="button"
          onClick={() => onComment?.(post)}
          className="inline-flex items-center justify-center px-3 h-11 min-h-[44px] rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          aria-label={`Comment on post (${comments} comments)`}
          data-testid="comment-button"
        >
          <span className="mr-1" aria-hidden>💬</span>
          <span>{COPY.buttons.comment}</span>
          <span className="ml-2 text-gray-500">{comments}</span>
        </button>

        {hasTraining && (
          <button
            type="button"
            onClick={() => {
              try { postOpenTraining({ postId: post.id, trainingId: post.trainingId }); } catch {}
              onViewTraining?.(post.trainingId, post);
            }}
            className="ml-auto inline-flex items-center justify-center px-3 h-11 min-h-[44px] rounded-md border border-deep-moss text-sm text-deep-moss hover:bg-oat-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            aria-label="View related training"
            data-testid="view-training-cta"
          >
            {COPY.buttons.viewTraining}
          </button>
        )}
      </footer>
    </article>
  );
}
