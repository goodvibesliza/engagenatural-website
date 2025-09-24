// src/components/community/ProFeed.jsx
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/auth-context';
import PostCard from './PostCard';
import ProGate from './ProGate';
import SkeletonPostCard from './SkeletonPostCard';
import ErrorBanner from './ErrorBanner';
import COPY from '../../i18n/community.copy';

export const PRO_STUBS = [
  {
    id: 'pro-001',
    brand: 'All',
    tags: ['strategy','growth'],
    content:
      "Q4 strategic review: 23% growth in organic lines. Plan educational content around ingredient sourcing.",
    author: { name: 'Alexandra Reid', role: 'Product Strategy', verified: true },
    timeAgo: '3h ago',
    isPinned: true,
  },
  {
    id: 'pro-002',
    brand: 'Botanical Co',
    tags: ['competition','training'],
    content:
      "Competitor analysis complete. Strong digital, weaker in-store. Double down on training + education.",
    author: { name: 'James Wilson', role: 'Market Research', verified: true },
    timeAgo: '5h ago',
  },
];

function readDevOverride() {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem('DEV_isVerifiedStaff');
    if (v === 'true') return true;
    if (v === 'false') return false;
    return null;
  } catch {
    return null;
  }
}

export default function ProFeed({
  query = '',
  search = '', // backward compat
  brand = 'All', // backward compat
  selectedBrands = [],
  selectedTags = [],
  onRequestVerify,
}) {
  const { isVerified, hasRole } = useAuth();

  // Real computed value for staff verification
  const realIsVerifiedStaff = (isVerified === true) && (hasRole(['verified_staff', 'staff', 'brand_manager', 'super_admin']));

  // Dev override that can be toggled without reload via localStorage
  const [devOverride, setDevOverride] = useState(readDevOverride());
  useEffect(() => {
    const id = setInterval(() => {
      const next = readDevOverride();
      setDevOverride((prev) => (prev !== next ? next : prev));
    }, 800);
    return () => clearInterval(id);
  }, []);

  const isVerifiedStaff = useMemo(() => {
    if (devOverride === true) return true;
    if (devOverride === false) return false;
    return realIsVerifiedStaff;
  }, [devOverride, realIsVerifiedStaff]);

  if (!isVerifiedStaff) return <ProGate onRequestVerify={onRequestVerify} />;

  // Simulated loading window to render skeletons within 150ms
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 0);
    return () => clearTimeout(id);
  }, []);

  const q = (query || search).trim().toLowerCase();
  const filtered = PRO_STUBS.filter((p) => {
    const okText = !q || (p.content?.toLowerCase().includes(q) || p.author?.name?.toLowerCase().includes(q));
    const brandList = selectedBrands.length > 0 ? selectedBrands : (brand && brand !== 'All' ? [brand] : []);
    const okBrand = brandList.length === 0 || brandList.includes(p.brand || '');
    const tags = Array.isArray(p.tags) ? p.tags : [];
    const okTags = selectedTags.length === 0 || tags.some((t) => selectedTags.includes(t));
    return okText && okBrand && okTags;
  });

  if (loading) {
    return (
      <div id="panel-pro" role="tabpanel" aria-labelledby="tab-pro" className="community-cards">
        <SkeletonPostCard />
        <SkeletonPostCard />
        <SkeletonPostCard />
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div id="panel-pro" role="tabpanel" aria-labelledby="tab-pro" className="space-y-3 text-center py-10">
        {error && (
          <div className="max-w-md mx-auto">
            <ErrorBanner message={error} onDismiss={() => setError('')} />
          </div>
        )}
        <div className="text-gray-900 font-medium">{COPY.empty.pro}</div>
      </div>
    );
  }

  return (
    <div id="panel-pro" role="tabpanel" aria-labelledby="tab-pro" className="community-cards">
      {error && (
        <div className="max-w-md mx-auto">
          <ErrorBanner message={error} onDismiss={() => setError('')} />
        </div>
      )}
      {filtered.map((post, idx) => (
        <div key={post.id}>
          {post.isPinned && (
            <div className="flex items-center space-x-2 text-xs font-medium text-deep-moss mb-2">
              <span>PINNED</span>
            </div>
          )}
          <PostCard post={post} dataTestId={idx === 0 ? 'postcard-first' : undefined} />
        </div>
      ))}
    </div>
  );
}
