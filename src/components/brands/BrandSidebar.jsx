import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';
import { useLogout } from '../../hooks/useLogout';
import { trackEvent } from '../../services/analytics';

// UI Components
import { Button } from '../ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

// Icons
import {
  Home,
  Users,
  FileText,
  BarChart3,
  Settings,
  User,
  HelpCircle,
  LogOut,
  Building,
  ChevronDown,
  X
} from 'lucide-react';

/**
 * Desktop sidebar for brand managers with Communities navigation
 * Supports both route-based navigation and section callbacks for Dashboard
 * @param {Object} props
 * @param {boolean} props.sidebarOpen - Mobile sidebar open state
 * @param {Function} props.setSidebarOpen - Mobile sidebar state setter
 * @param {Function} props.onSectionChange - Optional callback for Dashboard section changes
 * @param {string} props.activeSection - Active section ID for Dashboard
 */
export default function BrandSidebar({ sidebarOpen, setSidebarOpen, onSectionChange, activeSection }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { logout } = useLogout();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Get brand info from user
  const brandId = user?.brandId || 'demo-brand';
  const brandName = user?.brandName || brandId;

  // Navigation items - supports both routes and sections via onSectionChange
  const navItems = [
    {
      id: 'analytics',
      label: 'Dashboard',
      icon: Home,
      section: 'analytics',
      description: 'Overview and key metrics'
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      section: 'users',
      description: 'Manage team access'
    },
    {
      id: 'content',
      label: 'Content Management',
      icon: FileText,
      section: 'content',
      description: 'Publish and organize content'
    },
    {
      id: 'samples',
      label: 'Sample Requests',
      icon: FileText,
      section: 'samples',
      description: 'Manage sample requests'
    },
    {
      id: 'communities',
      label: 'Communities',
      icon: Users,
      href: '/brand/communities',
      description: 'All Communities',
      isNew: true
    },
    {
      id: 'brand',
      label: 'Brand Performance',
      icon: BarChart3,
      section: 'brand',
      description: 'Track engagement metrics'
    },
    {
      id: 'activity',
      label: 'Activity Feed',
      icon: FileText,
      section: 'activity',
      description: 'Recent updates and events'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      section: 'settings',
      description: 'Configure brand preferences'
    }
  ];

  const handleNavClick = (item) => {
    // Track navigation
    trackEvent('brand_nav_click', {
      nav_item: item.id,
      brand_id: brandId,
      from_path: location.pathname
    });

    // If item has an href, navigate to route
    if (item.href) {
      localStorage.setItem('en.brand.lastRoute', item.href);
      navigate(item.href);
    }
    // If item has a section and callback is provided, use section callback
    else if (item.section) {
      const target = `/brand?section=${item.section}`;
      // If we're already on the dashboard page and have a handler, update UI immediately
      if (onSectionChange && location.pathname === '/brand') {
        onSectionChange(item.section);
        navigate(target);
      } else {
        // Ensure we are on the dashboard route so section rendering works
        navigate(target);
      }
    }

    // Close mobile sidebar
    if (setSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = async () => {
    trackEvent('brand_logout', {
      brand_id: brandId,
      session_duration: Date.now() - (parseInt(localStorage.getItem('en.brand.sessionStart') || '0'))
    });
    logout();
  };

  const getUserInitials = () => {
    if (!user?.name) return 'BM';
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const SidebarContent = () => (
    <>
      {/* Brand Header with EngageNatural wordmark */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="EngageNatural"
            className="h-6 w-auto object-contain"
            loading="lazy"
          />
          <div className="w-9 h-9 rounded-full bg-brand-primary/90 flex items-center justify-center text-white font-bold text-base">
            {brandName.charAt(0).toUpperCase()}
          </div>
        </div>
        <span className="ml-3 text-lg font-semibold text-gray-800 dark:text-gray-200">
          {brandName}
        </span>
      </div>

      {/* Brand Context */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-md bg-brand-primary/10 flex items-center justify-center">
              <Building className="h-4 w-4 text-brand-primary" />
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>
                Switch Brand (Coming Soon)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3" role="navigation" aria-label="Brand management navigation">
        <div className="mb-2 px-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400" id="brand-nav-heading">
            Brand Management
          </h3>
        </div>
        
        {navItems.map((item, index) => {
          // Check if active based on href route OR section match
          const active = item.href ? isActive(item.href) : (item.section === activeSection);
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              aria-current={active ? 'page' : undefined}
              aria-label={`Navigate to ${item.label}${item.isNew ? ' (New feature)' : ''}`}
              aria-describedby="brand-nav-heading"
              tabIndex={0}
              data-testid={item.id === 'communities' ? 'nav-communities' : `sidebar-${item.id}`}
              className={`flex items-center w-full px-4 py-2.5 text-sm rounded-md mb-1 transition-colors group focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 ${
                active
                  ? 'text-brand-primary bg-brand-primary/10 font-medium border border-brand-primary/20'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <item.icon
                className={`h-5 w-5 mr-3 ${
                  active ? 'text-brand-primary' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'
                }`}
                aria-hidden="true"
              />
              <div className="flex flex-col items-start flex-1">
                <div className="flex items-center">
                  <span>{item.label}</span>
                  {item.isNew && (
                    <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-800">
                      New
                    </Badge>
                  )}
                </div>
                {active && (
                  <span className="text-xs opacity-80">{item.description}</span>
                )}
              </div>
            </button>
          );
        })}

        <Separator className="my-4" />

        <div className="mb-2 px-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Support
          </h3>
        </div>
        
        {(() => {
          const active = activeSection === 'help';
          const onClick = () => {
            const target = '/brand?section=help';
            if (onSectionChange && location.pathname === '/brand') {
              onSectionChange('help');
              navigate(target);
            } else {
              navigate(target);
            }
          };
          return (
            <button 
              onClick={onClick}
              className={`flex items-center w-full px-4 py-2.5 text-sm rounded-md mb-1 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 ${
                active
                  ? 'text-brand-primary bg-brand-primary/10 font-medium border border-brand-primary/20'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              aria-label="Access help and support resources"
            >
              <HelpCircle className={`h-5 w-5 mr-3 ${active ? 'text-brand-primary' : 'text-gray-500 dark:text-gray-400'}`} aria-hidden="true" />
              <span>Help & Support</span>
            </button>
          );
        })()}

        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2.5 text-sm rounded-md mb-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          aria-label="Sign out of your account"
        >
          <LogOut className="h-5 w-5 mr-3" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <DropdownMenu open={userDropdownOpen} onOpenChange={setUserDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center w-full p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
              <Avatar className="h-10 w-10 border border-brand-primary/20">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-brand-primary/10 text-brand-primary">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3 text-left flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user?.name || 'Brand Manager'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email || 'manager@brand.com'}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.name || 'Brand Manager'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || 'manager@brand.com'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Building className="mr-2 h-4 w-4" />
              <span>Brand Profile</span>
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
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-1 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-800 shadow-xl">
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-brand-primary/90 flex items-center justify-center text-white font-bold text-lg">
                  {brandName.charAt(0).toUpperCase()}
                </div>
                <span className="ml-3 text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {brandName}
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex flex-col flex-1 overflow-y-auto">
              <SidebarContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
}