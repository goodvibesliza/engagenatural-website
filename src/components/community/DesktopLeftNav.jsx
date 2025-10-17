import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query as firestoreQuery, where } from 'firebase/firestore';
import { track } from '../../lib/analytics';

export default function DesktopLeftNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasRole, user } = useAuth();
  const sp = new URLSearchParams(location.search);
  const tab = sp.get('tab') || 'whatsGood';
  const brand = sp.get('brand') || '';
  const brandId = sp.get('brandId') || '';
  const q = sp.get('q') || '';
  const tagsParam = sp.get('tags') || '';
  const activeTags = useMemo(() => tagsParam ? tagsParam.split(',').map(s => s.trim()).filter(Boolean) : [], [tagsParam]);
  const [query, setQuery] = useState(q);
  const [tagCounts, setTagCounts] = useState({});
  const isStaff = hasRole(['staff','verified_staff','brand_manager','super_admin']);
  const [followedBrands, setFollowedBrands] = useState([]);

  useEffect(() => setQuery(q), [q]);

  useEffect(() => {
    const onStats = (ev) => {
      if (ev?.detail?.tagCounts) setTagCounts(ev.detail.tagCounts);
    };
    window.addEventListener('communityTagStats', onStats);
    return () => window.removeEventListener('communityTagStats', onStats);
  }, []);

  // Subscribe to followed brands to persist Brand entries in left rail
  useEffect(() => {
    let unsub = () => {};
    try {
      // Hydrate from cache to reduce flicker
      try {
        const cached = localStorage.getItem('en.followedBrandCommunities');
        if (cached) {
          const arr = JSON.parse(cached);
          if (Array.isArray(arr)) setFollowedBrands(arr);
        }
      } catch (err) { console.debug?.('DesktopLeftNav cache read failed', err); }

      if (!db || !user?.uid) return;
      const qf = firestoreQuery(collection(db, 'brand_follows'), where('userId', '==', user.uid));
      unsub = onSnapshot(qf, (snap) => {
        const items = snap.docs.map((d) => {
          const data = d.data() || {};
          return { brandId: data.brandId, brandName: data.brandName || 'Brand' };
        }).filter((x) => !!x.brandId);
        setFollowedBrands(items);
        try { localStorage.setItem('en.followedBrandCommunities', JSON.stringify(items)); } catch (err) { console.debug?.('DesktopLeftNav cache write failed', err); }
      }, (err) => {
        console.debug?.('DesktopLeftNav onSnapshot error', err);
        setFollowedBrands([]);
      });
    } catch (err) {
      console.debug?.('DesktopLeftNav subscription error', err);
      setFollowedBrands([]);
    }
    return () => { try { if (typeof unsub === 'function') unsub(); } catch (err) { console.debug?.('DesktopLeftNav unsubscribe failed', err); } };
  }, [db, user?.uid]);

  const goTab = (nextTab) => {
    const next = new URLSearchParams(location.search);
    next.set('tab', nextTab);
    navigate({ pathname: location.pathname, search: next.toString() });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(location.search);
    if (query) next.set('q', query); else next.delete('q');
    navigate({ pathname: location.pathname, search: next.toString() });
  };

  const toggleTag = (tag) => {
    const set = new Set(activeTags);
    if (set.has(tag)) set.delete(tag); else set.add(tag);
    const next = new URLSearchParams(location.search);
    if (set.size > 0) next.set('tags', Array.from(set).join(',')); else next.delete('tags');
    navigate({ pathname: location.pathname, search: next.toString() });
  };

  const trending = useMemo(() => {
    const entries = Object.entries(tagCounts || {});
    return entries
      .sort((a,b) => (b[1]||0) - (a[1]||0))
      .slice(0, 10)
      .map(([k, v]) => ({ tag: k, count: v }));
  }, [tagCounts]);

  return (
    <div className="en-cd-left-inner">
      <div className="en-cd-left-title">Feed</div>
      <ul className="en-cd-left-menu" role="list">
        <li>
          <a
            href={"/community?tab=whatsGood"}
            onClick={(e) => { e.preventDefault(); goTab('whatsGood'); }}
            className={`en-cd-left-link ${tab === 'whatsGood' ? 'is-active' : ''}`}
            aria-current={tab === 'whatsGood' ? 'page' : undefined}
            data-testid="left-nav-whatsgood"
          >
            What's Good
          </a>
        </li>
        <li>
          <a
            href={"/community?tab=pro"}
            onClick={(e) => { e.preventDefault(); goTab('pro'); }}
            className={`en-cd-left-link ${tab === 'pro' ? 'is-active' : ''}`}
            aria-current={tab === 'pro' ? 'page' : undefined}
            data-testid="left-nav-pro"
          >
            Pro
          </a>
        </li>
        {followedBrands.length > 0 && (
          <li className="mt-3">
            <div className="en-cd-left-title">Brands</div>
            <ul role="list" className="en-cd-left-menu">
              {followedBrands.map((b) => {
                const active = tab === 'brand' && brandId === b.brandId;
                const label = b.brandName || 'Brand';
                return (
                  <li key={b.brandId}>
                    <a
                      href={`/community?tab=brand&brandId=${encodeURIComponent(b.brandId)}&brand=${encodeURIComponent(label)}&via=left_rail`}
                      onClick={(e) => {
                        e.preventDefault();
                        try { track('community_leftrail_click', { brandId: b.brandId }); } catch { /* ignore */ }
                        const next = new URLSearchParams(location.search);
                        next.set('tab', 'brand');
                        next.set('brandId', b.brandId);
                        next.set('brand', label);
                        navigate({ pathname: location.pathname, search: next.toString() });
                      }}
                      className={`en-cd-left-link ${active ? 'is-active' : ''}`}
                      aria-current={active ? 'page' : undefined}
                      title={label}
                      style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44 }}
                      data-testid={`left-nav-brand-${b.brandId}`}
                    >
                      <span className="truncate" style={{ maxWidth: 200 }}>{label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </li>
        )}
      </ul>

      <div className="mt-4">
        <form onSubmit={onSubmit}>
          <input
            id="desktop-left-search"
            name="desktop_left_search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts"
            className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-deep-moss"
            aria-label="Search posts"
            data-testid="desktop-left-search"
          />
        </form>
        {/* New Post button under search (staff only) */}
        {isStaff && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => {
                if (tab === 'brand' && brandId) {
                  let url = `/staff/community/post/new?brandId=${encodeURIComponent(brandId)}&via=brand_tab`;
                  if (brand) url += `&brand=${encodeURIComponent(brand)}`;
                  navigate(url);
                } else {
                  navigate('/staff/community/post/new');
                }
              }}
              className="w-full h-10 px-3 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-800 text-sm hover:bg-gray-50"
              data-testid="desktop-left-newpost"
            >
              New Post
            </button>
          </div>
        )}
        {(activeTags.length > 0 || (query || '').trim().length > 0) && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => {
                const next = new URLSearchParams(location.search);
                next.delete('q');
                next.delete('tags');
                setQuery('');
                navigate({ pathname: location.pathname, search: next.toString() });
              }}
              className="w-full h-9 px-3 inline-flex items-center justify-center rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
              aria-label="Clear search and hashtag filters"
              data-testid="desktop-left-clear"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      <div className="mt-5">
        <div className="en-cd-left-title">Trending hashtags</div>
        <div className="flex flex-wrap gap-2" aria-live="polite">
          {trending.length === 0 ? (
            <span className="text-sm text-gray-500">No data yet</span>
          ) : (
            trending.map(({ tag, count }) => {
              const active = activeTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 h-8 inline-flex items-center rounded-full border text-sm ${active ? 'bg-deep-moss text-white border-deep-moss' : 'bg-white text-gray-700 border-gray-300'}`}
                  aria-pressed={active ? 'true' : 'false'}
                  data-testid={`desktop-left-tag-${tag}`}
                >
                  #{tag}
                  <span className="ml-1 text-gray-500">{count}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
