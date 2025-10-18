// src/pages/Community.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef, lazy, Suspense } from 'react';
import useIsMobile from '../hooks/useIsMobile.js';
import { getFlag } from '../lib/featureFlags.js';
import { useLocation, useNavigate } from 'react-router-dom';
import FeedTabs from '../components/community/FeedTabs';
import WhatsGoodFeed from '../components/community/WhatsGoodFeed';
import BrandFeed from '../components/community/BrandFeed.jsx';
import { PRO_STUBS } from '../components/community/ProFeed';
const ProFeed = lazy(() => import('../components/community/ProFeed'));
import FilterBar from '../components/community/FilterBar';
import ComposerMobile from '../components/community/mobile/ComposerMobile.jsx';
import FilterBarMobileCompact from '../components/community/mobile/FilterBarMobileCompact.jsx';
import SkeletonPostCard from '../components/community/SkeletonPostCard';
import UserDropdownMenu from '../components/UserDropdownMenu';
import { communityView, filterApplied, track } from '../lib/analytics';
import './community.css';
import { useAuth } from '../contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Render the Community page with two feed tabs ("Whats Good" and "Pro"), filters, navigation, and lazy-loaded Pro content.
 *
 * Renders a header with the tab selector and mobile controls, a desktop sticky sidebar containing a New Post button and FilterBar,
 * and either the WhatsGoodFeed or a lazily loaded ProFeed based on the active tab. Synchronizes available filter options from child feeds,
 * initializes Pro filters from PRO_STUBS when the Pro tab is active, supports deep links to a specific post via location.state.focusPostId,
 * and records feed view analytics when the active tab changes.
 *
 * @returns {JSX.Element} The Community page component.
 */
