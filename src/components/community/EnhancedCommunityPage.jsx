import React, { useState, useEffect, useRef } from 'react';
import useIsMobile from '../../hooks/useIsMobile.js';
import { getFlag } from '../../lib/featureFlags.js';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { db, storage } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, limit, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

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
import PostCardMobileLinkedIn from './mobile/PostCardMobileLinkedIn.jsx';
import ComposerMobile from './mobile/ComposerMobile.jsx';
import FilterBarMobileCompact from './mobile/FilterBarMobileCompact.jsx';

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
  // Removed unused profile modal state to satisfy lint
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
  // Local state for mobile filter query so FilterBarMobileCompact is controlled
  const [mobileQuery, setMobileQuery] = useState('');

  // Minimal state/handlers to satisfy PostForm props and avoid runtime errors in brand view
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [mediaAttachments, setMediaAttachments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    const mapped = files.map((file, idx) => ({
      id: `${Date.now()}-${idx}`,
      type: file.type.startsWith('video/') ? 'video' : 'image',
      file,
      preview: URL.createObjectURL(file),
      url: null, // Will be set after upload
      uploading: true,
    }));
    
    setMediaAttachments((prev) => [...prev, ...mapped]);
    
    // Upload each file to Firebase Storage
    for (const attachment of mapped) {
      try {
        // Create storage reference with unique path
        const timestamp = Date.now();
        const sanitizedFileName = attachment.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `community-images/${communityId}/${user?.uid || 'anonymous'}/${timestamp}-${sanitizedFileName}`;
        const storageRef = ref(storage, storagePath);
        
        // Start upload
        const uploadTask = uploadBytesResumable(storageRef, attachment.file);
        
        // Track progress
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress((prev) => ({
              ...prev,
              [attachment.id]: Math.round(progress),
            }));
          },
          (error) => {
            console.error('Upload error:', error);
            // Remove failed attachment
            setMediaAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
            setUploadProgress((prev) => {
              const updated = { ...prev };
              delete updated[attachment.id];
              return updated;
            });
          },
          async () => {
            try {
              // Upload completed successfully, get download URL
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              
              // Update attachment with URL and mark as uploaded
              setMediaAttachments((prev) => 
                prev.map((a) => 
                  a.id === attachment.id 
                    ? { ...a, url: downloadURL, uploading: false }
                    : a
                )
              );
              
              setUploadProgress((prev) => ({
                ...prev,
                [attachment.id]: 100,
              }));
            } catch (error) {
              console.error('Failed to get download URL:', error);
              // Remove failed attachment
              setMediaAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
              setUploadProgress((prev) => {
                const updated = { ...prev };
                delete updated[attachment.id];
                return updated;
              });
            }
          }
        );
      } catch (error) {
        console.error('Failed to start upload:', error);
        // Remove failed attachment
        setMediaAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
      }
    }
  };
  const removeAttachment = (id) => {
    setMediaAttachments((prev) => prev.filter((a) => a.id !== id));
  };
  const createPost = async () => {
    if (!newPost.trim() && mediaAttachments.length === 0) return;
    
    // Check if any attachments are still uploading
    const stillUploading = mediaAttachments.some(attachment => attachment.uploading);
    if (stillUploading) {
      alert('Please wait for all images to finish uploading.');
      return;
    }
    
    try {
      // Prepare image URLs from uploaded attachments
      const imageUrls = mediaAttachments
        .filter(attachment => attachment.url) // Only include successfully uploaded images
        .map(attachment => attachment.url);
      
      // Create post data
      const postData = {
        content: newPost.trim(),
        communityId: communityId,
        communityName: community?.name || 'Community',
        createdAt: serverTimestamp(),
        userId: user?.uid || null,
        authorName: user?.displayName || user?.name || user?.email || 'Anonymous',
        authorPhotoURL: user?.profileImage || user?.photoURL || null,
        authorRole: user?.role || 'member',
        visibility: 'public',
        likeCount: 0,
        commentCount: 0,
        ...(imageUrls.length > 0 && { imageUrls }), // Add image URLs if present
        ...(selectedCategory && selectedCategory !== 'all' && { category: selectedCategory }),
      };
      
      // Save to Firestore
      await addDoc(collection(db, 'community_posts'), postData);
      
      // Clear form
      setNewPost('');
      setMediaAttachments([]);
      setUploadProgress({});
      setShowNewPost(false);
      
      console.log('Post created successfully with images:', imageUrls);
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post. Please try again.');
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
              imageUrls: p.imageUrls || [],
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
            imageUrls: p.imageUrls || [],
          }));
          setPosts(mapped);
        });
      } catch (err) {
        void err
        // leave mock posts
      }
    };
    start();
    return () => {
      if (typeof unsub === 'function') {
        try { unsub(); } catch (err) { void err }
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

  // removed unused handleCreatePost to satisfy lint

  // Handle going back to profile
  const handleBackToProfile = () => {
    navigate('/profile');
  };

  // Handle share modal actions
  const handleShare = (method) => {
    alert(`Sharing via ${method}`);
    setShareModalOpen(false);
  };

  // Mobile-only LinkedIn-style skin flag (must run unconditionally per Rules of Hooks)
  const isMobile = useIsMobile();
  const mobileSkin = (getFlag('EN_MOBILE_FEED_SKIN') || '').toString().toLowerCase();
  const useLinkedInMobileSkin = isMobile && mobileSkin === 'linkedin';

  if (!community) {
    return <div className="p-4">Loading community...</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen" data-mobile-skin={useLinkedInMobileSkin ? 'linkedin' : undefined}>
      <CommunityHeader 
        community={community}
        onBackToProfile={handleBackToProfile}
      />
      
      <div className="container mx-auto p-4">
        {/* Search + Composer */}
        {!useLinkedInMobileSkin && (
          <>
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
          </>
        )}
        {useLinkedInMobileSkin && (
          <>
            <FilterBarMobileCompact 
              query={mobileQuery}
              onChange={({ query: q }) => {
                setMobileQuery(q);
                handleSearch(q);
              }} 
            />
            <div className="mt-3 md:hidden">
              <ComposerMobile onStartPost={() => setShowNewPost(true)} />
            </div>
            {showNewPost && (
              <div className="md:hidden mt-3">
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
              </div>
            )}
          </>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main content */}
          <div className="md:col-span-2">
            {!useLinkedInMobileSkin && (
              <PostList posts={posts} onPostAction={handlePostAction} />
            )}
            {useLinkedInMobileSkin && (
              <div className="space-y-3 md:hidden">
                {posts.map((p) => (
                  <PostCardMobileLinkedIn
                    key={p.id}
                    post={p}
                    onLike={() => handlePostAction(p.id, 'like')}
                    onComment={() => {/* no-op placeholder */}}
                    onViewTraining={() => {/* no-op placeholder */}}
                  />
                ))}
              </div>
            )}
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
