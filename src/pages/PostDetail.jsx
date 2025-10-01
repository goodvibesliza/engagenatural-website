// src/pages/PostDetail.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { WHATS_GOOD_STUBS } from '../components/community/WhatsGoodFeed';
import { PRO_STUBS } from '../components/community/ProFeed';
import { db } from '@/lib/firebase';
import { useAuth } from '../contexts/auth-context';
import SkeletonDetail from '../components/community/SkeletonDetail';
import { filterPostContent } from '../ContentModeration';
import ErrorBanner from '../components/community/ErrorBanner';
import { postOpen, postLike as analyticsPostLike, postComment as analyticsPostComment, postOpenTraining } from '../lib/analytics';
import COPY from '../i18n/community.copy';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getCountFromServer,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const headingRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState(null);
  const [likeIds, setLikeIds] = useState([]); // derive counts from arrays
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]); // [{id,text,createdAt,status?:'pending'|'error'|'ok'}]
  const [newComment, setNewComment] = useState('');
  const [likeError, setLikeError] = useState('');

  const { user } = useAuth();

  // Focus the heading after content is loaded and rendered
  useEffect(() => {
    if (!loading && post && headingRef.current) {
      headingRef.current.focus();
    }
  }, [loading, post]);

  // Support draft previews passed via navigation state (no backend write yet)
  useEffect(() => {
    const draft = location.state?.draft;
    if (draft) {
      setPost({
        id: draft.id,
        brand: draft.brand || draft.communityName || 'General',
        title: draft.title || 'Update',
        snippet: draft.body || draft.content || '',
        content: draft.body || draft.content || '',
        createdAt: new Date(),
        likeIds: [],
        commentIds: [],
      });
      setLoading(false);
    }
  }, [location.state]);

  // initial load (stubs / firestore)
  useEffect(() => {
    // If we already set a draft post, skip network load
    if (location.state?.draft) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        let mappedPost = null;
        let feedType = 'unknown';
        
        // Try to find in stub data first
        const wg = WHATS_GOOD_STUBS.find((p) => p.id === postId);
        const pr = !wg ? PRO_STUBS.find((p) => p.id === postId) : null;
        const stub = wg || pr || null;
        
        if (stub) {
          mappedPost = {
            id: stub.id,
            brand: stub.brand || 'General',
            title: stub.title || 'Update',
            snippet: stub.snippet || stub.content || '',
            content: stub.content || stub.snippet || '',
            createdAt: stub.createdAt || null,
            timeAgo: stub.timeAgo || '',
            trainingId: stub.trainingId || null,
            likeIds: [],
            commentIds: [],
          };
          feedType = wg ? 'whatsGood' : 'pro';
        } else {
          // Try Firestore lookup
          const ref = doc(db, 'community_posts', postId);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            mappedPost = {
              id: snap.id,
              brand: data.brand || data.communityName || 'General',
              title: data.title || 'Update',
              snippet: data.body || '',
              content: data.body || '',
              createdAt: data.createdAt || null,
              authorName: data.authorName || '',
              authorPhotoURL: data.authorPhotoURL || '',
              userId: data.userId || null,
              trainingId: data.trainingId || null,
              likeIds: [],
              commentIds: [],
            };
            feedType = 'unknown';
          }
        }

        // Set the post if we found it (either stub or Firestore)
        if (mappedPost && !cancelled) {
          setPost(mappedPost);
          postOpen({ postId: mappedPost.id, feedType });
        } else if (!cancelled) {
          setPost(null);
          setLoading(false);
          return; // Exit early if no post found
        }

        // ALWAYS load likes and comments from Firestore (for both stub and real posts)
        if (db && !cancelled) {
          try {
            const likesQ = query(collection(db, 'post_likes'), where('postId', '==', postId));
            const commentsQ = query(collection(db, 'community_comments'), where('postId', '==', postId));
            const [likesSnap, commentsSnap] = await Promise.all([
              getCountFromServer(likesQ),
              getCountFromServer(commentsQ),
            ]);
            
            if (!cancelled) {
              const likeCount = likesSnap.data().count || 0;
              // Initialize likeIds as placeholders to derive count; ensure 'me' present if likedByMe resolves true later
              setLikeIds(Array.from({ length: likeCount }, (_, i) => `x${i}`));
            }

            const recentQ = query(
              collection(db, 'community_comments'),
              where('postId', '==', postId),
              orderBy('createdAt', 'asc')
            );
            const recentSnap = await getDocs(recentQ);
            if (!cancelled) {
              setComments(recentSnap.docs.map((d) => ({ id: d.id, status: 'ok', ...d.data() })));
            }

            // Determine if current user liked this post already
            try {
              if (user?.uid) {
                const likeRef = doc(db, 'post_likes', `${postId}_${user.uid}`);
                const likeDoc = await getDoc(likeRef);
                if (!cancelled) {
                  setLiked(likeDoc.exists());
                  // Ensure local likeIds includes 'me' token when liked
                  setLikeIds((prev) => {
                    const hasMe = prev.includes('me');
                    if (likeDoc.exists() && !hasMe) return [...prev, 'me'];
                    if (!likeDoc.exists() && hasMe) return prev.filter((v) => v !== 'me');
                    return prev;
                  });
                }
              }
            } catch (err) {
              console.warn('Failed to check if user liked post:', err);
            }
          } catch (err) {
            console.warn('Failed to load comments/likes from Firestore:', err);
            // Initialize empty arrays if Firestore fails
            if (!cancelled) {
              setLikeIds([]);
              setComments([]);
              setLiked(false);
            }
          }
        }
      } catch (e) {
        if (!cancelled) {
          setPost(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [postId, location.state]);

  // Keep liked marker in sync with auth changes
  useEffect(() => {
    let cancelled = false;
    async function refreshLiked() {
      if (!postId) return;
      // On logout, clear liked state immediately
      if (!user?.uid) {
        setLiked(false);
        setLikeIds((prev) => (prev.includes('me') ? prev.filter((v) => v !== 'me') : prev));
        return;
      }
      try {
        const likeRef = doc(db, 'post_likes', `${postId}_${user.uid}`);
        const likeDoc = await getDoc(likeRef);
        if (cancelled) return;
        setLiked(likeDoc.exists());
        setLikeIds((prev) => {
          const hasMe = prev.includes('me');
          if (likeDoc.exists() && !hasMe) return [...prev, 'me'];
          if (!likeDoc.exists() && hasMe) return prev.filter((v) => v !== 'me');
          return prev;
        });
      } catch {}
    }
    refreshLiked();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, postId]);

  const handleLike = async () => {
    if (!post) return;
    setLikeError('');

    // Derive nextLiked from previous state (race-safe)
    const intendedNext = !liked; // used only for server intent and error revert

    setLiked((prev) => {
      const next = !prev;
      analyticsPostLike({ postId: post.id, liked: next });
      return next;
    });

    // Update likeIds using intendedNext (single source of truth)
    setLikeIds((prev) => {
      const hasMe = prev.includes('me');
      if (intendedNext) {
        // ensure presence
        return hasMe ? prev : [...prev, 'me'];
      }
      // ensure removal
      return hasMe ? prev.filter((v) => v !== 'me') : prev;
    });

    // Persist via Firestore if available; revert on failure
    try {
      if (db && user?.uid) {
        const likeRef = doc(db, 'post_likes', `${post.id}_${user.uid}`);
        const likeDoc = await getDoc(likeRef);
        if (likeDoc.exists()) {
          // currently liked on server
          if (!intendedNext) {
            const { deleteDoc } = await import('firebase/firestore');
            await deleteDoc(likeRef);
          }
        } else {
          // not liked on server
          if (intendedNext) {
            const { setDoc, serverTimestamp } = await import('firebase/firestore');
            await setDoc(likeRef, { postId: post.id, userId: user.uid, createdAt: serverTimestamp() });
          }
        }
      }
    } catch (e) {
      // Revert and show error
      setLiked((prev) => !prev); // undo last toggle
      setLikeIds((prev) => {
        const hasMe = prev.includes('me');
        // Revert opposite of intended
        if (intendedNext) {
          // we tried to like → ensure removal
          return hasMe ? prev.filter((v) => v !== 'me') : prev;
        } else {
          // we tried to unlike → ensure add
          return hasMe ? prev : [...prev, 'me'];
        }
      });
      setLikeError(COPY.errors.generic);
    }
  };

  const handleDeletePost = async () => {
    try {
      if (!post || !user?.uid || post.userId !== user.uid) return;
      if (!window.confirm('Delete this post and its likes/comments? This cannot be undone.')) return;
      const { writeBatch, collection: coll, query: q2, where: w2, getDocs: gd2, doc: d2, deleteDoc: del2 } = await import('firebase/firestore');
      const batch = writeBatch(db);
      // delete likes
      const likesQ = q2(coll(db, 'post_likes'), w2('postId', '==', post.id));
      const likesSnap = await gd2(likesQ);
      likesSnap.forEach((docSnap) => batch.delete(docSnap.ref));
      // delete comments
      const cmtsQ = q2(coll(db, 'community_comments'), w2('postId', '==', post.id));
      const cmtsSnap = await gd2(cmtsQ);
      cmtsSnap.forEach((docSnap) => batch.delete(docSnap.ref));
      // delete post
      batch.delete(d2(db, 'community_posts', post.id));
      await batch.commit();
      navigate('/staff/community');
    } catch (e) {
      console.error('Failed to delete post', e);
      try { window.alert('Failed to delete post. Please try again.'); } catch {}
    }
  };

  const handleDeleteComment = async (cmt) => {
    try {
      if (!cmt?.id || !user?.uid || cmt.userId !== user.uid) return;
      if (!window.confirm('Delete this comment?')) return;
      const { doc: d2, deleteDoc: del2 } = await import('firebase/firestore');
      await del2(d2(db, 'community_comments', cmt.id));
      setComments((prev) => prev.filter((c) => c.id !== cmt.id));
      setTimeout(() => {
        if (typeof window.refreshWhatsGoodComments === 'function') {
          window.refreshWhatsGoodComments(post.id);
        }
      }, 500);
    } catch (e) {
      console.error('Failed to delete comment', e);
      try { window.alert('Failed to delete comment. Please try again.'); } catch {}
    }
  };

  const handleAddComment = async () => {
    const text = newComment.trim();
    if (!text) return;
    // Moderate comment content before any optimistic UI
    try {
      const moderation = await filterPostContent({ content: text });
      if (moderation?.isBlocked || moderation?.needsReview) {
        try { window.alert('Your comment needs revision before it can be posted.'); } catch {}
        return;
      }
    } catch {}
    analyticsPostComment({ postId: post.id, length: text.length });
    // Optimistic add; replace on success, mark error on failure
    const now = new Date();
    const optimistic = {
      id: `local-${now.getTime()}`,
      text,
      createdAt: now,
      userRole: 'you',
      status: 'pending',
    };
    setComments((prev) => [...prev, optimistic]);
    setNewComment('');
    if (!db || !user?.uid) {
      // no backend available → mark as ok
      setComments((prev) => prev.map((c) => (c.id === optimistic.id ? { ...c, status: 'ok' } : c)));
      return;
    }
    try {
      const { addDoc, serverTimestamp } = await import('firebase/firestore');
      const ref = await addDoc(collection(db, 'community_comments'), {
        postId: post.id,
        communityId: post.communityId || 'whats-good',
        brandId: post.brandId || null,
        userId: user.uid,
        userRole: user.role || 'user',
        authorName: user.displayName || user.email || 'User',
        authorPhotoURL: user.photoURL || null,
        text,
        createdAt: serverTimestamp(),
      });
      setComments((prev) => prev.map((c) => (c.id === optimistic.id ? { ...c, id: ref.id, status: 'ok' } : c)));
      
      // Refresh comment count in community feed with delay for Firestore consistency
      setTimeout(() => {
        if (typeof window.refreshWhatsGoodComments === 'function') {
          console.log('Refreshing comment count for post:', post.id);
          window.refreshWhatsGoodComments(post.id);
        } else {
          console.warn('window.refreshWhatsGoodComments not available');
        }
      }, 1000); // 1 second delay to allow Firestore to propagate
    } catch (e) {
      setComments((prev) => prev.map((c) => (c.id === optimistic.id ? { ...c, status: 'error' } : c)));
    }
  };

  const retrySendComment = async (cmt) => {
    if (!cmt || cmt.status !== 'error') return;
    setComments((prev) => prev.map((c) => (c.id === cmt.id ? { ...c, status: 'pending' } : c)));
    try {
      const { addDoc, serverTimestamp } = await import('firebase/firestore');
      const ref = await addDoc(collection(db, 'community_comments'), {
        postId: post.id,
        communityId: post.communityId || 'whats-good',
        brandId: post.brandId || null,
        userId: user.uid,
        userRole: user.role || 'user',
        authorName: user.displayName || user.email || 'User',
        authorPhotoURL: user.photoURL || null,
        text: cmt.text,
        createdAt: serverTimestamp(),
      });
      setComments((prev) => prev.map((c) => (c.id === cmt.id ? { ...c, id: ref.id, status: 'ok' } : c)));
    } catch (e) {
      setComments((prev) => prev.map((c) => (c.id === cmt.id ? { ...c, status: 'error' } : c)));
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="animate-pulse h-5 w-24 bg-gray-200 rounded" />
        <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
          <div className="h-4 bg-gray-200 rounded w-full mb-2" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <button
          onClick={() => navigate('/staff/community')}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          ← Back to community
        </button>
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-600">
          Post not found.
        </div>
      </div>
    );
  }

  const timeText = post.timeAgo || '';

  return (
    <div className="min-h-screen bg-cool-gray">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-600 hover:text-gray-800"
          aria-label="Go back"
        >
          ← Back
        </button>

        <article className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
          {location.state?.draft && (
            <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              Draft preview — this post is not yet saved to the community database.
            </div>
          )}
          <header className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-3 h-7 min-h-[28px] rounded-full text-xs font-medium border border-deep-moss/30 text-deep-moss bg-white">
                {post.brand || 'General'}
              </span>
              {(post.authorName || post.authorPhotoURL) && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  {post.authorPhotoURL ? (
                    <img src={post.authorPhotoURL} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-600">
                      {(post.authorName || 'U').slice(0,1).toUpperCase()}
                    </div>
                  )}
                  <span className="truncate max-w-[160px]" title={post.authorName}>{post.authorName}</span>
                </div>
              )}
            </div>
            {timeText && (
              <time className="text-xs text-warm-gray">{timeText}</time>
            )}
          </header>

          <h1
            ref={headingRef}
            tabIndex={-1}
            className="mt-3 text-xl font-semibold text-gray-900"
          >
            {post.title || 'Update'}
          </h1>

          {post.content && (
            <div className="mt-2 text-gray-800 whitespace-pre-wrap">{post.content}</div>
          )}

          {post.trainingId && (
            <section className="mt-6 border-t border-gray-100 pt-4">
              <h2 className="text-sm font-medium text-gray-900">Related training</h2>
              <button
                type="button"
                onClick={() => { postOpenTraining({ postId: post.id, trainingId: post.trainingId }); navigate(`/staff/trainings/${post.trainingId}`); }}
                className="mt-2 inline-flex items-center justify-center px-3 h-11 min-h-[44px] rounded-md border border-deep-moss text-sm text-deep-moss hover:bg-oat-beige"
                aria-label="View related training"
              >
                {COPY.buttons.viewTraining}
              </button>
            </section>
          )}

          <footer className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={handleLike}
              className={`inline-flex items-center justify-center px-3 h-11 min-h-[44px] rounded-md border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                liked ? 'border-rose-500 text-rose-600 bg-rose-50' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              aria-pressed={liked ? 'true' : 'false'}
              aria-label={liked ? `Unlike post (${likeIds.length} likes)` : `Like post (${likeIds.length} likes)`}
              data-testid="like-button"
            >
              <span className="mr-1" aria-hidden>
                {liked ? '❤️' : '🤍'}
              </span>
              <span>{COPY.buttons.like}</span>
              <span className="ml-2 text-gray-500">{likeIds.length}</span>
            </button>
            {likeError && (
              <span className="text-xs text-red-600">{likeError}</span>
            )}

            <a
              href="#comment"
              className="inline-flex items-center justify-center px-3 h-11 min-h-[44px] rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              aria-label={`Jump to comments (${comments.length} comments)`}
            >
              <span className="mr-1" aria-hidden>💬</span>
              <span>{COPY.buttons.comment}</span>
              <span className="ml-2 text-gray-500">{comments.length}</span>
            </a>
            {!!user?.uid && post.userId === user.uid && !location.state?.draft && (
              <button
                type="button"
                onClick={handleDeletePost}
                className="ml-auto inline-flex items-center justify-center px-3 h-11 min-h-[44px] rounded-md border border-rose-500 text-sm text-rose-600 hover:bg-rose-50"
              >
                Delete
              </button>
            )}
          </footer>
        </article>

        {/* Comments */}
        <section id="comments" className="mt-4">
          <h2 className="sr-only">Comments</h2>
          {comments.length === 0 ? (
            <div className="text-sm text-warm-gray">No comments yet.</div>
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li key={c.id} className="bg-white rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      {c.authorPhotoURL ? (
                        <img src={c.authorPhotoURL} alt="" className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-600">
                          {(c.authorName || 'U').slice(0,1).toUpperCase()}
                        </div>
                      )}
                      <span className="text-gray-700">{c.authorName || 'User'}</span>
                      <span className="text-gray-400">•</span>
                      <span>{c.userRole || 'user'}</span>
                    </div>
                    <span>
                      {typeof c.createdAt?.toDate === 'function'
                        ? c.createdAt.toDate().toLocaleString()
                        : (c.createdAt instanceof Date ? c.createdAt.toLocaleString() : 'Recently')}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-800">{c.text}</p>
                  {c.status === 'error' && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
                      <span>{COPY.errors.generic}</span>
              <button
                        type="button"
                        onClick={() => retrySendComment(c)}
                className="mt-2 inline-flex items-center justify-center px-3 h-11 min-h-[44px] rounded-md border border-deep-moss text-sm text-deep-moss hover:bg-oat-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                  {!!user?.uid && c.userId === user.uid && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(c)}
                        className="inline-flex items-center justify-center px-2 h-8 rounded-md border border-rose-500 text-xs text-rose-600 hover:bg-rose-50"
                      >
                        Delete comment
                      </button>
                    </div>
                  )}
                  {c.status === 'pending' && (
                    <div className="mt-2 text-xs text-gray-500">Sending…</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Composer – sticky bottom */}
      <div className="sticky bottom-0 inset-x-0 border-t border-gray-200 bg-white">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <input
            id="comment"
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment…"
            aria-label="Add a comment"
            className="flex-1 px-3 py-3 h-11 min-h-[44px] border border-gray-300 rounded-md text-sm"
            data-testid="comment-input"
          />
          <button
            type="button"
            onClick={handleAddComment}
            className={`px-4 h-11 min-h-[44px] rounded-md text-sm transition-colors border ${
              newComment.trim()
                ? 'bg-brand-primary text-primary border-brand-primary hover:opacity-90'
                : 'bg-gray-200 text-white border-gray-300 cursor-not-allowed'
            }`}
            disabled={!newComment.trim()}
            data-testid="comment-submit"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
