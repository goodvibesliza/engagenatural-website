import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/auth-context';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  doc,
  getDoc,
  deleteDoc,
  setDoc,
  startAfter,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';

// Post card component
const PostCard = ({ post, user, onLikeToggle, isLiked, isPendingLike, comments }) => {
  const isStaff = user?.role === 'staff';
  const formattedDate = post.createdAt?.toDate ? 
    new Date(post.createdAt.toDate()).toLocaleString() : 
    'Recently';
  
  // Truncate post body
  const truncateText = (text, maxLength = 150) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow-sm hover:shadow transition-shadow">
      <div className="flex justify-between items-start">
        <h3 className="font-medium text-lg text-gray-900">{post.title || 'Untitled Post'}</h3>
        <div className="text-xs text-gray-500 flex items-center">
          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded mr-2">
            {post.authorRole || 'user'}
          </span>
          <span>{formattedDate}</span>
        </div>
      </div>
      
      <p className="text-gray-700 my-3">{truncateText(post.body)}</p>
      
      <div className="flex justify-between items-center mt-4">
        <div className="flex space-x-4">
          <button 
            onClick={() => isStaff && onLikeToggle(post.id)}
            disabled={isPendingLike || !isStaff}
            className={`flex items-center space-x-1 ${
              isStaff ? 'hover:text-brand-primary' : ''
            } ${isLiked ? 'text-brand-primary' : 'text-gray-500'}`}
          >
            <span role="img" aria-label="like">
              {isLiked ? '♥️' : '♡'}
            </span>
            <span>{post.likesCount || 0}</span>
          </button>
          
          <div className="flex items-center space-x-1 text-gray-500">
            <span role="img" aria-label="comments">💬</span>
            <span>{post.commentsCount || 0}</span>
          </div>
        </div>
        
        <Link 
          to={`/community/${post.id}`}
          className="text-sm px-3 py-1 bg-brand-primary text-white rounded hover:bg-brand-primary/90"
        >
          View thread
        </Link>
      </div>
      
      {/* Comments preview */}
      {comments && comments.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Recent comments:</p>
          <div className="space-y-2">
            {comments.map(comment => (
              <div key={comment.id} className="bg-gray-50 rounded p-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{comment.authorRole || 'user'}</span>
                  <span>
                    {comment.createdAt?.toDate ? 
                      new Date(comment.createdAt.toDate()).toLocaleString() : 
                      'Recently'}
                  </span>
                </div>
                <p className="text-sm">{truncateText(comment.text, 100)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Loading skeleton
const PostSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow-sm animate-pulse">
    <div className="flex justify-between items-start">
      <div className="h-6 bg-gray-200 rounded w-3/5 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/5"></div>
    </div>
    <div className="space-y-2 my-3">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
    <div className="flex justify-between items-center mt-4">
      <div className="flex space-x-4">
        <div className="h-5 bg-gray-200 rounded w-12"></div>
        <div className="h-5 bg-gray-200 rounded w-12"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-24"></div>
    </div>
  </div>
);

export default function CommunitiesPage() {
  const { user } = useAuth();
  const useEmulator = import.meta.env.VITE_USE_EMULATOR === 'true';
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [pendingLikes, setPendingLikes] = useState(new Set());
  const [commentsMap, setCommentsMap] = useState({});
  
  // Ref to store the last document for pagination
  const lastVisibleRef = useRef(null);
  // Ref to store unsubscribe function
  const unsubscribeRef = useRef(null);
  
  // Load initial posts with live updates
  useEffect(() => {
    const postsQuery = query(
      collection(db, 'community_posts'),
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    
    setLoading(true);
    
    if (useEmulator) {
      (async () => {
        try {
          const snapshot = await getDocs(postsQuery);
          const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          if (snapshot.docs.length > 0) {
            lastVisibleRef.current = snapshot.docs[snapshot.docs.length - 1];
          }
          setPosts(postsData);
          // Load comments for each post
          postsData.forEach(post => { loadComments(post.id); });
        } finally {
          setLoading(false);
        }
      })();
      unsubscribeRef.current = null;
    } else {
      const unsubscribe = onSnapshot(
        postsQuery,
        (snapshot) => {
          const postsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          if (snapshot.docs.length > 0) {
            lastVisibleRef.current = snapshot.docs[snapshot.docs.length - 1];
          }
          setPosts(postsData);
          setLoading(false);
          postsData.forEach(post => { loadComments(post.id); });
        },
        (error) => {
          setLoading(false);
          setHasMore(false);
        }
      );
      unsubscribeRef.current = unsubscribe;
    }
    
    // Check which posts are liked by the user
    if (user?.uid) {
      checkLikedPosts();
    }
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [user]);
  
  // Check which posts are liked by the current user
  const checkLikedPosts = async () => {
    if (!user?.uid) return;
    
    try {
      const likedSet = new Set();
      
      // For each post, check if the user has liked it
      for (const post of posts) {
        const likeRef = doc(db, 'post_likes', `${post.id}_${user.uid}`);
        const likeDoc = await getDoc(likeRef);
        
        if (likeDoc.exists()) {
          likedSet.add(post.id);
        }
      }
      
      setLikedPosts(likedSet);
    } catch (error) {
      // Silent error handling
    }
  };
  
  // Load more posts
  const loadMorePosts = async () => {
    if (loadingMore || !hasMore || !lastVisibleRef.current) return;
    
    setLoadingMore(true);
    
    try {
      const morePostsQuery = query(
        collection(db, 'community_posts'),
        where('visibility', '==', 'public'),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisibleRef.current),
        limit(10)
      );
      
      const snapshot = await getDocs(morePostsQuery);
      
      if (snapshot.empty) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }
      
      const newPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Update the last visible document
      lastVisibleRef.current = snapshot.docs[snapshot.docs.length - 1];
      
      // Append new posts to the existing list
      setPosts(prev => [...prev, ...newPosts]);
      
      // Load comments for new posts
      newPosts.forEach(post => {
        loadComments(post.id);
      });
      
      // Check if the new posts are liked by the user
      const likedSet = new Set(likedPosts);
      
      for (const post of newPosts) {
        if (user?.uid) {
          const likeRef = doc(db, 'post_likes', `${post.id}_${user.uid}`);
          const likeDoc = await getDoc(likeRef);
          
          if (likeDoc.exists()) {
            likedSet.add(post.id);
          }
        }
      }
      
      setLikedPosts(likedSet);
    } catch (error) {
      // Silent error handling
    } finally {
      setLoadingMore(false);
    }
  };
  
  // Load comments for a post
  const loadComments = async (postId) => {
    try {
      const commentsQuery = query(
        collection(db, 'community_comments'),
        where('postId', '==', postId),
        orderBy('createdAt', 'desc'),
        limit(3)
      );
      
      const snapshot = await getDocs(commentsQuery);
      
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCommentsMap(prev => ({
        ...prev,
        [postId]: commentsData
      }));
    } catch (error) {
      // Silent error handling
    }
  };
  
  // Toggle like on a post
  const handleLikeToggle = async (postId) => {
    if (!user?.uid || pendingLikes.has(postId)) return;
    
    // Add to pending set
    setPendingLikes(prev => {
      const newSet = new Set(prev);
      newSet.add(postId);
      return newSet;
    });
    
    // Optimistic update
    const isCurrentlyLiked = likedPosts.has(postId);
    
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyLiked) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
    
    // Update posts count optimistically
    setPosts(prev => 
      prev.map(post => {
        if (post.id === postId) {
          const newCount = Math.max(
            0, 
            (post.likesCount || 0) + (isCurrentlyLiked ? -1 : 1)
          );
          return { ...post, likesCount: newCount };
        }
        return post;
      })
    );
    
    try {
      const likeId = `${postId}_${user.uid}`;
      const likeRef = doc(db, 'post_likes', likeId);
      const postRef = doc(db, 'community_posts', postId);
      
      // Run transaction to update both documents
      await runTransaction(db, async (transaction) => {
        const postDoc = await transaction.get(postRef);
        
        if (!postDoc.exists()) {
          throw new Error("Post does not exist!");
        }
        
        const likeDoc = await transaction.get(likeRef);
        const currentLikes = postDoc.data().likesCount || 0;
        
        if (likeDoc.exists()) {
          // Unlike: Delete like document and decrement count
          transaction.delete(likeRef);
          transaction.update(postRef, { 
            likesCount: Math.max(0, currentLikes - 1) 
          });
        } else {
          // Like: Create like document and increment count
          transaction.set(likeRef, {
            userId: user.uid,
            postId: postId,
            createdAt: serverTimestamp()
          });
          transaction.update(postRef, { 
            likesCount: currentLikes + 1 
          });
        }
      });
      
      // Transaction successful, no need to revert optimistic update
    } catch (error) {
      // Revert optimistic updates on error
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
      
      setPosts(prev => 
        prev.map(post => {
          if (post.id === postId) {
            const newCount = Math.max(
              0, 
              (post.likesCount || 0) + (isCurrentlyLiked ? 1 : -1)
            );
            return { ...post, likesCount: newCount };
          }
          return post;
        })
      );
    } finally {
      // Remove from pending set
      setPendingLikes(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Community Feed</h1>
        <p className="text-gray-600 mt-1">
          Stay connected with the latest public posts from the community
        </p>
      </div>
      
      {/* Feed content */}
      <div className="space-y-4">
        {loading ? (
          // Show skeletons while loading
          Array(3).fill().map((_, i) => <PostSkeleton key={i} />)
        ) : posts.length > 0 ? (
          // Show posts
          <div>
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                user={user}
                onLikeToggle={handleLikeToggle}
                isLiked={likedPosts.has(post.id)}
                isPendingLike={pendingLikes.has(post.id)}
                comments={commentsMap[post.id] || []}
              />
            ))}
            
            {/* Load more button */}
            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMorePosts}
                  disabled={loadingMore}
                  className={`px-4 py-2 rounded ${
                    loadingMore
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-brand-primary text-white hover:bg-brand-primary/90'
                  }`}
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        ) : (
          // No posts found
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No community posts found</p>
            <p className="text-sm text-gray-400 mt-2">
              Check back later for new content
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
