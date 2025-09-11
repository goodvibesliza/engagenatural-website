import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

// Comment component
const Comment = ({ comment }) => {
  const formattedDate = comment.createdAt?.toDate ? 
    new Date(comment.createdAt.toDate()).toLocaleString() : 
    'Recently';
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-3">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium text-sm flex items-center">
          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs mr-2">
            {comment.userRole || 'user'}
          </span>
          <span className="text-gray-500 text-xs">{formattedDate}</span>
        </span>
      </div>
      <p className="text-gray-800">{comment.text}</p>
    </div>
  );
};

// Loading skeleton for post
const PostSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 animate-pulse">
    <div className="h-7 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="space-y-2 mb-4">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
    <div className="flex justify-between items-center mt-6">
      <div className="h-5 bg-gray-200 rounded w-24"></div>
      <div className="h-8 bg-gray-200 rounded w-20"></div>
    </div>
  </div>
);

// Loading skeleton for comment
const CommentSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 mb-3 animate-pulse">
    <div className="flex justify-between items-center mb-2">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 rounded w-full"></div>
      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
    </div>
  </div>
);

export default function PostDetail() {
  const { postId, id } = useParams(); // Support both postId and id keys
  const actualPostId = postId || id;
  const { user } = useAuth();
  
  // State
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [pendingLike, setPendingLike] = useState(false);
  
  // Refs
  const commentsEndRef = useRef(null);
  const unsubscribePostRef = useRef(null);
  const unsubscribeCommentsRef = useRef(null);
  
  // Subscribe to post
  useEffect(() => {
    if (!actualPostId) {
      setError('Post ID is missing');
      setLoading(false);
      return;
    }
    
    const postRef = doc(db, 'community_posts', actualPostId);
    
    unsubscribePostRef.current = onSnapshot(
      postRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const postData = {
            id: docSnapshot.id,
            ...docSnapshot.data()
          };
          
          // Check if post is public
          if (postData.visibility !== 'public') {
            setError('This post is not available');
            setPost(null);
          } else {
            setPost(postData);
            setError(null);
          }
        } else {
          setError('Post not found');
          setPost(null);
        }
        setLoading(false);
      },
      (err) => {
        setError('Error loading post');
        setLoading(false);
      }
    );
    
    return () => {
      if (unsubscribePostRef.current) {
        unsubscribePostRef.current();
      }
    };
  }, [actualPostId]);
  
  // Subscribe to comments
  useEffect(() => {
    if (!actualPostId) return;
    
    const commentsQuery = query(
      collection(db, 'community_comments'),
      where('postId', '==', actualPostId),
      orderBy('createdAt', 'asc')
    );
    
    setLoadingComments(true);
    
    unsubscribeCommentsRef.current = onSnapshot(
      commentsQuery,
      (snapshot) => {
        const commentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setComments(commentsData);
        setLoadingComments(false);
      },
      (err) => {
        setLoadingComments(false);
      }
    );
    
    return () => {
      if (unsubscribeCommentsRef.current) {
        unsubscribeCommentsRef.current();
      }
    };
  }, [actualPostId]);
  
  // Check if user has liked the post
  useEffect(() => {
    if (!user?.uid || !actualPostId) return;
    
    const checkLikeStatus = async () => {
      try {
        const likeRef = doc(db, 'post_likes', `${actualPostId}_${user.uid}`);
        const likeDoc = await getDoc(likeRef);
        setIsLiked(likeDoc.exists());
      } catch (err) {
        // Silent error handling
      }
    };
    
    checkLikeStatus();
  }, [user, actualPostId]);
  
  // Scroll to bottom when new comments arrive
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments.length]);
  
  // Handle like toggle
  const handleLikeToggle = async () => {
    if (!user?.uid || !actualPostId || pendingLike) return;
    
    setPendingLike(true);
    
    try {
      const likeId = `${actualPostId}_${user.uid}`;
      const likeRef = doc(db, 'post_likes', likeId);
      const postRef = doc(db, 'community_posts', actualPostId);
      
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
            postId: actualPostId,
            createdAt: serverTimestamp()
          });
          transaction.update(postRef, { 
            likesCount: currentLikes + 1 
          });
        }
      });
      
      // Update local state based on transaction result
      setIsLiked(!isLiked);
    } catch (err) {
      // Silent error handling
    } finally {
      setPendingLike(false);
    }
  };
  
  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?.uid || !actualPostId || !newComment.trim() || submitting) return;
    
    setSubmitting(true);
    
    try {
      const commentId = `${Date.now()}_${user.uid}`;
      const commentRef = doc(db, 'community_comments', commentId);
      const postRef = doc(db, 'community_posts', actualPostId);
      
      // Run transaction to create comment and update post count
      await runTransaction(db, async (transaction) => {
        const postDoc = await transaction.get(postRef);
        
        if (!postDoc.exists()) {
          throw new Error("Post does not exist!");
        }
        
        const currentComments = postDoc.data().commentsCount || 0;
        
        // Create comment document
        transaction.set(commentRef, {
          postId: actualPostId,
          userId: user.uid,
          userRole: user.role || 'user',
          text: newComment.trim(),
          createdAt: serverTimestamp(),
          demoSeed: false
        });
        
        // Update post's comment count
        transaction.update(postRef, {
          commentsCount: currentComments + 1
        });
      });
      
      // Clear input field after successful submission
      setNewComment('');
    } catch (err) {
      // Silent error handling
    } finally {
      setSubmitting(false);
    }
  };
  
  // Format date helper
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Recently';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Show error state if post not found or not public
  if (error && !loading) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">{error}</h2>
          <p className="text-red-600">
            The post you're looking for might have been removed or is not publicly available.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* Post content */}
      {loading ? (
        <PostSkeleton />
      ) : post && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title || 'Untitled Post'}</h1>
          
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-sm mr-2">
                {post.authorRole || 'user'}
              </span>
              <span className="text-gray-500 text-sm">
                {post.createdAt ? formatDate(post.createdAt) : 'Recently'}
              </span>
            </div>
          </div>
          
          <div className="prose max-w-none mb-6">
            <p className="text-gray-800 whitespace-pre-wrap">{post.body}</p>
          </div>
          
          <div className="flex justify-between items-center border-t border-gray-100 pt-4">
            <div className="flex space-x-4">
              <button 
                onClick={handleLikeToggle}
                disabled={pendingLike || !user}
                className={`flex items-center space-x-1 ${
                  user ? 'hover:text-brand-primary' : ''
                } ${isLiked ? 'text-brand-primary' : 'text-gray-500'}`}
              >
                <span role="img" aria-label="like">
                  {isLiked ? '❤️' : '🤍'}
                </span>
                <span>{post.likesCount || 0}</span>
              </button>
              
              <div className="flex items-center space-x-1 text-gray-500">
                <span role="img" aria-label="comments">💬</span>
                <span>{post.commentsCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Comments section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Comments</h2>
        
        {loadingComments ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <CommentSkeleton key={i} />)}
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
            {comments.map(comment => (
              <Comment key={comment.id} comment={comment} />
            ))}
            <div ref={commentsEndRef} />
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-6 text-center mb-4">
            <p className="text-gray-500">No comments yet</p>
            <p className="text-sm text-gray-400 mt-1">Be the first to comment</p>
          </div>
        )}
      </div>
      
      {/* Comment form */}
      {user ? (
        <form onSubmit={handleCommentSubmit} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="mb-3">
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
              Add a comment
            </label>
            <textarea
              id="comment"
              rows="3"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={submitting}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="Share your thoughts..."
            ></textarea>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className={`px-4 py-2 rounded ${
                !newComment.trim() || submitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-brand-primary text-white hover:bg-brand-primary/90'
              }`}
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-gray-600">Sign in to leave a comment</p>
        </div>
      )}
    </div>
  );
}
