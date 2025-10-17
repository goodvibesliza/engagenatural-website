// src/components/community/BrandFeed.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query as firestoreQuery, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PostCard from './PostCard';
import PostCardMobileLinkedIn from './mobile/PostCardMobileLinkedIn.jsx';
import PostCardDesktopLinkedIn from './PostCardDesktopLinkedIn.jsx';
import useIsMobile from '../../hooks/useIsMobile.js';
import { getFlag } from '../../lib/featureFlags.js';
import SkeletonPostCard from './SkeletonPostCard';
import ErrorBanner from './ErrorBanner';

export default function BrandFeed({ brandId, brandName = 'Brand', communityId, onFiltersChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [posts, setPosts] = useState([]);
  const isMobile = useIsMobile();
  const mobileSkin = (getFlag('EN_MOBILE_FEED_SKIN') || '').toString().toLowerCase();
  const desktopLinkedIn = !isMobile && (import.meta.env.VITE_EN_DESKTOP_FEED_LAYOUT === 'linkedin') && location.pathname.startsWith('/community');

  useEffect(() => {
    let unsub = () => {};
    try {
      if (!db || !brandId) throw new Error('No Firestore or brandId');
      const base = [
        collection(db, 'community_posts'),
        where('visibility', '==', 'public'),
        where('brandId', '==', brandId),
      ];
      if (communityId) {
        base.push(where('communityId', '==', communityId));
      }
      base.push(orderBy('createdAt', 'desc'));
      const q = firestoreQuery(...base);
      unsub = onSnapshot(
        q,
        async (snap) => {
        const base = snap.docs.map((d) => {
          const data = d.data();
          const imgs = Array.isArray(data?.imageUrls)
            ? data.imageUrls
            : (Array.isArray(data?.images) ? data.images : []);
          return {
            id: d.id,
            userId: data?.userId || data?.authorId || data?.author?.uid || data?.author?.id || null,
            title: data?.title || 'Untitled',
            snippet: (data?.body || '').slice(0, 200),
            content: data?.body || '',
            imageUrls: imgs,
            tags: Array.isArray(data?.tags) ? data.tags : [],
            communityId: data?.communityId || '',
            authorName: data?.authorName || data?.author?.name || '',
            authorPhotoURL: data?.authorPhotoURL || data?.author?.photoURL || data?.author?.profileImage || data?.author?.avatar || data?.author?.avatarUrl || data?.author?.image || '',
            brand: data?.brandName || brandName,
            createdAt: data?.createdAt,
            isBlocked: data?.isBlocked === true,
            needsReview: data?.needsReview === true,
            commentCount: Number(data?.commentCount || 0),
            likeCount: Number(data?.likeCount || 0),
          };
        });

        const visible = base.filter(p => !p.isBlocked && !p.needsReview);
        const narrowed = communityId ? visible : visible.filter(p => p.communityId && p.communityId !== 'whats-good');
        const enriched = await Promise.all(narrowed.map(async (post) => {
          try {
            let authorPhotoURL = post.authorPhotoURL;
            if (!authorPhotoURL && db && post.userId) {
              try {
                const userRef = doc(db, 'users', post.userId);
                const userDoc = await getDoc(userRef);
                if (userDoc.exists()) {
                  const u = userDoc.data() || {};
                  authorPhotoURL = u.profileImage || u.photoURL || '';
                }
              } catch (err) { console.debug?.('BrandFeed author lookup failed', err); }
            }
            // Counts are read from denormalized fields on the post
            return { ...post, authorPhotoURL };
          } catch (err) {
            console.debug?.('BrandFeed enrich failed', err);
            return { ...post };
          }
        }));

          setPosts(enriched);
          // Surface filters upward so the left rail can reflect current brand/tags
          try {
            const brands = brandName ? [brandName] : [];
            const tags = Array.from(new Set(enriched.flatMap(p => Array.isArray(p.tags) ? p.tags : []).filter(Boolean)));
            onFiltersChange?.({ brands, tags, tagCounts: {} });
          } catch (err) {
            console.debug?.('BrandFeed: failed to derive filters', err);
          }
          setLoading(false);
        },
        (err) => {
          console.debug?.('BrandFeed snapshot error', err);
          setError('Failed to load brand posts. An index may be required.');
          setLoading(false);
        }
      );
    } catch {
      setError('Failed to load brand posts.');
      setLoading(false);
    }
    return () => { try { unsub(); } catch (err) { console.debug?.('BrandFeed unsubscribe failed', err); } };
  }, [db, brandId, brandName, communityId]);

  if (loading) {
    return (
      <div id="panel-brand" role="tabpanel" aria-labelledby="tab-brand" className="community-cards">
        <SkeletonPostCard />
        <SkeletonPostCard />
        <SkeletonPostCard />
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div id="panel-brand" role="tabpanel" aria-labelledby="tab-brand" className="space-y-3 text-center py-10">
        {error && (
          <div className="max-w-md mx-auto">
            <ErrorBanner message={error} onDismiss={() => setError('')} />
          </div>
        )}
        <div className="text-gray-900 font-medium">{`No posts yet from ${brandName}.`}</div>
        <button
          type="button"
          onClick={() => navigate('/staff/dashboard/my-brands')}
          className="mt-2 inline-flex items-center justify-center px-4 h-11 min-h-[44px] rounded-md border border-gray-300 bg-white text-sm hover:bg-gray-50"
        >
          View All Brands
        </button>
      </div>
    );
  }

  const Card = isMobile && mobileSkin === 'linkedin' ? PostCardMobileLinkedIn : (desktopLinkedIn ? PostCardDesktopLinkedIn : PostCard);

  return (
    <div id="panel-brand" role="tabpanel" aria-labelledby="tab-brand" className="community-cards">
      {posts.map((post) => (
        <Card
          key={post.id}
          post={post}
          onCardClick={() => navigate(`/community/post/${post.id}`)}
        />
      ))}
    </div>
  );
}
