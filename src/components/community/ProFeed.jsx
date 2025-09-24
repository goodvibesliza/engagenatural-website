// src/components/community/ProFeed.jsx
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/auth-context';
import PostCard from './PostCard';
import ProGate from './ProGate';

const proStubPosts = [
  {
    id: 'pro-001',
    brand: 'All',
    content:
      "Q4 strategic review: 23% growth in organic lines. Plan educational content around ingredient sourcing.",
    author: { name: 'Alexandra Reid', role: 'Product Strategy', verified: true },
    timeAgo: '3h ago',
    isPinned: true,
  },
  {
    id: 'pro-002',
    brand: 'Botanical Co',
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

export default function ProFeed({ search = '', brand = 'All', onRequestVerify }) {
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

  const q = search.trim().toLowerCase();
  const filtered = proStubPosts.filter((p) => {
    const okBrand = brand === 'All' || p.brand === brand;
    if (!q) return okBrand;
    return okBrand && (p.content.toLowerCase().includes(q) || p.author.name.toLowerCase().includes(q));
  });

  return (
    <div id="panel-pro" role="tabpanel" aria-labelledby="tab-pro" className="space-y-4">
      {filtered.map((post) => (
        <div key={post.id}>
          {post.isPinned && (
            <div className="flex items-center space-x-2 text-xs font-medium text-deep-moss mb-2">
              <span>PINNED</span>
            </div>
          )}
          <PostCard post={post} />
        </div>
      ))}
    </div>
  );
}
