import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { db, storage } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, limit, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';

// Import simplified components
import PublicHeader from '../layout/PublicHeader.jsx';
import CommunityGuidelines from './components/CommunityGuidelines.jsx';
import PostList from './components/PostList.jsx';
import VerificationPrompt from './components/VerificationPrompt.jsx';
import ShareModal from './components/ShareModal.jsx';
import CommunitySearch from './components/CommunitySearch.jsx';
import PostForm from './components/PostForm.jsx';
import ProfileModal from './components/ProfileModal.jsx';
import { postCategories } from './utils/CommunityUtils.js';

// File upload configuration
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

// Placeholder data
const mockCommunities = {
  'whats-good': {
    id: 'whats-good',
    name: "What's Good Community",
    description: "Share what's working for you and discover new natural products",
    members: 1250,
    rules: [
      "Be respectful and supportive",
      "No promotion without disclosure",
      "Share evidence when making claims",
      "Keep discussions focused on natural wellness"
    ]
  },
  'daily-stack': {
    id: 'daily-stack',
    name: "Daily Stack",
    description: "Share your daily supplement routines and get feedback",
    members: 870,
    rules: [
      "Include details on dosage and timing",
      "No medical advice",
      "Respect different approaches",
      "Use appropriate categories for posts"
    ]
  }
};

const mockPosts = [
  {
    id: 'post-1',
    author: "Jane Smith",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    content: "Just started taking magnesium glycinate for sleep and it's working amazingly well!",
    reactions: { like: 24 },
    comments: [{ id: 'comment-1', content: 'That\'s great!' }]
  },
  {
    id: 'post-2',
    author: "John Doe",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    content: "Has anyone tried the new probiotic from NaturalLife? Looking for reviews before I purchase.",
    reactions: { like: 5 },
    comments: []
  }
];

