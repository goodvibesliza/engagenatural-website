import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import PublicHeader from '../../components/layout/PublicHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/card';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import MediaUploader from '../../components/media/MediaUploader';
import { ArrowLeft } from 'lucide-react';

// Community name mappings
const COMMUNITY_NAMES = {
  whats_good: "What's Good",
  supplement_scoop: "Supplement Scoop",
  pro_feed: "Pro Feed",
  brand_community: "Brand Community"
};

const COMMUNITY_IDS = {
  whats_good: "whats-good",
  supplement_scoop: "supplement-scoop",
  pro_feed: "pro-feed",
  brand_community: "brand"
};

export default function CommunityPage() {
  const { key } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [images, setImages] = useState([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  
  // Posts state
  const [recentPosts, setRecentPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  
  const communityName = COMMUNITY_NAMES[key] || key;
  const communityId = COMMUNITY_IDS[key] || key;
  const brandId = user?.brandId;

  useEffect(() => {
    if (communityId) {
      fetchRecentPosts();
    }
  }, [communityId, brandId]);

  const fetchRecentPosts = async () => {
    if (!brandId) {
      setLoadingPosts(false);
      return;
    }
    
    try {
      const postsQuery = query(
        collection(db, 'community_posts'),
        where('communityId', '==', communityId),
        where('brandId', '==', brandId),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      const snapshot = await getDocs(postsQuery);
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setRecentPosts(posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleMediaComplete = (urls) => {
    setImages(urls);
  };

  const handleMediaUploadingChange = (count) => {
    setUploadingCount(count);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !body.trim()) {
      return;
    }
    
    if (uploadingCount > 0) {
      return;
    }

    setSubmitting(true);

    try {
      const postData = {
        communityId,
        brandId,
        authorId: user.uid,
        authorName: user.name || user.displayName || 'Brand Manager',
        title: title.trim(),
        body: body.trim(),
        images: images || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'published',
        visibility: 'public',
        likeCount: 0,
        commentCount: 0
      };

      await addDoc(collection(db, 'community_posts'), postData);

      // Reset form
      setTitle('');
      setBody('');
      setImages([]);
      
      // Refresh posts
      fetchRecentPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = title.trim() && body.trim() && uploadingCount === 0 && !submitting;

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/brand/communities')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Communities
        </Button>

        {/* Community Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{communityName}</h1>
          <p className="text-gray-600 mt-2">Share updates and engage with your community</p>
        </div>

        {/* Create Post Form */}
        {user?.role === 'brand_manager' && (
          <Card className="mb-8" data-testid="community-create-form">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Post title"
                    required
                    maxLength={200}
                  />
                </div>

                <div>
                  <Label htmlFor="body">Body *</Label>
                  <Textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="What would you like to share?"
                    required
                    rows={4}
                    maxLength={5000}
                  />
                </div>

                <div>
                  <Label>Images (Optional)</Label>
                  <MediaUploader
                    brandId={brandId}
                    maxMB={5}
                    onComplete={handleMediaComplete}
                    onUploadingChange={handleMediaUploadingChange}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full"
                >
                  {uploadingCount > 0 
                    ? `Uploading ${uploadingCount} image${uploadingCount > 1 ? 's' : ''}...` 
                    : submitting 
                      ? 'Creating Post...' 
                      : 'Create Post'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Recent Posts */}
        <div data-testid="community-posts-list">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Posts</h2>
          
          {loadingPosts ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-3">
                      <div className="h-6 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/4" />
                      <div className="h-20 bg-gray-200 rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recentPosts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">No posts yet. Be the first to post!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentPosts.map(post => (
                <Card key={post.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {post.images && post.images.length > 0 && (
                        <img
                          src={post.images[0]}
                          alt=""
                          className="w-24 h-24 object-cover rounded"
                          loading="lazy"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">
                          {post.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          {post.authorName} • {post.createdAt?.toDate?.().toLocaleDateString() || 'Recently'}
                        </p>
                        <p className="text-gray-700 line-clamp-3">{post.body}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
