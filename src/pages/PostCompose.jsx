// src/pages/PostCompose.jsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { filterPostContent } from '../ContentModeration';
import { useAuth } from '../contexts/auth-context';
import MediaUploader from '../components/media/MediaUploader';
import TopMenuBarDesktop from '@/components/community/desktop/TopMenuBarDesktop.jsx';
import DesktopLinkedInShell from '@/layouts/DesktopLinkedInShell.jsx';
import LeftSidebarSearch from '@/components/common/LeftSidebarSearch.jsx';

/**
 * Post composition UI for creating a community post.
 *
 * Renders a form to choose a target community, enter a title and body, and submit a post or navigate
 * to a draft preview when submission cannot be completed.
 * @returns {JSX.Element} The post compose UI.
 */
export default function PostCompose() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasRole } = useAuth();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const headingRef = useRef(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [images, setImages] = useState([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [communities, setCommunities] = useState([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState('whats-good');

  // Extract hashtags from title/body into normalized array
  const extractTags = (t = '', b = '') => {
    const text = `${t}\n${b}`;
    const matches = text.match(/(^|\s)#([a-zA-Z0-9_\-]{2,50})/g) || [];
    const set = new Set(matches.map(m => m.replace(/^[^#]*#/, '').toLowerCase()));
    return Array.from(set);
  };

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // Load available communities and set initial selection from URL (?communityId=...)
  useEffect(() => {
    const loadCommunities = async () => {
      try {
        // 1) Public, active communities
        const pubQ = query(
          collection(db, 'communities'),
          where('isActive', '==', true),
          where('isPublic', '==', true)
        );
        const pubSnap = await getDocs(pubQ);
        const pubItems = pubSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        let items = [...pubItems];

        // 2) Brand communities (active) if user belongs to a brand
        try {
          if (user?.uid) {
            const userRef = doc(db, 'users', user.uid);
            const profile = await getDoc(userRef);
            const u = profile.exists() ? (profile.data() || {}) : {};
            const uBrandId = u.brandId || u.brand?.id;
            if (uBrandId) {
              const brandQ = query(
                collection(db, 'communities'),
                where('isActive', '==', true),
                where('brandId', '==', uBrandId)
              );
              const brandSnap = await getDocs(brandQ);
              const brandItems = brandSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
              for (const c of brandItems) {
                if (!items.some((x) => x.id === c.id)) items.push(c);
              }
            }
          }
        } catch {}

        // 3) Always include What's Good
        if (!items.some((c) => c.id === 'whats-good')) {
          items.push({ id: 'whats-good', name: "What's Good", isActive: true, isPublic: true });
        }

        // 4) Include Pro Feed for verified staff even if private/missing
        const isVerifiedStaff = hasRole && hasRole(['verified_staff', 'staff', 'brand_manager', 'super_admin']);
        if (isVerifiedStaff && !items.some((c) => c.id === 'pro-feed')) {
          try {
            const proRef = doc(db, 'communities', 'pro-feed');
            const proDoc = await getDoc(proRef);
            items.push(proDoc.exists() ? { id: 'pro-feed', ...proDoc.data() } : { id: 'pro-feed', name: 'Pro Feed', isActive: true, isPublic: false });
          } catch {
            items.push({ id: 'pro-feed', name: 'Pro Feed', isActive: true, isPublic: false });
          }
        }

        // Sort: What's Good first, then Pro Feed, then alpha
        items.sort((a, b) => {
          if (a.id === 'whats-good') return -1;
          if (b.id === 'whats-good') return 1;
          if (a.id === 'pro-feed') return -1;
          if (b.id === 'pro-feed') return 1;
          return (a.name || '').localeCompare(b.name || '');
        });

        setCommunities(items);

        const params = new URLSearchParams(location.search);
        const cid = params.get('communityId');
        const brandIdParam = params.get('brandId');
        if (cid && items.some((c) => c.id === cid)) {
          setSelectedCommunityId(cid);
        } else {
          setSelectedCommunityId('whats-good');
        }
      } catch (err) {
        // Fallback: ensure both What's Good and Pro Feed appear for verified staff
        const fallback = [{ id: 'whats-good', name: "What's Good" }];
        const isVerifiedStaff = hasRole && hasRole(['verified_staff', 'staff', 'brand_manager', 'super_admin']);
        if (isVerifiedStaff) fallback.push({ id: 'pro-feed', name: 'Pro Feed' });
        setCommunities(fallback);
        const params = new URLSearchParams(location.search);
        const cid = params.get('communityId');
        setSelectedCommunityId(cid === 'pro-feed' ? 'pro-feed' : 'whats-good');
      }
    };
    loadCommunities();
  }, [location.search, user?.role, hasRole]);

  const canSubmit = title.trim().length > 0 && body.trim().length > 0 && !submitting && uploadingCount === 0;

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    const rawBody = body.trim();
    let moderatedBody = rawBody;
    let needsReview = false;
    let isBlocked = false;
    let moderationFlags = [];
    let moderationMeta = null;
    try {
      // Moderate content (DSHEA/inappropriate/spam) before saving
      const moderation = await filterPostContent({ content: rawBody });
      moderatedBody = moderation?.content ?? rawBody;
      needsReview = !!moderation?.needsReview;
      isBlocked = !!moderation?.isBlocked;
      moderationFlags = moderation?.moderationFlags || moderation?.moderation?.flags || [];
      moderationMeta = moderation?.moderation || null;

      if (isBlocked) {
        setError('This post was blocked by moderation. Please revise and try again.');
        const cid = selectedCommunityId || 'whats-good';
        const cname = (communities.find(c => c.id === cid)?.name) || "What's Good";
        const draft = {
          id: `draft-${Date.now()}`,
          title: title.trim(),
          body: moderatedBody,
          communityId: cid,
          communityName: cname,
        };
        navigate(`/staff/community/post/${draft.id}`, { state: { draft } });
        return;
      }
      if (needsReview) {
        setError('This post needs review and was not published. Please revise and try again.');
        const cid = selectedCommunityId || 'whats-good';
        const cname = (communities.find(c => c.id === cid)?.name) || "What's Good";
        const draft = {
          id: `draft-${Date.now()}`,
          title: title.trim(),
          body: moderatedBody,
          communityId: cid,
          communityName: cname,
        };
        navigate(`/staff/community/post/${draft.id}`, { state: { draft } });
        return;
      }

      // If database is unavailable (e.g., deploy preview without env), fall back to draft preview
      if (!db || !user?.uid) {
        const cid = selectedCommunityId || 'whats-good';
        const cname = (communities.find((c) => c.id === cid)?.name) || "What's Good";
        const draft = {
          id: `draft-${Date.now()}`,
          title: title.trim(),
          body: moderatedBody,
          communityId: cid,
          communityName: cname,
        };
        navigate(`/staff/community/post/${draft.id}`, { state: { draft } });
        return;
      }
      // Create a public post in the selected community (fallback to 'whats-good' when none is selected)
      // Normalize for storage, but use raw id for lookups
      const rawCid = selectedCommunityId || 'whats-good';
      const cid = rawCid.replaceAll('_', '-');
      const cname = (communities.find((c) => c.id === rawCid)?.name) || "What's Good";
      // Load user profile for brand metadata
      let brandId; let brandName;
      try {
        if (db && user?.uid) {
          const userRef = doc(db, 'users', user.uid);
          const profile = await getDoc(userRef);
          const u = profile.exists() ? (profile.data() || {}) : {};
          brandId = u.brandId || u.brand?.id;
          brandName = u.brandName || u.brand?.name;
        }
      } catch {}
      // Fallback to brand context passed via URL (from Brand sub-tab)
      try {
        const sp = new URLSearchParams(location.search);
        const qBrandId = sp.get('brandId');
        const qBrand = sp.get('brand');
        if (!brandId && qBrandId) brandId = qBrandId;
        if (!brandName && qBrand) brandName = qBrand;
      } catch {
        // intentionally ignoring errors from URLSearchParams parsing
      }
      const tags = extractTags(title, moderatedBody);
      const ref = await addDoc(collection(db, 'community_posts'), {
        title: title.trim(),
        body: moderatedBody,
        visibility: 'public',
        communityId: cid,
        communityName: cname,
        createdAt: serverTimestamp(),
        userId: user?.uid || null,
        authorName: user?.name || user?.displayName || user?.email || 'Staff',
        authorPhotoURL: user?.profileImage || user?.photoURL || null,
        authorRole: user?.role || 'staff',
        images: Array.isArray(images) ? images : [],
        ...(brandId ? { brandId } : {}),
        ...(brandName ? { brandName } : {}),
        ...(tags.length ? { tags } : {}),
        needsReview,
        isBlocked,
        moderationFlags,
        moderation: moderationMeta,
      });
      navigate(`/staff/community/post/${ref.id}`);
    } catch (e) {
      // On failure, still allow users to preview their content as a draft
      if (moderatedBody === rawBody) {
        try {
          const moderation = await filterPostContent({ content: rawBody });
          moderatedBody = moderation?.content ?? rawBody;
        } catch {
          // leave moderatedBody as raw fallback
        }
      }
      const rawCid = selectedCommunityId || 'whats-good';
      const cid = rawCid.replaceAll('_', '-');
      const cname = (communities.find((c) => c.id === rawCid)?.name) || "What's Good";
      const draft = {
        id: `draft-${Date.now()}`,
        title: title.trim(),
        body: moderatedBody,
        communityId: cid,
        communityName: cname,
        error: e?.message || 'unknown',
      };
      navigate(`/staff/community/post/${draft.id}`, { state: { draft } });
    } finally {
      setSubmitting(false);
    }
  };

  const rightRail = (
    <>
      <div className="en-cd-right-title">Right Rail</div>
      <div className="en-cd-right-placeholder">(reserved)</div>
    </>
  );

  const CenterContent = () => (
    <div className="min-h-screen bg-cool-gray" data-testid="postcreate-center">
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
            <h1 className="text-lg font-semibold text-gray-900">New Post</h1>
          </header>

          {error && (
            <div className="mt-3 text-sm text-red-600" role="alert">{error}</div>
          )}

          <label htmlFor="post-community" className="text-sm text-gray-700 mt-3 block">Community</label>
          <select
            id="post-community"
            value={selectedCommunityId}
            onChange={(e) => setSelectedCommunityId(e.target.value)}
            className="mt-1 w-full px-3 py-2 h-11 min-h-[44px] border border-gray-300 rounded-md text-base bg-white"
          >
            {communities.map((c) => (
              <option key={c.id} value={c.id}>{c.name || c.id}</option>
            ))}
          </select>

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

          {/* Images */}
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700 mb-1">Images (optional)</p>
            <MediaUploader
              maxMB={5}
              onComplete={(urls) => setImages(urls)}
              onUploadingChange={setUploadingCount}
              // Use app path so staff uploads are allowed by storage rules
              pathPrefix={`app/community/${(selectedCommunityId || 'whats-good').replaceAll('_','-')}/users/${user?.uid || 'anon'}`}
            />
            {uploadingCount > 0 && (
              <p className="text-xs text-gray-500 mt-1">Uploading {uploadingCount} image(s)…</p>
            )}
          </div>

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
              {uploadingCount > 0 ? `Uploading ${uploadingCount}…` : 'Post'}
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
            {uploadingCount > 0 ? `Uploading ${uploadingCount}…` : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );

  const flag = import.meta.env.VITE_EN_DESKTOP_FEED_LAYOUT;
  if (flag === 'linkedin' && isDesktop) {
    return (
      <DesktopLinkedInShell
        topBar={<TopMenuBarDesktop />}
        leftSidebar={<LeftSidebarSearch />}
        center={<CenterContent />}
        rightRail={rightRail}
      />
    );
  }

  return <CenterContent />;
}
