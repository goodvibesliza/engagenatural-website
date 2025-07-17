import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Menu, X, Bell, Search, Calendar, Download, ChevronDown,
  BarChart2, Users, FileText, TrendingUp, Activity, Settings, 
  HelpCircle, LogOut, User, Building, Shield, Home
} from 'lucide-react';
import EnhancedBrandDashboard from './EnhancedBrandDashboard';
// Import useAuth from the top-level UpdatedAppWithIntegration.jsx file
import { useAuth } from '../UpdatedAppWithIntegration';

// UI Components
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

const EnhancedBrandHome = () => {
  const { brandId: paramBrandId } = useParams();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const brandId = paramBrandId || "sample-brand";
  
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
    if (signOut) {
      await signOut();
    }
    navigate('/login');
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
  
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar for desktop */}
      <div className="hidden lg:block lg:w-72 flex-shrink-0">
        <div className="h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center text-white font-bold text-lg">
              E
            </div>
            <span className="ml-3 text-lg font-semibold text-gray-800 dark:text-gray-200">EngageNatural</span>
          </div>
          
          {/* Brand selector */}
          <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                  <Building className="h-4 w-4 text-primary" />
                </div>
                <div className="ml-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {brandId}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Brand Manager
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="mb-2 px-3">
              <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Main
              </h3>
            </div>
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`flex items-center w-full px-4 py-2.5 text-sm rounded-md mb-1 transition-colors ${
                  activeSection === item.id 
                    ? 'text-primary-foreground bg-primary font-medium' 
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleSectionChange(item.id)}
              >
                <item.icon className={`h-5 w-5 mr-3 ${activeSection === item.id ? 'text-primary-foreground' : 'text-gray-500 dark:text-gray-400'}`} />
                <div className="flex flex-col items-start">
                  <span>{item.label}</span>
                  {activeSection === item.id && (
                    <span className="text-xs opacity-80">{item.description}</span>
                  )}
                </div>
              </button>
            ))}
            
            <Separator className="my-4" />
            
            <div className="mb-2 px-3">
              <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Account
              </h3>
            </div>
            <button
              className="flex items-center w-full px-4 py-2.5 text-sm rounded-md mb-1 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
              <span>Sign Out</span>
            </button>
          </nav>
          
          {/* User profile section */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Avatar className="h-10 w-10 border border-primary/20">
                <AvatarImage src={userData.avatar} alt={userData.name} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{userData.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{userData.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-72 bg-white dark:bg-gray-800 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:hidden shadow-xl`}
      >
        {/* Mobile sidebar header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center text-white font-bold text-lg">
              E
            </div>
            <span className="ml-3 text-lg font-semibold text-gray-800 dark:text-gray-200">EngageNatural</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Mobile brand selector */}
        <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                <Building className="h-4 w-4 text-primary" />
              </div>
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {brandId}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Brand Manager
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Mobile navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="mb-2 px-3">
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Main
            </h3>
          </div>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`flex items-center w-full px-4 py-2.5 text-sm rounded-md mb-1 transition-colors ${
                activeSection === item.id 
                  ? 'text-primary-foreground bg-primary font-medium' 
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              onClick={() => handleSectionChange(item.id)}
            >
              <item.icon className={`h-5 w-5 mr-3 ${activeSection === item.id ? 'text-primary-foreground' : 'text-gray-500 dark:text-gray-400'}`} />
              <div className="flex flex-col items-start">
                <span>{item.label}</span>
                {activeSection === item.id && (
                  <span className="text-xs opacity-80">{item.description}</span>
                )}
              </div>
            </button>
          ))}
          
          <Separator className="my-4" />
          
          <div className="mb-2 px-3">
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Account
            </h3>
          </div>
          <button
            className="flex items-center w-full px-4 py-2.5 text-sm rounded-md mb-1 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
            <span>Sign Out</span>
          </button>
        </nav>
        
        {/* Mobile user profile section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 border border-primary/20">
              <AvatarImage src={userData.avatar} alt={userData.name} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{userData.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{userData.email}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
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
            
            {/* User profile dropdown */}
            <div className="relative dropdown-container">
              <DropdownMenu open={userDropdownOpen} onOpenChange={setUserDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 flex items-center space-x-2 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userData.avatar} alt={userData.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline-block text-sm">{userData.name}</span>
                    <ChevronDown className="hidden md:block h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userData.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{userData.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>My Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Building className="mr-2 h-4 w-4" />
                    <span>Brand Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Account Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600 focus:text-red-600" onSelect={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {/* Render the appropriate section based on activeSection */}
          {activeSection === 'analytics' && <EnhancedBrandDashboard brandId={brandId} />}
          {activeSection === 'users' && (
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">User Management</h1>
                <p className="text-gray-500 dark:text-gray-400">Manage team members and their access permissions</p>
              </div>
              <Card className="p-6">
                <p>User management content will be displayed here.</p>
              </Card>
            </div>
          )}
          {activeSection === 'content' && (
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Content Management</h1>
                <p className="text-gray-500 dark:text-gray-400">Create, publish and manage your brand content</p>
              </div>
              <Card className="p-6">
                <p>Content management tools will be displayed here.</p>
              </Card>
            </div>
          )}
          {activeSection === 'brand' && (
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Brand Performance</h1>
                <p className="text-gray-500 dark:text-gray-400">Track your brand's performance and engagement metrics</p>
              </div>
              <Card className="p-6">
                <p>Brand performance metrics will be displayed here.</p>
              </Card>
            </div>
          )}
          {activeSection === 'activity' && (
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Activity Feed</h1>
                <p className="text-gray-500 dark:text-gray-400">Recent activity and events from your brand</p>
              </div>
              <Card className="p-6">
                <p>Activity feed will be displayed here.</p>
              </Card>
            </div>
          )}
          {activeSection === 'settings' && (
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Settings</h1>
                <p className="text-gray-500 dark:text-gray-400">Configure your brand settings and preferences</p>
              </div>
              <Card className="p-6">
                <p>Settings options will be displayed here.</p>
              </Card>
            </div>
          )}
          {activeSection === 'help' && (
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Help & Support</h1>
                <p className="text-gray-500 dark:text-gray-400">Resources and documentation to help you succeed</p>
              </div>
              <Card className="p-6">
                <p>Help and support resources will be displayed here.</p>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default EnhancedBrandHome;
