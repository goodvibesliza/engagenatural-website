import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';

// Import simplified components
import CommunityHeader from './components/CommunityHeader.jsx';
import CommunityGuidelines from './components/CommunityGuidelines.jsx';
import PostList from './components/PostList.jsx';
import VerificationPrompt from './components/VerificationPrompt.jsx';
import ShareModal from './components/ShareModal.jsx';
import CommunitySearch from './components/CommunitySearch.jsx';
import PostForm from './components/PostForm.jsx';
import ProfileModal from './components/ProfileModal.jsx';
import { postCategories } from './utils/CommunityUtils.js';

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
  const { user } = useAuth ? useAuth() : { user: null };
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
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const mapped = files.map((file, idx) => ({
      id: `${Date.now()}-${idx}`,
      type: file.type.startsWith('video/') ? 'video' : 'image',
      file,
      preview: URL.createObjectURL(file),
    }));
    setMediaAttachments((prev) => [...prev, ...mapped]);
    // Simulate progress to 100%
    const next = { ...uploadProgress };
    mapped.forEach((m) => (next[m.id] = 100));
    setUploadProgress(next);
  };
  const removeAttachment = (id) => {
    setMediaAttachments((prev) => prev.filter((a) => a.id !== id));
  };
  const createPost = () => {
    if (!newPost.trim()) return;
    handleCreatePost(newPost.trim());
    setNewPost('');
    setMediaAttachments([]);
    setShowNewPost(false);
  };
  const getProfileImageDisplay = () => null;
  
  // Load community data based on ID (placeholder mapping for now)
  useEffect(() => {
    const communityData = mockCommunities[communityId] || {
      id: communityId,
      name: communityId?.replace(/[-_]/g, ' ') || 'Community',
      description: 'Community feed',
      members: 0,
      rules: [],
    };
    setCommunity(communityData);
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
      <CommunityHeader 
        community={community}
        onBackToProfile={handleBackToProfile}
      />
      
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
