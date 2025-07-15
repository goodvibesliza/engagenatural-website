import React, { useState } from "react";
import { useParams } from "react-router-dom";
import SimpleBrandDashboard from "./SimpleBrandDashboard";

/**
 * SimpleBrandHome.jsx
 * 
 * A simplified version of BrandHome that:
 * 1. Directly includes SimpleBrandDashboard for the analytics tab
 * 2. Uses minimal dependencies
 * 3. Has placeholder components for other tabs
 * 4. Doesn't make any Firebase calls
 * 5. Has simple authentication checks that won't cause errors
 */

// -------------------------------------------------------------------------
// Simple UI Components - These replace shadcn/ui dependencies
// -------------------------------------------------------------------------

// Simple Button Component
const Button = ({ children, className = "", onClick, ...props }) => (
  <button
    className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${className}`}
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
);

// Simple Avatar Component
const Avatar = ({ src, alt, initials, className = "", ...props }) => (
  <div 
    className={`w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden ${className}`}
    {...props}
  >
    {src ? (
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    ) : (
      <span className="text-gray-700 font-medium">{initials}</span>
    )}
  </div>
);

// Simple Dropdown Component
const Dropdown = ({ isOpen, toggle, children }) => {
  return isOpen ? (
    <div className="relative">
      <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
        <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
          {children}
        </div>
      </div>
    </div>
  ) : null;
};

// -------------------------------------------------------------------------
// Mock Components for Tabs
// -------------------------------------------------------------------------

// Mock BrandChallenges Component
const MockBrandChallenges = ({ brandId }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h2 className="text-xl font-bold mb-4">Challenges (Mock)</h2>
    <p className="text-gray-600 mb-4">This is a placeholder for the Challenges tab.</p>
    <div className="space-y-4">
      <div className="p-4 border rounded-lg">
        <h3 className="font-medium">Summer Sales Challenge</h3>
        <p className="text-sm text-gray-500">Increase sales by 15% during summer months</p>
        <div className="mt-2 flex justify-between">
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
          <span className="text-xs text-gray-500">42 participants</span>
        </div>
      </div>
      <div className="p-4 border rounded-lg">
        <h3 className="font-medium">Product Knowledge Quiz</h3>
        <p className="text-sm text-gray-500">Test retail staff on product features</p>
        <div className="mt-2 flex justify-between">
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Upcoming</span>
          <span className="text-xs text-gray-500">18 participants</span>
        </div>
      </div>
    </div>
  </div>
);

// Mock BrandContentUploader Component
const MockBrandContentUploader = ({ brandId }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h2 className="text-xl font-bold mb-4">Content Upload (Mock)</h2>
    <p className="text-gray-600 mb-4">This is a placeholder for the Content Upload tab.</p>
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      <p className="mt-2 text-sm text-gray-600">Drag and drop files here or click to browse</p>
      <p className="mt-1 text-xs text-gray-500">Supported formats: JPG, PNG, PDF, MP4</p>
      <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Select Files
      </button>
    </div>
  </div>
);

// Mock CommunityFeed Component
const MockCommunityFeed = ({ brandId }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h2 className="text-xl font-bold mb-4">Community Feed (Mock)</h2>
    <p className="text-gray-600 mb-4">This is a placeholder for the Community tab.</p>
    <div className="space-y-4">
      <div className="p-4 border rounded-lg">
        <div className="flex items-center mb-2">
          <Avatar initials="JD" />
          <div className="ml-3">
            <p className="font-medium">John Doe</p>
            <p className="text-xs text-gray-500">2 hours ago</p>
          </div>
        </div>
        <p className="text-gray-700">Just completed the sustainability training! Learned so much about the brand's eco-friendly initiatives.</p>
        <div className="mt-2 flex space-x-4 text-gray-500 text-sm">
          <button className="flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            Like (24)
          </button>
          <button className="flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Comment (8)
          </button>
        </div>
      </div>
      <div className="p-4 border rounded-lg">
        <div className="flex items-center mb-2">
          <Avatar initials="AS" />
          <div className="ml-3">
            <p className="font-medium">Alice Smith</p>
            <p className="text-xs text-gray-500">5 hours ago</p>
          </div>
        </div>
        <p className="text-gray-700">Excited to announce our store exceeded sales targets this month! The new product training really helped.</p>
        <div className="mt-2 flex space-x-4 text-gray-500 text-sm">
          <button className="flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            Like (36)
          </button>
          <button className="flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Comment (12)
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Mock BrandPosting Component
const MockBrandPosting = ({ brandId }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h2 className="text-xl font-bold mb-4">Post as Brand (Mock)</h2>
    <p className="text-gray-600 mb-4">This is a placeholder for the Brand Posting tab.</p>
    <div className="border rounded-lg p-4">
      <textarea
        className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows="4"
        placeholder="What would you like to share with your community?"
      ></textarea>
      <div className="mt-3 flex justify-between items-center">
        <div className="flex space-x-2">
          <button className="p-2 text-gray-500 hover:text-blue-500">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button className="p-2 text-gray-500 hover:text-blue-500">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button className="p-2 text-gray-500 hover:text-blue-500">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
        </div>
        <Button>Post</Button>
      </div>
    </div>
  </div>
);

// Mock BrandConfiguration Component
const MockBrandConfiguration = ({ brandId }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h2 className="text-xl font-bold mb-4">Brand Configuration (Mock)</h2>
    <p className="text-gray-600 mb-4">This is a placeholder for the Configuration tab.</p>
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Brand Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value="Sample Brand"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value="https://example.com"
              readOnly
            />
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-medium mb-2">Brand Colors</h3>
        <div className="flex space-x-4">
          <div>
            <div className="h-10 w-10 rounded-full bg-blue-600"></div>
            <p className="text-xs text-center mt-1">Primary</p>
          </div>
          <div>
            <div className="h-10 w-10 rounded-full bg-blue-800"></div>
            <p className="text-xs text-center mt-1">Secondary</p>
          </div>
          <div>
            <div className="h-10 w-10 rounded-full bg-gray-200"></div>
            <p className="text-xs text-center mt-1">Background</p>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button>Save Changes</Button>
      </div>
    </div>
  </div>
);

/**
 * SimpleBrandHome Component
 * A simplified version of BrandHome that works without Firebase or external dependencies
 */
export default function SimpleBrandHome() {
  const { brandId: paramBrandId } = useParams();
  const brandId = paramBrandId || "sample-brand";
  
  // Mock user data - no Firebase authentication
  const mockUser = {
    displayName: "Brand Manager",
    email: "brand@example.com",
    photoURL: null,
    brandId: brandId,
    isBrandManager: true,
    isSuperAdmin: false
  };
  
  // Simple state for tabs and dropdown
  const [tab, setTab] = useState("analytics");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  // Mock permissions - always return true for simplicity
  const hasPermission = () => true;
  
  // Mock tabs configuration
  const TABS = [
    { key: "analytics", label: "Analytics" },
    { key: "challenges", label: "Challenges" },
    { key: "upload", label: "Content Upload" },
    { key: "community", label: "Community" },
    { key: "brand-posting", label: "Post as Brand" },
    { key: "configuration", label: "Configuration" },
  ];
  
  // Helper function to get initials from name
  const getInitials = (name) => {
    if (!name) return 'BM';
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.length > 2 ? initials.substring(0, 2) : initials;
  };
  
  // Mock logout function
  const handleLogout = () => {
    console.log("Mock logout function called");
    window.location.href = "/login";
  };
  
  // Render tab content based on selected tab
  const renderTabContent = () => {
    switch (tab) {
      case "analytics":
        return <SimpleBrandDashboard brandId={brandId} />;
      case "challenges":
        return <MockBrandChallenges brandId={brandId} />;
      case "upload":
        return <MockBrandContentUploader brandId={brandId} />;
      case "community":
        return <MockCommunityFeed brandId={brandId} />;
      case "brand-posting":
        return <MockBrandPosting brandId={brandId} />;
      case "configuration":
        return <MockBrandConfiguration brandId={brandId} />;
      default:
        return <SimpleBrandDashboard brandId={brandId} />;
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto p-6 relative">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brand Admin</h1>
          <p className="text-gray-600 mt-1">
            {mockUser.isBrandManager && `Managing ${brandId}`}
            {mockUser.isSuperAdmin && `Super Admin - Managing ${brandId}`}
          </p>
        </div>
        
        {/* Simple User Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center space-x-2 focus:outline-none"
          >
            <Avatar 
              initials={getInitials(mockUser.displayName)} 
              src={mockUser.photoURL} 
              alt={mockUser.displayName} 
            />
            <span className="hidden md:inline-block text-gray-700">{mockUser.displayName}</span>
            <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <Dropdown isOpen={showProfileDropdown} toggle={setShowProfileDropdown}>
            <div className="px-4 py-3 border-b">
              <p className="text-sm font-medium">{mockUser.displayName}</p>
              <p className="text-xs text-gray-500">{mockUser.email}</p>
            </div>
            <button 
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => console.log("Profile clicked")}
            >
              My Profile
            </button>
            <button 
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => console.log("Settings clicked")}
            >
              Settings
            </button>
            <button 
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              onClick={handleLogout}
            >
              Logout
            </button>
          </Dropdown>
        </div>
      </header>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`${
                tab === t.key
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Tab Content */}
      <main>
        {renderTabContent()}
      </main>
    </div>
  );
}
