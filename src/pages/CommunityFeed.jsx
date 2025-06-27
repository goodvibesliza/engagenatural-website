import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/auth-context';
import { 
  MessageSquare, 
  Heart, 
  Share2, 
  Users, 
  Building,
  Plus,
  Filter,
  Search,
  AlertCircle,
  Loader
} from 'lucide-react';

export default function CommunityFeed({ brandId }) {
  const { 
    hasPermission, 
    canAccessContent,
    userProfile, 
    isBrandManager,
    PERMISSIONS 
  } = useAuth();
  
  const [posts, setPosts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState('all');
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (hasPermission(PERMISSIONS.VIEW_COMMUNITIES)) {
      fetchCommunities();
      fetchPosts();
    } else {
      setLoading(false);
    }
  }, [hasPermission, brandId]);

  const fetchCommunities = async () => {
    try {
      // Replace with your actual API call
      const response = await fetch('/api/communities');
      const data = await response.json();
      
      // Filter communities based on permissions
      const accessibleCommunities = data.filter(community => {
        // Brand managers can only see their own brand communities
        if (isBrandManager()) {
          return community.brandId === brandId || community.isPublic;
        }
        // Other users can see all communities
        return true;
      });
      
      setCommunities(accessibleCommunities);
    } catch (error) {
      console.error('Error fetching communities:', error);
      // Fallback to mock data
      setCommunities([
        { 
          id: 'sustainability', 
          name: 'Sustainability Champions', 
          members: 1247, 
          brandId: brandId,
          isPublic: true 
        },
        { 
          id: 'product-training', 
          name: 'Product Training Hub', 
          members: 892, 
          brandId: brandId,
          isPublic: false 
        },
        { 
          id: 'retail-excellence', 
          name: 'Retail Excellence', 
          members: 1456, 
          brandId: 'general',
          isPublic: true 
        }
      ]);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      // Replace with your actual API call
      const response = await fetch(`/api/communities/posts?brandId=${brandId}`);
      const data = await response.json();
      
      // Filter posts based on permissions
      const accessiblePosts = data.filter(post => {
        // Check if user can access content from this brand
        return canAccessContent(post.authorBrandId);
      });
      
      setPosts(accessiblePosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      // Fallback to mock data
      setPosts([
        {
          id: 1,
          content: "Just completed the new sustainability training! The insights on eco-friendly packaging were eye-opening. 🌱",
          author: "Sarah Johnson",
          authorType: "user",
          authorBrandId: brandId,
          community: "Sustainability Champions",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          likes: 12,
          comments: 3,
          isLiked: false
        },
        {
          id: 2,
          content: "Excited to announce our new product line focused on sustainable materials! We're committed to reducing our environmental impact while maintaining the quality you expect from EngageNatural.",
          author: "EngageNatural",
          authorType: "brand",
          authorBrandId: brandId,
          community: "Sustainability Champions",
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          likes: 28,
          comments: 7,
          isLiked: true,
          isBrandPost: true
        },
        {
          id: 3,
          content: "Question for the group: What's been your most effective approach to explaining product benefits to customers?",
          author: "Mike Chen",
          authorType: "user",
          authorBrandId: brandId,
          community: "Retail Excellence",
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          likes: 8,
          comments: 15,
          isLiked: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    
    if (!newPostContent.trim()) return;
    
    setIsPosting(true);
    
    try {
      const postData = {
        content: newPostContent,
        authorType: 'user',
        authorId: userProfile.id,
        authorName: `${userProfile.firstName} ${userProfile.lastName}`,
        communityId: selectedCommunity === 'all' ? communities[0]?.id : selectedCommunity,
        timestamp: new Date()
      };
      
      // Replace with your actual API call
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      });
      
      if (response.ok) {
        setNewPostContent('');
        setShowNewPostForm(false);
        fetchPosts(); // Refresh posts
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      // Replace with your actual API call
      await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
      });
      
      // Update local state
      setPosts(posts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
              isLiked: !post.isLiked 
            }
          : post
      ));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const filteredPosts = posts.filter(post => {
    const matchesCommunity = selectedCommunity === 'all' || post.community === selectedCommunity;
    const matchesSearch = searchTerm === '' || 
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCommunity && matchesSearch;
  });

  // Check if user has permission to view communities
  if (!hasPermission(PERMISSIONS.VIEW_COMMUNITIES)) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-red-600 mb-2">Access Restricted</h2>
        <p className="text-gray-600">You don't have permission to view communities.</p>
      </div>
    );
  }

  // Check if brand manager is accessing their own brand
  if (isBrandManager() && userProfile?.brandId !== brandId) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-red-600 mb-2">Access Restricted</h2>
        <p className="text-gray-600">You can only view communities for your own brand.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading community feed...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Community Feed</h1>
            <p className="text-gray-600">
              {isBrandManager() 
                ? `Participate in your brand communities as ${userProfile?.firstName}`
                : 'Engage with communities and fellow members'
              }
            </p>
          </div>
          
          {hasPermission(PERMISSIONS.POST_IN_COMMUNITIES) && (
            <button
              onClick={() => setShowNewPostForm(!showNewPostForm)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Post</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Community Filter */}
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedCommunity}
              onChange={(e) => setSelectedCommunity(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Communities</option>
              {communities.map((community) => (
                <option key={community.id} value={community.name}>
                  {community.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* New Post Form */}
      {showNewPostForm && hasPermission(PERMISSIONS.POST_IN_COMMUNITIES) && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Create New Post</h2>
            <p className="text-sm text-gray-600">
              Posting as {userProfile?.firstName} {userProfile?.lastName}
            </p>
          </div>
          
          <form onSubmit={handleCreatePost} className="p-6">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              required
            />
            
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-gray-500">
                {newPostContent.length}/500 characters
              </p>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewPostForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPosting || !newPostContent.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isPosting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-4">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-sm border">
              <div className="p-6">
                <div className="flex items-start space-x-3">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    post.isBrandPost 
                      ? 'bg-blue-600' 
                      : 'bg-gray-600'
                  }`}>
                    {post.isBrandPost ? (
                      <Building className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-white font-medium">
                        {post.author.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  {/* Post Content */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-gray-900">{post.author}</span>
                      {post.isBrandPost && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Building className="w-3 h-3 mr-1" />
                          Brand
                        </span>
                      )}
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">{post.community}</span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">{formatTimeAgo(post.timestamp)}</span>
                    </div>
                    
                    <p className="text-gray-900 mb-4">{post.content}</p>
                    
                    {/* Post Actions */}
                    <div className="flex items-center space-x-6">
                      <button
                        onClick={() => handleLikePost(post.id)}
                        className={`flex items-center space-x-2 text-sm transition-colors ${
                          post.isLiked 
                            ? 'text-red-600 hover:text-red-700' 
                            : 'text-gray-500 hover:text-red-600'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                        <span>{post.likes}</span>
                      </button>
                      
                      <button className="flex items-center space-x-2 text-sm text-gray-500 hover:text-blue-600 transition-colors">
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.comments}</span>
                      </button>
                      
                      <button className="flex items-center space-x-2 text-sm text-gray-500 hover:text-green-600 transition-colors">
                        <Share2 className="w-4 h-4" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCommunity !== 'all' 
                ? 'Try adjusting your filters or search terms.'
                : 'Be the first to start a conversation!'
              }
            </p>
            {hasPermission(PERMISSIONS.POST_IN_COMMUNITIES) && !showNewPostForm && (
              <button
                onClick={() => setShowNewPostForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Post
              </button>
            )}
          </div>
        )}
      </div>

      {/* Community Stats */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Community Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {communities.slice(0, 3).map((community) => (
            <div key={community.id} className="text-center p-4 border rounded-lg">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900">{community.name}</h3>
              <p className="text-sm text-gray-600">{community.members} members</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

