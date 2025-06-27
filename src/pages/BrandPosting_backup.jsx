import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/auth-context';
import { 
  MessageSquare, 
  Image, 
  Video, 
  FileText, 
  Send,
  AlertCircle,
  CheckCircle,
  Users,
  Building
} from 'lucide-react';

export default function BrandPosting({ brandId }) {
  const { 
    canPostAsBrand, 
    userProfile, 
    isBrandManager,
    hasPermission,
    PERMISSIONS 
  } = useAuth();
  
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState('text');
  const [selectedCommunity, setSelectedCommunity] = useState('');
  const [communities, setCommunities] = useState([]);
  const [isPosting, setIsPosting] = useState(false);
  const [postStatus, setPostStatus] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);

  // Check permissions on component mount
  useEffect(() => {
    if (!canPostAsBrand()) {
      setPostStatus({
        type: 'error',
        message: 'You do not have permission to post as a brand.'
      });
      return;
    }

    // Fetch communities where brand can post
    fetchBrandCommunities();
    fetchRecentBrandPosts();
  }, [canPostAsBrand, brandId]);

  const fetchBrandCommunities = async () => {
    try {
      // Replace with your actual API call
      const response = await fetch(`/api/brands/${brandId}/communities`);
      const data = await response.json();
      setCommunities(data);
      
      // Set first community as default
      if (data.length > 0) {
        setSelectedCommunity(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
      // Fallback to mock data
      setCommunities([
        { id: 'sustainability', name: 'Sustainability Champions', members: 1247 },
        { id: 'product-training', name: 'Product Training Hub', members: 892 },
        { id: 'retail-excellence', name: 'Retail Excellence', members: 1456 }
      ]);
      setSelectedCommunity('sustainability');
    }
  };

  const fetchRecentBrandPosts = async () => {
    try {
      // Replace with your actual API call
      const response = await fetch(`/api/brands/${brandId}/posts?limit=5`);
      const data = await response.json();
      setRecentPosts(data);
    } catch (error) {
      console.error('Error fetching recent posts:', error);
      // Fallback to mock data
      setRecentPosts([
        {
          id: 1,
          content: 'Excited to announce our new sustainability initiative! 🌱',
          community: 'Sustainability Champions',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          engagements: 45
        },
        {
          id: 2,
          content: 'New product training materials are now available in the hub.',
          community: 'Product Training Hub',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          engagements: 23
        }
      ]);
    }
  };

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    
    if (!canPostAsBrand()) {
      setPostStatus({
        type: 'error',
        message: 'You do not have permission to post as a brand.'
      });
      return;
    }

    if (!postContent.trim()) {
      setPostStatus({
        type: 'error',
        message: 'Please enter some content for your post.'
      });
      return;
    }

    if (!selectedCommunity) {
      setPostStatus({
        type: 'error',
        message: 'Please select a community to post to.'
      });
      return;
    }

    setIsPosting(true);
    setPostStatus(null);

    try {
      const postData = {
        content: postContent,
        type: postType,
        communityId: selectedCommunity,
        authorType: 'brand',
        authorId: brandId,
        authorName: getBrandName(),
        isBrandPost: true,
        timestamp: new Date()
      };

      // Replace with your actual API call
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userProfile.token}` // If you use tokens
        },
        body: JSON.stringify(postData)
      });

      if (response.ok) {
        setPostStatus({
          type: 'success',
          message: 'Post published successfully!'
        });
        setPostContent('');
        setPostType('text');
        
        // Refresh recent posts
        fetchRecentBrandPosts();
      } else {
        throw new Error('Failed to publish post');
      }
    } catch (error) {
      console.error('Error posting:', error);
      setPostStatus({
        type: 'error',
        message: 'Failed to publish post. Please try again.'
      });
    } finally {
      setIsPosting(false);
    }
  };

  const getBrandName = () => {
    // Replace with actual brand name logic
    return brandId === 'engagenatural' ? 'EngageNatural' : brandId;
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

  // Check if user has access to this brand
  if (isBrandManager() && userProfile?.brandId !== brandId) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-red-600 mb-2">Access Restricted</h2>
        <p className="text-gray-600">You can only post for your own brand.</p>
      </div>
    );
  }

  // Check if user has permission to post as brand
  if (!canPostAsBrand()) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-red-600 mb-2">Permission Denied</h2>
        <p className="text-gray-600">You do not have permission to post as a brand.</p>
        <p className="text-sm text-gray-500 mt-2">
          Contact your administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Building className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Post as {getBrandName()}</h1>
            <p className="text-gray-600">Share official updates and engage with your communities</p>
          </div>
        </div>
        
        {/* Brand Badge */}
        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          <Building className="w-4 h-4 mr-1" />
          Official Brand Account
        </div>
      </div>

      {/* Post Creation Form */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Create New Post</h2>
        </div>
        
        <form onSubmit={handleSubmitPost} className="p-6 space-y-6">
          {/* Community Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Community
            </label>
            <select
              value={selectedCommunity}
              onChange={(e) => setSelectedCommunity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Choose a community...</option>
              {communities.map((community) => (
                <option key={community.id} value={community.id}>
                  {community.name} ({community.members} members)
                </option>
              ))}
            </select>
          </div>

          {/* Post Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Post Type
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setPostType('text')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                  postType === 'text' 
                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Text</span>
              </button>
              
              <button
                type="button"
                onClick={() => setPostType('image')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                  postType === 'image' 
                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Image className="w-4 h-4" />
                <span>Image</span>
              </button>
              
              <button
                type="button"
                onClick={() => setPostType('announcement')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                  postType === 'announcement' 
                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Announcement</span>
              </button>
            </div>
          </div>

          {/* Post Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Post Content
            </label>
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder={`Share an official update from ${getBrandName()}...`}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              required
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-gray-500">
                {postContent.length}/500 characters
              </p>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Building className="w-4 h-4" />
                <span>Posting as {getBrandName()}</span>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {postStatus && (
            <div className={`p-4 rounded-lg flex items-center space-x-2 ${
              postStatus.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {postStatus.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{postStatus.message}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPosting || !postContent.trim() || !selectedCommunity}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>{isPosting ? 'Publishing...' : 'Publish Post'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Recent Brand Posts */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Recent Brand Posts</h2>
          <p className="text-sm text-gray-600">Your latest posts across all communities</p>
        </div>
        
        <div className="divide-y">
          {recentPosts.length > 0 ? (
            recentPosts.map((post) => (
              <div key={post.id} className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-gray-900">{getBrandName()}</span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Brand
                      </span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">{post.community}</span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">{formatTimeAgo(post.timestamp)}</span>
                    </div>
                    <p className="text-gray-900 mb-3">{post.content}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{post.engagements} engagements</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No recent posts found.</p>
              <p className="text-sm">Create your first brand post above!</p>
            </div>
          )}
        </div>
      </div>

      {/* Posting Guidelines */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Brand Posting Guidelines</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
            <span>Posts will appear with the official {getBrandName()} brand badge</span>
          </li>
          <li className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
            <span>Keep content professional and aligned with brand values</span>
          </li>
          <li className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
            <span>Engage authentically with community members</span>
          </li>
          <li className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
            <span>Use announcements for important updates and news</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

