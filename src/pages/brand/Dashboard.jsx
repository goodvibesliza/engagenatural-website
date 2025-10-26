import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, Outlet, useOutlet } from 'react-router-dom';
import { 
  Menu, Bell, Search, Calendar, Download, ChevronDown,
  BarChart2, Users, FileText, TrendingUp, Activity, Settings, 
  HelpCircle, Package
} from 'lucide-react';
import { useAuth } from "../../contexts/auth-context";

// New content management component
import IntegratedContentManager from './ContentManager';
// Consistent logout hook
import { useLogout } from '../../hooks/useLogout';

// UI Components
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
// Communities manager
import CommunitiesManager from '../../components/brand/communities/CommunitiesManager';
// Brand Sidebar component
import BrandSidebar from '../../components/brands/BrandSidebar';
// Extracted sections
import AnalyticsSection from './dashboard/AnalyticsSection';
import SampleRequestsSection from './dashboard/SampleRequestsSection';
import UsersSection from './dashboard/UsersSection';
import BrandPerformanceSection from './dashboard/BrandPerformanceSection';
import ActivitySection from './dashboard/ActivitySection';
import SettingsSection from './dashboard/SettingsSection';
import HelpSection from './dashboard/HelpSection';

// Brand Dashboard Content moved to ./dashboard/AnalyticsSection.jsx