const EnhancedCommunityPage = () => {
  const { communityId } = useParams();
  const navigate = useNavigate();
  // Call useAuth unconditionally per React Hooks rules
  const { user } = useAuth();
  const [posts, setPosts] = useState(mockPosts);
  const [community, setCommunity] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [viewedUser, setViewedUser] = useState(null);
  // Local state to support CommunitySearch props when used in brand view
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeSort, setActiveSort] = useState('newest');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    dateRange: 'all',
    hasMedia: false,
    verifiedOnly: false,
    expertContent: false,
    minLikes: 0,
    minComments: 0,
  });
  const getCategoryInfo = (id) =>
    postCategories.find((c) => c.id === id) || { id, name: 'All', icon: '' };

  // Minimal state/handlers to satisfy PostForm props and avoid runtime errors in brand view
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [mediaAttachments, setMediaAttachments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);
  
  // Track active upload tasks for cleanup on unmount
  const uploadTasksRef = useRef([]);

  // Cleanup function to revoke blob URLs
  const revokePreviewUrls = (attachments) => {
    attachments.forEach(attachment => {
      if (attachment.preview) {
        try {
          URL.revokeObjectURL(attachment.preview);
        } catch (error) {
          console.error('Error revoking blob URL:', error);
        }
      }
    });
  };

  // Enhanced file select with validation
  const handleFileSelect = (e) => {
    const fileList = e.target.files || [];
    if (fileList.length === 0) return;

    // Validate user is authenticated
    if (!user || !user.uid) {
      toast.error('Please log in to upload files');
      return;
    }

    const validFiles = [];
    const rejectedFiles = [];

    // Validate each file
    Array.from(fileList).forEach((file) => {
      // Check MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        rejectedFiles.push({ file, reason: 'Invalid file type' });
        return;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE_BYTES) {
        rejectedFiles.push({ file, reason: 'File too large (max 10MB)' });
        return;
      }

      validFiles.push(file);
    });

    // Show feedback for rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, reason }) => {
        toast.error(`${file.name}: ${reason}`);
      });
    }

    // Process valid files
    if (validFiles.length > 0) {
      const mapped = validFiles.map((file, idx) => ({
        id: `${Date.now()}-${idx}`,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        file,
        preview: URL.createObjectURL(file),
      }));

      setMediaAttachments((prev) => [...prev, ...mapped]);

      // Start uploads for each valid file
      mapped.forEach((attachment) => {
        uploadFile(attachment);
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload file to Firebase Storage
  const uploadFile = async (attachment) => {
    if (!user || !user.uid) {
      toast.error('Authentication required to upload files');
      removeAttachment(attachment.id);
      return;
    }

    try {
      // Use authenticated user's UID in storage path
      const storagePath = `users/${user.uid}/community/${communityId}/${Date.now()}-${attachment.file.name}`;
      const storageRef = ref(storage, storagePath);
      
      const uploadTask = uploadBytesResumable(storageRef, attachment.file);
      
      // Track this upload task
      uploadTasksRef.current.push(uploadTask);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress((prev) => ({
            ...prev,
            [attachment.id]: progress,
          }));
        },
        (error) => {
          console.error('Upload failed:', error);
          toast.error(`Failed to upload ${attachment.file.name}. Please check your connection and try again.`);
          
          // Cleanup
          removeUploadTask(uploadTask);
          removeAttachment(attachment.id);
          setUploadProgress((prev) => {
            const next = { ...prev };
            delete next[attachment.id];
            return next;
          });
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Update attachment with download URL
            setMediaAttachments((prev) =>
              prev.map((a) =>
                a.id === attachment.id ? { ...a, url: downloadURL } : a
              )
            );

            // Revoke the preview blob URL after successful upload
            if (attachment.preview) {
              URL.revokeObjectURL(attachment.preview);
            }

            // Remove from active tasks
            removeUploadTask(uploadTask);
            
            toast.success(`${attachment.file.name} uploaded successfully`);
          } catch (error) {
            console.error('Failed to get download URL:', error);
            toast.error(`Failed to complete upload for ${attachment.file.name}. Please try again.`);
            
            // Cleanup
            removeUploadTask(uploadTask);
            if (attachment.preview) {
              URL.revokeObjectURL(attachment.preview);
            }
            removeAttachment(attachment.id);
            setUploadProgress((prev) => {
              const next = { ...prev };
              delete next[attachment.id];
              return next;
            });
          }
        }
      );
    } catch (error) {
      console.error('Upload initialization failed:', error);
      toast.error(`Failed to start upload for ${attachment.file.name}. Please try again.`);
      
      if (attachment.preview) {
        URL.revokeObjectURL(attachment.preview);
      }
      removeAttachment(attachment.id);
    }
  };

  // Remove upload task from tracking ref
  const removeUploadTask = (task) => {
    uploadTasksRef.current = uploadTasksRef.current.filter((t) => t !== task);
  };

  // Remove attachment and revoke its preview URL
  const removeAttachment = (id) => {
    setMediaAttachments((prev) => {
      const attachment = prev.find((a) => a.id === id);
      if (attachment && attachment.preview) {
        URL.revokeObjectURL(attachment.preview);
      }
      return prev.filter((a) => a.id !== id);
    });
  };

  // Cleanup on unmount: cancel uploads and revoke URLs
  useEffect(() => {
    return () => {
      // Cancel all active uploads
      uploadTasksRef.current.forEach((task) => {
        try {
          task.cancel();
        } catch (error) {
          console.error('Error cancelling upload task:', error);
        }
      });
      uploadTasksRef.current = [];

      // Revoke all preview URLs
      revokePreviewUrls(mediaAttachments);
    };
  }, [mediaAttachments]);

  const createPost = () => {
    if (!newPost.trim()) return;
    handleCreatePost(newPost.trim());
    setNewPost('');
    
    // Revoke URLs before clearing attachments
    revokePreviewUrls(mediaAttachments);
    setMediaAttachments([]);
    setUploadProgress({});
    setShowNewPost(false);
    
    // Reset file input to allow re-selecting the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getProfileImageDisplay = () => null;
  
  // Load community data by ID from Firestore; fall back to simple mapping when missing
  useEffect(() => {
    let isActive = true;
    const load = async () => {
      if (!communityId) return;
      try {
        const ref = doc(db, 'communities', communityId);
        const snap = await getDoc(ref);
        if (isActive && snap.exists()) {
          const data = snap.data();
          setCommunity({
            id: snap.id,
            name: data.name || communityId?.replace(/[-_]/g, ' ') || 'Community',
            description: data.description || 'Community feed',
            members: data.members ?? data.memberCount ?? 0,
            rules: Array.isArray(data.rules) ? data.rules : [],
            ...data,
          });
          return;
        }
      } catch (e) {
        // non-fatal; fall back below
        // eslint-disable-next-line no-console
        console.warn('Failed to load community doc, using fallback name.', e?.message);
      }
      // Fallback: mock map or simple name from id
      if (!isActive) return;
      const communityData = mockCommunities[communityId] || {
        id: communityId,
        name: communityId?.replace(/[-_]/g, ' ') || 'Community',
        description: 'Community feed',
        members: 0,
        rules: [],
      };
      setCommunity(communityData);
    };
    load();
    return () => { isActive = false; };
  }, [communityId]);

  // Real-time Firestore posts feed for this community (public visibility)
  useEffect(() => {
    if (!communityId) return;
    let unsub = null;
    const start = () => {
      try {
        const q = query(
          collection(db, 'community_posts'),
          where('communityId', '==', communityId),
          where('visibility', '==', 'public'),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        unsub = onSnapshot(
          q,
          (snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            // Map to PostList shape
            const mapped = list.map((p) => ({
              id: p.id,
              author: p.userName || p.authorName || 'User',
              timestamp: p.createdAt?.toDate?.() || new Date(),
              content: p.content || p.title || '',
              reactions: { like: p.likeCount || 0 },
              comments: new Array(p.commentCount || 0).fill(0).map((_, i) => ({ id: `${p.id}-c${i}` })),
            }));
            setPosts(mapped);
          },
          () => {
            // fallback below
            fallback();
          }
        );
      } catch {
        fallback();
      }
    };
    const fallback = () => {
      try {
        const q2 = query(
          collection(db, 'community_posts'),
          where('communityId', '==', communityId),
          where('visibility', '==', 'public')
        );
        unsub = onSnapshot(q2, (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          const mapped = list.map((p) => ({
            id: p.id,
            author: p.userName || p.authorName || 'User',
            timestamp: p.createdAt?.toDate?.() || new Date(),
            content: p.content || p.title || '',
            reactions: { like: p.likeCount || 0 },
            comments: new Array(p.commentCount || 0).fill(0).map((_, i) => ({ id: `${p.id}-c${i}` })),
          }));
          setPosts(mapped);
        });
      } catch {
        // leave mock posts
      }
    };
    start();
    return () => {
      if (typeof unsub === 'function') {
        try { unsub(); } catch {}
      }
    };
  }, [communityId]);

  // Handle post interactions
  const handlePostAction = (postId, action) => {
    if (action === 'like') {
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            reactions: {
              ...post.reactions,
              like: (post.reactions?.like || 0) + 1
            }
          };
        }
        return post;
      }));
    } else if (action === 'share') {
      const post = posts.find(p => p.id === postId);
      setSelectedPost(post);
      setShareModalOpen(true);
    }
  };

  // Simple search handler (placeholder)
  const handleSearch = (term) => {
    /* Placeholder: in real app filter posts here */
    console.log('Searching for:', term);
  };

  // Create a new post handler
  const handleCreatePost = (content) => {
    const newPost = {
      id: `post-${Date.now()}`,
      author: 'Current User',
      timestamp: new Date(),
      content,
      reactions: { like: 0 },
      comments: []
    };
    setPosts(prev => [newPost, ...prev]);
  };

  // Handle going back to profile
  const handleBackToProfile = () => {
    navigate('/profile');
  };

  // Handle share modal actions
  const handleShare = (method) => {
    alert(`Sharing via ${method}`);
    setShareModalOpen(false);
  };

  if (!community) {
    return <div className="p-4">Loading community...</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <PublicHeader />
      
      {/* Community info section below header */}
      <div className="bg-white border-b border-gray-200 pt-20">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">{community.name}</h1>
          <p className="text-gray-600 mt-2">{community.description}</p>
          {community.members > 0 && (
            <p className="text-sm text-gray-500 mt-2">{community.members.toLocaleString()} members</p>
          )}
        </div>
      </div>
      
      <div className="container mx-auto p-4">
        {/* Search bar and new post form */}
        <CommunitySearch
          onSearch={handleSearch}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          activeSort={activeSort}
          setActiveSort={setActiveSort}
          showAdvancedSearch={showAdvancedSearch}
          setShowAdvancedSearch={setShowAdvancedSearch}
          advancedFilters={advancedFilters}
          setAdvancedFilters={setAdvancedFilters}
          categories={postCategories.map((c) => c.id)}
          getCategoryInfo={getCategoryInfo}
        />
        <PostForm
          user={user}
          community={community}
          showNewPost={showNewPost}
          setShowNewPost={setShowNewPost}
          newPost={newPost}
          setNewPost={setNewPost}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          mediaAttachments={mediaAttachments}
          setMediaAttachments={setMediaAttachments}
          uploadProgress={uploadProgress}
          fileInputRef={fileInputRef}
          handleFileSelect={handleFileSelect}
          removeAttachment={removeAttachment}
          createPost={createPost}
          loading={false}
          getProfileImageDisplay={getProfileImageDisplay}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main content */}
          <div className="md:col-span-2">
            <PostList posts={posts} onPostAction={handlePostAction} />
          </div>
          
          {/* Sidebar */}
          <div>
            <div className="mb-4">
              <CommunityGuidelines community={community} />
            </div>
            <div>
              <VerificationPrompt navigate={navigate} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      {shareModalOpen && selectedPost && (
        <ShareModal 
          post={selectedPost} 
          onClose={() => setShareModalOpen(false)}
          onShare={handleShare}
        />
      )}
    </div>
  );
};

export default EnhancedCommunityPage;
