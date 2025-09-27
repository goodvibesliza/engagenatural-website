// src/components/community/WhatsGoodFeed.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query as firestoreQuery, where, getCountFromServer, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
  const [postsWithCounts, setPostsWithCounts] = useState(
    WHATS_GOOD_STUBS.map(post => ({ 
      ...post, 
      likeIds: post.likeIds || [], 
      commentIds: post.commentIds || [] 
    }))
  );

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
              
              const commentsQuery = firestoreQuery(
                collection(db, 'community_comments'),
                where('postId', '==', post.id)
              );
              const likesQuery = firestoreQuery(
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
        // Set error state and keep stub data if Firestore fails
        if (!cancelled) {
          setError('Failed to load latest interaction data. Showing cached content.');
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
      
      setPostsWithCounts(prev => {
        const updated = prev.map(post => 
          post.id === postId 
            ? { ...post, commentIds: Array.from({ length: commentCount }, (_, i) => `comment-${i}`) }
            : post
        );
        console.log('Updated postsWithCounts:', updated.find(p => p.id === postId));
        return updated;
      });
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

  const handleLike = async (post) => {
    console.log('Like post:', post.id);
    
    if (!user) {
      console.warn('No user logged in');
      return;
    }

    try {
      // Optimistically update the UI first
      setPostsWithCounts(prev => 
        prev.map(p => 
          p.id === post.id 
            ? { 
                ...p, 
                likeIds: p.likedByMe 
                  ? (p.likeIds || []).filter(id => id !== 'me') // unlike
                  : [...(p.likeIds || []), 'me'], // like
                likedByMe: !p.likedByMe 
              }
            : p
        )
      );

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
      // Set error state and revert optimistic update on error
      setError('Failed to save like. Please try again.');
      setPostsWithCounts(prev => 
        prev.map(p => 
          p.id === post.id 
            ? { 
                ...p, 
                likeIds: post.likedByMe 
                  ? [...(p.likeIds || []), 'me'] // revert unlike
                  : (p.likeIds || []).filter(id => id !== 'me'), // revert like
                likedByMe: post.likedByMe // revert state
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
      
      setPostsWithCounts(prev => 
        prev.map(post => 
          post.id === postId 
            ? { ...post, likeIds: Array.from({ length: likeCount }, (_, i) => `like-${i}`) }
            : post
        )
      );
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
      {filtered.map((post, idx) => (
        <PostCard 
          key={post.id} 
          post={post} 
          dataTestId={idx === 0 ? 'postcard-first' : undefined}
          onLike={handleLike}
          onComment={handleComment}
          onCardClick={handleCardClick}
          onViewTraining={handleViewTraining}
        />
      ))}
    </div>
  );
}
