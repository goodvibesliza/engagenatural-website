// src/components/community/WhatsGoodFeed.jsx
import PostCard from './PostCard';

const stubPosts = [
  {
    id: 'wg-001',
    brand: 'All',
    content:
      "🎉 Just hit our quarterly sales target! Amazing teamwork across locations. Shoutout to the Denver team for stellar CSAT this month.",
    author: { name: 'Sarah Chen', role: 'Regional Manager', verified: true },
    timeAgo: '2h ago',
  },
  {
    id: 'wg-002',
    brand: 'Botanical Co',
    content:
      'Customers love the new sustainability packaging. One said it made her feel great about supporting us! 🌱',
    author: { name: 'Marcus Rodriguez', role: 'Store Manager', verified: true },
    timeAgo: '4h ago',
  },
  {
    id: 'wg-003',
    brand: 'All',
    content:
      "Amazing training session with new team members today. Their enthusiasm reminded me why I love this industry. ✨",
    author: { name: 'Jennifer Park', role: 'Training Coordinator', verified: true },
    timeAgo: '6h ago',
  },
];

export default function WhatsGoodFeed({ search = '', brand = 'All' }) {
  const q = search.trim().toLowerCase();
  const filtered = stubPosts.filter((p) => {
    const okBrand = brand === 'All' || p.brand === brand;
    if (!q) return okBrand;
    return okBrand && (p.content.toLowerCase().includes(q) || p.author.name.toLowerCase().includes(q));
  });

  if (filtered.length === 0) {
    return (
      <div className="text-sm text-warm-gray py-8 text-center">No posts match your filters yet.</div>
    );
  }

  return (
    <div id="panel-whats-good" role="tabpanel" aria-labelledby="tab-whats-good" className="space-y-4">
      {filtered.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
