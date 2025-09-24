// src/components/community/EmptyStates.jsx
import { MessageCircle, Users, Lock, Sparkles } from 'lucide-react';

export const EmptyFeedState = ({ type = 'general' }) => {
  const configs = {
    general: {
      icon: MessageCircle,
      title: 'No posts yet',
      description: 'Be the first to share something with the community!',
      actionText: 'Start a conversation'
    },
    whatsGood: {
      icon: Sparkles,
      title: "What's good today?",
      description: 'Share wins, celebrate achievements, and spread positivity with your team!',
      actionText: 'Share something good'
    },
    proFeed: {
      icon: Users,
      title: 'Pro discussions coming soon',
      description: 'This space is reserved for verified team members to share insights and updates.',
      actionText: null
    },
    restricted: {
      icon: Lock,
      title: 'Access restricted',
      description: 'You need to be a verified team member to view this content.',
      actionText: 'Request verification'
    }
  };

  const config = configs[type] || configs.general;
  const IconComponent = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 bg-oat-beige rounded-full flex items-center justify-center mb-4">
        <IconComponent size={24} className="text-sage-green" />
      </div>
      
      <h3 className="text-lg font-heading font-medium text-deep-moss mb-2">
        {config.title}
      </h3>
      
      <p className="text-warm-gray text-sm max-w-sm mb-6 leading-relaxed">
        {config.description}
      </p>
      
      {config.actionText && (
        <button className="px-6 py-2.5 bg-sage-green text-white font-medium text-sm rounded-lg hover:bg-sage-dark transition-colors">
          {config.actionText}
        </button>
      )}
    </div>
  );
};

export const ErrorState = ({ message = 'Something went wrong', onRetry = null }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Oops, something went wrong
      </h3>
      
      <p className="text-gray-600 text-sm max-w-sm mb-6">
        {message}
      </p>
      
      {onRetry && (
        <button 
          onClick={onRetry}
          className="px-4 py-2 bg-sage-green text-white font-medium text-sm rounded-lg hover:bg-sage-dark transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
};

export const UnverifiedUserCard = ({ onRequestVerification = null }) => {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
            <Lock size={16} className="text-amber-600" />
          </div>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-amber-800 mb-1">
            Pro Feed Access
          </h4>
          <p className="text-sm text-amber-700 mb-3">
            Get verified to unlock exclusive content, team insights, and professional discussions.
          </p>
          {onRequestVerification && (
            <button 
              onClick={onRequestVerification}
              className="text-sm font-medium text-amber-800 hover:text-amber-900 underline"
            >
              Request verification →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
