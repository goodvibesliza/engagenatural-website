import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';
import { db } from '../../lib/firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  getCountFromServer
} from 'firebase/firestore';

// Loading skeleton for post
const PostSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4 shadow-sm animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="flex justify-between items-center mb-6">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/5"></div>
    </div>
    <div className="space-y-3 mb-6">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
    <div className="h-10 bg-gray-200 rounded w-full mt-6"></div>
  </div>
);

export default function PostDetail() {
  const { id: postId } = useParams();
  const { user } = useAuth();
  
  // Post state
  const [post, setPost] = useState(null);
  const [loadingPost, setLoadingPost] = useState(true);
  
  // Comments state
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  
  // Like state
  const [liked, setLiked] = useState(false);
  const [pendingLike, setPendingLike] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Subscribe to post document
  useEffect(() => {
    if (!postId) return;
    
    const postRef = doc(db, 'community_posts', postId);
    const unsubscribe = onSnapshot(postRef, (doc) => {
      if (doc.exists()) {
        setPost({ id: doc.id, ...doc.data() });
      } else {
        setPost(null);
      }
      setLoadingPost(false);
    }, (error) => {
      setLoadingPost(false);
    });
    
    return () => unsubscribe();
  }, [postId]);

  // Subscribe to comments
  useEffect(() => {
    if (!postId) return;
    
    const commentsQuery = query(
      collection(db, 'community_comments'),
      where('postId', '==', postId),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(commentsData);
    });
    
    return () => unsubscribe();
  }, [postId]);

  // Check if user has liked the post
  useEffect(() => {
    if (!user?.uid || !postId) return;
    
    const checkLiked = async () => {
      const likeRef = doc(db, 'post_likes', `${postId}_${user.uid}`);
      const likeDoc = await getDoc(likeRef);
      setLiked(likeDoc.exists());
    };
    
    checkLiked();
  }, [user, postId]);

  // Get initial like count
  useEffect(() => {
    if (!postId) return;
    refreshLikeCount();
  }, [postId]);

  // Refresh like count
  const refreshLikeCount = useCallback(async () => {
    if (!postId) return;
    
    const likesQuery = query(collection(db, 'post_likes'), where('postId', '==', postId));
    const snapshot = await getCountFromServer(likesQuery);
    setLikeCount(snapshot.data().count || 0);
  }, [postId]);

  // Toggle like
  const toggleLike = async () => {
    if (!user?.uid || pendingLike) return;
    
    setPendingLike(true);
    try {
      const likeRef = doc(db, 'post_likes', `${postId}_${user.uid}`);
      
      if (liked) {
        await deleteDoc(likeRef);
        setLiked(false);
      } else {
        await setDoc(likeRef, {
          postId,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
        setLiked(true);
      }
      
      // Refresh like count after toggling
      await refreshLikeCount();
    } finally {
      setPendingLike(false);
    }
  };

  // Submit comment
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?.uid || !commentText.trim() || submittingComment) return;
    
    setSubmittingComment(true);
    try {
      await addDoc(collection(db, 'community_comments'), {
        postId,
        userId: user.uid,
        userName: user.name || user.displayName || 'User',
        userRole: user.role || 'user',
        body: commentText.trim(),
        createdAt: serverTimestamp()
      });
      
      setCommentText('');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Recently';
    return timestamp.toDate ? new Date(timestamp.toDate()).toLocaleString() : 'Recently';
  };

  if (loadingPost) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <PostSkeleton />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Post Not Found</h2>
          <p className="text-red-700 mb-4">The post you're looking for doesn't exist or has been removed.</p>
          <Link to="/staff/communities" className="inline-block px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90">
            Back to Communities
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Post Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{post.title || 'Untitled Post'}</h1>
          <div className="flex items-center">
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs mr-2">
              {post.authorRole || 'user'}
            </span>
            <span className="text-gray-500 text-sm">{formatDate(post.createdAt)}</span>
          </div>
        </div>
        
        {/* Post Body */}
        <div className="prose max-w-none mb-6">
          <p className="text-gray-700 whitespace-pre-line">{post.body}</p>
        </div>
        
        {/* Post Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-6">
            <button
              onClick={toggleLike}
              disabled={!user || pendingLike}
              className={`flex items-center space-x-1 ${
                liked ? 'text-brand-primary' : 'text-gray-500'
              } ${
                !user || pendingLike ? 'opacity-50 cursor-not-allowed' : 'hover:text-brand-primary'
              }`}
            >
              <span role="img" aria-label="like">{liked ? '❤️' : '🤍'}</span>
              <span>{likeCount}</span>
            </button>
            
            <div className="flex items-center space-x-1 text-gray-500">
              <span role="img" aria-label="comments">💬</span>
              <span>{comments.length}</span>
            </div>
          </div>
          
          <Link to="/staff/communities" className="text-sm text-brand-primary hover:underline">
            Back to Communities
          </Link>
        </div>
      </div>
      
      {/* Comments Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Comments ({comments.length})</h2>
        
        {/* Comment Form */}
        {user && (
          <form onSubmit={handleCommentSubmit} className="mb-6">
            <div className="mb-3">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add your comment..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                rows="3"
                disabled={submittingComment}
              ></textarea>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!commentText.trim() || submittingComment}
                className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        )}
        
        {/* Comments List */}
        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900 mr-2">
                      {comment.userName || 'User'}
                    </span>
                    <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-xs">
                      {comment.userRole || 'user'}
                    </span>
                  </div>
                  <span className="text-gray-500 text-sm">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="text-gray-700 whitespace-pre-line">
                  {/* Support both comment.body (new) and comment.text (existing) */}
                  {comment.body || comment.text}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>
    </div>
  );
}
