import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Import Lucide icons for UI elements
import { 
  Menu, X, Bell, Search, Calendar, Download, ChevronDown,
  BarChart2, Users, FileText, TrendingUp, Activity, Settings, 
  HelpCircle, Edit, List, Eye, Calculator, Template, Layout,
  Upload, MessageSquare, Award, Sliders, AlertTriangle
} from 'lucide-react';

// Import existing brand components - using dynamic imports with React.lazy for better performance
// This allows components to be loaded only when needed
const BrandAnalyticsPage = React.lazy(() => import('./brand/BrandAnalyticsPage'));
const BrandCommunityPage = React.lazy(() => import('./brand/BrandCommunityPage'));
const BrandContentEditorPage = React.lazy(() => import('./brand/BrandContentEditorPage'));
const BrandContentListPage = React.lazy(() => import('./brand/BrandContentListPage'));
const BrandContentViewPage = React.lazy(() => import('./brand/BrandContentViewPage'));
const BrandDashboardPage = React.lazy(() => import('./brand/BrandDashboardPage'));
const BrandROICalculatorPage = React.lazy(() => import('./brand/BrandROICalculatorPage'));
const BrandTemplatesPage = React.lazy(() => import('./brand/BrandTemplatesPage'));
const BrandTemplateViewPage = React.lazy(() => import('./brand/BrandTemplateViewPage'));
const BrandChallenges = React.lazy(() => import('./brand/BrandChallenges'));
const BrandConfiguration = React.lazy(() => import('./brand/BrandConfiguration'));
const BrandContentManager = React.lazy(() => import('./brand/BrandContentManager'));
const BrandContentUploader = React.lazy(() => import('./brand/BrandContentUploader'));
const BrandMenu = React.lazy(() => import('./brand/BrandMenu'));
const BrandPosting = React.lazy(() => import('./brand/BrandPosting'));
const CommunityFeed = React.lazy(() => import('./brand/CommunityFeed'));

/**
 * ErrorBoundary Component
 * Catches errors in child components and displays a fallback UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error information for debugging
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI when an error occurs
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
            <h2 className="text-xl font-bold text-red-700">Component Error</h2>
          </div>
          <p className="text-red-600 mb-4">
            {this.props.componentName ? 
              `The ${this.props.componentName} component couldn't be loaded.` : 
              'This component encountered an error.'}
          </p>
          <details className="whitespace-pre-wrap text-sm mb-4">
            <summary className="text-red-600 font-medium cursor-pointer mb-2">View error details</summary>
            <p className="text-red-800 font-mono bg-red-50 p-4 rounded overflow-auto">
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </p>
          </details>
          <button 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" 
            onClick={() => this.setState({ hasError: false })}
          >
            Try Again
          </button>
          {this.props.onReset && (
            <button 
              className="px-4 py-2 ml-2 bg-gray-600 text-white rounded hover:bg-gray-700" 
              onClick={this.props.onReset}
            >
              Go Back
            </button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * ComponentLoader
 * Handles loading components with Suspense and ErrorBoundary
 */
