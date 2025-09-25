// src/components/community/LoadingStates.jsx

export const PostCardSkeleton = ({ variant = 'default' }) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${variant === 'compact' ? 'p-3' : 'p-4'} mb-3 animate-pulse`}>
      {/* Header skeleton */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`${variant === 'compact' ? 'w-8 h-8' : 'w-10 h-10'} bg-gray-200 rounded-full`}></div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
        <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
      </div>

      {/* Content skeleton */}
      <div className="mb-4">
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
        
        {/* Image skeleton */}
        <div className="h-48 bg-gray-200 rounded-md"></div>
      </div>

      {/* Actions skeleton */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="h-8 bg-gray-200 rounded-full w-16"></div>
          <div className="h-8 bg-gray-200 rounded-full w-16"></div>
        </div>
        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
      </div>
    </div>
  );
};

export const FeedSkeleton = ({ count = 3, variant = 'default' }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <PostCardSkeleton key={i} variant={variant} />
      ))}
    </div>
  );
};

export const LoadingSpinner = ({ size = 'default', className = '' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8', 
    large: 'w-12 h-12'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-sage-green border-t-transparent ${sizeClasses[size]} ${className}`}>
    </div>
  );
};

export const InlineLoading = ({ message = 'Loading...' }) => {
  return (
    <div className="flex items-center justify-center space-x-2 py-8">
      <LoadingSpinner size="default" />
      <span className="text-warm-gray text-sm">{message}</span>
    </div>
  );
};
