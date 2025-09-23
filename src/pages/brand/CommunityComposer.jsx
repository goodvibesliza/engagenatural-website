import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import { db, storage } from '../../lib/firebase';

export default function CommunityComposer({ mode = 'create' }) {
  const { postId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [keepExistingImage, setKeepExistingImage] = useState(true);
  
  // UI state
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [notFound, setNotFound] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Load post data in edit mode
  useEffect(() => {
    if (mode !== 'edit' || !postId || !user) return;
    
    setLoading(true);
    setError(null);
    
    const postRef = doc(db, 'community_posts', postId);
    
    const unsubscribe = onSnapshot(
      postRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const postData = docSnap.data();
          
          // Check if user is the author
          if (postData.authorUid !== user.uid) {
            setUnauthorized(true);
            setLoading(false);
            return;
          }
          
          // Set form data
          setTitle(postData.title || '');
          setBody(postData.body || '');
          if (postData.imageUrl) {
            setExistingImageUrl(postData.imageUrl);
            setKeepExistingImage(true);
          }
        } else {
          setNotFound(true);
        }
        setLoading(false);
      },
      (err) => {
        setError(`Error loading post: ${err.message}`);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [mode, postId, user]);
  
  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      setValidationErrors(prev => ({
        ...prev,
        image: 'Please select an image file'
      }));
      return;
    }
    
    // Clear previous validation error
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.image;
      return newErrors;
    });
    
    // Set file and preview
    setImageFile(file);
    setKeepExistingImage(false);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };
  
  // Remove selected image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setKeepExistingImage(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!body.trim()) {
      errors.body = 'Body is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Upload image to storage
  const uploadImage = async (docId) => {
    if (!imageFile) return null;
    
    try {
      const fileExtension = imageFile.name.split('.').pop();
      const storagePath = `app/community/${docId}/hero.${fileExtension}`;
      const storageRef = ref(storage, storagePath);
      
      await uploadBytes(storageRef, imageFile);
      const downloadUrl = await getDownloadURL(storageRef);
      
      return downloadUrl;
    } catch (err) {
      throw new Error(`Failed to upload image: ${err.message}`);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) return;
    
    setSaving(true);
    setError(null);
    
    try {
      if (mode === 'create') {
        // Create new post
        const postData = {
          title: title.trim(),
          body: body.trim(),
          content: `${title.trim()}\n\n${body.trim()}`, // Compatibility field
          authorUid: user.uid,
          brandId: user.brandId,
          communityId: 'whats-good', // Default to public community
          visibility: 'public',
          userName: user.name || user.displayName || 'Anonymous',
          likeCount: 0,
          commentCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          demoSeed: false
        };
        
        // Add document
        const docRef = await addDoc(collection(db, 'community_posts'), postData);
        
        // Upload image if provided
        if (imageFile) {
          const imageUrl = await uploadImage(docRef.id);
          if (imageUrl) {
            await updateDoc(docRef, { imageUrl });
          }
        }
        
        // Navigate to list view
        navigate('/brand/community');
      } else if (mode === 'edit') {
        // Update existing post
        const postRef = doc(db, 'community_posts', postId);
        
        // Check if post exists and user is author
        const postSnap = await getDoc(postRef);
        if (!postSnap.exists()) {
          setNotFound(true);
          setSaving(false);
          return;
        }
        
        const postData = postSnap.data();
        if (postData.authorUid !== user.uid) {
          setUnauthorized(true);
          setSaving(false);
          return;
        }
        
        // Prepare update data
        const updateData = {
          title: title.trim(),
          body: body.trim(),
          content: `${title.trim()}\n\n${body.trim()}`, // Update compatibility field
          updatedAt: serverTimestamp()
        };
        
        // Handle image update
        if (imageFile) {
          // Upload new image
          const imageUrl = await uploadImage(postId);
          if (imageUrl) {
            updateData.imageUrl = imageUrl;
          }
        } else if (!keepExistingImage) {
          // Remove image reference if user removed it
          updateData.imageUrl = null;
        }
        
        // Update document
        await updateDoc(postRef, updateData);
        
        // Navigate to list view
        navigate('/brand/community');
      }
    } catch (err) {
      setError(`Error saving post: ${err.message}`);
      setSaving(false);
    }
  };
  
  // Handle delete
  const handleDelete = async () => {
    if (mode !== 'edit' || !postId) return;
    
    setSaving(true);
    setError(null);
    
    try {
      await deleteDoc(doc(db, 'community_posts', postId));
      navigate('/brand/community');
    } catch (err) {
      setError(`Error deleting post: ${err.message}`);
      setSaving(false);
    }
  };
  
  // If user is not signed in
  if (!user) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-md">
          Please sign in to create or edit posts.
        </div>
      </div>
    );
  }
  
  // If post not found in edit mode
  if (mode === 'edit' && notFound && !loading) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-md">
          Post not found. It may have been deleted.
        </div>
        <button
          onClick={() => navigate('/brand/community')}
          className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90"
        >
          Back to Posts
        </button>
      </div>
    );
  }
  
  // If user is not authorized to edit
  if (mode === 'edit' && unauthorized && !loading) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          You do not have permission to edit this post.
        </div>
        <button
          onClick={() => navigate('/brand/community')}
          className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90"
        >
          Back to Posts
        </button>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === 'create' ? 'Create New Post' : 'Edit Post'}
        </h1>
        <p className="text-gray-600 mt-1">
          {mode === 'create'
            ? 'Share content with the community'
            : 'Update your community post'}
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
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <form onSubmit={handleSubmit}>
            {/* Title field */}
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full px-3 py-2 border ${
                  validationErrors.title ? 'border-red-300' : 'border-gray-300'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent`}
                placeholder="Enter post title"
              />
              {validationErrors.title && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
              )}
            </div>
            
            {/* Body field */}
            <div className="mb-4">
              <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
                Body <span className="text-red-500">*</span>
              </label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                className={`w-full px-3 py-2 border ${
                  validationErrors.body ? 'border-red-300' : 'border-gray-300'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent`}
                placeholder="Write your post content here..."
              />
              {validationErrors.body && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.body}</p>
              )}
            </div>
            
            {/* Image upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image (Optional)
              </label>
              
              {/* Existing image preview */}
              {mode === 'edit' && existingImageUrl && keepExistingImage && (
                <div className="mb-3">
                  <div className="relative inline-block">
                    <img
                      src={existingImageUrl}
                      alt="Current"
                      className="h-40 w-auto object-cover rounded-md border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setKeepExistingImage(false)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              
              {/* New image preview */}
              {imagePreview && (
                <div className="mb-3">
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-40 w-auto object-cover rounded-md border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              
              {/* File input */}
              {(!keepExistingImage || mode === 'create') && (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      {imagePreview ? 'Change Image' : 'Select Image'}
                    </button>
                    {validationErrors.image && (
                      <p className="text-sm text-red-600">{validationErrors.image}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Form actions */}
            <div className="flex justify-between">
              <div>
                {mode === 'edit' && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    disabled={saving}
                  >
                    Delete
                  </button>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/brand/community')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving
                    ? mode === 'create' ? 'Creating...' : 'Saving...'
                    : mode === 'create' ? 'Create Post' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
