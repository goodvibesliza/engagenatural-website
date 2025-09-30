// src/pages/PostCompose.jsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { filterPostContent } from '../ContentModeration';
import { useAuth } from '../contexts/auth-context';

/**
 * Render a post composition UI for the "What's Good" community that moderates content and saves posts or drafts.
 *
 * @returns {JSX.Element} The compose form UI which validates input, moderates content on submit, and navigates to the created post or a draft preview.
 */
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
      // Moderate content (DSHEA/inappropriate/spam) before saving
      const moderation = await filterPostContent({ content: body.trim() });
      const moderatedBody = moderation?.content ?? body.trim();
      const needsReview = !!moderation?.needsReview;
      const isBlocked = !!moderation?.isBlocked;
      const moderationFlags = moderation?.moderationFlags || moderation?.moderation?.flags || [];
      // If database is unavailable (e.g., deploy preview without env), fall back to draft preview
      if (!db || !user?.uid) {
        const draft = {
          id: `draft-${Date.now()}`,
          title: title.trim(),
          body: moderatedBody,
          communityName: "What's Good",
        };
        navigate(`/staff/community/post/${draft.id}`, { state: { draft } });
        return;
      }
      // Create public post in universal "what's-good" community
      const ref = await addDoc(collection(db, 'community_posts'), {
        title: title.trim(),
        body: moderatedBody,
        visibility: 'public',
        communityId: 'whats-good',
        communityName: "What's Good",
        createdAt: serverTimestamp(),
        userId: user?.uid || null,
        authorRole: user?.role || 'staff',
        needsReview,
        isBlocked,
        moderationFlags,
        moderation: moderation?.moderation || null,
      });
      navigate(`/staff/community/post/${ref.id}`);
    } catch (e) {
      // On failure, still allow users to preview their content as a draft
      const moderation = await filterPostContent({ content: body.trim() });
      const moderatedBody = moderation?.content ?? body.trim();
      const draft = {
        id: `draft-${Date.now()}`,
        title: title.trim(),
        body: moderatedBody,
        communityName: "What's Good",
        error: e?.message || 'unknown',
      };
      navigate(`/staff/community/post/${draft.id}`, { state: { draft } });
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
