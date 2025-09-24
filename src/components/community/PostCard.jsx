// src/components/community/PostCard.jsx
import React from 'react';

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

export default function PostCard({ post, onLike, onComment, onViewTraining }) {
  const likes = Array.isArray(post?.likeIds) ? post.likeIds.length : 0;
  const comments = Array.isArray(post?.commentIds) ? post.commentIds.length : 0;
  const liked = post?.likedByMe === true;
  const brand = post?.brand || 'General';
  const title = post?.title || post?.author?.name || (brand ? `${brand} update` : 'Update');
  const snippet = post?.snippet || post?.content || '';
  const time = post?.timeAgo || formatRelativeTime(post?.createdAt);
  const hasTraining = !!post?.trainingId;

  return (
    <article
      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm min-h-[140px]"
      aria-label={title}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center px-3 h-7 min-h-[28px] rounded-full text-xs font-medium border border-deep-moss/30 text-deep-moss bg-white"
            aria-label={`Brand ${brand}`}
          >
            {brand}
          </span>
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
        >
          <span className="mr-1" aria-hidden>
            {liked ? '❤️' : '🤍'}
          </span>
          <span>Like</span>
          <span className="ml-2 text-gray-500">{likes}</span>
        </button>

        <button
          type="button"
          onClick={() => onComment?.(post)}
          className="inline-flex items-center justify-center px-3 h-11 min-h-[44px] rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          aria-label={`Comment on post (${comments} comments)`}
        >
          <span className="mr-1" aria-hidden>💬</span>
          <span>Comment</span>
          <span className="ml-2 text-gray-500">{comments}</span>
        </button>

        {hasTraining && (
          <button
            type="button"
            onClick={() => onViewTraining?.(post.trainingId, post)}
            className="ml-auto inline-flex items-center justify-center px-3 h-11 min-h-[44px] rounded-md border border-deep-moss text-sm text-deep-moss hover:bg-oat-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            aria-label="View related training"
          >
            View Training
          </button>
        )}
      </footer>
    </article>
  );
}
