// src/pages/PostCompose.jsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '../contexts/auth-context';

export default function PostCompose() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const headingRef = useRef(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const canSubmit = title.trim().length > 0 && body.trim().length > 0 && !submitting;

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      // Create public post in universal "what's-good" community
      const ref = await addDoc(collection(db, 'community_posts'), {
        title: title.trim(),
        body: body.trim(),
        visibility: 'public',
        communityId: 'whats-good',
        communityName: "What's Good",
        createdAt: serverTimestamp(),
        userId: user?.uid || null,
        authorRole: user?.role || 'staff',
      });
      navigate(`/staff/community/post/${ref.id}`);
    } catch (e) {
      setError('Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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

        <form onSubmit={handleSubmit} className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
          <header className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 h-7 min-h-[28px] rounded-full text-xs font-medium border border-deep-moss/30 text-deep-moss bg-white">
                What's Good
              </span>
            </div>
          </header>

          {error && (
            <div className="mt-3 text-sm text-red-600" role="alert">{error}</div>
          )}

          <label htmlFor="post-title" className="sr-only">Title</label>
          <input
            id="post-title"
            ref={headingRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a concise title"
            className="mt-4 w-full px-3 py-3 h-12 min-h-[48px] border border-gray-300 rounded-md text-base"
          />

          <label htmlFor="post-body" className="sr-only">Body</label>
          <textarea
            id="post-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your post…"
            rows={8}
            className="mt-3 w-full px-3 py-3 border border-gray-300 rounded-md text-base resize-vertical min-h-[200px]"
          />

          {/* Desktop actions */}
          <div className="hidden sm:flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => navigate('/staff/community')}
              className="px-4 h-11 min-h-[44px] rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`px-4 h-11 min-h-[44px] rounded-md text-sm transition-colors border ${
                canSubmit
                  ? 'bg-brand-primary text-primary border-brand-primary hover:opacity-90'
                  : 'bg-gray-200 text-white border-gray-300 cursor-not-allowed'
              }`}
            >
              Post
            </button>
          </div>
        </form>
      </div>

      {/* Sticky mobile action bar */}
      <div className="sm:hidden sticky bottom-0 inset-x-0 border-t border-gray-200 bg-white">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/staff/community')}
            className="flex-1 px-4 h-11 min-h-[44px] rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`flex-1 px-4 h-11 min-h-[44px] rounded-md text-sm transition-colors border ${
              canSubmit
                ? 'bg-brand-primary text-primary border-brand-primary hover:opacity-90'
                : 'bg-gray-200 text-white border-gray-300 cursor-not-allowed'
            }`}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
