import React, { useEffect, useRef } from 'react';

/**
 * ProfileModal Component
 * Modal for displaying user profile information
 */
const ProfileModal = ({ user, onClose, calculateLevel }) => {
  // Refs for focus management
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Calculate user level based on points
  const levelInfo = user?.points ? calculateLevel(user.points) : {
    level: 1,
    title: 'Newcomer',
    progressPercent: 0,
    pointsNeeded: 100
  };

  // Format date to readable string
  const formatDate = (date) => {
    if (!date) return 'Unknown';
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString(undefined, options);
  };

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    // Handle escape key to close
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Add event listeners
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);
    
    // Focus the close button when modal opens
    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    }

    // Lock body scroll
    document.body.style.overflow = 'hidden';

    // Clean up event listeners
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
        role="dialog"
        aria-labelledby="profile-modal-title"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-brand-primary to-brand-secondary p-6 text-white">
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white rounded-full p-1"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* User Avatar */}
          <div className="flex justify-center mb-3">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-white bg-opacity-20 flex items-center justify-center text-white border-2 border-white">
              {user.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt={user.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
          </div>

          {/* User Name and Role */}
          <div className="text-center">
            <div className="flex items-center justify-center">
              <h3 id="profile-modal-title" className="text-xl font-bold">
                {user.name}
              </h3>
              {user.verified && (
                <span className="ml-1 text-blue-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </div>
            <p className="text-white text-opacity-90 mt-1">{user.role}</p>
            
            {/* User Badges */}
            {user.badges && user.badges.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1 mt-2">
                {user.badges.map(badge => (
                  <span 
                    key={badge}
                    className="text-xs px-2 py-0.5 rounded-full bg-white bg-opacity-20"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User Stats */}
        <div className="p-6">
          {/* Level and Points */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <div>
                <span className="text-sm text-gray-500">Level {levelInfo.level}</span>
                <h4 className="font-medium text-gray-900">{levelInfo.title}</h4>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-500">Points</span>
                <h4 className="font-medium text-gray-900">{user.points?.toLocaleString() || 0}</h4>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-brand-primary h-2.5 rounded-full" 
                style={{ width: `${levelInfo.progressPercent}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {levelInfo.pointsNeeded?.toLocaleString() || 0} points needed for next level
            </p>
          </div>

          {/* User Bio */}
          {user.bio && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Bio</h4>
              <p className="text-sm text-gray-600">{user.bio}</p>
            </div>
          )}
          
          {/* Activity Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <span className="text-sm text-gray-500">Posts</span>
              <h4 className="font-medium text-gray-900">{user.postsCount || 0}</h4>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <span className="text-sm text-gray-500">Comments</span>
              <h4 className="font-medium text-gray-900">{user.commentsCount || 0}</h4>
            </div>
          </div>

          {/* Joined Date */}
          <div className="text-center text-sm text-gray-500 mb-6">
            Member since {formatDate(user.joinedDate)}
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              className="flex-1 bg-brand-primary hover:bg-brand-primary/90 text-white py-2 px-4 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
            >
              Message
            </button>
            <button
              className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Follow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
