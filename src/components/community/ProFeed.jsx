// src/components/community/ProFeed.jsx
import { useAuth } from '../../contexts/auth-context';
import PostCard from './PostCard';

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

function GateView() {
  return (
    <div
      id="panel-pro"
      role="tabpanel"
      aria-labelledby="tab-pro"
      className="space-y-4"
    >
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-900">
        <div className="font-medium mb-1">Pro Feed is for verified team members</div>
        <div className="text-sm">Get verified to unlock strategic updates and insights.</div>
      </div>
    </div>
  );
}

export default function ProFeed({ search = '', brand = 'All' }) {
  const { isVerified } = useAuth();
  if (!isVerified) return <GateView />;

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
