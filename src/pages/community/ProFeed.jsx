// src/pages/community/ProFeed.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { trackPageView, trackUserAction } from '../../services/analytics';
import PostCard from '../../components/community/PostCard';
import { FeedSkeleton, InlineLoading } from '../../components/community/LoadingStates';
import { EmptyFeedState, UnverifiedUserCard } from '../../components/community/EmptyStates';
import { Plus, RefreshCw, Shield, TrendingUp, AlertCircle } from 'lucide-react';

// Stub data for Pro Feed (verified staff only)
const generateProStubPosts = () => {
  const posts = [
    {
      id: 'pro-001',
      content: "Q4 strategic review: We're seeing 23% growth in organic product lines. Key insights from customer feedback suggest demand for more educational content around ingredient sourcing. Planning workshop for next week.",
      author: {
        name: 'Alexandra Reid',
        role: 'Product Strategy Lead',
        verified: true
      },
      timeAgo: '3h ago',
      type: 'strategy',
      isPinned: true
    },
    {
      id: 'pro-002',
      content: "New competitor analysis complete. They're strong on digital but weak on in-store experience. Our advantage is clear - need to double down on staff training and customer education programs.",
      author: {
        name: 'James Wilson',
        role: 'Market Research Manager',
        verified: true
      },
      timeAgo: '5h ago',
      type: 'analysis'
    },
    {
      id: 'pro-003',
      content: 'Supply chain update: Secured better terms with our key suppliers for 2024. This should improve margins by 4-6% while maintaining quality. Legal review in progress.',
      author: {
        name: 'Maria Santos',
        role: 'Operations Director',
        verified: true
      },
      timeAgo: '7h ago',
      type: 'operations'
    },
    {
      id: 'pro-004',
      content: 'Training effectiveness metrics looking strong. New hires completing certification 18% faster with our updated modules. Customer satisfaction scores correlating nicely with training completion rates.',
      author: {
        name: 'Dr. Robert Chen',
        role: 'Learning & Development',
        verified: true
      },
      timeAgo: '1d ago',
      type: 'training'
    }
  ];
  
  return posts;
};

const ProFeedAccessGate = ({ user, onRequestVerification }) => {
  return (
    <div className="space-y-6">
      <UnverifiedUserCard onRequestVerification={onRequestVerification} />
      
      <div className="bg-gradient-to-br from-deep-moss to-sage-dark rounded-lg p-6 text-white">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <Shield size={24} />
          </div>
          <div>
            <h3 className="text-lg font-heading font-semibold mb-2">
              Pro Feed Preview
            </h3>
            <p className="text-gray-100 text-sm leading-relaxed mb-4">
              Access exclusive strategic insights, market analysis, operational updates, and leadership discussions reserved for verified team members.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <TrendingUp size={16} />
                <span>Market insights & analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertCircle size={16} />
                <span>Strategic updates</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield size={16} />
                <span>Leadership communications</span>
              </div>
              <div className="flex items-center space-x-2">
                <Plus size={16} />
                <span>Operational insights</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <EmptyFeedState type="restricted" />
    </div>
  );
};

const ProFeed = () => {
  const { user, isVerified, hasRole } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Check if user has access to Pro Feed
  const hasProAccess = isVerified && hasRole(['verified_staff', 'staff', 'brand_manager', 'super_admin']);
  
  useEffect(() => {
    trackPageView('community_pro_feed', { hasAccess: hasProAccess });
    
    if (hasProAccess) {
      loadPosts();
    } else {
      setLoading(false);
    }
  }, [hasProAccess]);
  
  const loadPosts = async () => {
    setTimeout(() => {
      const stubPosts = generateProStubPosts();
      setPosts(stubPosts);
      setLoading(false);
      setRefreshing(false);
    }, 800);
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    trackUserAction('refresh_feed', { feedType: 'pro' });
    loadPosts();
  };
  
  const handleCreatePost = () => {
    trackUserAction('create_post_attempt', { feedType: 'pro' });
    alert('Pro post creation coming soon!');
  };
  
  const handleRequestVerification = () => {
    trackUserAction('request_verification', { source: 'pro_feed_gate' });
    alert('Verification request coming soon!');
  };

  if (!hasProAccess) {
    return (
      <ProFeedAccessGate 
        user={user} 
        onRequestVerification={handleRequestVerification}
      />
    );
  }

  if (loading) {
    return <FeedSkeleton count={3} />;
  }

  return (
    <div className="space-y-6">
      {/* Pro Feed Header */}
      <div className="bg-gradient-to-r from-deep-moss to-sage-dark rounded-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield size={20} />
            <div>
              <h2 className="text-lg font-heading font-semibold">
                Pro Feed
              </h2>
              <p className="text-gray-100 text-sm">
                Strategic insights for verified team members
              </p>
            </div>
          </div>
          <div className="text-xs bg-white/20 px-2 py-1 rounded-full">
            Verified Access
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-medium text-deep-moss">
          Latest Updates
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
            className="flex items-center space-x-2 px-4 py-2 bg-deep-moss text-white font-medium text-sm rounded-lg hover:bg-sage-dark transition-colors"
          >
            <Plus size={16} />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Feed Content */}
      {refreshing && (
        <InlineLoading message="Refreshing pro feed..." />
      )}
      
      {!refreshing && posts.length === 0 && (
        <EmptyFeedState type="proFeed" />
      )}
      
      {!refreshing && posts.length > 0 && (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id}>
              {post.isPinned && (
                <div className="flex items-center space-x-2 text-xs font-medium text-deep-moss mb-2">
                  <Shield size={12} />
                  <span>PINNED POST</span>
                </div>
              )}
              <PostCard post={post} />
            </div>
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

export default ProFeed;
