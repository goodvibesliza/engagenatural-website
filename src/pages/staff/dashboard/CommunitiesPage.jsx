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
  addDoc,
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
          to={`/community/post/${post.id}`}
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

  /* -------------------------------------------------------------------
   * Communities list + post composer state
   * ------------------------------------------------------------------*/
  const [communities, setCommunities] = useState([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [communitiesError, setCommunitiesError] = useState(false);

  const canCreate =
    user?.role === 'super_admin' || user?.role === 'brand_manager';

  const truncate = (t, n = 140) =>
    t && t.length > n ? `${t.slice(0, n)}...` : t || '';

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

  /* -------------------------------------------------------------------
   * Create Post Handler
   * ------------------------------------------------------------------*/
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!canCreate || !newTitle.trim() || !newBody.trim() || creating) return;

    setCreating(true);
    setCreateError('');
    try {
      await addDoc(collection(db, 'community_posts'), {
        title: newTitle.trim(),
        body: newBody.trim(),
        visibility: 'public',
        createdAt: serverTimestamp(),
        userId: user?.uid || null,
        authorRole: user?.role || 'user'
      });
      setNewTitle('');
      setNewBody('');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setCreateError('Failed to create post');
    } finally {
      setCreating(false);
    }
  };

  /* -------------------------------------------------------------------
   * Load Communities list (public & active)
   * ------------------------------------------------------------------*/
  useEffect(() => {
    const loadCommunities = async () => {
      try {
        const q = query(
          collection(db, 'communities'),
          where('isActive', '==', true)
        );
        const snap = await getDocs(q);
        let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // staff users only see public ones
        items = items.filter((c) => c.isPublic === true);
        // put what's-good first
        items.sort((a, b) => {
          if (a.id === 'whats-good') return -1;
          if (b.id === 'whats-good') return 1;
          return (a.name || '').localeCompare(b.name || '');
        });
        setCommunities(items);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error loading communities', err);
        setCommunitiesError(true);
      } finally {
        setLoadingCommunities(false);
      }
    };
    loadCommunities();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communities</h1>
          <p className="text-gray-600 mt-1">Public community posts</p>
        </div>

        {/* ---------------- Communities Grid ---------------- */}
        <div className="mt-2">
          <h2 className="text-xl font-semibold text-gray-900">Communities</h2>
          {loadingCommunities ? (
            <div className="text-gray-500 text-sm mt-2">Loading communities…</div>
          ) : communitiesError && communities.length === 0 ? (
            <div className="mt-3">
              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium text-gray-900">What's Good</h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary">
                        Open to All
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">
                      Latest product drops and industry buzz.
                    </p>
                    <div className="text-xs text-gray-500 mt-2">2500 members</div>
                  </div>
                  <Link
                    to="/community/whats-good"
                    className="ml-3 text-sm px-3 py-1 bg-brand-primary text-white rounded hover:bg-brand-primary/90"
                  >
                    Open
                  </Link>
                </div>
              </div>
            </div>
          ) : communities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              {communities.map((c) => (
                <div key={c.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium text-gray-900">{c.name || c.id}</h3>
                        {c.badge && (
                          <span className="text-xs px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary">
                            {c.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mt-1">{truncate(c.description, 140)}</p>
                      <div className="text-xs text-gray-500 mt-2">
                        {(c.members ?? c.memberCount ?? 0)} members
                      </div>
                    </div>
                    <Link
                      to={`/community/${c.id}`}
                      className="ml-3 text-sm px-3 py-1 bg-brand-primary text-white rounded hover:bg-brand-primary/90"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm mt-2">No public communities available.</div>
          )}
        </div>

        {/* ---------------- Post Composer ---------------- */}
        {canCreate && (
          <form
            onSubmit={handleCreatePost}
            className="mt-6 bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Create a Post</h3>
            {createError && <div className="mb-2 text-sm text-red-600">{createError}</div>}
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Post title"
              className="w-full mb-3 p-2 border border-gray-300 rounded"
            />
            <textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="Write your post…"
              rows="4"
              className="w-full mb-3 p-2 border border-gray-300 rounded"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creating || !newTitle.trim() || !newBody.trim()}
                className="px-4 py-2 rounded bg-brand-primary text-white hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Posting…' : 'Post'}
              </button>
            </div>
          </form>
        )}

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
