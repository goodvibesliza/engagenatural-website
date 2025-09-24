// src/pages/Community.jsx
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FeedTabs from '../components/community/FeedTabs';
import WhatsGoodFeed from '../components/community/WhatsGoodFeed';
import ProFeed from '../components/community/ProFeed';

export default function Community() {
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState('whatsGood'); // 'whatsGood' | 'pro'
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('All');

  // Deep-link support: if navigated with { state: { focusPostId } }, redirect to detail
  useEffect(() => {
    const focusPostId = location.state?.focusPostId;
    if (focusPostId) {
      navigate(`/community/post/${focusPostId}`, { replace: true });
    }
  }, [location.state, navigate]);

  const header = useMemo(
    () => (
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <h1 className="text-2xl font-heading font-semibold text-deep-moss mb-4">
            Community
          </h1>
          <FeedTabs value={tab} onChange={setTab} />
          {/* Search + Brand filter */}
          <div className="mt-3 flex items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts…"
              aria-label="Search posts"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              aria-label="Filter by brand"
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option>All</option>
              <option>Botanical Co</option>
            </select>
          </div>
        </div>
      </div>
    ),
    [tab, search, brand]
  );

  return (
    <div className="min-h-screen bg-cool-gray">
      {header}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {tab === 'whatsGood' ? (
          <WhatsGoodFeed search={search} brand={brand} />
        ) : (
          <ProFeed search={search} brand={brand} />
        )}
      </main>
    </div>
  );
}
