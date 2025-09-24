// src/pages/PostDetail.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { WHATS_GOOD_STUBS } from '../components/community/WhatsGoodFeed';
import { PRO_STUBS } from '../components/community/ProFeed';
import { db } from '../lib/firebase';
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
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (headingRef.current) headingRef.current.focus();
  }, []);

  // initial load
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const stub = [...WHATS_GOOD_STUBS, ...PRO_STUBS].find((p) => p.id === postId);
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
            setLikeCount(0);
            setCommentCount(0);
            setComments([]);
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
            if (!cancelled) setPost(mapped);

            const likesQ = query(collection(db, 'post_likes'), where('postId', '==', postId));
            const commentsQ = query(collection(db, 'community_comments'), where('postId', '==', postId));
            const [likesSnap, commentsSnap] = await Promise.all([
              getCountFromServer(likesQ),
              getCountFromServer(commentsQ),
            ]);
            if (!cancelled) {
              setLikeCount(likesSnap.data().count || 0);
              setCommentCount(commentsSnap.data().count || 0);
            }

            const recentQ = query(
              collection(db, 'community_comments'),
              where('postId', '==', postId),
              orderBy('createdAt', 'asc')
            );
            const recentSnap = await getDocs(recentQ);
            if (!cancelled) {
              setComments(recentSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
            }
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

  const handleLike = () => {
    // Optimistic toggle (persistence handled in next step)
    setLiked((prev) => !prev);
    setLikeCount((c) => (liked ? Math.max(0, c - 1) : c + 1));
  };

  const handleAddComment = () => {
    const text = newComment.trim();
    if (!text) return;
    // Optimistic add (persistence handled in next step)
    const now = new Date();
    const optimistic = {
      id: `local-${now.getTime()}`,
      text,
      createdAt: now,
      userRole: 'you',
    };
    setComments((prev) => [...prev, optimistic]);
    setCommentCount((c) => c + 1);
    setNewComment('');
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
          onClick={() => navigate('/community')}
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
                onClick={() => navigate(`/staff/trainings/${post.trainingId}`)}
                className="mt-2 inline-flex items-center justify-center px-3 h-11 min-h-[44px] rounded-md border border-deep-moss text-sm text-deep-moss hover:bg-oat-beige"
                aria-label="View related training"
              >
                View Training
              </button>
            </section>
          )}

          <footer className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={handleLike}
              className={`inline-flex items-center justify-center px-3 h-11 min-h-[44px] rounded-md border text-sm transition-colors ${
                liked ? 'border-rose-500 text-rose-600 bg-rose-50' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              aria-label={liked ? `Unlike post (${likeCount} likes)` : `Like post (${likeCount} likes)`}
            >
              <span className="mr-1" aria-hidden>
                {liked ? '❤️' : '🤍'}
              </span>
              <span>Like</span>
              <span className="ml-2 text-gray-500">{likeCount}</span>
            </button>

            <a
              href="#comment"
              className="inline-flex items-center justify-center px-3 h-11 min-h-[44px] rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
              aria-label={`Jump to comments (${commentCount} comments)`}
            >
              <span className="mr-1" aria-hidden>💬</span>
              <span>Comment</span>
              <span className="ml-2 text-gray-500">{commentCount}</span>
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
          />
          <button
            type="button"
            onClick={handleAddComment}
            className="px-3 h-11 min-h-[44px] rounded-md bg-deep-moss text-white text-sm hover:bg-sage-dark disabled:opacity-50"
            disabled={!newComment.trim()}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
