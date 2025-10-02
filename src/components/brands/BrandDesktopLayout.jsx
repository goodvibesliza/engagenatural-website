import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';
import { trackEvent } from '../../services/analytics';
import BrandSidebar from './BrandSidebar';

// UI Components
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

// Icons
import { Menu, Settings } from 'lucide-react';

/**
 * Desktop-only layout wrapper for brand management routes
 * Enforces 1024px minimum width and provides consistent sidebar navigation
 */
export default function BrandDesktopLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track session start
  useEffect(() => {
    if (user?.brandId && isDesktop) {
      trackEvent('brand_session_start', {
        brand_id: user.brandId,
        user_role: user.role,
        viewport_width: window.innerWidth
      });

      // Store session start time for duration tracking
      localStorage.setItem('en.brand.sessionStart', Date.now().toString());

      // Restore last route if available
      const lastRoute = localStorage.getItem('en.brand.lastRoute');
      if (lastRoute && window.location.pathname === '/brands') {
        navigate(lastRoute);
      }
    }
  }, [user, isDesktop, navigate]);

  // Non-brand users get redirected with friendly message
  if (!user?.brandId || user?.role !== 'brand_manager') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto text-center border-red-200 bg-red-50">
          <CardHeader>
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Settings className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-red-800">Access Restricted</CardTitle>
            <CardDescription className="text-red-600">
              Brand management tools are only available to approved brand managers. 
              Please contact your administrator if you believe this is an error.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Mobile blocking banner - desktop only enforcement
  if (!isDesktop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" data-testid="brand-desktop-only-banner">
        <Card className="max-w-md mx-auto text-center border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <Settings className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle className="text-orange-800">Desktop Required</CardTitle>
            <CardDescription className="text-orange-600">
              Brand tools are desktop-only. Please use a larger screen (1024px or wider) to access brand management features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-orange-500 mt-4">
              Current width: {window.innerWidth}px
              <br />
              Required: 1024px minimum
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <BrandSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="p-2"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="font-semibold text-gray-800">
            {user?.brandName || user?.brandId || 'Brand Manager'}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}