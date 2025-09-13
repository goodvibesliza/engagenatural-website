import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/auth-context';
import { db } from '../../../lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  startAfter,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  getCountFromServer
} from 'firebase/firestore';

const PostSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow-sm animate-pulse">
    <div className="flex justify-between items-start">
      <div className="h-6 bg-gray-200 rounded w-3/5 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/5"></div>
    </div>
    <div className="space-y-2 my-3">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
    <div className="flex justify-between items-center mt-4">
      <div className="h-5 bg-gray-200 rounded w-20"></div>
      <div className="h-8 bg-gray-200 rounded w-24"></div>
    </div>
  </div>
);

const PostCard = ({ post, liked, likeCount, commentCount, onToggleLike, pendingLike, comments }) => {
  const formattedDate = post.createdAt?.toDate
    ? new Date(post.createdAt.toDate()).toLocaleString()
    : 'Recently';

  const truncate = (text, n = 160) => (text && text.length > n ? `${text.slice(0, n)}...` : (text || ''));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow-sm hover:shadow transition-shadow">
      <div className="flex justify-between items-start">
        <h3 className="font-medium text-lg text-gray-900">{post.title || 'Untitled Post'}</h3>
        <div className="text-xs text-gray-500 flex items-center">
          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded mr-2">{post.authorRole || 'user'}</span>
          <span>{formattedDate}</span>
        </div>
      </div>

      {post.body && <p className="text-gray-700 my-3">{truncate(post.body)}</p>}

      <div className="flex justify-between items-center mt-4">
        <div className="flex space-x-5 items-center">
          <button
            onClick={() => onToggleLike(post.id)}
            disabled={pendingLike}
            className={`flex items-center space-x-1 ${liked ? 'text-brand-primary' : 'text-gray-500'} ${pendingLike ? 'opacity-50 cursor-not-allowed' : 'hover:text-brand-primary'}`}
          >
            <span role="img" aria-label="like">{liked ? '❤️' : '🤍'}</span>
            <span>{likeCount ?? 0}</span>
          </button>

          <div className="flex items-center space-x-1 text-gray-500">
            <span role="img" aria-label="comments">💬</span>
            <span>{commentCount ?? 0}</span>
          </div>
        </div>

        <Link
          to={`/community/${post.id}`}
          className="text-sm px-3 py-1 bg-brand-primary text-white rounded hover:bg-brand-primary/90"
        >
          View thread
        </Link>
      </div>

      {comments && comments.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Recent comments:</p>
          <div className="space-y-2">
            {comments.map((c) => (
              <div key={c.id} className="bg-gray-50 rounded p-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{c.userRole || 'user'}</span>
                  <span>{c.createdAt?.toDate ? new Date(c.createdAt.toDate()).toLocaleString() : 'Recently'}</span>
                </div>
                <p className="text-sm">{truncate(c.text, 100)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function CommunitiesPage() {
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef(null);

  const [likedPosts, setLikedPosts] = useState(new Set());
  const [pendingLikes, setPendingLikes] = useState(new Set());
  const [likeCounts, setLikeCounts] = useState({});
  const [commentCounts, setCommentCounts] = useState({});
  const [commentsMap, setCommentsMap] = useState({});

  const loadCountsFor = useCallback(async (postIds) => {
    if (!postIds || postIds.length === 0) return;
    const nextLikeCounts = {};
    const nextCommentCounts = {};

    for (const pid of postIds) {
      const likesQ = query(collection(db, 'post_likes'), where('postId', '==', pid));
      const commentsQ = query(collection(db, 'community_comments'), where('postId', '==', pid));
      const [likesSnap, commentsSnap] = await Promise.all([
        getCountFromServer(likesQ),
        getCountFromServer(commentsQ)
      ]);
      nextLikeCounts[pid] = likesSnap.data().count || 0;
      nextCommentCounts[pid] = commentsSnap.data().count || 0;
    }

    setLikeCounts((prev) => ({ ...prev, ...nextLikeCounts }));
    setCommentCounts((prev) => ({ ...prev, ...nextCommentCounts }));
  }, []);

  const loadLikedFlagsFor = useCallback(async (postIds, uid) => {
    if (!uid || !postIds || postIds.length === 0) return;
    const liked = new Set();
    for (const pid of postIds) {
      const likeRef = doc(db, 'post_likes', `${pid}_${uid}`);
      const likeDoc = await getDoc(likeRef);
      if (likeDoc.exists()) liked.add(pid);
    }
    setLikedPosts((prev) => {
      const merged = new Set(prev);
      liked.forEach((id) => merged.add(id));
      return merged;
    });
  }, []);

  const loadCommentsPreviewFor = useCallback(async (postIds) => {
    if (!postIds || postIds.length === 0) return;
    const next = {};
    for (const pid of postIds) {
      const commentsQ = query(
        collection(db, 'community_comments'),
        where('postId', '==', pid),
        orderBy('createdAt', 'desc'),
        limit(3)
      );
      const snap = await getDocs(commentsQ);
      next[pid] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
    setCommentsMap((prev) => ({ ...prev, ...next }));
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'community_posts'),
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsub = onSnapshot(q, async (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPosts(items);
      lastDocRef.current = snap.docs[snap.docs.length - 1] || null;
      setHasMore(snap.size === 10);
      setInitialLoading(false);

      const ids = items.map((p) => p.id);
      await Promise.all([
        loadCountsFor(ids),
        loadCommentsPreviewFor(ids),
        loadLikedFlagsFor(ids, user?.uid)
      ]);
    });

    return () => unsub();
  }, [user?.uid, loadCountsFor, loadCommentsPreviewFor, loadLikedFlagsFor]);

  const loadMore = async () => {
    if (!lastDocRef.current || loadingMore) return;
    setLoadingMore(true);
    try {
      const q = query(
        collection(db, 'community_posts'),
        where('visibility', '==', 'public'),
        orderBy('createdAt', 'desc'),
        startAfter(lastDocRef.current),
        limit(10)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        setHasMore(false);
        return;
      }
      const more = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPosts((prev) => [...prev, ...more]);
      lastDocRef.current = snap.docs[snap.docs.length - 1] || null;
      setHasMore(snap.size === 10);

      const ids = more.map((p) => p.id);
      await Promise.all([
        loadCountsFor(ids),
        loadCommentsPreviewFor(ids),
        loadLikedFlagsFor(ids, user?.uid)
      ]);
    } finally {
      setLoadingMore(false);
    }
  };

  const toggleLike = async (postId) => {
    if (!user?.uid || pendingLikes.has(postId)) return;
    setPendingLikes((prev) => new Set(prev).add(postId));

    const likeRef = doc(db, 'post_likes', `${postId}_${user.uid}`);
    const likeDoc = await getDoc(likeRef);

    if (likeDoc.exists()) {
      await deleteDoc(likeRef);
      setLikedPosts((prev) => {
        const s = new Set(prev);
        s.delete(postId);
        return s;
      });
    } else {
      await setDoc(likeRef, { postId, userId: user.uid, createdAt: serverTimestamp() });
      setLikedPosts((prev) => {
        const s = new Set(prev);
        s.add(postId);
        return s;
      });
    }

    const likesQ = query(collection(db, 'post_likes'), where('postId', '==', postId));
    const commentsQ = query(collection(db, 'community_comments'), where('postId', '==', postId));
    const [likesSnap, commentsSnap] = await Promise.all([
      getCountFromServer(likesQ),
      getCountFromServer(commentsQ)
    ]);
    setLikeCounts((prev) => ({ ...prev, [postId]: likesSnap.data().count || 0 }));
    setCommentCounts((prev) => ({ ...prev, [postId]: commentsSnap.data().count || 0 }));

    setPendingLikes((prev) => {
      const s = new Set(prev);
      s.delete(postId);
      return s;
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communities</h1>
          <p className="text-gray-600 mt-1">Public community posts</p>
        </div>

        {initialLoading ? (
          <div className="flex flex-col py-4">
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 mt-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                liked={likedPosts.has(post.id)}
                likeCount={likeCounts[post.id]}
                commentCount={commentCounts[post.id]}
                onToggleLike={toggleLike}
                pendingLike={pendingLikes.has(post.id)}
                comments={commentsMap[post.id] || []}
              />
            ))}

            {hasMore && (
              <div className="flex justify-center mt-2">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-4 py-2 rounded bg-brand-primary text-white hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? 'Loading…' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center mt-4">
            <p className="text-gray-500">No public posts yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
