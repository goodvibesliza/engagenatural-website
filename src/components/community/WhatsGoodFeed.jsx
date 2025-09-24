// src/components/community/WhatsGoodFeed.jsx
import PostCard from './PostCard';

export const WHATS_GOOD_STUBS = [
  {
    id: 'wg-001',
    brand: 'All',
    tags: ['milestone','csat'],
    content:
      "🎉 Just hit our quarterly sales target! Amazing teamwork across locations. Shoutout to the Denver team for stellar CSAT this month.",
    author: { name: 'Sarah Chen', role: 'Regional Manager', verified: true },
    timeAgo: '2h ago',
  },
  {
    id: 'wg-002',
    brand: 'Botanical Co',
    tags: ['sustainability','packaging'],
    content:
      'Customers love the new sustainability packaging. One said it made her feel great about supporting us! 🌱',
    author: { name: 'Marcus Rodriguez', role: 'Store Manager', verified: true },
    timeAgo: '4h ago',
  },
  {
    id: 'wg-003',
    brand: 'All',
    tags: ['training','people'],
    content:
      "Amazing training session with new team members today. Their enthusiasm reminded me why I love this industry. ✨",
    author: { name: 'Jennifer Park', role: 'Training Coordinator', verified: true },
    timeAgo: '6h ago',
  },
];

export default function WhatsGoodFeed({
  query = '',
  search = '', // backward compat
  brand = 'All', // backward compat
  selectedBrands = [],
  selectedTags = []
}) {
  const q = (query || search).trim().toLowerCase();
  const filtered = WHATS_GOOD_STUBS.filter((p) => {
    // Text query against content and author name (and optional title if exists)
    const okText = !q || (p.content?.toLowerCase().includes(q) || p.author?.name?.toLowerCase().includes(q));

    // Brands: OR within brands. Back-compat: single brand select or multi-select chips
    const brandList = selectedBrands.length > 0 ? selectedBrands : (brand && brand !== 'All' ? [brand] : []);
    const okBrand = brandList.length === 0 || brandList.includes(p.brand || '');

    // Tags: OR within tags
    const tags = Array.isArray(p.tags) ? p.tags : [];
    const okTags = selectedTags.length === 0 || tags.some((t) => selectedTags.includes(t));

    // AND across types
    return okText && okBrand && okTags;
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