const EnhancedBrandHome = () => {
  const { brandId: paramBrandId } = useParams();
  const navigate = useNavigate();
  const outlet = useOutlet();
  const { user, signOut } = useAuth();
  // Centralised logout that always redirects to PublicWebsite
  const { logout } = useLogout();
  // Determine active brandId in priority order:
  // 1) brand chosen in sidebar (saved in localStorage)
  // 2) brandId on the authenticated user document
  // 3) brandId from URL params
  // 4) default seeded brand ("demo-brand")
  const storedBrandId =
    typeof window !== 'undefined' ? localStorage.getItem('selectedBrandId') : null;
  const brandId = storedBrandId || user?.brandId || paramBrandId || 'demo-brand';
  
  // State for mobile sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // State for active section (analytics, users, content, etc.)
  const [activeSection, setActiveSection] = useState('analytics');
  
  // State for notifications dropdown
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // State for user dropdown
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsOpen || userDropdownOpen) {
        if (!event.target.closest('.dropdown-container')) {
          setNotificationsOpen(false);
          setUserDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsOpen, userDropdownOpen]);
  
  // Mock user data - use actual user data if available
  const userData = user || {
    name: 'Brand Manager',
    email: 'manager@engagenatural.com',
    avatar: null,
    notifications: 3
  };
  
  // Navigation items with enhanced styling
  const navItems = [
    { id: 'analytics', label: 'Analytics Dashboard', icon: BarChart2, description: 'Key metrics and ROI' },
    { id: 'users', label: 'User Management', icon: Users, description: 'Manage team access' },
    { id: 'content', label: 'Content Management', icon: FileText, description: 'Publish and organize content' },
    { id: 'samples', label: 'Sample Requests', icon: Package, description: 'Manage sample requests' },
    { id: 'communities', label: 'Communities', icon: Users, description: 'All Communities' },
    { id: 'brand', label: 'Brand Performance', icon: TrendingUp, description: 'Track engagement metrics' },
    { id: 'activity', label: 'Activity Feed', icon: Activity, description: 'Recent updates and events' },
    { id: 'settings', label: 'Settings', icon: Settings, description: 'Configure brand preferences' },
    { id: 'help', label: 'Help & Support', icon: HelpCircle, description: 'Documentation and resources' }
  ];
  
  // Function to handle section change
  const handleSectionChange = (section) => {
    setActiveSection(section);
    setSidebarOpen(false); // Close mobile sidebar when navigating
  };
  
  // Function to get user initials for avatar
  const getUserInitials = () => {
    if (!userData.name) return 'U';
    return userData.name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Handle logout
  const handleLogout = async () => {
    // use standardised logout flow
    logout();
  };
  
  // Mock notifications
  const notifications = [
    {
      id: 1,
      title: 'New challenge completed',
      description: 'User John D. completed the Eco-Shopping challenge',
      time: '10 minutes ago',
      read: false
    },
    {
      id: 2,
      title: 'ROI milestone reached',
      description: 'Your brand has reached 250% ROI growth',
      time: '2 hours ago',
      read: false
    },
    {
      id: 3,
      title: 'New user registration spike',
      description: '25 new users registered in the last hour',
      time: '5 hours ago',
      read: true
    }
  ];

  // SampleRequestsSection extracted to ./dashboard/SampleRequestsSection.jsx
  
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Brand Sidebar - replaces old desktop + mobile sidebar */}
      <BrandSidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onSectionChange={handleSectionChange}
        activeSection={activeSection}
      />
      {/* Main content */}
      <div className="flex-1 lg:pl-72 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between h-16 px-4 lg:px-6">
          {/* Left section: Mobile menu button and breadcrumbs */}
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 lg:hidden mr-3"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Breadcrumbs */}
            <div className="hidden md:flex items-center text-sm">
              <Link to="/" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                Home
              </Link>
              <span className="mx-2 text-gray-400 dark:text-gray-500">/</span>
              <Link to={`/brand/${brandId}`} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                Brands
              </Link>
              <span className="mx-2 text-gray-400 dark:text-gray-500">/</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">
                {navItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
              </span>
            </div>
            
            <div className="md:hidden text-lg font-semibold text-gray-900 dark:text-gray-100">
              {navItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
            </div>
          </div>
          
          {/* Right section: Actions and user profile */}
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 w-64 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:text-gray-200 text-sm"
              />
            </div>
            
            {/* Export button */}
            <Button variant="outline" size="sm" className="hidden md:flex items-center space-x-1">
              <Download className="h-4 w-4 mr-1" />
              <span>Export</span>
            </Button>
            
            {/* Date range selector */}
            <Button variant="outline" size="sm" className="hidden md:flex items-center space-x-1">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Last 30 Days</span>
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
            
            {/* Notifications dropdown */}
            <div className="relative dropdown-container">
              <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative h-9 w-9 rounded-full p-0">
                    <Bell className="h-5 w-5" />
                    {userData.notifications > 0 && (
                      <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-white dark:ring-gray-800"></span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Notifications</h3>
                      <Badge variant="outline" className="text-xs">
                        {notifications.filter(n => !n.read).length} new
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.map(notification => (
                    <DropdownMenuItem key={notification.id} className="p-0 focus:bg-transparent">
                      <div className={`w-full p-3 border-l-2 ${notification.read ? 'border-transparent' : 'border-primary'} hover:bg-muted/50`}>
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <span className="text-xs text-muted-foreground">{notification.time}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{notification.description}</p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="justify-center text-center text-sm text-primary">
                    View all notifications
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {/* Render outlet content if available, otherwise render section content */}
          {outlet ? (
            <div className="w-full p-0 md:p-6">{outlet}</div>
          ) : (
            <>
              {activeSection === 'analytics' && <AnalyticsSection brandId={brandId} />}
              {activeSection === 'users' && <UsersSection />}
              {activeSection === 'content' && (
                /* Full-width workspace for the content manager */
                <div className="w-full p-0 md:p-6">
                  {/* Render the integrated content-management system */}
                  <IntegratedContentManager brandId={brandId} />
                </div>
              )}
              {activeSection === 'samples' && (
                <div className="w-full p-6">
                  <SampleRequestsSection brandId={brandId} />
                </div>
              )}
              {activeSection === 'communities' && (
                <div className="w-full p-0 md:p-6">
                  <CommunitiesManager brandId={brandId} />
                </div>
              )}
              {activeSection === 'brand' && <BrandPerformanceSection />}
              {activeSection === 'activity' && <ActivitySection />}
              {activeSection === 'settings' && <SettingsSection brandId={brandId} />}
              {activeSection === 'help' && <HelpSection />}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default EnhancedBrandHome;