const ComponentLoader = ({ component: Component, componentName, brandId, onReset, ...props }) => {
  return (
    <ErrorBoundary componentName={componentName} onReset={onReset}>
      <Suspense fallback={
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          <span className="ml-3 text-gray-600">Loading {componentName}...</span>
        </div>
      }>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <Component brandId={brandId} {...props} />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * IntegratedBrandDashboard Component
 * Main dashboard component that integrates all brand components
 */
const IntegratedBrandDashboard = () => {
  const { brandId: paramBrandId } = useParams();
  const navigate = useNavigate();
  const brandId = paramBrandId || "sample-brand";
  
  // State for mobile sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // State for active section and subsection
  const [activeSection, setActiveSection] = useState('dashboard');
  const [activeSubsection, setActiveSubsection] = useState(null);
  
  // State for notifications dropdown
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // State for user dropdown
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  // State for date range
  const [dateRange, setDateRange] = useState('Last 30 Days');
  
  // Mock user data - would be replaced with actual auth context in a real app
  const user = {
    name: 'Brand Manager',
    email: 'manager@engagenatural.com',
    avatar: null,
    notifications: 3
  };
  
  // Navigation items configuration
  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: BarChart2,
      component: BrandDashboardPage,
      subsections: []
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: TrendingUp,
      component: BrandAnalyticsPage,
      subsections: [
        { id: 'roi', label: 'ROI Calculator', component: BrandROICalculatorPage }
      ]
    },
    { 
      id: 'content', 
      label: 'Content', 
      icon: FileText,
      component: BrandContentListPage,
      subsections: [
        { id: 'editor', label: 'Editor', component: BrandContentEditorPage },
        { id: 'view', label: 'View Content', component: BrandContentViewPage },
        { id: 'manage', label: 'Content Manager', component: BrandContentManager },
        { id: 'upload', label: 'Upload Content', component: BrandContentUploader }
      ]
    },
    { 
      id: 'templates', 
      label: 'Templates', 
      icon: Layout,
      component: BrandTemplatesPage,
      subsections: [
        { id: 'view', label: 'View Template', component: BrandTemplateViewPage }
      ]
    },
    { 
      id: 'community', 
      label: 'Community', 
      icon: Users,
      component: BrandCommunityPage,
      subsections: [
        { id: 'feed', label: 'Feed', component: CommunityFeed }
      ]
    },
    { 
      id: 'challenges', 
      label: 'Challenges', 
      icon: Award,
      component: BrandChallenges,
      subsections: []
    },
    { 
      id: 'posting', 
      label: 'Brand Posting', 
      icon: MessageSquare,
      component: BrandPosting,
      subsections: []
    },
    { 
      id: 'configuration', 
      label: 'Configuration', 
      icon: Sliders,
      component: BrandConfiguration,
      subsections: []
    },
    { 
      id: 'menu', 
      label: 'Brand Menu', 
      icon: Menu,
      component: BrandMenu,
      subsections: []
    }
  ];
  
  // Function to handle section change
  const handleSectionChange = (section, subsection = null) => {
    setActiveSection(section);
    setActiveSubsection(subsection);
    setSidebarOpen(false); // Close mobile sidebar when navigating
  };
  
  // Function to get user initials for avatar
  const getUserInitials = () => {
    if (!user.name) return 'U';
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Function to get active component based on active section and subsection
  const getActiveComponent = () => {
    const section = navItems.find(item => item.id === activeSection);
    if (!section) return null;
    
    if (activeSubsection) {
      const subsection = section.subsections.find(sub => sub.id === activeSubsection);
      return subsection ? subsection.component : section.component;
    }
    
    return section.component;
  };

  // Get the active component
  const ActiveComponent = getActiveComponent();
  
  // Get the active component name for display
  const getActiveComponentName = () => {
    const section = navItems.find(item => item.id === activeSection);
    if (!section) return 'Dashboard';
    
    if (activeSubsection) {
      const subsection = section.subsections.find(sub => sub.id === activeSubsection);
      return subsection ? `${section.label} - ${subsection.label}` : section.label;
    }
    
    return section.label;
  };

  // Reset function for error boundary - goes back to dashboard
  const handleErrorReset = () => {
    setActiveSection('dashboard');
    setActiveSubsection(null);
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
        <div className="h-full bg-white border-r border-gray-200 overflow-y-auto">
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
              <div key={item.id} className="mb-2">
                <button
                  className={`flex items-center w-full px-4 py-3 text-sm rounded-md ${
                    activeSection === item.id 
                      ? 'text-green-600 bg-green-50 font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => handleSectionChange(item.id)}
                >
                  <item.icon className={`h-5 w-5 mr-3 ${activeSection === item.id ? 'text-green-500' : 'text-gray-500'}`} />
                  <span>{item.label}</span>
                </button>
                
                {/* Subsections */}
                {activeSection === item.id && item.subsections.length > 0 && (
                  <div className="ml-9 mt-1 space-y-1">
                    {item.subsections.map(sub => (
                      <button
                        key={sub.id}
                        className={`flex items-center w-full px-3 py-2 text-xs rounded-md ${
                          activeSubsection === sub.id 
                            ? 'text-green-600 bg-green-50 font-medium' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => handleSectionChange(item.id, sub.id)}
                      >
                        <span>{sub.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
        <nav className="mt-5 px-2 overflow-y-auto h-full pb-20">
          {navItems.map((item) => (
            <div key={item.id} className="mb-2">
              <button
                className={`flex items-center w-full px-4 py-3 text-sm rounded-md ${
                  activeSection === item.id 
                    ? 'text-green-600 bg-green-50 font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => handleSectionChange(item.id)}
              >
                <item.icon className={`h-5 w-5 mr-3 ${activeSection === item.id ? 'text-green-500' : 'text-gray-500'}`} />
                <span>{item.label}</span>
              </button>
              
              {/* Subsections for mobile */}
              {activeSection === item.id && item.subsections.length > 0 && (
                <div className="ml-9 mt-1 space-y-1">
                  {item.subsections.map(sub => (
                    <button
                      key={sub.id}
                      className={`flex items-center w-full px-3 py-2 text-xs rounded-md ${
                        activeSubsection === sub.id 
                          ? 'text-green-600 bg-green-50 font-medium' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => handleSectionChange(item.id, sub.id)}
                    >
                      <span>{sub.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
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
              <span className="text-sm text-gray-700">{dateRange}</span>
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
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-6">
          {/* Page header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{getActiveComponentName()}</h1>
              <p className="text-sm text-gray-600">
                {activeSection === 'dashboard' ? 'Overview of engagement metrics and performance indicators' : `Manage your brand's ${getActiveComponentName().toLowerCase()}`}
              </p>
            </div>
            <div className="flex items-center space-x-2 mt-2 md:mt-0">
              <button className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">Last 30 Days</span>
              </button>
              <button className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50">
                <Download className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">Export Report</span>
              </button>
            </div>
          </div>
          
          {/* Error boundary wrapper for the entire active component */}
          <ErrorBoundary 
            componentName={getActiveComponentName()} 
            onReset={handleErrorReset}
          >
            {/* Render the active component */}
            {ActiveComponent ? (
              <ComponentLoader 
                component={ActiveComponent} 
                componentName={getActiveComponentName()} 
                brandId={brandId}
                onReset={handleErrorReset}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">Component Not Found</h3>
                <p className="text-gray-600 mb-4">The requested component could not be found.</p>
                <button 
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  onClick={() => handleSectionChange('dashboard')}
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default IntegratedBrandDashboard;
