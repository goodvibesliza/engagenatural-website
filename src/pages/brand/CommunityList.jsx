import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function CommunityList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteInProgress, setDeleteInProgress] = useState({});
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);

  // Fetch posts created by the current user
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create query for posts by this user
      const postsQuery = query(
        collection(db, 'community_posts'),
        where('authorUid', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      // Subscribe to query
      const unsubscribe = onSnapshot(
        postsQuery,
        (snapshot) => {
          const postData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setPosts(postData);
          setLoading(false);
        },
        (err) => {
          setError(`Error loading posts: ${err.message}`);
          setLoading(false);
        }
      );

      // Clean up subscription
      return () => unsubscribe();
    } catch (err) {
      setError(`Error setting up posts query: ${err.message}`);
      setLoading(false);
    }
  }, [user?.uid]);

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  // Navigate to edit page
  const handleEdit = (postId) => {
    navigate(`/brand/community/${postId}/edit`);
  };

  // Show delete confirmation
  const confirmDelete = (post) => {
    setShowConfirmDelete(post);
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowConfirmDelete(null);
  };

  // Delete post
  const handleDelete = async (postId) => {
    if (!postId) return;
    
    setDeleteInProgress(prev => ({ ...prev, [postId]: true }));
    setShowConfirmDelete(null);
    
    try {
      await deleteDoc(doc(db, 'community_posts', postId));
      // Note: We're not deleting the image from storage as it wasn't specified in requirements
    } catch (err) {
      setError(`Error deleting post: ${err.message}`);
    } finally {
      setDeleteInProgress(prev => ({ ...prev, [postId]: false }));
    }
  };

  // If user is not signed in
  if (!user) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-md">
          Please sign in to view your community posts.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Community Posts</h1>
        <p className="text-gray-600 mt-1">
          Manage posts you've created in the community
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-primary"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
          <div className="text-gray-500 mb-4">You haven't created any posts yet.</div>
          <button
            onClick={() => navigate('/brand/community/new')}
            className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90"
          >
            Create Your First Post
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          {/* Desktop view: Table */}
          <div className="hidden md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visibility
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {post.title || (post.content?.substring(0, 50) + (post.content?.length > 50 ? '...' : ''))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(post.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {post.visibility || 'public'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(post.id)}
                        className="text-brand-primary hover:text-brand-primary/80 mr-4"
                        disabled={deleteInProgress[post.id]}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmDelete(post)}
                        className="text-red-600 hover:text-red-900"
                        disabled={deleteInProgress[post.id]}
                      >
                        {deleteInProgress[post.id] ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile view: Cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {posts.map((post) => (
              <div key={post.id} className="p-4">
                <div className="mb-2">
                  <div className="text-sm font-medium text-gray-900">
                    {post.title || (post.content?.substring(0, 50) + (post.content?.length > 50 ? '...' : ''))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{formatDate(post.createdAt)}</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {post.visibility || 'public'}
                  </span>
                  <div>
                    <button
                      onClick={() => handleEdit(post.id)}
                      className="text-brand-primary hover:text-brand-primary/80 mr-3 text-sm"
                      disabled={deleteInProgress[post.id]}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => confirmDelete(post)}
                      className="text-red-600 hover:text-red-900 text-sm"
                      disabled={deleteInProgress[post.id]}
                    >
                      {deleteInProgress[post.id] ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showConfirmDelete.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create new post button */}
      <div className="mt-6">
        <button
          onClick={() => navigate('/brand/community/new')}
          className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90"
        >
          Create New Post
        </button>
      </div>
    </div>
  );
}
