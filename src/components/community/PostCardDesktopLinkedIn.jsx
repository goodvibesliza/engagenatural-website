// src/components/community/PostCardDesktopLinkedIn.jsx
import React from 'react';
import { getBrandLogo, getBrandInitial } from '../../lib/brandAssets';
import { formatRelativeTime as formatRelativeTimeShared } from '../../lib/trainingAdapter';
import AspectBox from '../common/AspectBox';
import '../../styles/truncate.css';

export default function PostCardDesktopLinkedIn({ post, onLike, onComment, onViewTraining, onCardClick, dataTestId }) {
  const likes = Number.isFinite(post?.likeCount)
    ? post.likeCount
    : (Array.isArray(post?.likeIds) ? post.likeIds.length : 0);
  const comments = Number.isFinite(post?.commentCount)
    ? post.commentCount
    : (Array.isArray(post?.commentIds) ? post.commentIds.length : 0);
  const liked = post?.likedByMe === true;
  const authorName = post?.authorName || post?.author?.name || 'Unknown';
  const brandName = post?.company || post?.brandName || post?.brand || '';
  const brandId = post?.brandId || brandName || 'brand';
  const title = post?.title || brandName || 'Update';
  const body = post?.snippet || post?.content || '';
  let createdDate = null;
  if (post?.createdAt) {
    if (typeof post.createdAt?.toDate === 'function') createdDate = post.createdAt.toDate();
    else if (post.createdAt instanceof Date) createdDate = post.createdAt;
    else if (typeof post.createdAt === 'number' || typeof post.createdAt === 'string') {
      const parsed = new Date(post.createdAt);
      if (!isNaN(parsed)) createdDate = parsed;
    }
  }
  const time = post?.timeAgo || (createdDate ? formatRelativeTimeShared(createdDate) : '');
  const hasTraining = !!post?.trainingId;

  const logoUrl = getBrandLogo(brandId);
  const authorPhotoURL = post?.authorPhotoURL || post?.author?.photoURL || post?.author?.profileImage || '';

  const handleCardClick = (e) => {
    if (e.target.closest('button')) return;
    onCardClick?.(post);
  };

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (e.target.closest('button')) return;
    if (e.key === ' ') e.preventDefault();
    onCardClick?.(post);
  };

  // Fixed hero height for uniform card visuals
  const HERO_H = 400; // ~360–420px

  const imgSrc = Array.isArray(post?.imageUrls) && post.imageUrls.length > 0 ? post.imageUrls[0] : null;

  return (
    <article
      className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden focus:outline-none focus:ring-2 focus:ring-deep-moss focus:ring-offset-2"
      data-testid={dataTestId || 'desktop-linkedin-postcard'}
      aria-label={title}
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
    >
      {/* Byline Row */}
      <header className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200" aria-hidden data-testid="desktop-linkedin-avatar">
          {authorPhotoURL ? (
            <img src={authorPhotoURL} alt="" className="w-full h-full object-cover" />
          ) : logoUrl ? (
            <img src={logoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-gray-600">{getBrandInitial(authorName)}</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="text-sm text-gray-900 font-medium truncate" title={authorName} aria-label={`Author ${authorName}`} data-testid="desktop-linkedin-author-name">
            {authorName}
          </div>
          <div className="text-xs text-gray-500 truncate" aria-label={`Company and time`} data-testid="desktop-linkedin-company-time">
            <span>{brandName}</span>{brandName && time ? <span> • </span> : null}<span>{time}</span>
          </div>
        </div>
      </header>

      {/* Title + Body (clamped) */}
      <div className="px-4">
        <h3 className="text-base font-semibold text-gray-900 leading-snug overflow-hidden line-clamp-2">
          {title}
        </h3>
        {body && (
          <p className="mt-1 text-sm text-gray-700 overflow-hidden line-clamp-3">
            {body}
          </p>
        )}
      </div>

      {/* Hero image with consistent height */}
      <div className="mt-3" aria-hidden data-testid="desktop-linkedin-hero">
        <AspectBox ratio="16/9">
          {imgSrc ? (
            <img src={imgSrc} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-100 border-t border-b border-gray-200 flex items-center justify-center text-gray-400">
              <span className="text-sm">No image</span>
            </div>
          )}
        </AspectBox>
      </div>

      {/* Action row */}
      <footer className="px-2 py-2 border-t border-gray-200 mt-2 grid grid-cols-3 gap-2 text-sm">
        <button
          type="button"
          onClick={() => onLike?.(post)}
          className={`inline-flex items-center justify-center h-10 rounded-md hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
            liked ? 'text-rose-600 bg-rose-50 ring-rose-500' : 'text-gray-700'
          }`}
          aria-pressed={liked ? 'true' : 'false'}
          aria-label={liked ? `Unlike post (${likes} likes)` : `Like post (${likes} likes)`}
          data-testid="desktop-linkedin-action-like"
        >
          <span className="mr-2" aria-hidden>{liked ? '❤️' : '🤍'}</span>
          <span>Like</span>
          <span className="ml-2 text-gray-500">{likes}</span>
        </button>

        <button
          type="button"
          onClick={() => onComment?.(post)}
          className="inline-flex items-center justify-center h-10 rounded-md hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 text-gray-700"
          aria-label={`Comment on post (${comments} comments)`}
          data-testid="desktop-linkedin-action-comment"
        >
          <span className="mr-2" aria-hidden>💬</span>
          <span>Comment</span>
          <span className="ml-2 text-gray-500">{comments}</span>
        </button>

        <button
          type="button"
          onClick={() => hasTraining && onViewTraining?.(post.trainingId, post)}
          disabled={!hasTraining}
          className={`inline-flex items-center justify-center h-10 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
            hasTraining ? 'text-deep-moss hover:bg-oat-beige' : 'text-gray-400 cursor-not-allowed'
          }`}
          aria-label={hasTraining ? 'View related training' : 'No related training'}
          data-testid="desktop-linkedin-action-training"
        >
          <span aria-hidden>🎓</span>
          <span className="ml-2">View training</span>
        </button>
      </footer>
    </article>
  );
}
