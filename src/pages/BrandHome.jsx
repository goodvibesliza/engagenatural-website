import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/auth-context";
import BrandDashboard from "./BrandDashboard";
import BrandChallenges from "./BrandChallenges";
import BrandContentUploader from "./BrandContentUploader";
import BrandConfiguration from "./BrandConfiguration";
import BrandPosting from "./BrandPosting";
import CommunityFeed from "./CommunityFeed";

export default function BrandHome() {
  const { brandId } = useParams();
  const authContext = useAuth();
  
  // Handle both old and new auth context structures
  const {
    hasPermission = () => true, // Default fallback
    canCreateChallenge = () => true,
    canPostAsBrand = () => true,
    isBrandManager = () => false,
    isSuperAdmin = () => false,
    userProfile = {},
    PERMISSIONS = {
      VIEW_ANALYTICS: 'view_analytics',
      UPLOAD_CONTENT: 'upload_content',
      VIEW_COMMUNITIES: 'view_communities'
    }
  } = authContext || {};
  
  const [tab, setTab] = useState("analytics");

  // Check if user has access to this brand
  if (isBrandManager() && userProfile?.brandId !== brandId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Access Restricted</h2>
          <p className="text-gray-600 mb-4">
            You can only access your own brand dashboard.
          </p>
          <button 
            onClick={() => window.location.href = `/brand/${userProfile.brandId}`}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Your Brand Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Build tabs array based on permissions
  const buildTabs = () => {
    const tabs = [];
    
    // Analytics tab - available if user has analytics permission or fallback
    if (hasPermission(PERMISSIONS.VIEW_ANALYTICS)) {
      tabs.push({ key: "analytics", label: "Analytics" });
    }
    
    // Challenges tab - available if user can create challenges or fallback
    if (canCreateChallenge()) {
      tabs.push({ key: "challenges", label: "Challenges" });
    }
    
    // Upload tab - available if user can upload content or fallback
    if (hasPermission(PERMISSIONS.UPLOAD_CONTENT)) {
      tabs.push({ key: "upload", label: "Content Upload" });
    }
    
    // Community tab - available if user can view communities or fallback
    if (hasPermission(PERMISSIONS.VIEW_COMMUNITIES)) {
      tabs.push({ key: "community", label: "Community" });
    }
    
    // Brand Posting tab - available if user can post as brand
    if (canPostAsBrand()) {
      tabs.push({ key: "brand-posting", label: "Post as Brand" });
    }
    
    // Configuration tab - available for brand managers and super admins
    if (isBrandManager() || isSuperAdmin()) {
      tabs.push({ key: "configuration", label: "Configuration" });
    }
    
    // If no tabs are available (shouldn't happen with fallbacks), add analytics
    if (tabs.length === 0) {
      tabs.push({ key: "analytics", label: "Analytics" });
    }
    
    return tabs;
  };

  const TABS = buildTabs();

  // Set default tab to first available tab if current tab is not available
  React.useEffect(() => {
    if (!TABS.find(t => t.key === tab)) {
      setTab(TABS[0]?.key || "analytics");
    }
  }, [TABS, tab]);

  const renderTabContent = () => {
    switch (tab) {
      case "analytics":
        return <BrandDashboard brandId={brandId} />;
        
      case "challenges":
        return <BrandChallenges brandId={brandId} />;
        
      case "upload":
        return <BrandContentUploader brandId={brandId} />;
        
      case "community":
        return <CommunityFeed brandId={brandId} />;
        
      case "brand-posting":
        return <BrandPosting brandId={brandId} />;
        
      case "configuration":
        return <BrandConfiguration brandId={brandId} />;
        
      default:
        return <BrandDashboard brandId={brandId} />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Brand Admin</h1>
        <p className="text-gray-600">
          {isBrandManager() && `Managing ${userProfile?.brandId || brandId}`}
          {isSuperAdmin() && `Super Admin - Managing ${brandId}`}
          {!isBrandManager() && !isSuperAdmin() && `Managing ${brandId}`}
        </p>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded whitespace-nowrap transition-colors ${
              tab === t.key
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="bg-white rounded shadow p-4">
        {renderTabContent()}
      </div>
      
      {/* Permission System Status */}
      {!authContext?.PERMISSIONS && (
        <div className="mt-8 p-4 bg-yellow-100 border border-yellow-400 rounded">
          <h3 className="font-bold text-yellow-800 mb-2">⚠️ Permission System Not Active</h3>
          <p className="text-yellow-700 text-sm">
            You're using the basic auth context. To enable the full permission system with brand manager restrictions, 
            replace your auth-context.jsx with the enhanced version that includes PERMISSIONS.
          </p>
        </div>
      )}
      
      {/* Debug Info for Development */}
      {process.env.NODE_ENV === 'development' && authContext?.PERMISSIONS && (
        <div className="mt-8 p-4 bg-gray-100 rounded text-sm">
          <h3 className="font-bold mb-2">Debug Info (Development Only):</h3>
          <p><strong>User Role:</strong> {userProfile?.role || 'Not set'}</p>
          <p><strong>Brand ID:</strong> {userProfile?.brandId || 'Not set'}</p>
          <p><strong>Current Brand:</strong> {brandId}</p>
          <p><strong>Available Tabs:</strong> {TABS.map(t => t.label).join(', ')}</p>
          <p><strong>Permission System:</strong> {authContext?.PERMISSIONS ? '✅ Active' : '❌ Not Active'}</p>
        </div>
      )}
    </div>
  );
}

