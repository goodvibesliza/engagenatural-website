import React from 'react';

// Simple Share Modal Component for debugging
const ShareModal = ({ post, onClose, onShare }) => {
  if (!post) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-bold mb-4">Share Post</h3>
        
        <div className="mb-4">
          <p className="text-gray-700">{post.content?.substring(0, 100)}...</p>
        </div>
        
        <div className="flex gap-2 mb-4">
          <button 
            onClick={() => onShare('copy')}
            className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded"
          >
            Copy Link
          </button>
          <button 
            onClick={() => onShare('email')}
            className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded"
          >
            Email
          </button>
        </div>
        
        <button
          onClick={onClose}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ShareModal;
