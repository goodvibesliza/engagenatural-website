// src/components/community/WhatsGoodFeed.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query as firestoreQuery, where, orderBy, onSnapshot, getCountFromServer, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '../../contexts/auth-context';
import PostCard from './PostCard';
import PostCardDesktopLinkedIn from './PostCardDesktopLinkedIn';
import SkeletonPostCard from './SkeletonPostCard';
import ErrorBanner from './ErrorBanner';
import COPY from '../../i18n/community.copy';

export const WHATS_GOOD_STUBS = [
  {
    id: 'wg-001',
    brand: 'All',
    tags: ['milestone','csat'],
    content:
      "🎉 Just hit our quarterly sales target! Amazing teamwork across locations. Shoutout to the Denver team for stellar CSAT this month.",
    author: { name: 'Sarah Chen', role: 'Regional Manager', verified: true },
    timeAgo: '2h ago',
  },
  {
    id: 'wg-002',
    brand: 'Botanical Co',
    tags: ['sustainability','packaging'],
    content:
      'Customers love the new sustainability packaging. One said it made her feel great about supporting us! 🌱',
    author: { name: 'Marcus Rodriguez', role: 'Store Manager', verified: true },
    timeAgo: '4h ago',
  },
  {
    id: 'wg-003',
    brand: 'All',
    tags: ['training','people'],
    content:
      "Amazing training session with new team members today. Their enthusiasm reminded me why I love this industry. ✨",
    author: { name: 'Jennifer Park', role: 'Training Coordinator', verified: true },
    timeAgo: '6h ago',
  },
];

/**
 * Render the "What's Good" community feed with live posts, counts, filtering, and interaction handlers.
 *
 * Renders a list of public "What's Good" posts sourced from Firestore, enriches each post with comment and like counts,
 * applies text/brand/tag filters, provides optimistic like toggling, and exposes handlers for commenting and navigation.
 *
 * @param {Object} props - Component props.
 * @param {string} [props.query] - Primary text search input (trimmed and lowercased); kept for backward compatibility with `search`.
 * @param {string} [props.search] - Backward-compatible alias for `query`.
 * @param {string} [props.brand] - Backward-compatible single-brand filter; ignored when `selectedBrands` is non-empty or equals "All".
 * @param {string[]} [props.selectedBrands] - Array of selected brand names to filter posts; if empty, `brand` may be used.
 * @param {string[]} [props.selectedTags] - Array of selected tag strings to filter posts; post is included if it has any of these tags.
 * @param {Function} [props.onStartPost] - Callback invoked when a staff user requests to start a new post (e.g., clicking "Start a post").
 * @param {Function} [props.onFiltersChange] - Optional callback called when available filter options are derived; receives an object `{ brands: string[], tags: string[] }`.
 *
 * @returns {JSX.Element} The feed UI for the "What's Good" community panel.
 */
