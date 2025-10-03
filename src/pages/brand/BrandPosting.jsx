import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import MediaUploader from './components/MediaUploader';
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
  
  // Image upload state
  const [images, setImages] = useState([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [postId, setPostId] = useState(null);

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
    
    // Generate post ID for this session
    setPostId(`post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  }, [canPostAsBrand, brandId]);

  const fetchBrandCommunities = async () => {
    try {
      // Fetch real communities from Firestore
      const communitiesQuery = query(
        collection(db, 'communities'),
        where('active', '==', true),
        orderBy('name')
      );
      
      const snapshot = await getDocs(communitiesQuery);
      const communityData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCommunities(communityData);
      
      // Set first community as default
      if (communityData.length > 0) {
        setSelectedCommunity(communityData[0].id);
      }
    } catch (error) {
      // Fallback to mock data
      setCommunities([
        { id: 'whats-good', name: "What's Good", members: 1247 },
        { id: 'supplement-scoop', name: 'Supplement Scoop', members: 892 },
        { id: 'pro-feed', name: 'Pro Feed', members: 1456 },
        { id: 'brand', name: 'Brand Community', members: 892 }
      ]);
      setSelectedCommunity('whats-good');
    }
  };

  const fetchRecentBrandPosts = async () => {
    try {
      // Fetch recent posts from this brand
      const postsQuery = query(
        collection(db, 'posts'),
        where('brandId', '==', brandId),
        where('isBrandPost', '==', true),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      
      const snapshot = await getDocs(postsQuery);
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().createdAt?.toDate() || new Date()
      }));
      
      setRecentPosts(postsData);
    } catch (error) {
      // Fallback to mock data
      setRecentPosts([
        {
          id: 1,
          content: 'Excited to announce our new sustainability initiative! 🌱',
          community: 'What\'s Good',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          engagements: 45
        },
        {
          id: 2,
          content: 'New product training materials are now available in the hub.',
          community: 'Supplement Scoop',
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

    if (!postContent.trim() && images.length === 0) {
      setPostStatus({
        type: 'error',
        message: 'Please enter some content or add images to your post.'
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
    
    // Check if any images are still uploading
    if (uploadingCount > 0) {
      setPostStatus({
        type: 'error',
        message: 'Please wait for all images to finish uploading.'
      });
      return;
    }

    setIsPosting(true);
    setPostStatus(null);

    try {
      // Prepare image data with download URLs only
      const imageData = images
        .filter(img => img.downloadURL && img.complete)
        .map(img => ({
          name: img.name,
          path: img.path,
          downloadURL: img.downloadURL
        }));

      const postData = {
        content: postContent,
        type: postType,
        communityId: selectedCommunity,
        authorType: 'brand',
        authorId: brandId,
        authorName: getBrandName(),
        isBrandPost: true,
        brandId: brandId,
        images: imageData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: 0,
        comments: 0,
        shares: 0
      };

      // Save post to Firestore
      await addDoc(collection(db, 'posts'), postData);

      setPostStatus({
        type: 'success',
        message: 'Post published successfully!'
      });
      
      // Reset form
      setPostContent('');
      setPostType('text');
      setImages([]);
      setPostId(`post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      
      // Refresh recent posts
      fetchRecentBrandPosts();
    } catch (error) {
      setPostStatus({
        type: 'error',
        message: `Failed to publish post: ${error.message}`
      });
    } finally {
      setIsPosting(false);
    }
  };

  const getBrandName = () => {
    // Get brand name from brand ID
    return brandId.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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
                  {community.name} {community.members ? `(${community.members} members)` : ''}
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

          {/* Media Uploader */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Images (Optional)
            </label>
            <MediaUploader
              brandId={brandId}
              postId={postId}
              maxMB={parseInt(import.meta.env.VITE_MAX_IMAGE_MB) || 5}
              onImagesChange={setImages}
              onUploadingChange={setUploadingCount}
            />
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
              disabled={isPosting || uploadingCount > 0 || (!postContent.trim() && images.length === 0) || !selectedCommunity}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={uploadingCount > 0 ? 'Please wait for images to finish uploading' : ''}
            >
              <Send className="w-4 h-4" />
              <span>
                {uploadingCount > 0 
                  ? `Uploading ${uploadingCount} ${uploadingCount === 1 ? 'image' : 'images'}...`
                  : isPosting 
                    ? 'Publishing...' 
                    : 'Publish Post'}
              </span>
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
                      <span className="text-sm text-gray-500">{post.community || post.communityId}</span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">{formatTimeAgo(post.timestamp)}</span>
                    </div>
                    <p className="text-gray-900 mb-3">{post.content}</p>
                    {post.images && post.images.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {post.images.slice(0, 4).map((img, idx) => (
                          <img 
                            key={idx} 
                            src={img.downloadURL} 
                            alt={img.name} 
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{post.engagements || post.likes || 0} engagements</span>
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
            <span>Images must be under {parseInt(import.meta.env.VITE_MAX_IMAGE_MB) || 5}MB each</span>
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
