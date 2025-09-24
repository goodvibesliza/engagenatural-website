// src/pages/Community.jsx
import { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FeedTabs from '../components/community/FeedTabs';
import WhatsGoodFeed, { WHATS_GOOD_STUBS } from '../components/community/WhatsGoodFeed';
const ProFeed = lazy(() => import('../components/community/ProFeed'));
import FilterBar from '../components/community/FilterBar';
import SkeletonPostCard from '../components/community/SkeletonPostCard';
import { communityView, filterApplied } from '../lib/analytics';
import './community.css';

export default function Community() {
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState('whatsGood'); // 'whatsGood' | 'pro'
  const [query, setQuery] = useState('');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  // Deep-link support: if navigated with { state: { focusPostId } }, redirect to detail
  useEffect(() => {
    const focusPostId = location.state?.focusPostId;
    if (focusPostId) {
      navigate(`/community/post/${focusPostId}`, { replace: true });
    }
  }, [location.state, navigate]);

  const header = useMemo(() => {
    const posts = tab === 'whatsGood' ? WHATS_GOOD_STUBS : [];
    const availableBrands = Array.from(new Set(posts.map((p) => p.brand).filter(Boolean)));
    const availableTags = Array.from(new Set(posts.flatMap((p) => (Array.isArray(p.tags) ? p.tags : [])).filter(Boolean)));

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
  }, [tab, query, selectedBrands, selectedTags]);

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
              <FilterBar
                query={query}
                selectedBrands={selectedBrands}
                selectedTags={selectedTags}
                availableBrands={[]}
                availableTags={[]}
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
                    // Use existing verification flow route if available
                    try {
                      window.history.pushState({}, '', '/staff/verification');
                      // In case some routers rely on full navigation
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    } catch {
                      window.location.assign('/staff/verification');
                    }
                  }}
                />
              </Suspense>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
