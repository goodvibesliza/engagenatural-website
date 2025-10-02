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
import { brandPostCreate, brandPostPublish, brandPostUpdate, brandPostDelete, brandPostAttachTraining, brandTrainingPreview, brandTrainingFilterToggle } from '../../lib/analytics';
import LiveAnnouncer, { useAnnouncements } from '../../components/ui/LiveAnnouncer';
import { toast } from 'sonner';
import AccessibleConfirmDialog from '../../components/ui/AccessibleConfirmDialog';
import TrainingSelect from '../../components/brands/TrainingSelectFixed';
import PostListItem from '../../components/brands/PostListItem';
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
  const [trainingFilterEnabled, setTrainingFilterEnabled] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState(null);

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
      // Training filter (highest priority)
      if (trainingFilterEnabled && selectedTraining) {
        if (post.attachedTrainingId !== selectedTraining.id) {
          return false;
        }
      }

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
      attachedTrainingId: selectedTraining?.id || '', // Prefill if training is selected
      status: 'draft'
    });
  };

  // Handle training selection
  const handleTrainingSelect = (training) => {
    setSelectedTraining(training);
    handleFormChange('attachedTrainingId', training.id);
    // Track training attachment
    if (selectedPost?.id) {
      brandPostAttachTraining({ 
        postId: selectedPost.id, 
        trainingId: training.id 
      });
    }
  };

  // Handle training clear
  const handleTrainingClear = () => {
    setSelectedTraining(null);
    handleFormChange('attachedTrainingId', '');
    // Disable filter when training is cleared
    if (trainingFilterEnabled) {
      setTrainingFilterEnabled(false);
      announce('Training filter disabled - training cleared');
    }
  };

  // Handle training filter toggle
  const handleTrainingFilterToggle = (enabled) => {
    setTrainingFilterEnabled(enabled);
    
    if (enabled && selectedTraining) {
      const filteredCount = posts.filter(post => 
        post.attachedTrainingId === selectedTraining.id
      ).length;
      
      announce(`Filtered to posts linked to: ${selectedTraining.title}. ${filteredCount} results.`);
      
      // Track filter toggle
      brandTrainingFilterToggle({
        trainingId: selectedTraining.id,
        enabled: true,
        postCount: filteredCount
      });
    } else {
      announce('Training filter disabled - showing all posts');
      
      if (selectedTraining) {
        brandTrainingFilterToggle({
          trainingId: selectedTraining.id,
          enabled: false,
          postCount: posts.length
        });
      }
    }
  };

  // Handle post update from inline actions (optimistic updates)
  const handlePostUpdate = async (updatedPost) => {
    try {
      // Update local state immediately (optimistic)
      setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
      
      // Update selected post if it's the same one
      if (selectedPost?.id === updatedPost.id) {
        setSelectedPost(updatedPost);
        setEditingPost(updatedPost);
        setFormData({
          title: updatedPost.title || '',
          body: updatedPost.body || '',
          tags: updatedPost.tags || [],
          attachedTrainingId: updatedPost.attachedTrainingId || '',
          status: updatedPost.status || 'draft'
        });
      }
      
      // Update training filter visibility if needed
      if (trainingFilterEnabled && selectedTraining) {
        // Compute current filtered count using same logic as getFilteredPosts
        const currentFilteredCount = posts.filter(post => {
          // Training filter (highest priority)
          if (trainingFilterEnabled && selectedTraining) {
            if (post.attachedTrainingId !== selectedTraining.id) {
              return false;
            }
          }

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
        }).length;

        // Compute after filter count including the updated post
        const postsWithUpdate = posts.map(p => p.id === updatedPost.id ? updatedPost : p);
        const afterFilterCount = postsWithUpdate.filter(post => {
          // Training filter (highest priority)
          if (trainingFilterEnabled && selectedTraining) {
            if (post.attachedTrainingId !== selectedTraining.id) {
              return false;
            }
          }

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
        }).length;
        
        if (afterFilterCount !== currentFilteredCount) {
          announce(`Training filter updated. ${afterFilterCount} posts linked to ${selectedTraining.title}.`);
        }
      }

      // Save to Firestore
      const postData = {
        title: updatedPost.title,
        body: updatedPost.body,
        tags: updatedPost.tags || [],
        attachedTrainingId: updatedPost.attachedTrainingId || '',
        status: updatedPost.status,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'posts', updatedPost.id), postData);
      
      // Track analytics (handled by PostListItem component)
      
    } catch (error) {
      console.error('Failed to update post:', error);
      
      // Revert optimistic update on failure
      setPosts(posts); // Reset to original state
      
      // Revert form data if selected post was affected
      if (selectedPost?.id === updatedPost.id) {
        const originalPost = posts.find(p => p.id === updatedPost.id);
        if (originalPost) {
          setSelectedPost(originalPost);
          setEditingPost(originalPost);
          setFormData({
            title: originalPost.title || '',
            body: originalPost.body || '',
            tags: originalPost.tags || [],
            attachedTrainingId: originalPost.attachedTrainingId || '',
            status: originalPost.status || 'draft'
          });
        }
      }
      
      announce('Failed to update post. Please try again.', 'assertive');
      throw error; // Re-throw for PostListItem error handling
    }
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
        
        // Update optimistic post in posts array with real Firestore ID
        const updatedPost = { ...selectedPost, id: docRef.id };
        setPosts(prev => prev.map(p => p.id === 'new' ? updatedPost : p));
        
        // Update both selected and editing post with real ID  
        setSelectedPost(updatedPost);
        setEditingPost(updatedPost);
        setIsNewPost(false);
        
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
    
    // Track post preview analytics - already handled by brandPostUpdate when needed
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
              <div className="p-8 text-center text-gray-500" data-testid={trainingFilterEnabled && selectedTraining ? "post-list-empty-training" : "post-list-empty"}>
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                {trainingFilterEnabled && selectedTraining ? (
                  <>
                    <p className="text-base font-medium mb-2">No posts linked to this training yet.</p>
                    <p className="text-sm mb-4">Create one to highlight the training in staff feeds.</p>
                    <Button
                      onClick={handleNewPost}
                      className="bg-brand-primary hover:bg-brand-primary/90"
                      data-testid="create-post-from-empty-training"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create post
                    </Button>
                  </>
                ) : (
                  <>
                    <p>No posts found</p>
                    <p className="text-sm">Create your first post to get started</p>
                  </>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200" data-testid="post-list">
                {filteredPosts.map((post) => (
                  <PostListItem
                    key={post.id}
                    post={post}
                    isSelected={selectedPost?.id === post.id}
                    onSelect={() => handlePostSelect(post)}
                    onUpdatePost={handlePostUpdate}
                    trainings={trainings}
                    brandId={user?.brandId}
                  />
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
                        data-testid="editor-preview-as-staff"
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
                        data-testid="editor-delete"
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
                    data-testid="editor-title-input"
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
                      data-testid="editor-body-input"
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
                        data-testid="editor-tags-input"
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
                  <div className="mt-1">
                    <TrainingSelect
                      value={formData.attachedTrainingId}
                      brandId={user?.brandId}
                      onSelect={handleTrainingSelect}
                      onClear={handleTrainingClear}
                    />
                    
                    {/* Training Filter Checkbox */}
                    {selectedTraining && (
                      <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={trainingFilterEnabled}
                            onChange={(e) => handleTrainingFilterToggle(e.target.checked)}
                            disabled={!selectedTraining}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded focus:ring-2"
                            data-testid="training-filter-checkbox"
                            aria-describedby="training-filter-description"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-700">
                              Show posts linked to this training
                            </span>
                            <p id="training-filter-description" className="text-xs text-gray-500 mt-1">
                              Filter the post list to show only posts attached to "{selectedTraining.title}"
                            </p>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
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
                      data-testid="editor-save-draft"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Draft'}
                    </Button>
                    
                    <Button
                      onClick={() => handleSave(true)}
                      disabled={saving || !formData.title.trim()}
                      className="bg-brand-primary hover:bg-brand-primary/90"
                      data-testid="editor-publish"
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