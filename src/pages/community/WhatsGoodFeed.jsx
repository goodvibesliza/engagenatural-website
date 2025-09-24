// src/pages/community/WhatsGoodFeed.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { trackPageView, trackUserAction } from '../../services/analytics';
import PostCard from '../../components/community/PostCard';
import { FeedSkeleton, InlineLoading } from '../../components/community/LoadingStates';
import { EmptyFeedState } from '../../components/community/EmptyStates';
import { Plus, RefreshCw } from 'lucide-react';

// Stub data for What's Good feed
const generateStubPosts = () => {
  const posts = [
    {
      id: 'wg-001',
      content: '🎉 Just hit our quarterly sales target! Amazing teamwork from everyone across all locations. Special shoutout to the Denver team for their incredible customer service scores this month.',
      author: {
        name: 'Sarah Chen',
        role: 'Regional Manager',
        verified: true
      },
      timeAgo: '2h ago',
      type: 'celebration'
    },
    {
      id: 'wg-002',
      content: 'Love seeing customers light up when they discover our new sustainability packaging. One customer today said it made her feel great about supporting us! 🌱',
      author: {
        name: 'Marcus Rodriguez',
        role: 'Store Manager',
        verified: true
      },
      timeAgo: '4h ago',
      type: 'win'
    },
    {
      id: 'wg-003',
      content: 'Had the most amazing training session with new team members today. Their enthusiasm and questions reminded me why I love this industry. The future is bright! ✨',
      author: {
        name: 'Jennifer Park',
        role: 'Training Coordinator',
        verified: true
      },
      timeAgo: '6h ago',
      type: 'reflection'
    },
    {
      id: 'wg-004',
      content: 'Customer came back specifically to thank Jake for his product recommendations last week. She said it completely changed her routine for the better. These moments make it all worth it! 💚',
      image: null,
      author: {
        name: 'Lisa Thompson',
        role: 'Assistant Manager',
        verified: false
      },
      timeAgo: '8h ago',
      type: 'customer_story'
    },
    {
      id: 'wg-005',
      content: 'Team lunch was incredible today! Nothing brings people together like good food and great company. Already planning the next one 🍕',
      author: {
        name: 'David Kim',
        role: 'Team Lead',
        verified: true
      },
      timeAgo: '1d ago',
      type: 'team_building'
    }
  ];
  
  return posts;
};

const WhatsGoodFeed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    trackPageView('community_whats_good_feed');
    loadPosts();
  }, []);
  
  const loadPosts = async () => {
    // Simulate API call
    setTimeout(() => {
      const stubPosts = generateStubPosts();
      setPosts(stubPosts);
      setLoading(false);
      setRefreshing(false);
    }, 800);
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    trackUserAction('refresh_feed', { feedType: 'whats_good' });
    loadPosts();
  };
  
  const handleCreatePost = () => {
    trackUserAction('create_post_attempt', { feedType: 'whats_good' });
    alert('Post creation coming soon!');
  };

  if (loading) {
    return <FeedSkeleton count={3} />;
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-medium text-deep-moss">
          What's Good Today
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-warm-gray hover:text-deep-moss hover:bg-oat-beige rounded-full transition-colors disabled:opacity-50"
            title="Refresh feed"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleCreatePost}
            className="flex items-center space-x-2 px-4 py-2 bg-sage-green text-white font-medium text-sm rounded-lg hover:bg-sage-dark transition-colors"
          >
            <Plus size={16} />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Feed Content */}
      {refreshing && (
        <InlineLoading message="Refreshing feed..." />
      )}
      
      {!refreshing && posts.length === 0 && (
        <EmptyFeedState type="whatsGood" />
      )}
      
      {!refreshing && posts.length > 0 && (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          
          {/* Load more placeholder */}
          <div className="text-center py-8">
            <button className="px-6 py-2 text-sm font-medium text-warm-gray hover:text-deep-moss transition-colors">
              Load more posts
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsGoodFeed;
