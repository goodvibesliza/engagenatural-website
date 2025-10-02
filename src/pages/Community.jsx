// src/pages/Community.jsx
import { useEffect, useMemo, useState, useCallback, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FeedTabs from '../components/community/FeedTabs';
import WhatsGoodFeed from '../components/community/WhatsGoodFeed';
import { PRO_STUBS } from '../components/community/ProFeed';
const ProFeed = lazy(() => import('../components/community/ProFeed'));
import FilterBar from '../components/community/FilterBar';
import SkeletonPostCard from '../components/community/SkeletonPostCard';
import UserDropdownMenu from '../components/UserDropdownMenu';
import { communityView, filterApplied } from '../lib/analytics';
import './community.css';

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
export default function Community() {
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState('whatsGood'); // 'whatsGood' | 'pro'
  const [query, setQuery] = useState('');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableBrands, setAvailableBrands] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

  // Stable handler to receive filters (brands/tags) from child feeds
  const handleFiltersChange = useCallback(({ brands, tags } = {}) => {
    setAvailableBrands(Array.from(new Set((brands || []).filter(Boolean))));
    setAvailableTags(Array.from(new Set((tags || []).filter(Boolean))));
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
    const brandParam = searchParams.get('brand');
    
    if (brandParam && !selectedBrands.includes(brandParam)) {
      setSelectedBrands([brandParam]);
      
      // Track filter applied from URL
      filterApplied({ brands: [brandParam], tags: [], query: '' });
    }
  }, [location.search, selectedBrands]); // Include selectedBrands in dependency array

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
    return (
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 pt-3">
          <h1 className="text-2xl font-heading font-semibold text-deep-moss mb-3">
            Community
          </h1>
          <FeedTabs value={tab} onChange={(t) => { setTab(t); }} />
        </div>
        {/* Inline filters for mobile/tablet; hidden on desktop */}
        <div className="only-mobile">
          <div className="px-4 pt-3">
            <button
              type="button"
              onClick={() => navigate('/staff/community/post/new')}
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
        </div>
      </div>
    );
  }, [tab, query, selectedBrands, selectedTags, availableBrands, availableTags]);

  // Track tab view on mount and whenever the tab changes
  useEffect(() => {
    communityView({ feedType: tab });
  }, [tab]);

  return (
    <div className="min-h-screen bg-cool-gray">
      {header}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="community-grid">
          {/* Desktop sidebar filters */}
          <aside className="only-desktop">
            <div className="community-sticky">
              <button
                type="button"
                onClick={() => navigate('/staff/community/post/new')}
                className="mb-3 inline-flex items-center justify-center px-4 h-11 min-h-[44px] rounded-md border border-brand-primary bg-brand-primary text-primary text-sm hover:opacity-90"
              >
                New Post
              </button>
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
            ) : (
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
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
