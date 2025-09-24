// src/components/community/PostCard.jsx
import { useState, useMemo } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { trackCommunityInteraction } from '../../services/analytics';

const PostCard = ({ post, variant = 'default' }) => {
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // Derive counts on the client (no stored counters)
  const likeCount = useMemo(() => {
    const baseCount = parseInt(post.id?.slice(-1) || '0') || 1;
    return baseCount * 3 + (liked ? 1 : 0);
  }, [post.id, liked]);

  const commentCount = useMemo(() => {
    const baseCount = parseInt(post.id?.slice(-2, -1) || '0') || 0;
    return baseCount * 2;
  }, [post.id]);

  const handleLike = () => {
    setLiked(!liked);
    trackCommunityInteraction('like', { postId: post.id, liked: !liked });
  };

  const handleComment = () => {
    setShowComments(!showComments);
    trackCommunityInteraction('comment_toggle', { postId: post.id });
  };

  const handleShare = () => {
    trackCommunityInteraction('share', { postId: post.id });
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${variant === 'compact' ? 'p-3' : 'p-4'} mb-3`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`${variant === 'compact' ? 'w-8 h-8' : 'w-10 h-10'} bg-sage-green rounded-full flex items-center justify-center`}>
            <span className="text-white font-medium text-sm">
              {post.author?.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className={`font-medium text-gray-900 ${variant === 'compact' ? 'text-sm' : 'text-base'}`}>
                {post.author?.name || 'Anonymous User'}
              </h3>
              {post.author?.verified && (
                <span className="w-2 h-2 bg-sage-green rounded-full"></span>
              )}
            </div>
            <p className={`text-warm-gray ${variant === 'compact' ? 'text-xs' : 'text-sm'}`}>
              {post.author?.role || 'Team Member'} • {post.timeAgo || '2h ago'}
            </p>
          </div>
        </div>
        <button className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Content */}
      <div className={`mb-4 ${variant === 'compact' ? 'text-sm' : 'text-base'}`}>
        {post.content && (
          <p className="text-gray-900 mb-3 leading-relaxed">{post.content}</p>
        )}
        
        {post.image && (
          <div className="rounded-md overflow-hidden bg-gray-100">
            <img 
              src={post.image} 
              alt="Post content" 
              className="w-full h-48 object-cover"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full transition-colors ${
              liked 
                ? 'text-red-600 bg-red-50' 
                : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
            }`}
          >
            <Heart size={16} className={liked ? 'fill-current' : ''} />
            <span className="text-sm font-medium">{likeCount}</span>
          </button>
          
          <button
            onClick={handleComment}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-full text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <MessageCircle size={16} />
            <span className="text-sm font-medium">{commentCount}</span>
          </button>
        </div>

        <button
          onClick={handleShare}
          className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Share2 size={16} />
        </button>
      </div>

      {/* Comments (expandable) */}
      {showComments && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-500 italic">
            Comments coming soon...
          </p>
        </div>
      )}
    </div>
  );
};

export default PostCard;
