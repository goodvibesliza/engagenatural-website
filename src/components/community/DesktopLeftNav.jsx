import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';
import { track } from '../../lib/analytics';
import useCommunitySwitcher from '@/hooks/useCommunitySwitcher';
import useNotificationsStore from '@/hooks/useNotificationsStore';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';

/**
 * Render the desktop left navigation for the community feed, including feed tabs, followed brands, search, staff actions, and trending hashtags.
 *
 * The component reflects URL search parameters (tab, brand, brandId, q, tags), derives followed brands and trending tag counts from shared stores/events, and provides controls to navigate tabs, update query/tags in the URL, clear filters, pin/unpin brands, and mark brands as read.
 *
 * @returns {JSX.Element} The left-side navigation UI for the community feed.
 */
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
  const { allCommunities, isPinned, togglePin } = useCommunitySwitcher();
  const { unreadCounts, markAsRead } = useNotificationsStore();
  const [followedBrands, setFollowedBrands] = useState([]);

  useEffect(() => setQuery(q), [q]);

  useEffect(() => {
    const onStats = (ev) => {
      if (ev?.detail?.tagCounts) setTagCounts(ev.detail.tagCounts);
    };
    window.addEventListener('communityTagStats', onStats);
    return () => window.removeEventListener('communityTagStats', onStats);
  }, []);

  // Source brands from Community Switcher (already caches and subscribes)
  useEffect(() => {
    try {
      const items = (allCommunities || []).map(c => ({ brandId: c.id, brandName: c.name, communityId: c.communityId }));
      setFollowedBrands(items);
    } catch {
      setFollowedBrands([]);
    }
  }, [allCommunities]);

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
                const unread = Number(unreadCounts?.[b.communityId] || 0) > 0;
                const pinned = isPinned?.(b.communityId);
                return (
                  <li key={`${b.brandId}|${b.communityId || 'na'}`}>
                    <ContextMenu>
                      <ContextMenuTrigger asChild>
                        <a
                          href={`/community?tab=brand&brandId=${encodeURIComponent(b.brandId)}&brand=${encodeURIComponent(label)}${b.communityId ? `&communityId=${encodeURIComponent(b.communityId)}` : ''}&via=left_rail`}
                          onClick={(e) => {
                            e.preventDefault();
                            try { track('community_leftrail_click', { brandId: b.brandId }); } catch (err) { console.debug?.('DesktopLeftNav track leftrail click failed', err); }
                            const next = new URLSearchParams(location.search);
                            next.set('tab', 'brand');
                            next.set('brandId', b.brandId);
                            next.set('brand', label);
                            if (b.communityId) next.set('communityId', b.communityId); else next.delete('communityId');
                            navigate({ pathname: location.pathname, search: next.toString() });
                            try { markAsRead?.(b.communityId); } catch (err) { console.debug?.('DesktopLeftNav markAsRead failed', err); }
                          }}
                          className={`en-cd-left-link ${active ? 'is-active' : ''}`}
                          aria-current={active ? 'page' : undefined}
                          title={pinned ? 'Pinned' : (unread ? 'New posts' : label)}
                          style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, position: 'relative' }}
                          data-testid={`left-nav-brand-${b.brandId}`}
                        >
                          <span className="truncate" style={{ maxWidth: 200 }}>{label}</span>
                          {pinned && <span aria-hidden className="ml-1 text-amber-500">★</span>}
                          {unread && (
                            <span aria-hidden className="absolute right-2 top-1.5 inline-block w-2 h-2 rounded-full bg-brand-primary" />
                          )}
                        </a>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem onClick={() => togglePin?.(b.communityId)}>
                          {pinned ? 'Unpin' : 'Pin to top'}
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
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