export default function Community({ hideTopTabs = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState('whatsGood'); // 'whatsGood' | 'pro'
  const [query, setQuery] = useState('');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagCounts, setTagCounts] = useState({});
  const [availableBrands, setAvailableBrands] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const { isVerified, hasRole, user } = useAuth();
  const [brandContext, setBrandContext] = useState({ has: false, brand: '', brandId: '', communityId: '' });
  const [isFollowingBrand, setIsFollowingBrand] = useState(false);
  const [brandTabAllowed, setBrandTabAllowed] = useState(false);
  const [ctaMsg, setCtaMsg] = useState('');
  const [ctaDismissed, setCtaDismissed] = useState(false);
  const isMobile = useIsMobile();
  const mobileSkin = (getFlag('EN_MOBILE_FEED_SKIN') || '').toString().toLowerCase();
  const useLinkedInMobileSkin = isMobile && mobileSkin === 'linkedin';

  // Refs to avoid stale closures when syncing from URL params
  const lastSyncedQueryRef = useRef('');
  const lastSyncedTagsRef = useRef('');

  // Stable handler to receive filters (brands/tags) from child feeds
  const handleFiltersChange = useCallback(({ brands, tags, tagCounts: counts } = {}) => {
    setAvailableBrands(Array.from(new Set((brands || []).filter(Boolean))));
    setAvailableTags(Array.from(new Set((tags || []).filter(Boolean))));
    if (counts && typeof counts === 'object') {
      setTagCounts(counts);
    }
  }, []);

  // Deep-link support: if navigated with { state: { focusPostId } }, redirect to detail
  useEffect(() => {
    const focusPostId = location.state?.focusPostId;
    if (focusPostId) {
      navigate(`/staff/community/post/${focusPostId}`, { replace: true });
    }
  }, [location.state, navigate]);

  // URL parameter support: read initial brand filter from ?brand=brandName
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const brandParam = searchParams.get('brandName') || searchParams.get('brand');
    const brandIdParam = searchParams.get('brandId');
    const communityIdParam = searchParams.get('communityId') || '';
    const qParam = searchParams.get('q') || '';
    const tagsParam = searchParams.get('tags') || '';
    const urlTags = tagsParam ? tagsParam.split(',').map(s => s.trim()).filter(Boolean) : [];
    const tagsKey = JSON.stringify(urlTags);

    if (brandParam && !selectedBrands.includes(brandParam)) {
      setSelectedBrands([brandParam]);
      filterApplied({ brands: [brandParam], tags: [], query: '' });
    } else if (!brandParam && selectedBrands.length) {
      // Clear stale brand filter when URL no longer specifies a brand
      setSelectedBrands([]);
    }

    // Track brand context presence for conditional Brand tab
    setBrandContext({ has: !!(brandParam || brandIdParam), brand: brandParam || '', brandId: brandIdParam || '', communityId: communityIdParam });

    if (qParam !== lastSyncedQueryRef.current) {
      setQuery(qParam);
      lastSyncedQueryRef.current = qParam;
    }

    if (tagsKey !== lastSyncedTagsRef.current) {
      setSelectedTags(urlTags);
      lastSyncedTagsRef.current = tagsKey;
    }
  }, [location.search, selectedBrands]);

  // Router state fallback: allow navigation via state { brand, brandName, brandId, tab }
  useEffect(() => {
    // Only apply when no brand context provided via URL
    if (brandContext.has) return;
    const st = location.state || {};
    const brandName = st.brandName || st.brand || '';
    const brandId = st.brandId || '';
    const communityId = st.communityId || '';
    const tabState = st.tab || '';
    if (!brandName && !brandId && !tabState) return;
    const sp = new URLSearchParams(location.search);
    if (brandName) sp.set('brand', brandName);
    if (brandId) sp.set('brandId', brandId);
    if (communityId) sp.set('communityId', communityId);
    if (tabState) sp.set('tab', tabState);
    navigate({ pathname: location.pathname, search: sp.toString() }, { replace: true });
  }, [location.state, brandContext.has]);

  // Sync tab with URL (?tab=whatsGood|pro) to preserve deep linking and left-nav highlight
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const t = sp.get('tab');
    if (t === 'pro' && tab !== 'pro') {
      setTab('pro');
    } else if (t === 'whatsGood' && tab !== 'whatsGood') {
      setTab('whatsGood');
    } else if (t === 'brand' || t === 'feed') {
      if (brandTabAllowed && tab !== 'brand') {
        setTab('brand');
      } else if (!brandTabAllowed) {
        // normalize to whatsGood if brand tab not allowed
        sp.set('tab', 'whatsGood');
        navigate({ pathname: location.pathname, search: sp.toString() }, { replace: true });
      }
    } else if (!t) {
      // default param for clarity; restore last selection when no brand context
      let def = 'whatsGood';
      try {
        if (!brandContext.has) {
          const saved = localStorage.getItem('community.feed.selectedTab');
          if (saved === 'whatsGood' || saved === 'pro') def = saved;
        }
      } catch (err) {
        console.debug?.('Community: localStorage read failed', err);
      }
      sp.set('tab', def);
      navigate({ pathname: location.pathname, search: sp.toString() }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, brandTabAllowed, brandContext.has]);

  // When the UI tab changes, reflect it in URL to keep selection highlighted
  // Use a ref to avoid unnecessary navigations and safely include all deps
  const lastAppliedRef = useRef('');
  const prevBrandAccessRef = useRef(false);
  useEffect(() => {
    const key = `${location.pathname}|${tab}`;
    if (lastAppliedRef.current === key) return;
    const sp = new URLSearchParams(location.search);
    const current = sp.get('tab');
    if (current !== tab) {
      sp.set('tab', tab);
      navigate({ pathname: location.pathname, search: sp.toString() }, { replace: true });
    }
    lastAppliedRef.current = key;
  }, [tab, navigate, location.pathname, location.search]);

  // Persist last selected feed sub-tab when no brand context
  useEffect(() => {
    try {
      if (!brandContext.has && (tab === 'whatsGood' || tab === 'pro')) {
        localStorage.setItem('community.feed.selectedTab', tab);
      }
    } catch (err) {
      console.debug?.('Community: localStorage write failed', err);
    }
  }, [tab, brandContext.has]);

  // Broadcast tag statistics for shell left-nav (event-based wiring)
  useEffect(() => {
    try {
      const detail = { tagCounts };
      const ev = new CustomEvent('communityTagStats', { detail });
      window.dispatchEvent(ev);
    } catch (err) {
      console.debug?.('Community: tagStats broadcast failed', err);
    }
  }, [tagCounts]);

  // Update available filters when tab changes (Pro uses stubs for now)
  useEffect(() => {
    if (tab === 'pro') {
      const brands = Array.from(new Set(PRO_STUBS.map((p) => p.brand).filter(Boolean)));
      const tags = Array.from(new Set(PRO_STUBS.flatMap((p) => (Array.isArray(p.tags) ? p.tags : [])).filter(Boolean)));
      setAvailableBrands(brands);
      setAvailableTags(tags);
    }
  }, [tab]);

  const header = useMemo(() => {
    if (hideTopTabs) return null;
    const truncate = (s, n = 20) => {
      const str = String(s || '');
      return str.length > n ? `${str.slice(0, n - 1)}…` : str;
    };
    const brandTab = brandTabAllowed && brandContext.has
      ? { show: true, label: `${truncate(brandContext.brand || 'Brand', 20)}`, fullLabel: `${brandContext.brand || 'Brand'}` }
      : { show: false };
    return (
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 pt-3">
          <h1 className="text-2xl font-heading font-semibold text-deep-moss mb-3">
            Community
          </h1>
          <FeedTabs
            value={tab}
            onChange={(t) => {
              try { track('community_tab_click', { group: 'feed', subtab: t }); } catch (err) { console.debug?.('Community: tab click track failed', err); }
              setTab(t);
            }}
            brandTab={brandTab}
          />
        </div>
        {/* Inline filters for mobile/tablet; hidden on desktop */}
        <div className="only-mobile">
          {!useLinkedInMobileSkin && (
            <>
              <div className="px-4 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    if (tab === 'brand' && brandContext.brandId) {
                      navigate(`/staff/community/post/new?brandId=${encodeURIComponent(brandContext.brandId)}&brand=${encodeURIComponent(brandContext.brand || 'Brand')}&via=brand_tab`);
                    } else {
                      navigate('/staff/community/post/new');
                    }
                  }}
                  className="mb-3 inline-flex items-center justify-center px-4 h-11 min-h-[44px] rounded-md border border-brand-primary bg-brand-primary text-primary text-sm hover:opacity-90"
                >
                  New Post
                </button>
              </div>
              <FilterBar
                query={query}
                selectedBrands={selectedBrands}
                selectedTags={selectedTags}
                availableBrands={availableBrands}
                availableTags={availableTags}
                onChange={({ query: q, selectedBrands: sb, selectedTags: st }) => {
                  setQuery(q ?? '');
                  setSelectedBrands(sb ?? []);
                  setSelectedTags(st ?? []);
                  filterApplied({ brands: sb ?? [], tags: st ?? [], query: q ?? '' });
                }}
              />
            </>
          )}
          {useLinkedInMobileSkin && (
            <>
              <FilterBarMobileCompact
                query={query}
                availableBrands={availableBrands}
                selectedBrands={selectedBrands}
                onChange={({ query: q, selectedBrands: sb }) => {
                  setQuery(q ?? '');
                  setSelectedBrands(sb ?? []);
                  filterApplied({ brands: sb ?? [], tags: selectedTags ?? [], query: q ?? '' });
                }}
              />
              <div className="px-4 pt-2">
                <ComposerMobile onStartPost={() => navigate('/staff/community/post/new')} />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }, [hideTopTabs, tab, query, selectedBrands, selectedTags, availableBrands, availableTags, useLinkedInMobileSkin, navigate, brandTabAllowed, brandContext.brand, brandContext.has, brandContext.brandId]);

  // Track tab view on mount and whenever the tab changes, include referral + brandId when present
  useEffect(() => {
    try {
      const sp = new URLSearchParams(location.search);
      const via = sp.get('via') || undefined;
      const brandId = sp.get('brandId') || undefined;
      const communityId = sp.get('communityId') || undefined;
      const payload = { feedType: tab };
      if (via) payload.via = via;
      if (brandId) payload.brandId = brandId;
      if (tab === 'brand' && brandId) {
        communityView({ feedType: 'feed', via: via || 'unknown', brandId, ...(communityId ? { communityId } : {}), subtab: 'brand' });
      } else {
        communityView(payload);
      }
    } catch (err) {
      console.debug?.('Community: analytics view track failed', err);
    }
  }, [tab, location.search]);

  // Determine if Brand tab should be allowed based on verification + follow + brand context
  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const allowedRole = hasRole(['verified_staff', 'staff', 'brand_manager', 'super_admin']);
        const verifiedStaff = (isVerified === true) && allowedRole;
        let following = false;
        if (verifiedStaff && user?.uid && brandContext.has && brandContext.brandId) {
          if (db) {
            const ref = doc(db, 'brand_follows', `${user.uid}_${brandContext.brandId}`);
            const snap = await getDoc(ref);
            following = snap.exists();
          }
        }
        if (!active) return;
        setIsFollowingBrand(following);
        const allow = verifiedStaff && brandContext.has && !!brandContext.brandId && following;
        setBrandTabAllowed(allow);
        if (!allow && brandContext.has) {
          if (!verifiedStaff) setCtaMsg('Brand feed is for verified staff.');
          else if (!following) setCtaMsg('Follow this brand to view its feed.');
          else setCtaMsg('');
        } else {
          setCtaMsg('');
        }
      } catch {
        if (!active) return;
        setBrandTabAllowed(false);
      }
    };
    run();
    return () => { active = false; };
  }, [db, isVerified, hasRole, user?.uid, brandContext.has, brandContext.brandId]);

  // Auto-select Brand tab only when access transitions from false -> true
  useEffect(() => {
    const allowedNow = Boolean(brandTabAllowed && brandContext.has);
    const allowedPrev = prevBrandAccessRef.current;
    if (allowedNow && !allowedPrev) {
      setTab('brand');
      const sp = new URLSearchParams(location.search);
      sp.set('tab', 'brand');
      navigate({ pathname: location.pathname, search: sp.toString() }, { replace: true });
    }
    prevBrandAccessRef.current = allowedNow;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandTabAllowed, brandContext.has]);

  // Reset CTA dismissal when switching to a new brand context
  useEffect(() => {
    setCtaDismissed(false);
  }, [brandContext.brandId, brandContext.brand]);

  const handleFollowBrand = useCallback(async () => {
    try {
      if (!db || !user?.uid || !brandContext.brandId) return;
      const followId = `${user.uid}_${brandContext.brandId}`;
      await setDoc(doc(db, 'brand_follows', followId), {
        brandId: brandContext.brandId,
        brandName: brandContext.brand || 'Brand',
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      setIsFollowingBrand(true);
      const allowedRole = hasRole(['verified_staff', 'staff', 'brand_manager', 'super_admin']);
      const allow = (isVerified === true) && allowedRole && !!brandContext.brandId && brandContext.has;
      setBrandTabAllowed(allow);
      try { track('community_cta_click', { type: 'follow', brandId: brandContext.brandId }); } catch (err) { console.debug?.('Community: CTA track failed', err); }
    } catch (err) {
      console.debug?.('Community: followBrand failed', err);
    }
  }, [db, user?.uid, brandContext.brandId, brandContext.brand, brandContext.has, isVerified, hasRole]);

  // flag handled above

  return (
    <div className="min-h-screen bg-cool-gray" data-mobile-skin={useLinkedInMobileSkin ? 'linkedin' : undefined}>
      {header}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {brandContext.has && !brandTabAllowed && !ctaDismissed && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded p-3 text-amber-900">
            <div className="text-sm font-medium">{ctaMsg || 'Brand feed unavailable.'}</div>
            <div className="mt-2 flex flex-wrap gap-2 items-center">
              {isVerified !== true && (
                <button
                  type="button"
                  onClick={() => { try { track('community_cta_click', { type: 'verify', brandId: brandContext.brandId }); } catch { /* ignore analytics */ } navigate('/staff/verification'); }}
                  className="px-3 py-1.5 text-sm bg-deep-moss text-white rounded hover:bg-sage-dark"
                >
                  Verify me
                </button>
              )}
              {isVerified === true && !isFollowingBrand && (
                <button
                  type="button"
                  onClick={handleFollowBrand}
                  className="px-3 py-1.5 text-sm bg-brand-primary text-white rounded hover:bg-brand-primary/90"
                >
                  Follow {brandContext.brand || 'Brand'}
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/staff/dashboard/my-brands')}
                className="px-3 py-1.5 text-sm underline"
              >
                Back to My Brands
              </button>
              <button
                type="button"
                onClick={() => setCtaDismissed(true)}
                className="ml-auto px-2 py-1 text-xs text-amber-900/80 hover:text-amber-900"
                aria-label="Dismiss notice"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        <div className="community-grid">
          {/* Desktop sidebar filters */}
          <aside className="only-desktop">
            <div className="community-sticky">
            <FilterBar
                query={query}
                selectedBrands={selectedBrands}
                selectedTags={selectedTags}
                availableBrands={availableBrands}
                availableTags={availableTags}
              onChange={({ query: q, selectedBrands: sb, selectedTags: st }) => {
                const qv = q ?? '';
                const sbv = sb ?? [];
                const stv = st ?? [];
                setQuery(qv);
                setSelectedBrands(sbv);
                setSelectedTags(stv);
                const sp = new URLSearchParams(location.search);
                if (qv) sp.set('q', qv); else sp.delete('q');
                if (stv.length) sp.set('tags', stv.join(',')); else sp.delete('tags');
                navigate({ pathname: location.pathname, search: sp.toString() }, { replace: true });
                filterApplied({ brands: sbv, tags: stv, query: qv });
              }}
              />
              <button
                type="button"
                onClick={() => {
                  if (tab === 'brand' && brandContext.brandId) {
                    navigate(`/staff/community/post/new?brandId=${encodeURIComponent(brandContext.brandId)}&brand=${encodeURIComponent(brandContext.brand || 'Brand')}&via=brand_tab`);
                  } else {
                    navigate('/staff/community/post/new');
                  }
                }}
                className="mt-3 inline-flex items-center justify-center px-4 h-11 min-h-[44px] rounded-md border border-brand-primary bg-brand-primary text-primary text-sm hover:opacity-90"
              >
                New Post
              </button>
            </div>
          </aside>
          {/* Feed content */}
          <section>
            {tab === 'whatsGood' ? (
              <WhatsGoodFeed
                query={query}
                selectedBrands={selectedBrands}
                selectedTags={selectedTags}
                onStartPost={() => navigate('/staff/community/post/new')}
                onFiltersChange={handleFiltersChange}
              />
            ) : tab === 'pro' ? (
              <Suspense
                fallback={
                  <div className="community-cards">
                    <SkeletonPostCard />
                    <SkeletonPostCard />
                    <SkeletonPostCard />
                  </div>
                }
              >
                <ProFeed
                  query={query}
                  selectedBrands={selectedBrands}
                  selectedTags={selectedTags}
                  onRequestVerify={() => {
                    navigate('/staff/verification');
                  }}
                  onFiltersChange={handleFiltersChange}
                />
              </Suspense>
            ) : (
              <BrandFeed
                brandId={brandContext.brandId}
                brandName={brandContext.brand || 'Brand'}
                communityId={brandContext.communityId || ''}
                onFiltersChange={handleFiltersChange}
              />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
