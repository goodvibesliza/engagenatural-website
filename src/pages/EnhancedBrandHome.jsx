import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Menu, X, Bell, Search, Calendar, Download, ChevronDown,
  BarChart2, Users, FileText, TrendingUp, Activity, Settings, HelpCircle 
} from 'lucide-react';
import EnhancedBrandDashboard from './EnhancedBrandDashboard';
import Sidebar from './Sidebar';

const EnhancedBrandHome = () => {
  const { brandId: paramBrandId } = useParams();
  const navigate = useNavigate();
  const brandId = paramBrandId || "sample-brand";
  
  // State for mobile sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // State for active section (analytics, users, content, etc.)
  const [activeSection, setActiveSection] = useState('analytics');
  
  // State for notifications dropdown
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // State for user dropdown
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  // Mock user data
  const user = {
    name: 'Brand Manager',
    email: 'manager@engagenatural.com',
    avatar: null,
    notifications: 3
  };
  
  // Navigation items
  const navItems = [
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'content', label: 'Content Management', icon: FileText },
    { id: 'brand', label: 'Brand Performance', icon: TrendingUp },
    { id: 'activity', label: 'Activity Feed', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Help & Support', icon: HelpCircle }
  ];
  
  // Function to handle section change
  const handleSectionChange = (section) => {
    setActiveSection(section);
    setSidebarOpen(false); // Close mobile sidebar when navigating
  };
  
  // Function to get user initials for avatar
  const getUserInitials = () => {
    if (!user.name) return 'U';
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar for desktop */}
      <div className="hidden lg:block lg:w-64 flex-shrink-0">
        <div className="h-full bg-white border-r border-gray-200">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-lg">
              E
            </div>
            <span className="ml-2 text-lg font-semibold text-gray-800">EngageNatural</span>
          </div>
          
          {/* Navigation */}
          <nav className="mt-5 px-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`flex items-center w-full px-4 py-3 text-sm rounded-md mb-1 ${
                  activeSection === item.id 
                    ? 'text-green-600 bg-green-50 font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => handleSectionChange(item.id)}
              >
                <item.icon className={`h-5 w-5 mr-3 ${activeSection === item.id ? 'text-green-500' : 'text-gray-500'}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Mobile sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:hidden`}
      >
        {/* Mobile sidebar header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-lg">
              E
            </div>
            <span className="ml-2 text-lg font-semibold text-gray-800">EngageNatural</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Mobile navigation */}
        <nav className="mt-5 px-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`flex items-center w-full px-4 py-3 text-sm rounded-md mb-1 ${
                activeSection === item.id 
                  ? 'text-green-600 bg-green-50 font-medium' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => handleSectionChange(item.id)}
            >
              <item.icon className={`h-5 w-5 mr-3 ${activeSection === item.id ? 'text-green-500' : 'text-gray-500'}`} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white border-b border-gray-200 flex items-center justify-between h-16 px-4 lg:px-6">
          {/* Left section: Mobile menu button and search */}
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700 lg:hidden mr-2"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 w-64 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          
          {/* Right section: Actions and user profile */}
          <div className="flex items-center space-x-4">
            {/* Export button */}
            <button className="hidden md:flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50">
              <Download className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-700">Export</span>
            </button>
            
            {/* Date range selector */}
            <button className="hidden md:flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50">
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-700">Last 30 Days</span>
              <ChevronDown className="h-4 w-4 text-gray-600" />
            </button>
            
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-1 rounded-full text-gray-600 hover:bg-gray-100"
              >
                <Bell className="h-6 w-6" />
                {user.notifications > 0 && (
                  <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">
                    {user.notifications}
                  </span>
                )}
              </button>
              
              {/* Notifications dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <div className="p-3 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <div className="p-3 border-b border-gray-100 hover:bg-gray-50">
                      <p className="text-sm text-gray-800 font-medium">New challenge completed</p>
                      <p className="text-xs text-gray-500">User John D. completed the Eco-Shopping challenge</p>
                      <p className="text-xs text-gray-400 mt-1">10 minutes ago</p>
                    </div>
                    <div className="p-3 border-b border-gray-100 hover:bg-gray-50">
                      <p className="text-sm text-gray-800 font-medium">ROI milestone reached</p>
                      <p className="text-xs text-gray-500">Your brand has reached 250% ROI growth</p>
                      <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                    </div>
                    <div className="p-3 hover:bg-gray-50">
                      <p className="text-sm text-gray-800 font-medium">New user registration spike</p>
                      <p className="text-xs text-gray-500">25 new users registered in the last hour</p>
                      <p className="text-xs text-gray-400 mt-1">5 hours ago</p>
                    </div>
                  </div>
                  <div className="p-2 border-t border-gray-200">
                    <button className="w-full text-center text-sm text-green-600 hover:text-green-700 py-1">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* User profile */}
            <div className="relative">
              <button 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2"
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full" />
                  ) : (
                    <span className="text-sm font-medium">{getUserInitials()}</span>
                  )}
                </div>
                <span className="hidden md:inline-block text-sm text-gray-700">{user.name}</span>
                <ChevronDown className="hidden md:block h-4 w-4 text-gray-500" />
              </button>
              
              {/* User dropdown */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <div className="p-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      My Profile
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Account Settings
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Brand Settings
                    </button>
                  </div>
                  <div className="py-1 border-t border-gray-200">
                    <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {/* Render the appropriate section based on activeSection */}
          {activeSection === 'analytics' && <EnhancedBrandDashboard brandId={brandId} />}
          {activeSection === 'users' && (
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-4">User Management</h1>
              <p>User management content will be displayed here.</p>
            </div>
          )}
          {activeSection === 'content' && (
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-4">Content Management</h1>
              <p>Content management tools will be displayed here.</p>
            </div>
          )}
          {activeSection === 'brand' && (
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-4">Brand Performance</h1>
              <p>Brand performance metrics will be displayed here.</p>
            </div>
          )}
          {activeSection === 'activity' && (
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-4">Activity Feed</h1>
              <p>Activity feed will be displayed here.</p>
            </div>
          )}
          {activeSection === 'settings' && (
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-4">Settings</h1>
              <p>Settings options will be displayed here.</p>
            </div>
          )}
          {activeSection === 'help' && (
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-4">Help & Support</h1>
              <p>Help and support resources will be displayed here.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default EnhancedBrandHome;
