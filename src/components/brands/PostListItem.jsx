import React, { useState } from 'react';
import { Heart, MessageSquare, BookOpen, Link, Unlink, ExternalLink } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/Button';
import TrainingQuickPicker from './TrainingQuickPicker';
import { useAnnouncements } from '../ui/LiveAnnouncer';
import { brandPostLinkTraining, brandPostUnlinkTraining, brandTrainingPreview } from '../../lib/analytics';

/**
 * Individual post row component for Community Editor left pane
 * Includes inline training actions: Link, Unlink, View
 */
export default function PostListItem({
  post,
  isSelected,
  onSelect,
  onUpdatePost,
  trainings = [],
  brandId,
  className = ''
}) {
  const [showQuickPicker, setShowQuickPicker] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { announce } = useAnnouncements();

  // Find attached training data
  const attachedTraining = trainings.find(t => t.id === post.attachedTrainingId);

  // Handle training link (optimistic update)
  const handleLinkTraining = async (training) => {
    if (isUpdating) return;

    setIsUpdating(true);
    setShowQuickPicker(false);

    // Optimistic update
    const optimisticPost = {
      ...post,
      attachedTrainingId: training.id,
      attachedTrainingTitle: training.title // Store for display
    };

    try {
      // Update local state immediately
      onUpdatePost(optimisticPost);
      
      // Show success toast and announce
      announce(`Linked to ${training.title}`, 'polite');
      
      // Track analytics
      brandPostLinkTraining({ postId: post.id, trainingId: training.id });
      
      // TODO: Call actual API update - will be handled by parent component
      // The parent should call the same save function used by the editor
      
    } catch (error) {
      console.error('Failed to link training:', error);
      
      // Revert optimistic update on failure
      onUpdatePost(post);
      announce('Failed to link training. Please try again.', 'assertive');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle training unlink (optimistic update)
  const handleUnlinkTraining = async () => {
    if (isUpdating || !post.attachedTrainingId) return;

    const trainingTitle = attachedTraining?.title || 'training';
    const trainingId = post.attachedTrainingId;
    
    setIsUpdating(true);

    // Optimistic update
    const optimisticPost = {
      ...post,
      attachedTrainingId: '',
      attachedTrainingTitle: ''
    };

    try {
      // Update local state immediately
      onUpdatePost(optimisticPost);
      
      // Show success toast and announce
      announce(`Unlinked from ${trainingTitle}`, 'polite');
      
      // Track analytics
      brandPostUnlinkTraining({ postId: post.id, trainingId });
      
      // TODO: Call actual API update - will be handled by parent component
      
    } catch (error) {
      console.error('Failed to unlink training:', error);
      
      // Revert optimistic update on failure  
      onUpdatePost(post);
      announce('Failed to unlink training. Please try again.', 'assertive');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle view training
  const handleViewTraining = () => {
    if (!post.attachedTrainingId) return;
    
    window.open(`/staff/trainings/${post.attachedTrainingId}`, '_blank');
    
    // Track analytics
    brandTrainingPreview({ trainingId: post.attachedTrainingId });
  };

  return (
    <div
      className={`p-4 cursor-pointer hover:bg-gray-50 relative ${
        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
      } ${className}`}
      onClick={onSelect}
      data-testid={`post-list-row-${post.id}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-4" onClick={onSelect}>
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {post.title || 'Untitled Post'}
            </h3>
            <Badge 
              variant={post.status === 'published' ? 'default' : 'secondary'}
              className={post.status === 'published' ? 'bg-green-100 text-green-800' : ''}
            >
              {post.status}
            </Badge>
          </div>
          <p className="text-xs text-gray-600 line-clamp-2">
            {post.body || 'No content yet...'}
          </p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              <span className="flex items-center">
                <Heart className="w-3 h-3 mr-1" />
                {post.likes?.length || 0}
              </span>
              <span className="flex items-center">
                <MessageSquare className="w-3 h-3 mr-1" />
                {post.comments?.length || 0}
              </span>
              {post.attachedTrainingId && (
                <span className="flex items-center">
                  <BookOpen className="w-3 h-3 mr-1" />
                  Training
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">
              {post.updatedAt?.toLocaleDateString()}
            </span>
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {post.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {post.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{post.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Inline Training Actions */}
        <div className="flex items-center space-x-1 ml-2" onClick={(e) => e.stopPropagation()}>
          {post.attachedTrainingId ? (
            <>
              {/* View Training */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewTraining}
                disabled={isUpdating}
                className="h-8 w-8 p-1 text-gray-400 hover:text-blue-600"
                aria-label={`View training: ${attachedTraining?.title || 'Unknown'}`}
                data-testid={`post-row-view-training-${post.id}`}
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
              
              {/* Unlink Training */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUnlinkTraining}
                disabled={isUpdating}
                className="h-8 w-8 p-1 text-gray-400 hover:text-red-600"
                aria-label="Unlink training"
                data-testid={`post-row-unlink-${post.id}`}
              >
                <Unlink className="w-3 h-3" />
              </Button>
            </>
          ) : (
            /* Link Training */
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQuickPicker(true)}
                disabled={isUpdating}
                className="h-8 w-8 p-1 text-gray-400 hover:text-blue-600"
                aria-label="Link training"
                data-testid={`post-row-link-${post.id}`}
              >
                <Link className="w-3 h-3" />
              </Button>
              
              {/* Quick Picker Popover */}
              {showQuickPicker && (
                <TrainingQuickPicker
                  brandId={brandId}
                  onSelect={handleLinkTraining}
                  onClose={() => setShowQuickPicker(false)}
                  className="absolute right-0 top-full mt-1 z-50"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}