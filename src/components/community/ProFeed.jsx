// src/components/community/ProFeed.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query as firestoreQuery, where, orderBy, onSnapshot, getCountFromServer, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '../../contexts/auth-context';
import PostCard from './PostCard';
import ProGate from './ProGate';
import SkeletonPostCard from './SkeletonPostCard';
import ErrorBanner from './ErrorBanner';
import COPY from '../../i18n/community.copy';

export const PRO_STUBS = [
  {
    id: 'pro-001',
    brand: 'All',
    tags: ['strategy','growth'],
    content:
      "Q4 strategic review: 23% growth in organic lines. Plan educational content around ingredient sourcing.",
    author: { name: 'Alexandra Reid', role: 'Product Strategy', verified: true },
    timeAgo: '3h ago',
    isPinned: true,
  },
  {
    id: 'pro-002',
    brand: 'Botanical Co',
    tags: ['competition','training'],
    content:
      "Competitor analysis complete. Strong digital, weaker in-store. Double down on training + education.",
    author: { name: 'James Wilson', role: 'Market Research', verified: true },
    timeAgo: '5h ago',
  },
];

function readDevOverride() {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem('DEV_isVerifiedStaff');
    if (v === 'true') return true;
    if (v === 'false') return false;
    return null;
  } catch {
    return null;
  }
}

function ProFeedContent({ query = '', search = '', brand = 'All', selectedBrands = [], selectedTags = [], onFiltersChange, currentUser }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();

  // Subscribe to Firestore for live "Pro Feed" public posts
  useEffect(() => {
    let unsub = () => {};
    try {
      if (!db) throw new Error('No Firestore');
      const q = firestoreQuery(
        collection(db, 'community_posts'),
        where('visibility', '==', 'public'),
        where('communityId', '==', 'pro-feed'),
        orderBy('createdAt', 'desc')
      );
      unsub = onSnapshot(q, async (snap) => {
        const base = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            brand: data?.communityName || 'Pro Feed',
            title: data?.title || 'Untitled',
            snippet: (data?.body || '').slice(0, 200),
            content: data?.body || '',
            tags: Array.isArray(data?.tags) ? data.tags : [],
            authorName: data?.authorName || '',
            createdAt: data?.createdAt,
          };
        });

        // Emit filters (brands/tags)
        try {
          const brandSet = new Set();
          const tagCounts = new Map();
          for (const p of base) {
            if (p.brand) brandSet.add(p.brand);
            if (Array.isArray(p.tags)) {
              for (const t of p.tags) {
                const key = String(t || '').trim();
                if (!key) continue;
                tagCounts.set(key, (tagCounts.get(key) || 0) + 1);
              }
            }
          }
          const brands = Array.from(brandSet);
          const tags = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]).map(([k]) => k);
          onFiltersChange?.({ brands, tags });
        } catch {}

        // Numeric counts; fallback to 0 if queries fail
        const enriched = await Promise.all(base.map(async (post) => {
          try {
            const commentsQ = firestoreQuery(collection(db, 'community_comments'), where('postId', '==', post.id));
            const likesQ = firestoreQuery(collection(db, 'post_likes'), where('postId', '==', post.id));
            const [commentsSnap, likesSnap] = await Promise.all([
              getCountFromServer(commentsQ),
              getCountFromServer(likesQ)
            ]);
            return {
              ...post,
              commentCount: commentsSnap.data().count || 0,
              likeCount: likesSnap.data().count || 0,
            };
          } catch {
            return { ...post, commentCount: 0, likeCount: 0 };
          }
        }));

        setPosts(enriched);
        setLoading(false);
      });
    } catch (e) {
      setError('Failed to load Pro Feed.');
      setPosts(PRO_STUBS.map(p => ({
        id: p.id,
        brand: p.brand || 'Pro Feed',
        title: p.title || 'Untitled',
        snippet: (p.content || '').slice(0, 200),
        content: p.content || '',
        tags: Array.isArray(p.tags) ? p.tags : [],
        authorName: p.author?.name || '',
        likeCount: 0,
        commentCount: 0,
        createdAt: null,
      })));
      setLoading(false);
    }
    return () => { try { unsub(); } catch {} };
  }, []);

  const q = (query || search).trim().toLowerCase();
  const filtered = posts.filter((p) => {
    const okText = !q || (p.content?.toLowerCase().includes(q) || p.author?.name?.toLowerCase().includes(q));
    const brandList = selectedBrands.length > 0 ? selectedBrands : (brand && brand !== 'All' ? [brand] : []);
    const okBrand = brandList.length === 0 || brandList.includes(p.brand || '');
    const tags = Array.isArray(p.tags) ? p.tags : [];
    const okTags = selectedTags.length === 0 || tags.some((t) => selectedTags.includes(t));
    return okText && okBrand && okTags;
  });

  if (loading) {
    return (
      <div id="panel-pro" role="tabpanel" aria-labelledby="tab-pro" className="community-cards">
        <SkeletonPostCard />
        <SkeletonPostCard />
        <SkeletonPostCard />
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div id="panel-pro" role="tabpanel" aria-labelledby="tab-pro" className="space-y-3 text-center py-10">
        {error && (
          <div className="max-w-md mx-auto">
            <ErrorBanner message={error} onDismiss={() => setError('')} />
          </div>
        )}
        <div className="text-gray-900 font-medium">{COPY.empty.pro}</div>
      </div>
    );
  }

  const handleLike = async (post) => {
    try {
      // Optimistic UI toggle
      setPosts(prev => prev.map(p => (
        p.id === post.id
          ? { ...p, likeCount: (Number.isFinite(p.likeCount) ? p.likeCount : 0) + (p.likedByMe ? -1 : 1), likedByMe: !p.likedByMe }
          : p
      )));
      if (!db || !currentUser?.uid) return;
      const likeRef = doc(db, 'post_likes', `${post.id}_${currentUser.uid}`);
      const existing = await getDoc(likeRef);
      if (existing.exists()) {
        await deleteDoc(likeRef);
      } else {
        await setDoc(likeRef, { postId: post.id, userId: currentUser.uid, createdAt: serverTimestamp() });
      }
      // Refresh like count after write
      const likesQ = firestoreQuery(collection(db, 'post_likes'), where('postId', '==', post.id));
      const likesSnap = await getCountFromServer(likesQ);
      const likeCount = likesSnap.data().count || 0;
      setPosts(prev => prev.map(p => (p.id === post.id ? { ...p, likeCount } : p)));
    } catch {}
  };

  const handleComment = (post) => {
    console.log('Comment on pro post:', post.id);
    navigate(`/staff/community/post/${post.id}`);
  };

  const handleCardClick = (post) => {
    console.log('Pro card clicked for post:', post.id);
    navigate(`/staff/community/post/${post.id}`);
  };

  const handleViewTraining = (trainingId, post) => {
    console.log('View training:', trainingId, 'from pro post:', post.id);
    navigate(`/staff/trainings/${trainingId}`);
  };

  return (
    <div id="panel-pro" role="tabpanel" aria-labelledby="tab-pro" className="community-cards">
      {error && (
        <div className="max-w-md mx-auto">
          <ErrorBanner message={error} onDismiss={() => setError('')} />
        </div>
      )}
      {filtered.map((post, idx) => (
        <div key={post.id}>
          {post.isPinned && (
            <div className="flex items-center space-x-2 text-xs font-medium text-deep-moss mb-2">
              <span>PINNED</span>
            </div>
          )}
          <PostCard 
            post={post} 
            dataTestId={idx === 0 ? 'postcard-first' : undefined}
            onLike={handleLike}
            onComment={handleComment}
            onCardClick={handleCardClick}
            onViewTraining={handleViewTraining}
          />
        </div>
      ))}
    </div>
  );
}

