// src/pages/PostDetail.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { WHATS_GOOD_STUBS } from '../components/community/WhatsGoodFeed';
import { PRO_STUBS } from '../components/community/ProFeed';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/auth-context';
import SkeletonDetail from '../components/community/SkeletonDetail';
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

  // initial load
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const wg = WHATS_GOOD_STUBS.find((p) => p.id === postId);
        const pr = !wg ? PRO_STUBS.find((p) => p.id === postId) : null;
        const stub = wg || pr || null;
        if (stub) {
          const mapped = {
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
          if (!cancelled) {
            setPost(mapped);
            setLikeIds([]);
            setComments([]);
            postOpen({ postId: mapped.id, feedType: wg ? 'whatsGood' : 'pro' });
          }
        } else {
          // Firestore lookup
          const ref = doc(db, 'community_posts', postId);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            const mapped = {
              id: snap.id,
              brand: data.brand || data.communityName || 'General',
              title: data.title || 'Update',
              snippet: data.body || '',
              content: data.body || '',
              createdAt: data.createdAt || null,
              trainingId: data.trainingId || null,
              likeIds: [],
              commentIds: [],
            };
            if (!cancelled) {
              setPost(mapped);
              postOpen({ postId: mapped.id, feedType: 'unknown' });
            }

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
            } catch {}
          } else if (!cancelled) {
            setPost(null);
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
  }, [postId]);

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

  const handleAddComment = async () => {
    const text = newComment.trim();
    if (!text) return;
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
        text,
        createdAt: serverTimestamp(),
      });
      setComments((prev) => prev.map((c) => (c.id === optimistic.id ? { ...c, id: ref.id, status: 'ok' } : c)));
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
          <header className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 h-7 min-h-[28px] rounded-full text-xs font-medium border border-deep-moss/30 text-deep-moss bg-white">
                {post.brand || 'General'}
              </span>
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
                    <span>{c.userRole || 'user'}</span>
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
            className="px-3 h-11 min-h-[44px] rounded-md bg-deep-moss text-white text-sm hover:bg-sage-dark disabled:opacity-50"
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
