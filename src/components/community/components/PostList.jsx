import React, { useState } from 'react';
import { formatTimeAgo } from '../utils/CommunityUtils.js';

// Sanitize and validate image URLs
const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

// Get safe image URLs from post
const getSafeImageUrls = (post) => {
  const images = post.images || post.imageUrls || [];
  if (!Array.isArray(images)) return [];
  
  return images
    .map(img => {
      // Handle both string URLs and image objects
      const url = typeof img === 'string' ? img : img?.downloadURL || img?.url;
      return isValidImageUrl(url) ? url : null;
    })
    .filter(Boolean);
};

// Image component with error handling and lazy loading
const PostImage = ({ src, alt, index, total, onError }) => {
  const [failed, setFailed] = useState(false);
  
  const handleError = () => {
    setFailed(true);
    if (onError) onError();
  };
  
  if (failed) return null;
  
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={handleError}
      className="w-full h-full object-cover"
      style={{ aspectRatio: '1' }}
    />
  );
};

// Simple Post List Component
const PostList = ({ posts, onPostAction }) => {
  if (!posts || posts.length === 0) {
    return (
      <div className="bg-white rounded p-4 shadow text-center">
        <p className="text-gray-500">No posts available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => {
        const safeImages = getSafeImageUrls(post);
        const imageCount = safeImages.length;
        const authorName = post.author || post.authorName || 'Community Member';
        
        return (
          <div key={post.id} className="bg-white rounded shadow p-4">
            {/* Post Header */}
            <div className="flex justify-between mb-2">
              <div className="font-bold">{authorName}</div>
              <div className="text-sm text-gray-500">
                {formatTimeAgo(post.timestamp)}
              </div>
            </div>
            
            {/* Post Content */}
            <p className="mb-3">{post.content}</p>
            
            {/* Post Images */}
            {imageCount > 0 && (
              <div className={`mb-3 grid gap-2 ${
                imageCount === 1 ? 'grid-cols-1' : 
                imageCount === 2 ? 'grid-cols-2' : 
                imageCount === 3 ? 'grid-cols-3' : 
                'grid-cols-2'
              }`}>
                {safeImages.slice(0, 4).map((imageUrl, idx) => (
                  <div 
                    key={idx}
                    className="relative rounded-lg overflow-hidden bg-gray-100"
                    style={{ aspectRatio: '1' }}
                  >
                    <PostImage
                      src={imageUrl}
                      alt={`Photo ${idx + 1} of ${imageCount} by ${authorName}${post.content ? `: ${post.content.slice(0, 50)}` : ''}`}
                      index={idx}
                      total={imageCount}
                    />
                    {imageCount > 4 && idx === 3 && (
                      <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                        <span className="text-white text-xl font-bold">
                          +{imageCount - 4}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Post Actions */}
            <div className="flex gap-2 text-sm text-gray-600 border-t pt-2">
              <button 
                onClick={() => onPostAction(post.id, 'like')}
                className="hover:text-blue-600"
              >
                Like ({post.reactions?.like || post.likes || 0})
              </button>
              <button 
                onClick={() => onPostAction(post.id, 'comment')}
                className="hover:text-blue-600"
              >
                Comment ({post.comments?.length || post.commentCount || 0})
              </button>
              <button 
                onClick={() => onPostAction(post.id, 'share')}
                className="hover:text-blue-600"
              >
                Share
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PostList;
