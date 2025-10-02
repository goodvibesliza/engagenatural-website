import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';
import { db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  getDocs,
  updateDoc, 
  addDoc, 
  deleteDoc,
  collection, 
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  limit 
} from 'firebase/firestore';
import { brandPostCreate, brandPostPublish, brandPostUpdate, brandPostDelete } from '../../lib/analytics';
import LiveAnnouncer, { useAnnouncements } from '../../components/ui/LiveAnnouncer';
import AccessibleConfirmDialog from '../../components/ui/AccessibleConfirmDialog';
import EditorToolbar from '../../components/brands/EditorToolbar';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
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
  Tag, 
  Globe, 
  Lock, 
  AlertCircle,
  Plus,
  Search,
  Filter,
  Calendar,
  Eye,
  ExternalLink,
  Trash2,
  Edit3,
  Clock,
  Heart,
  MessageSquare,
  BookOpen,
  X,
  Send,
  FileText
} from 'lucide-react';

/**
 * Two-pane Community Editor for brand managers
 * Left: Post list with filters, Right: Post editor
 */
export default function CommunityEditor() {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const textareaRef = useRef();
  const { announcement, announce, clear } = useAnnouncements();

  // Community and posts state
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editor state
  const [selectedPost, setSelectedPost] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [isNewPost, setIsNewPost] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, published, draft
  const [dateFilter, setDateFilter] = useState('all'); // all, 7d, 30d
  const [tagFilter, setTagFilter] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    tags: [],
    attachedTrainingId: '',
    status: 'draft'
  });
  const [newTag, setNewTag] = useState('');
  
  // Autosave state
  const [lastSaved, setLastSaved] = useState(null);
  const autosaveTimeoutRef = useRef();

  // Desktop breakpoint check
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Permission and brand check
  useEffect(() => {
    if (!user) return;
    
    // Check if user has brand_manager role
    if (!user.role || user.role !== 'brand_manager') {
      announce('Access denied. Only brand managers can manage community content.');
      navigate('/brands/communities');
      return;
    }
    
    // Check if user has brandId
    if (!user.brandId) {
      announce('No brand associated with your account. Please contact support.');
      navigate('/brands/communities');
      return;
    }
  }, [user, navigate]);

  // Fetch community data
  useEffect(() => {
    if (!user?.brandId || user.role !== 'brand_manager') return;
    
    const fetchCommunity = async () => {
      if (communityId === 'new') {
        // Check if brand already has a community
        const existingCommunityQuery = query(
          collection(db, 'communities'),
          where('brandId', '==', user?.brandId),
          limit(1)
        );
        
        const snapshot = await getDocs(existingCommunityQuery);
        if (!snapshot.empty) {
          announce('Each brand can have only one community. Redirecting to existing community.');
          const existingCommunity = snapshot.docs[0];
          navigate(`/brands/communities/${existingCommunity.id}`);
          return;
        }
        
        setCommunity({ id: 'new', name: 'New Community', brandId: user?.brandId });
        setLoading(false);
        
        // Track create community access
        if (window.analytics?.track) {
          window.analytics.track('Community Create Started', {
            brand_id: user?.brandId,
            user_id: user?.uid
          });
        }
        return;
      }

      try {
        const docRef = doc(db, 'communities', communityId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const communityData = { id: docSnap.id, ...docSnap.data() };
          setCommunity(communityData);
        } else {
          announce('Community not found');
          navigate('/brands/communities');
        }
      } catch (error) {
        console.error('Error fetching community:', error);
        announce('Failed to load community');
      } finally {
        setLoading(false);
      }
    };

    if (user?.brandId) {
      fetchCommunity();
    }
  }, [communityId, user?.brandId, navigate]);

  // Fetch posts for the community
  useEffect(() => {
    if (!community?.id || community.id === 'new') return;

    const postsQuery = query(
      collection(db, 'posts'),
      where('communityId', '==', community.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        likes: doc.data().likes || [],
        comments: doc.data().comments || []
      }));
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, [community]);

  // Fetch available trainings
  useEffect(() => {
    if (!user?.brandId) return;

    const trainingsQuery = query(
      collection(db, 'trainings'),
      where('brandId', '==', user.brandId),
      orderBy('title', 'asc')
    );

    const unsubscribe = onSnapshot(trainingsQuery, (snapshot) => {
      const trainingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTrainings(trainingsData);
    });

    return () => unsubscribe();
  }, [user?.brandId]);

  // Filter posts based on current filters
  const getFilteredPosts = () => {
    return posts.filter(post => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        if (!post.title?.toLowerCase().includes(searchLower) && 
            !post.body?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && post.status !== statusFilter) {
        return false;
      }

      // Tag filter
      if (tagFilter && !post.tags?.includes(tagFilter)) {
        return false;
      }

      // Date filter
      if (dateFilter !== 'all' && post.createdAt) {
        const daysDiff = (new Date() - post.createdAt) / (1000 * 60 * 60 * 24);
        if (dateFilter === '7d' && daysDiff > 7) return false;
        if (dateFilter === '30d' && daysDiff > 30) return false;
      }

      return true;
    });
  };

  // Handle post selection
  const handlePostSelect = (post) => {
    setSelectedPost(post);
    setEditingPost({ ...post });
    setIsNewPost(false);
    setFormData({
      title: post.title || '',
      body: post.body || '',
      tags: post.tags || [],
      attachedTrainingId: post.attachedTrainingId || '',
      status: post.status || 'draft'
    });
  };

  // Handle new post
  const handleNewPost = () => {
    const newPost = {
      id: 'new',
      title: '',
      body: '',
      tags: [],
      status: 'draft',
      communityId: community.id,
      brandId: user?.brandId,
      authorId: user?.uid,
      authorName: user?.name || 'Brand Manager',
      likes: [],
      comments: []
    };
    
    setSelectedPost(newPost);
    setEditingPost(newPost);
    setIsNewPost(true);
    setFormData({
      title: '',
      body: '',
      tags: [],
      attachedTrainingId: '',
      status: 'draft'
    });
  };

  // Autosave to localStorage every 10 seconds when editing
  useEffect(() => {
    if (selectedPost && (formData.title.trim() || formData.body.trim())) {
      // Clear previous timeout
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }

      // Set new timeout for autosave
      autosaveTimeoutRef.current = setTimeout(() => {
        const autosaveData = {
          ...formData,
          postId: selectedPost.id,
          communityId: community.id,
          timestamp: Date.now()
        };
        
        const key = `autosave_${selectedPost.id}_${user?.uid}`;
        localStorage.setItem(key, JSON.stringify(autosaveData));
        setLastSaved(new Date());
        
        // Announce autosave to screen readers
        announce('Draft automatically saved');
      }, 10000); // 10 seconds
    }

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [formData, selectedPost, community, user, announce]);

  // Restore autosaved data on post selection
  useEffect(() => {
    if (selectedPost && !isNewPost && user?.uid) {
      const key = `autosave_${selectedPost.id}_${user.uid}`;
      const autosavedData = localStorage.getItem(key);
      
      if (autosavedData) {
        try {
          const parsed = JSON.parse(autosavedData);
          const autosaveAge = Date.now() - parsed.timestamp;
          
          // Only restore if autosave is newer than 24 hours and has content
          if (autosaveAge < 24 * 60 * 60 * 1000 && 
              (parsed.title !== selectedPost.title || parsed.body !== selectedPost.body)) {
            
            // Announce restore option to screen readers
            const shouldRestore = confirm('Found an autosaved version of this post. Would you like to restore it?');
            
            if (shouldRestore) {
              setFormData({
                title: parsed.title || '',
                body: parsed.body || '',
                tags: parsed.tags || [],
                attachedTrainingId: parsed.attachedTrainingId || '',
                status: parsed.status || 'draft'
              });
              setLastSaved(new Date(parsed.timestamp));
              announce('Autosaved content restored');
            } else {
              // Clear old autosave if user chooses not to restore
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          console.error('Error parsing autosave data:', error);
          localStorage.removeItem(key);
        }
      }
    }
  }, [selectedPost, isNewPost, user, announce]);

  // Clear autosave when post is successfully saved
  const clearAutosave = () => {
    if (selectedPost && user?.uid) {
      const key = `autosave_${selectedPost.id}_${user.uid}`;
      localStorage.removeItem(key);
      setLastSaved(null);
    }
  };

  // Handle form changes
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (editingPost) {
      setEditingPost(prev => ({ ...prev, [field]: value }));
    }
  };

  // Handle tag management
  const handleAddTag = () => {
    if (!newTag.trim() || formData.tags.includes(newTag.trim())) return;
    
    const updatedTags = [...formData.tags, newTag.trim()];
    handleFormChange('tags', updatedTags);
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove) => {
    const updatedTags = formData.tags.filter(tag => tag !== tagToRemove);
    handleFormChange('tags', updatedTags);
  };

  // Save post (optimistic with rollback on failure)
  const handleSave = async (publishNow = false) => {
    if (!formData.title.trim()) {
      announce('Post title is required');
      return;
    }

    setSaving(true);
    const targetStatus = publishNow ? 'published' : formData.status;
    
    // Optimistic update
    const optimisticPost = {
      ...editingPost,
      ...formData,
      status: targetStatus,
      updatedAt: new Date(),
      ...(publishNow && { publishedAt: new Date() })
    };
    
    if (isNewPost) {
      setPosts(prev => [optimisticPost, ...prev]);
    } else {
      setPosts(prev => prev.map(p => p.id === selectedPost.id ? optimisticPost : p));
    }
    
    setSelectedPost(optimisticPost);
    announce(publishNow ? 'Post published!' : 'Post saved!');

    try {
      if (isNewPost) {
        const postData = {
          ...formData,
          communityId: community.id,
          brandId: user?.brandId,
          authorId: user?.uid,
          authorName: user?.name || 'Brand Manager',
          status: targetStatus,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...(publishNow && { publishedAt: serverTimestamp() }),
          likes: [],
          comments: []
        };

        const docRef = await addDoc(collection(db, 'posts'), postData);
        setIsNewPost(false);
        setSelectedPost(prev => ({ ...prev, id: docRef.id }));
        
        // Track post create and publish if applicable
        brandPostCreate({ communityId: community.id, postId: docRef.id });
        if (publishNow) {
          brandPostPublish({ postId: docRef.id });
        }
      } else {
        const postData = {
          ...formData,
          status: targetStatus,
          updatedAt: serverTimestamp(),
          ...(publishNow && { publishedAt: serverTimestamp() })
        };

        await updateDoc(doc(db, 'posts', selectedPost.id), postData);
        
        // Track post update and publish if applicable
        brandPostUpdate({ postId: selectedPost.id });
        if (publishNow && selectedPost.status !== 'published') {
          brandPostPublish({ postId: selectedPost.id });
        }
      }
    } catch (error) {
      console.error('Error saving post:', error);
      
      // Rollback optimistic update
      if (isNewPost) {
        setPosts(prev => prev.filter(p => p.id !== 'new'));
        setSelectedPost(null);
        setEditingPost(null);
      } else {
        setPosts(posts); // Reset to original state
        setSelectedPost(selectedPost);
      }
      
      toast.error('Failed to save post. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Delete post
  const handleDelete = async (post) => {
    try {
      await deleteDoc(doc(db, 'posts', post.id));
      setPosts(prev => prev.filter(p => p.id !== post.id));
      
      if (selectedPost?.id === post.id) {
        setSelectedPost(null);
        setEditingPost(null);
        setFormData({
          title: '',
          body: '',
          tags: [],
          attachedTrainingId: '',
          status: 'draft'
        });
      }
      
      // Announce to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.textContent = `Post "${post.title}" has been deleted. Focus returned to post list.`;
      announcement.style.position = 'absolute';
      announcement.style.left = '-10000px';
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
      
      toast.success('Post deleted');
      setDeleteConfirmOpen(false);
      setPostToDelete(null);
      
      // Track post delete
      brandPostDelete({ postId: post.id });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  // Preview post as staff
  const handlePreviewAsStaff = (post) => {
    if (post.status !== 'published') {
      toast.error('Only published posts can be previewed');
      return;
    }
    
    // Open staff post detail view in new tab
    window.open(`/post/${post.id}`, '_blank');
    
    trackEvent('post_preview_as_staff', {
      post_id: post.id,
      community_id: community.id,
      brand_id: user?.brandId
    });
  };

  // Get all unique tags from posts
  const getAllTags = () => {
    const allTags = posts.flatMap(post => post.tags || []);
    return [...new Set(allTags)].sort();
  };

  // Mobile blocking banner
  if (!isDesktop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto text-center border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <Edit3 className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle className="text-orange-800">Desktop Required</CardTitle>
            <CardDescription className="text-orange-600">
              Community editor requires desktop (1024px or wider) for the two-pane layout.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  const filteredPosts = getFilteredPosts();

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <LiveAnnouncer message={announcement} onClear={clear} />
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/brands/communities')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Communities
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{community.name}</h1>
            <p className="text-sm text-gray-600">Community Post Editor</p>
          </div>
        </div>
        <Button
          onClick={handleNewPost}
          className="bg-brand-primary hover:bg-brand-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Two-pane layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane - Post List */}
        <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
          {/* Filters */}
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex space-x-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Tags</SelectItem>
                  {getAllTags().map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Post List */}
          <div className="flex-1 overflow-y-auto">
            {filteredPosts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No posts found</p>
                <p className="text-sm">Create your first post to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => handlePostSelect(post)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedPost?.id === post.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {post.title || 'Untitled Post'}
                          </h3>
                          <Badge 
                            variant={post.status === 'published' ? 'default' : 'secondary'}
                            className={post.status === 'published' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {post.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {post.body || 'No content yet...'}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Heart className="w-3 h-3 mr-1" />
                              {post.likes?.length || 0}
                            </span>
                            <span className="flex items-center">
                              <MessageSquare className="w-3 h-3 mr-1" />
                              {post.comments?.length || 0}
                            </span>
                            {post.attachedTrainingId && (
                              <span className="flex items-center">
                                <BookOpen className="w-3 h-3 mr-1" />
                                Training
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {post.updatedAt?.toLocaleDateString()}
                          </span>
                        </div>
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {post.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {post.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{post.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane - Editor */}
        <div className="w-1/2 bg-white flex flex-col">
          {selectedPost ? (
            <>
              {/* Editor Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-medium">
                      {isNewPost ? 'New Post' : 'Edit Post'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Shows to followers of <strong>{community.brandName || user?.brandName}</strong> in staff 'My Brands'
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedPost.status === 'published' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreviewAsStaff(selectedPost)}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Preview as Staff
                      </Button>
                    )}
                    {!isNewPost && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPostToDelete(selectedPost);
                          setDeleteConfirmOpen(true);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Editor Form */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Title */}
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    placeholder="Enter post title..."
                    className="mt-1"
                  />
                </div>

                {/* Body with toolbar */}
                <div>
                  <Label>Content</Label>
                  <div className="mt-1">
                    <EditorToolbar
                      textareaRef={textareaRef}
                      disabled={saving}
                    />
                    <Textarea
                      ref={textareaRef}
                      value={formData.body}
                      onChange={(e) => handleFormChange('body', e.target.value)}
                      placeholder="Write your post content..."
                      className="min-h-[200px] rounded-t-none border-t-0"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <Label>Tags</Label>
                  <div className="mt-1 space-y-2">
                    <div className="flex space-x-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add a tag..."
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleAddTag}
                        disabled={!newTag.trim()}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="flex items-center">
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Attach Training */}
                <div>
                  <Label>Attach Training (Optional)</Label>
                  <Select
                    value={formData.attachedTrainingId}
                    onValueChange={(value) => handleFormChange('attachedTrainingId', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a training to attach..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No training</SelectItem>
                      {trainings.map(training => (
                        <SelectItem key={training.id} value={training.id}>
                          {training.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status and metrics */}
                {!isNewPost && (
                  <div className="p-3 bg-gray-50 rounded-md space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Post Metrics</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center">
                        <Heart className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{selectedPost.likes?.length || 0} likes</span>
                      </div>
                      <div className="flex items-center">
                        <MessageSquare className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{selectedPost.comments?.length || 0} comments</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Editor Actions */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <Badge 
                    variant={formData.status === 'published' ? 'default' : 'secondary'}
                    className={formData.status === 'published' ? 'bg-green-100 text-green-800' : ''}
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {formData.status === 'published' ? 'Published' : 'Draft'}
                  </Badge>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleSave(false)}
                      disabled={saving || !formData.title.trim()}
                      variant="ghost"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Draft'}
                    </Button>
                    
                    <Button
                      onClick={() => handleSave(true)}
                      disabled={saving || !formData.title.trim()}
                      className="bg-brand-primary hover:bg-brand-primary/90"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {formData.status === 'published' ? 'Update' : 'Publish'}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Edit3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Select a post to edit or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog with Keyboard Trap */}
      <AccessibleConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => handleDelete(postToDelete)}
        title="Delete Post"
        description={`Are you sure you want to delete "${postToDelete?.title}"? This action cannot be undone and will remove the post from your community feed.`}
        confirmText="Delete Post"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}