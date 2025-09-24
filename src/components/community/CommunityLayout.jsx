// src/components/community/CommunityLayout.jsx
import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';
import { trackEvent } from '../../services/analytics'; // Event instrumentation stub

const CommunityLayout = () => {
  const { isVerified } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    location.pathname.includes('pro') ? 'pro' : 'whats-good'
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    trackEvent('community_tab_change', { from: activeTab, to: tab });
  };

  return (
    <div className="min-h-screen bg-cool-gray">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <h1 className="text-2xl font-heading font-semibold text-deep-moss mb-4">
            Community
          </h1>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-oat-beige rounded-lg p-1">
            <Link
              to="/community/whats-good"
              onClick={() => handleTabChange('whats-good')}
              className={`flex-1 text-center py-2.5 px-4 rounded-md font-medium text-sm transition-colors ${
                activeTab === 'whats-good'
                  ? 'bg-white text-deep-moss shadow-sm'
                  : 'text-warm-gray hover:text-deep-moss'
              }`}
            >
              What's Good
            </Link>
            <Link
              to="/community/pro"
              onClick={() => handleTabChange('pro')}
              className={`flex-1 text-center py-2.5 px-4 rounded-md font-medium text-sm transition-colors ${
                activeTab === 'pro'
                  ? 'bg-white text-deep-moss shadow-sm'
                  : 'text-warm-gray hover:text-deep-moss'
              }`}
            >
              <span className="flex items-center justify-center gap-1">
                Pro Feed
                {!isVerified && (
                  <span className="w-2 h-2 bg-sage-green rounded-full" />
                )}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Outlet />
      </div>
    </div>
  );
};

export default CommunityLayout;
