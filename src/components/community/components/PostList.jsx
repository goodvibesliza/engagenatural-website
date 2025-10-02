import React from 'react';
import { formatTimeAgo } from '../utils/CommunityUtils.js';

// Simple Post List Component for debugging
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
      {posts.map((post) => (
        <div key={post.id} className="bg-white rounded shadow p-4">
          {/* Post Header */}
          <div className="flex justify-between mb-2">
            <div className="font-bold">{post.author}</div>
            <div className="text-sm text-gray-500">
              {formatTimeAgo(post.timestamp)}
            </div>
          </div>
          
          {/* Post Content */}
          <p className="mb-3">{post.content}</p>
          
          {/* Post Images */}
          {post.imageUrls && post.imageUrls.length > 0 && (
            <div className="mb-3">
              {post.imageUrls.length === 1 ? (
                <img 
                  src={post.imageUrls[0]} 
                  alt="Post attachment" 
                  className="w-full max-w-lg h-auto rounded-lg border border-gray-200"
                />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {post.imageUrls.slice(0, 4).map((url, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={url} 
                        alt={`Post attachment ${index + 1}`} 
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      {index === 3 && post.imageUrls.length > 4 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                          <span className="text-white font-medium">
                            +{post.imageUrls.length - 4} more
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Post Actions */}
          <div className="flex gap-2 text-sm text-gray-600 border-t pt-2">
            <button 
              onClick={() => onPostAction(post.id, 'like')}
              className="hover:text-blue-600"
            >
              Like ({post.reactions?.like || 0})
            </button>
            <button 
              onClick={() => onPostAction(post.id, 'comment')}
              className="hover:text-blue-600"
            >
              Comment ({post.comments?.length || 0})
            </button>
            <button 
              onClick={() => onPostAction(post.id, 'share')}
              className="hover:text-blue-600"
            >
              Share
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PostList;
