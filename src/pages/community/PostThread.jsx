// src/pages/community/PostThread.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';
import { db } from '../../lib/firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

export default function PostThread() {
  const { postId } = useParams();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const unsubRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'community_posts', postId));
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setPost(data);

          // Subscribe to comments for this post
          const q = query(
            collection(db, 'community_comments'),
            where('postId', '==', snap.id),
            orderBy('createdAt', 'asc')
          );
          unsubRef.current = onSnapshot(q, (s) => {
            setComments(s.docs.map((d) => ({ id: d.id, ...d.data() })));
          });
        } else {
          setPost(null);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => {
      if (unsubRef.current) {
        try { unsubRef.current(); } catch {}
      }
    };
  }, [postId]);

  const backHref = useMemo(() => {
    const cid = post?.communityId || 'whats-good';
    return `/community/${cid}`;
  }, [post]);

  const handleAddComment = async () => {
    if (!user?.uid) return;
    const text = commentInput.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'community_comments'), {
        postId: post.id,
        communityId: post.communityId || 'whats-good',
        brandId: post.brandId || null,
        userId: user.uid,
        userRole: user.role || 'user',
        text,
        createdAt: serverTimestamp(),
      });
      setCommentInput('');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to add comment', e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded">
          Post not found
        </div>
        <Link to="/community/whats-good" className="text-brand-primary underline">
          Go to Community
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to={backHref} className="text-sm text-gray-600 hover:text-gray-800">
          ← Back to community
        </Link>
        <div className="text-xs text-gray-500">
          {post.createdAt?.toDate ? new Date(post.createdAt.toDate()).toLocaleString() : 'Recently'}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">{post.title || 'Post'}</h1>
        {post.body && <p className="text-gray-800 whitespace-pre-wrap">{post.body}</p>}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Comments</h2>

        {comments.length === 0 ? (
          <div className="text-sm text-gray-500">No comments yet</div>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="bg-gray-50 rounded p-3">
                <div className="text-xs text-gray-500 mb-1">
                  {c.userRole || 'user'} • {c.createdAt?.toDate ? new Date(c.createdAt.toDate()).toLocaleString() : 'Recently'}
                </div>
                <div className="text-sm text-gray-800 whitespace-pre-wrap">{c.text}</div>
              </div>
            ))}
          </div>
        )}

        {user && (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Add a comment…"
              className="flex-1 p-2 text-sm border border-gray-300 rounded"
            />
            <button
              onClick={handleAddComment}
              disabled={submitting || !commentInput.trim()}
              className="text-sm px-3 py-1 bg-brand-primary text-white rounded hover:bg-brand-primary/90 disabled:opacity-50"
            >
              {submitting ? 'Posting…' : 'Comment'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
