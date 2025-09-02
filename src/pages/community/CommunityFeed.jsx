import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function CommunityFeed() {
  const { id: communityId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [posting, setPosting] = useState(false);
  const postsUnsubRef = useRef(null);
  
  // New state for comments
  const [comments, setComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentLikesByMe, setCommentLikesByMe] = useState(new Set());
  const [commentsLoading, setCommentsLoading] = useState({});
  const commentsUnsubRef = useRef({});

  // Fetch community data
  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const communityRef = doc(db, 'communities', communityId);
        const communitySnap = await getDoc(communityRef);
        
        if (communitySnap.exists()) {
          setCommunity({
            id: communitySnap.id,
            ...communitySnap.data()
          });
        } else {
          setError('Community not found');
        }
      } catch (err) {
        console.error('Error fetching community:', err);
        setError(`Error loading community: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunity();
  }, [communityId]);

  // Subscribe to posts
  useEffect(() => {
    if (!communityId) return;

    setPostsLoading(true);
    
    const fetchPosts = () => {
      try {
        // Try with orderBy
        const postsQuery = query(
          collection(db, 'community_posts'),
          where('communityId', '==', communityId),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        
        postsUnsubRef.current = onSnapshot(
          postsQuery,
          (snapshot) => {
            const postsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setPosts(postsData);
            setPostsLoading(false);
          },
          (err) => {
            console.error('Error with ordered query:', err);
            
            // Fallback to unordered query if orderBy fails
            try {
              const fallbackQuery = query(
                collection(db, 'community_posts'),
                where('communityId', '==', communityId)
              );
              
              postsUnsubRef.current = onSnapshot(
                fallbackQuery,
                (snapshot) => {
                  const postsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                  }));
                  
                  // Sort manually by createdAt
                  postsData.sort((a, b) => {
                    const aTime = a.createdAt?.seconds || 0;
                    const bTime = b.createdAt?.seconds || 0;
                    return bTime - aTime;
                  });
                  
                  setPosts(postsData);
                  setPostsLoading(false);
                },
                (fallbackErr) => {
                  console.error('Error with fallback query:', fallbackErr);
                  setError(`Error loading posts: ${fallbackErr.message}`);
                  setPostsLoading(false);
                }
              );
            } catch (fallbackErr) {
              console.error('Error setting up fallback query:', fallbackErr);
              setError(`Error loading posts: ${fallbackErr.message}`);
              setPostsLoading(false);
            }
          }
        );
      } catch (err) {
        console.error('Error setting up posts query:', err);
        setError(`Error loading posts: ${err.message}`);
        setPostsLoading(false);
      }
    };

    fetchPosts();

    // Cleanup subscription
    return () => {
      if (postsUnsubRef.current) {
        try {
          postsUnsubRef.current();
        } catch (err) {
          console.error('Error unsubscribing from posts:', err);
        }
      }
      
      // Clean up comment subscriptions
      Object.values(commentsUnsubRef.current).forEach(unsub => {
        if (typeof unsub === 'function') {
          try {
            unsub();
          } catch (err) {
            console.error('Error unsubscribing from comments:', err);
          }
        }
      });
      commentsUnsubRef.current = {};
    };
  }, [communityId]);

  // Subscribe to comments for each post
  useEffect(() => {
    if (!posts.length) return;
    
    const newCommentsLoading = { ...commentsLoading };
    
    // Clean up old subscriptions first
    Object.values(commentsUnsubRef.current).forEach(unsub => {
      if (typeof unsub === 'function') {
        try {
          unsub();
        } catch (err) {
          console.error('Error unsubscribing from comments:', err);
        }
      }
    });
    commentsUnsubRef.current = {};
    
    // Create new subscriptions for each post
    posts.forEach(post => {
      newCommentsLoading[post.id] = true;
      setCommentsLoading(newCommentsLoading);
      
      try {
        const commentsQuery = query(
          collection(db, 'community_comments'),
          where('postId', '==', post.id),
          orderBy('createdAt', 'asc')
        );
        
        commentsUnsubRef.current[post.id] = onSnapshot(
          commentsQuery,
          async (snapshot) => {
            const commentsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            // Update comments state
            setComments(prev => ({
              ...prev,
              [post.id]: commentsData
            }));
            
            // Check for likes by current user
            if (user) {
              const newLikes = new Set(commentLikesByMe);
              
              for (const comment of commentsData) {
                const likeId = `${user.uid}_${comment.id}`;
                const likeRef = doc(db, 'comment_likes', likeId);
                const likeSnap = await getDoc(likeRef);
                
                if (likeSnap.exists()) {
                  newLikes.add(comment.id);
                } else {
                  newLikes.delete(comment.id);
                }
              }
              
              setCommentLikesByMe(newLikes);
            }
            
            // Update loading state
            setCommentsLoading(prev => ({
              ...prev,
              [post.id]: false
            }));
          },
          (err) => {
            console.error(`Error loading comments for post ${post.id}:`, err);
            setCommentsLoading(prev => ({
              ...prev,
              [post.id]: false
            }));
          }
        );
      } catch (err) {
        console.error(`Error setting up comments query for post ${post.id}:`, err);
        setCommentsLoading(prev => ({
          ...prev,
          [post.id]: false
        }));
      }
    });
    
    // Cleanup on unmount or when posts change
    return () => {
      Object.values(commentsUnsubRef.current).forEach(unsub => {
        if (typeof unsub === 'function') {
          try {
            unsub();
          } catch (err) {
            console.error('Error unsubscribing from comments:', err);
          }
        }
      });
      commentsUnsubRef.current = {};
    };
  }, [posts, user]);

  // Create a new post
  const handleCreatePost = async () => {
    if (!user || !newPostContent.trim()) return;
    
    setPosting(true);
    
    try {
      await addDoc(collection(db, 'community_posts'), {
        brandId: community?.brandId || null,
        communityId,
        userId: user.uid,
        userName: user.name || user.displayName || 'Anonymous',
        content: newPostContent.trim(),
        visibility: 'public',
        likeCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      setNewPostContent('');
    } catch (err) {
      console.error('Error creating post:', err);
      alert(`Error creating post: ${err.message}`);
    } finally {
      setPosting(false);
    }
  };

  // Add a comment to a post
  const handleAddComment = async (postId) => {
    if (!user || !commentInputs[postId]?.trim()) return;
    
    try {
      await addDoc(collection(db, 'community_comments'), {
        postId,
        communityId,
        userId: user.uid,
        userName: user.name || user.displayName || 'Anonymous',
        content: commentInputs[postId].trim(),
        likeCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Clear the input
      setCommentInputs(prev => ({
        ...prev,
        [postId]: ''
      }));
    } catch (err) {
      console.error('Error adding comment:', err);
      alert(`Error adding comment: ${err.message}`);
    }
  };

  // Toggle like on a comment
  const toggleCommentLike = async (commentId) => {
    if (!user) return;
    
    const likeId = `${user.uid}_${commentId}`;
    const likeRef = doc(db, 'comment_likes', likeId);
    
    try {
      if (commentLikesByMe.has(commentId)) {
        // Unlike
        await deleteDoc(likeRef);
        setCommentLikesByMe(prev => {
          const newSet = new Set(prev);
          newSet.delete(commentId);
          return newSet;
        });
      } else {
        // Like
        await setDoc(likeRef, {
          commentId,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
        setCommentLikesByMe(prev => {
          const newSet = new Set(prev);
          newSet.add(commentId);
          return newSet;
        });
      }
    } catch (err) {
      console.error('Error toggling comment like:', err);
    }
  };

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      }).format(date);
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Invalid date';
    }
  };

  // Go back to previous page
  const handleGoBack = () => {
    navigate(-1);
  };

  /* ---------- helpers for nav buttons in header ---------- */
  const goToCommunities = () => {
    if (user?.role === 'brand_manager') {
      navigate('/brand?section=communities');
    } else {
      // default staff / unknown
      navigate('/staff?tab=communities');
    }
  };

  const goToProfile = () => {
    if (user?.role === 'brand_manager') {
      navigate('/brand');
    } else if (user?.role === 'staff') {
      navigate('/staff?tab=profile');
    } else {
      navigate('/');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
        <button 
          onClick={handleGoBack}
          className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Community not found
  if (!community) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          <p>Community not found</p>
        </div>
        <button 
          onClick={handleGoBack}
          className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Community Header */}
      <div className="mb-6">
        {/* optional banner image */}
        {community.image && typeof community.image === 'string' && community.image.trim() !== '' && (
          <img
            src={community.image}
            alt={`${community.name} cover`}
            className="w-full h-44 object-cover rounded-lg mb-4"
            onError={(e) => (e.target.style.display = 'none')}
          />
        )}

        <div className="flex items-center justify-between mb-2">
          {/* left: back to communities */}
          <div className="flex items-center">
            <button
              onClick={goToCommunities}
              className="mr-4 text-gray-600 hover:text-gray-800"
            >
              ← Back to Communities
            </button>
            <h1 className="text-2xl font-bold">{community.name}</h1>
          </div>

          {/* right: additional actions */}
          <div className="flex space-x-2">
            <button
              onClick={goToProfile}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Profile
            </button>
            <button
              onClick={goToCommunities}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Other Communities
            </button>
          </div>
        </div>
        <p className="text-gray-600">{community.description}</p>
      </div>

      {/* Post Creation Form */}
      {user && (
        <div className="mb-6 bg-white rounded-lg shadow p-4 border border-gray-200">
          <h2 className="text-lg font-semibold mb-2">Create a Post</h2>
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full p-2 border border-gray-300 rounded mb-2"
            rows={3}
          />
          <div className="flex justify-end">
            <button
              onClick={handleCreatePost}
              disabled={posting || !newPostContent.trim()}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
            >
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">Community Posts</h2>
        
        {postsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-500">No posts yet. Be the first to post!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="mb-2 text-sm text-gray-500">
                {post.userName && <span className="font-medium">{post.userName} · </span>}
                {formatDate(post.createdAt)}
              </div>
              <p className="whitespace-pre-wrap mb-4">{post.content}</p>
              
              {/* Comments section */}
              <div className="mt-4 border-t pt-3">
                <h3 className="text-sm font-medium mb-2">Comments</h3>
                
                {/* Comment list */}
                {commentsLoading[post.id] ? (
                  <div className="py-2 text-center text-sm text-gray-500">
                    Loading comments...
                  </div>
                ) : comments[post.id]?.length > 0 ? (
                  <div className="space-y-3 mb-3">
                    {comments[post.id].map(comment => (
                      <div key={comment.id} className="bg-gray-50 p-3 rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm">
                              <span className="font-medium">{comment.userName || 'Anonymous'}</span>
                              <span className="text-gray-500 text-xs ml-2">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm mt-1">{comment.content}</p>
                          </div>
                          <button
                            onClick={() => toggleCommentLike(comment.id)}
                            className={`text-xs px-2 py-1 rounded ${
                              commentLikesByMe.has(comment.id)
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {commentLikesByMe.has(comment.id) ? 'Liked' : 'Like'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-2 text-sm text-gray-500">
                    No comments yet
                  </div>
                )}
                
                {/* Comment input */}
                {user && (
                  <div className="mt-2 flex">
                    <input
                      type="text"
                      value={commentInputs[post.id] || ''}
                      onChange={(e) => 
                        setCommentInputs(prev => ({
                          ...prev,
                          [post.id]: e.target.value
                        }))
                      }
                      placeholder="Add a comment..."
                      className="flex-1 p-2 text-sm border border-gray-300 rounded-l"
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      disabled={!commentInputs[post.id]?.trim()}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-r hover:bg-gray-300 disabled:opacity-50 text-sm"
                    >
                      Comment
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
