import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { trackEvent } from '../../services/analytics';
import { toast } from 'sonner';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { Separator } from '../../components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

// Icons
import { 
  Save, 
  ArrowLeft, 
  Users, 
  Plus, 
  X, 
  MessageSquare,
  BarChart3,
  Calendar,
  Tag,
  Image,
  Settings
} from 'lucide-react';

/**
 * Desktop-only Community Editor for creating/editing communities and posts
 * Can be opened as modal or full page from Communities List
 */
export default function CommunityEditor() {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(!!communityId);
  const [saving, setSaving] = useState(false);
  const [posts, setPosts] = useState([]);
  const [showPostDialog, setShowPostDialog] = useState(false);
  
  // Desktop breakpoint check
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    topics: [],
    status: 'draft',
    memberCount: 0,
    image: '',
    isPublic: true,
    brandId: user?.brandId || ''
  });

  // New post state
  const [postData, setPostData] = useState({
    content: '',
    title: '',
    type: 'text'
  });

  const [topicInput, setTopicInput] = useState('');
  const unsubRef = useRef(null);
  const postsUnsubRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track page view
  useEffect(() => {
    trackEvent('page_view', {
      page: communityId ? 'community_edit' : 'community_create',
      community_id: communityId,
      user_role: user?.role,
      brand_id: user?.brandId
    });

    // Persist route in localStorage
    localStorage.setItem('en.brand.lastRoute', `/brands/communities/${communityId || 'new'}`);
  }, [communityId, user]);

  // Load existing community if editing
  useEffect(() => {
    if (!communityId) {
      setLoading(false);
      return;
    }

    const loadCommunity = async () => {
      try {
        const docRef = doc(db, 'communities', communityId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const communityData = { id: docSnap.id, ...docSnap.data() };
          setCommunity(communityData);
          setFormData({
            name: communityData.name || '',
            description: communityData.description || '',
            topics: communityData.topics || [],
            status: communityData.status || 'draft',
            memberCount: communityData.memberCount || 0,
            image: communityData.image || '',
            isPublic: communityData.isPublic ?? true,
            brandId: communityData.brandId || user?.brandId || ''
          });
        } else {
          toast.error('Community not found');
          navigate('/brands/communities');
        }
      } catch (error) {
        console.error('Error loading community:', error);
        toast.error('Failed to load community');
      } finally {
        setLoading(false);
      }
    };

    loadCommunity();
  }, [communityId, user?.brandId, navigate]);

  // Load posts for existing community
  useEffect(() => {
    if (!communityId) return;

    const q = query(
      collection(db, 'community_posts'),
      where('communityId', '==', communityId),
      where('brandId', '==', user?.brandId),
      orderBy('createdAt', 'desc')
    );

    postsUnsubRef.current = onSnapshot(q,
      (snapshot) => {
        const postsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));
        setPosts(postsData);
      },
      (error) => {
        console.error('Error fetching posts:', error);
      }
    );

    return () => {
      if (postsUnsubRef.current) {
        postsUnsubRef.current();
      }
    };
  }, [communityId, user?.brandId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSwitchChange = (checked) => {
    setFormData(prev => ({
      ...prev,
      isPublic: checked
    }));
  };

  const handleAddTopic = () => {
    if (topicInput.trim() === '') return;
    
    const formattedTopic = topicInput.trim().toLowerCase().replace(/\s+/g, '-');
    
    if (!formData.topics.includes(formattedTopic)) {
      setFormData(prev => ({
        ...prev,
        topics: [...prev.topics, formattedTopic]
      }));
    }
    
    setTopicInput('');
  };

  const handleRemoveTopic = (topicToRemove) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.filter(topic => topic !== topicToRemove)
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error('Name and description are required');
      return;
    }

    setSaving(true);
    
    try {
      const communityData = {
        ...formData,
        createdBy: user?.uid || null,
        createdByRole: user?.role || 'brand_manager',
        updatedAt: serverTimestamp(),
        brandId: user?.brandId || formData.brandId
      };

      if (communityId) {
        // Update existing community
        const docRef = doc(db, 'communities', communityId);
        await updateDoc(docRef, communityData);
        
        trackEvent('community_updated', {
          community_id: communityId,
          brand_id: user?.brandId,
          status: formData.status
        });
        
        toast.success('Community updated successfully');
      } else {
        // Create new community
        communityData.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(db, 'communities'), communityData);
        
        trackEvent('community_created', {
          community_id: docRef.id,
          brand_id: user?.brandId,
          status: formData.status
        });
        
        toast.success('Community created successfully');
        navigate(`/brands/communities/${docRef.id}`);
      }
    } catch (error) {
      console.error('Error saving community:', error);
      toast.error('Failed to save community');
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePost = async () => {
    if (!postData.content.trim()) {
      toast.error('Post content is required');
      return;
    }

    if (!communityId) {
      toast.error('Please save the community first');
      return;
    }

    try {
      await addDoc(collection(db, 'community_posts'), {
        communityId,
        brandId: user?.brandId,
        authorUid: user?.uid,
        userId: user?.uid,
        userName: user?.name || user?.displayName || user?.email || 'Brand Manager',
        content: postData.content.trim(),
        title: postData.title.trim(),
        type: postData.type,
        visibility: 'public',
        likeCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      trackEvent('community_post_created', {
        community_id: communityId,
        brand_id: user?.brandId,
        post_type: postData.type
      });

      toast.success('Post created successfully');
      setShowPostDialog(false);
      setPostData({
        content: '',
        title: '',
        type: 'text'
      });
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    
    // Handle Firestore Timestamp
    let jsDate;
    if (date && typeof date.toDate === 'function') {
      jsDate = date.toDate();
    } else if (date instanceof Date) {
      jsDate = date;
    } else {
      jsDate = new Date(date);
    }
    
    return jsDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Mobile blocking banner
  if (!isDesktop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto text-center border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <Settings className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle className="text-orange-800">Desktop Required</CardTitle>
            <CardDescription className="text-orange-600">
              Community editing tools are desktop-only. Please use a larger screen (1024px or wider) to manage communities.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/brands/communities')}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {communityId ? 'Edit Community' : 'Create Community'}
              </h1>
              <p className="text-gray-600 mt-1">
                {communityId ? 'Update your community settings and manage posts' : 'Set up a new community for your brand'}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            {communityId && (
              <Button
                variant="outline"
                onClick={() => setShowPostDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Post
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-brand-primary hover:bg-brand-primary/90"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Community
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Community Settings */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Community Details</CardTitle>
                <CardDescription>
                  Basic information about your community
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Community Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter community name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe what this community is about"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Cover Image URL</Label>
                  <Input
                    id="image"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.image && (
                    <div className="mt-2">
                      <img 
                        src={formData.image} 
                        alt="Community cover"
                        className="w-full h-32 object-cover rounded border"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="memberCount">Member Count</Label>
                    <Input
                      id="memberCount"
                      name="memberCount"
                      type="number"
                      value={formData.memberCount}
                      onChange={handleInputChange}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={handleSwitchChange}
                  />
                  <Label htmlFor="isPublic">Public community</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Topics</CardTitle>
                <CardDescription>
                  Add relevant topics to help categorize your community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <Input
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    placeholder="Add topic (press Enter)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTopic();
                      }
                    }}
                  />
                  <Button onClick={handleAddTopic}>Add</Button>
                </div>

                {formData.topics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {formData.topics.map((topic) => (
                      <Badge key={topic} variant="secondary" className="flex items-center space-x-1">
                        <Tag className="w-3 h-3" />
                        <span>{topic}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTopic(topic)}
                          className="ml-1 hover:bg-gray-200 rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Stats & Posts Preview */}
          <div className="space-y-6">
            {communityId && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Community Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Members</span>
                      </div>
                      <span className="font-semibold">{formData.memberCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Posts</span>
                      </div>
                      <span className="font-semibold">{posts.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Created</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {formatDate(community?.createdAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Recent Posts</CardTitle>
                      <Button
                        size="sm"
                        onClick={() => setShowPostDialog(true)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {posts.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No posts yet</p>
                        <Button
                          size="sm"
                          className="mt-2"
                          onClick={() => setShowPostDialog(true)}
                        >
                          Create First Post
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {posts.slice(0, 3).map((post) => (
                          <div key={post.id} className="border rounded p-3">
                            {post.title && (
                              <div className="font-medium text-sm text-gray-900 mb-1">
                                {post.title}
                              </div>
                            )}
                            <div className="text-sm text-gray-600 line-clamp-2">
                              {post.content}
                            </div>
                            <div className="text-xs text-gray-400 mt-2">
                              {formatDate(post.createdAt)}
                            </div>
                          </div>
                        ))}
                        {posts.length > 3 && (
                          <p className="text-xs text-gray-500 text-center">
                            +{posts.length - 3} more posts
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>

      {/* New Post Dialog */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
            <DialogDescription>
              Share content with your community members
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="postTitle">Title (optional)</Label>
              <Input
                id="postTitle"
                value={postData.title}
                onChange={(e) => setPostData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter post title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postContent">Content</Label>
              <Textarea
                id="postContent"
                value={postData.content}
                onChange={(e) => setPostData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="What would you like to share?"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Post Type</Label>
              <Select
                value={postData.type}
                onValueChange={(value) => setPostData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="question">Question</SelectItem>
                  <SelectItem value="tip">Tip</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPostDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePost}
              disabled={!postData.content.trim()}
            >
              Create Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}