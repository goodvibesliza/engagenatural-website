import React, { useState } from 'react';
import { postCategories } from '../utils/CommunityUtils';

/**
 * Post Form Component
 * Allows users to create new posts with text, media, and category selection
 */
const PostForm = ({
  user,
  community,
  showNewPost,
  setShowNewPost,
  newPost,
  setNewPost,
  selectedCategory,
  setSelectedCategory,
  mediaAttachments,
  setMediaAttachments,
  uploadProgress,
  fileInputRef,
  handleFileSelect,
  removeAttachment,
  createPost,
  loading,
  getProfileImageDisplay
}) => {
  // State for tracking text area height
  const [textAreaHeight, setTextAreaHeight] = useState('auto');
  
  // Handle text area input and auto-resize
  const handleTextAreaChange = (e) => {
    setNewPost(e.target.value);
    
    // Auto-resize text area
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
    setTextAreaHeight(`${e.target.scrollHeight}px`);
  };
  
  // Handle category selection
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };
  
  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Get allowed categories for this community
  const getAllowedCategories = () => {
    if (!community) return postCategories;
    
    if (community.allowedPostTypes && community.allowedPostTypes[0] !== 'all') {
      return postCategories.filter(category => 
        community.allowedPostTypes.includes(category.id)
      );
    }
    
    return postCategories;
  };
  
  // Determine if post can be submitted
  const canSubmit = () => {
    return (newPost.trim() || mediaAttachments.length > 0) && !loading;
  };

  // If not showing new post form, show the compact version
  if (!showNewPost) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-3">
          {/* User avatar */}
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-gray-500">
            {getProfileImageDisplay(user) || (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          
          {/* Post prompt */}
          <div 
            onClick={() => setShowNewPost(true)}
            className="flex-grow bg-gray-100 hover:bg-gray-200 rounded-full px-4 py-2 text-gray-500 cursor-pointer transition"
          >
            <span>Share something with the community...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-6">
      <div className="flex items-start space-x-3">
        {/* User avatar */}
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-500">
          {getProfileImageDisplay(user) || (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </div>
        
        {/* Post form */}
        <div className="flex-grow">
          {/* User name and role */}
          <div className="flex items-center mb-2">
            <span className="font-medium text-gray-900">{user?.name || user?.displayName || 'Anonymous'}</span>
            {user?.verified && (
              <span className="ml-1 text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </span>
            )}
            <span className="ml-2 text-xs text-gray-500">{user?.role || 'Community Member'}</span>
          </div>
          
          {/* Text area */}
          <textarea
            value={newPost}
            onChange={handleTextAreaChange}
            placeholder="What's on your mind?"
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
            style={{ height: textAreaHeight, minHeight: '80px' }}
          />
          
          {/* Media previews */}
          {mediaAttachments.length > 0 && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {mediaAttachments.map(attachment => (
                <div key={attachment.id} className="relative rounded-lg overflow-hidden border border-gray-300 aspect-square">
                  {/* Preview */}
                  {attachment.type === 'image' ? (
                    <img 
                      src={attachment.preview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video 
                      src={attachment.preview} 
                      className="w-full h-full object-cover" 
                      controls
                    />
                  )}
                  
                  {/* Remove button */}
                  <button
                    onClick={() => removeAttachment(attachment.id)}
                    className="absolute top-1 right-1 bg-black bg-opacity-70 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-opacity-100 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  
                  {/* Upload progress */}
                  {uploadProgress[attachment.id] !== undefined && uploadProgress[attachment.id] < 100 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300">
                      <div 
                        className="h-full bg-brand-primary" 
                        style={{ width: `${uploadProgress[attachment.id]}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Form actions */}
          <div className="mt-4 flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-2">
              {/* Category dropdown */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="appearance-none bg-gray-100 border border-gray-300 text-gray-700 py-2 px-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent text-sm"
                >
                  <option value="all">Select category</option>
                  {getAllowedCategories().map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
              
              {/* Media attachment button */}
              <button
                type="button"
                onClick={triggerFileInput}
                className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg transition text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Add Media</span>
              </button>
              
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,video/*"
                className="hidden"
                multiple
              />
            </div>
            
            <div className="flex space-x-2">
              {/* Cancel button */}
              <button
                type="button"
                onClick={() => {
                  setShowNewPost(false);
                  setNewPost('');
                  setMediaAttachments([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition text-sm"
              >
                Cancel
              </button>
              
              {/* Post button */}
              <button
                type="button"
                onClick={createPost}
                disabled={!canSubmit()}
                className={`px-4 py-2 rounded-lg text-white text-sm ${
                  canSubmit()
                    ? 'bg-brand-primary hover:bg-brand-primary/90'
                    : 'bg-gray-400 cursor-not-allowed'
                } transition`}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>Posting...</span>
                  </div>
                ) : (
                  'Post'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostForm;