export default function WhatsGoodFeed({
  query = '',
  search = '', // backward compat
  brand = 'All', // backward compat
  selectedBrands = [],
  selectedTags = [],
  onStartPost,
  onFiltersChange,
}) {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [postsWithCounts, setPostsWithCounts] = useState([]);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);
  const desktopFlag = import.meta.env.VITE_EN_DESKTOP_FEED_LAYOUT;

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Check if user is staff (can create posts)
  const isStaff = hasRole(['staff', 'verified_staff', 'brand_manager', 'super_admin']);

  // Subscribe to Firestore for live "What's Good" public posts and enrich counts
  useEffect(() => {
    let unsub = () => {};
    let cancelled = false;
    try {
      if (!db) throw new Error('No Firestore instance');
      const q = firestoreQuery(
        collection(db, 'community_posts'),
        where('visibility', '==', 'public'),
        where('communityId', '==', 'whats-good'),
        orderBy('createdAt', 'desc')
      );
      unsub = onSnapshot(q, async (snap) => {
        const base = snap.docs.map((d) => {
          const data = d.data();
          const imgs = Array.isArray(data?.imageUrls)
            ? data.imageUrls
            : (Array.isArray(data?.images) ? data.images : []);
          return {
            id: d.id,
            brand: data?.brandName || data?.communityName || 'What\'s Good',
            title: data?.title || 'Untitled',
            snippet: (data?.body || '').slice(0, 200),
            content: data?.body || '',
            imageUrls: imgs,
            tags: Array.isArray(data?.tags) ? data.tags : [],
            authorName: data?.authorName || '',
            authorPhotoURL: data?.authorPhotoURL || '',
            createdAt: data?.createdAt,
            isBlocked: data?.isBlocked === true,
            needsReview: data?.needsReview === true,
          };
        });
        // Hide moderated content
        const visible = base.filter(p => !p.isBlocked && !p.needsReview);

        // Emit available brands/tags (trending = tags sorted by frequency)
        try {
          const brandSet = new Set();
          const tagCounts = new Map();
          const bannedTagRe = /^(sex|nsfw|xxx)$/i;
          for (const p of visible) {
            if (p.brand) brandSet.add(p.brand);
            if (Array.isArray(p.tags)) {
              for (const t of p.tags) {
                const key = String(t || '').trim();
                if (!key || bannedTagRe.test(key)) continue;
                tagCounts.set(key, (tagCounts.get(key) || 0) + 1);
              }
            }
          }
          const brands = Array.from(brandSet);
          const tags = Array.from(tagCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([k]) => k);
          onFiltersChange?.({ brands, tags });
        } catch (err) {
          console.error('WhatsGoodFeed: failed to emit filters from live posts', { baseCount: Array.isArray(base) ? base.length : 0 }, err);
        }

        // Load counts per post (numeric fields) — fallback to 0 if query fails
        const enriched = await Promise.all(
          visible.map(async (post) => {
            try {
              const commentsQ = firestoreQuery(
                collection(db, 'community_comments'),
                where('postId', '==', post.id)
              );
              const likesQ = firestoreQuery(
                collection(db, 'post_likes'),
                where('postId', '==', post.id)
              );
              const [commentsSnap, likesSnap] = await Promise.all([
                getCountFromServer(commentsQ),
                getCountFromServer(likesQ)
              ]);
              const commentCount = commentsSnap.data().count || 0;
              const likeCount = likesSnap.data().count || 0;
              return { ...post, commentCount, likeCount };
            } catch (err) {
              console.warn('Failed loading counts for', post.id, err);
              return { ...post, commentCount: 0, likeCount: 0 };
            }
          })
        );

        if (!cancelled) setPostsWithCounts(enriched);
        if (!cancelled) setLoading(false);
      });
    } catch (err) {
      console.warn('WhatsGoodFeed subscription failed:', err);
      setError('Failed to load live posts. Showing cached content.');
      // Fallback to stubs (keep same shape as live posts)
      const fallback = WHATS_GOOD_STUBS.map((p) => ({
        ...p,
        title: p.title || 'Untitled',
        snippet: (p.content || '').slice(0, 200),
        content: p.content || '',
        imageUrls: Array.isArray(p.imageUrls) ? p.imageUrls : (Array.isArray(p.images) ? p.images : []),
        authorName: p.author?.name || '',
        commentCount: 0,
        likeCount: 0,
      }));
      setPostsWithCounts(fallback);
      try {
        const brands = Array.from(new Set(fallback.map((p) => p.brand).filter(Boolean)));
        const tags = Array.from(new Set(fallback.flatMap((p) => (Array.isArray(p.tags) ? p.tags : [])).filter(Boolean)));
        onFiltersChange?.({ brands, tags });
      } catch (e) {
        console.error('WhatsGoodFeed: failed to compute fallback filters', { fallbackCount: Array.isArray(fallback) ? fallback.length : 0 }, e);
      }
      setLoading(false);
    }
    return () => {
      cancelled = true;
      try { unsub(); } catch {}
    };
  }, [db]);

  // Fallback loading timer for network issues
  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 5000); // max 5s loading
    return () => clearTimeout(id);
  }, []);

  const refreshCommentCount = async (postId) => {
    console.log('refreshCommentCount called for postId:', postId);
    try {
      if (!db) {
        console.warn('No Firestore database available');
        return;
      }
      
      const commentsQuery = firestoreQuery(
        collection(db, 'community_comments'),
        where('postId', '==', postId)
      );
      const commentsSnap = await getCountFromServer(commentsQuery);
      const commentCount = commentsSnap.data().count || 0;
      
      console.log(`Found ${commentCount} comments for post ${postId}`);
      
      setPostsWithCounts(prev => prev.map(post => (
        post.id === postId ? { ...post, commentCount } : post
      )));
    } catch (err) {
      console.error('Failed to refresh comment count for post', postId, ':', err);
    }
  };

  // Expose refresh function globally for PostDetail to call (before early returns)
  useEffect(() => {
    window.refreshWhatsGoodComments = refreshCommentCount;
    return () => {
      delete window.refreshWhatsGoodComments;
    };
  }, []);

  const q = (query || search).trim().toLowerCase();
  const filtered = postsWithCounts.filter((p) => {
    // Text query against title, content/body snippet, authorName, and brand
    const okText = !q || (
      (p.title || '').toLowerCase().includes(q) ||
      (p.content || p.snippet || '').toLowerCase().includes(q) ||
      (p.authorName || '').toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q)
    );

    // Brands: OR within brands. Back-compat: single brand select or multi-select chips
    const brandList = selectedBrands.length > 0 ? selectedBrands : (brand && brand !== 'All' ? [brand] : []);
    const okBrand = brandList.length === 0 || brandList.includes(p.brand || '');

    // Tags: OR within tags
    const tags = Array.isArray(p.tags) ? p.tags : [];
    const okTags = selectedTags.length === 0 || tags.some((t) => selectedTags.includes(t));

    // AND across types
    return okText && okBrand && okTags;
  });

  if (loading) {
    return (
      <div id="panel-whats-good" role="tabpanel" aria-labelledby="tab-whats-good" className="community-cards">
        <SkeletonPostCard />
        <SkeletonPostCard />
        <SkeletonPostCard />
      </div>
    );
  }

  // Empty state
  if (filtered.length === 0) {
    return (
      <div id="panel-whats-good" role="tabpanel" aria-labelledby="tab-whats-good" className="space-y-3 text-center py-10">
        {error && (
          <div className="max-w-md mx-auto">
            <ErrorBanner message={error} onDismiss={() => setError('')} />
          </div>
        )}
        <div className="text-gray-900 font-medium">{COPY.empty.whatsGood}</div>
        {isStaff && (
          <div>
            <button
              type="button"
              onClick={() => {
                if (onStartPost) return onStartPost();
                navigate('/staff/communities');
              }}
              className="mt-2 inline-flex items-center justify-center px-4 h-11 min-h-[44px] rounded-md bg-deep-moss text-white text-sm hover:bg-sage-dark"
            >
              Start a post
            </button>
          </div>
        )}
      </div>
    );
  }

  const handleLike = async (post) => {
    console.log('Like post:', post.id);
    
    if (!user) {
      console.warn('No user logged in');
      return;
    }

    try {
      // Optimistically update the UI first
      setPostsWithCounts(prev => prev.map(p => (
        p.id === post.id
          ? {
              ...p,
              likeCount: (Number.isFinite(p.likeCount) ? p.likeCount : 0) + (p.likedByMe ? -1 : 1),
              likedByMe: !p.likedByMe,
            }
          : p
      )));

      // Update Firestore
      if (db) {
        const likeId = `${post.id}_${user.uid}`;
        const likeRef = doc(db, 'post_likes', likeId);
        const likeDoc = await getDoc(likeRef);
        
        if (likeDoc.exists()) {
          // Unlike
          const { deleteDoc } = await import('firebase/firestore');
          await deleteDoc(likeRef);
          console.log('Unliked post:', post.id);
        } else {
          // Like
          const { setDoc, serverTimestamp } = await import('firebase/firestore');
          await setDoc(likeRef, {
            postId: post.id,
            userId: user.uid,
            createdAt: serverTimestamp()
          });
          console.log('Liked post:', post.id);
        }
        
        // Refresh the count after a short delay
        setTimeout(() => refreshLikeCount(post.id), 500);
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
      setError('Failed to save like. Please try again.');
      // Revert optimistic update to original state (boolean + numeric count)
      setPostsWithCounts(prev => 
        prev.map(p => 
          p.id === post.id 
            ? { 
                ...p, 
                likedByMe: post.likedByMe,
                likeCount: Number.isFinite(post.likeCount) ? post.likeCount : 0,
              }
            : p
        )
      );
    }
  };

  const refreshLikeCount = async (postId) => {
    try {
      if (!db) return;
      
      const likesQuery = firestoreQuery(
        collection(db, 'post_likes'),
        where('postId', '==', postId)
      );
      const likesSnap = await getCountFromServer(likesQuery);
      const likeCount = likesSnap.data().count || 0;
      
      setPostsWithCounts(prev => prev.map(post => (
        post.id === postId ? { ...post, likeCount } : post
      )));
    } catch (err) {
      console.error('Failed to refresh like count:', err);
    }
  };

  const handleComment = (post) => {
    console.log('Comment on post:', post.id);
    navigate(`/community/post/${post.id}`);
  };

  const handleCardClick = (post) => {
    console.log('Card clicked for post:', post.id);
    navigate(`/community/post/${post.id}`);
  };

  const handleViewTraining = (trainingId, post) => {
    console.log('View training:', trainingId, 'from post:', post.id);
    navigate(`/staff/trainings/${trainingId}`);
  };

  return (
    <div id="panel-whats-good" role="tabpanel" aria-labelledby="tab-whats-good" className="community-cards">
      {error && (
        <div className="max-w-md mx-auto">
          <ErrorBanner message={error} onDismiss={() => setError('')} />
        </div>
      )}
      {filtered.map((post, idx) => {
        const Card = (isDesktop && desktopFlag === 'linkedin') ? PostCardDesktopLinkedIn : PostCard;
        return (
          <Card
            key={post.id}
            post={post}
            dataTestId={idx === 0 ? 'postcard-first' : undefined}
            onLike={handleLike}
            onComment={handleComment}
            onCardClick={handleCardClick}
            onViewTraining={handleViewTraining}
          />
        );
      })}
    </div>
  );
}