export default function ProFeed({
  query = '',
  search = '', // backward compat
  brand = 'All', // backward compat
  selectedBrands = [],
  selectedTags = [],
  onRequestVerify,
  onFiltersChange,
}) {
  const { isVerified, hasRole, user } = useAuth();

  // Real computed value for staff verification
  const realIsVerifiedStaff = (isVerified === true) && (hasRole(['verified_staff', 'staff', 'brand_manager', 'super_admin']));

  // Dev override that can be toggled without reload via localStorage
  const [devOverride, setDevOverride] = useState(readDevOverride());
  useEffect(() => {
    const id = setInterval(() => {
      const next = readDevOverride();
      setDevOverride((prev) => (prev !== next ? next : prev));
    }, 800);
    return () => clearInterval(id);
  }, []);

  const isVerifiedStaff = useMemo(() => {
    if (devOverride === true) return true;
    if (devOverride === false) return false;
    return realIsVerifiedStaff;
  }, [devOverride, realIsVerifiedStaff]);

  // Emit available filters from stubs when mounted/when props change
  useEffect(() => {
    try {
      const brands = Array.from(new Set(PRO_STUBS.map((p) => p.brand).filter(Boolean)));
      const tags = Array.from(new Set(PRO_STUBS.flatMap((p) => (Array.isArray(p.tags) ? p.tags : [])).filter(Boolean)));
      onFiltersChange?.({ brands, tags });
    } catch {}
  }, [onFiltersChange]);

  return isVerifiedStaff ? (
    <ProFeedContent
      query={query}
      search={search}
      brand={brand}
      selectedBrands={selectedBrands}
      selectedTags={selectedTags}
      onFiltersChange={onFiltersChange}
      currentUser={user}
    />
  ) : (
    <ProGate onRequestVerify={onRequestVerify} />
  );
}
