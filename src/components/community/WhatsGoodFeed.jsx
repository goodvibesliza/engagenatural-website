// src/components/community/WhatsGoodFeed.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/auth-context';
import PostCard from './PostCard';
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

export default function WhatsGoodFeed({
  query = '',
  search = '', // backward compat
  brand = 'All', // backward compat
  selectedBrands = [],
  selectedTags = [],
  onStartPost,
}) {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [postsWithCounts, setPostsWithCounts] = useState(WHATS_GOOD_STUBS);

  // Check if user is staff (can create posts)
  const isStaff = hasRole(['staff', 'verified_staff', 'brand_manager', 'super_admin']);

  // Load real comment counts from Firestore on mount
  useEffect(() => {
    let cancelled = false;
    
    const loadCommentCounts = async () => {
      try {
        const enrichedPosts = await Promise.all(
          WHATS_GOOD_STUBS.map(async (post) => {
            try {
              if (!db) return { ...post, commentIds: [], likeIds: [] };
              
              const commentsQuery = query(
                collection(db, 'community_comments'),
                where('postId', '==', post.id)
              );
              const likesQuery = query(
                collection(db, 'post_likes'),
                where('postId', '==', post.id)
              );
              
              const [commentsSnap, likesSnap] = await Promise.all([
                getCountFromServer(commentsQuery),
                getCountFromServer(likesQuery)
              ]);
              
              const commentCount = commentsSnap.data().count || 0;
              const likeCount = likesSnap.data().count || 0;
              
              return {
                ...post,
                commentIds: Array.from({ length: commentCount }, (_, i) => `comment-${i}`),
                likeIds: Array.from({ length: likeCount }, (_, i) => `like-${i}`),
              };
            } catch (err) {
              console.warn(`Failed to load counts for post ${post.id}:`, err);
              return { ...post, commentIds: [], likeIds: [] };
            }
          })
        );
        
        if (!cancelled) {
          setPostsWithCounts(enrichedPosts);
        }
      } catch (err) {
        console.warn('Failed to load comment counts:', err);
        // Keep stub data if Firestore fails
        if (!cancelled) {
          setPostsWithCounts(WHATS_GOOD_STUBS.map(p => ({ ...p, commentIds: [], likeIds: [] })));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCommentCounts();
    
    return () => {
      cancelled = true;
    };
  }, []);

  // Fallback loading timer for network issues
  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 2000); // max 2s loading
    return () => clearTimeout(id);
  }, []);

  const refreshCommentCount = async (postId) => {
    try {
      if (!db) return;
      
      const commentsQuery = query(
        collection(db, 'community_comments'),
        where('postId', '==', postId)
      );
      const commentsSnap = await getCountFromServer(commentsQuery);
      const commentCount = commentsSnap.data().count || 0;
      
      setPostsWithCounts(prev => 
        prev.map(post => 
          post.id === postId 
            ? { ...post, commentIds: Array.from({ length: commentCount }, (_, i) => `comment-${i}`) }
            : post
        )
      );
    } catch (err) {
      console.warn('Failed to refresh comment count:', err);
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
    // Text query against content and author name (and optional title if exists)
    const okText = !q || (p.content?.toLowerCase().includes(q) || p.author?.name?.toLowerCase().includes(q));

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

  const handleLike = (post) => {
    console.log('Like post:', post.id);
    // TODO: Implement optimistic like functionality with Firestore
  };

  const handleComment = (post) => {
    console.log('Comment on post:', post.id);
    navigate(`/staff/community/post/${post.id}`);
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
      {filtered.map((post, idx) => (
        <PostCard 
          key={post.id} 
          post={post} 
          dataTestId={idx === 0 ? 'postcard-first' : undefined}
          onLike={handleLike}
          onComment={handleComment}
          onViewTraining={handleViewTraining}
        />
      ))}
    </div>
  );
}
