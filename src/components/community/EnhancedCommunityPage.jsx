import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Import simplified components
import CommunityHeader from './components/CommunityHeader.jsx';
import CommunityGuidelines from './components/CommunityGuidelines.jsx';
import PostList from './components/PoslList.jsx';
import VerificationPrompt from './components/VerificationPrompt.jsx';
import ShareModal from './components/ShareModal.jsx';
import CommunitySearch from './components/CommunitySearch.jsx';
import PostForm from './components/PostForm.jsx';
import ProfileModal from './components/ProfileModal.jsx';

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
  const [posts, setPosts] = useState(mockPosts);
  const [community, setCommunity] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [viewedUser, setViewedUser] = useState(null);
  
  // Load community data based on ID
  useEffect(() => {
    // In a real app, this would be a database call
    const communityData = mockCommunities[communityId];
    if (communityData) {
      setCommunity(communityData);
    } else {
      // Redirect if community not found
      navigate('/communities');
    }
  }, [communityId, navigate]);

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
        <CommunitySearch onSearch={handleSearch} />
        <PostForm onSubmit={handleCreatePost} />
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
