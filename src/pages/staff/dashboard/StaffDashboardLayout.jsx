import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/auth-context';
import useIsMobile from '../../../hooks/useIsMobile.js';
import { getFlag } from '../../../lib/featureFlags.js';
import NavBarBottom from '../../../components/mobile/NavBarBottom.jsx';
import TopBarCollapsible from '../../../components/mobile/TopBarCollapsible.jsx';

/**
 * Staff dashboard layout component that renders the header, user avatar menu, responsive sidebar, and main content area for nested routes.
 *
 * Displays the current user's name and store information in the header, provides an avatar button that toggles a dropdown with profile links and a sign-out action (navigates the browser to "/?logout=true"), and renders a responsive navigation sidebar with links for staff pages. Nested route content is rendered via React Router's <Outlet />.
 *
 * @returns {JSX.Element} The staff dashboard layout element.
 */
export default function StaffDashboardLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const mobileSkin = (getFlag('EN_MOBILE_FEED_SKIN') || '').toString().toLowerCase();
  const useLinkedInMobileSkin = isMobile && mobileSkin === 'linkedin';
  const showCommunityTopBar = useLinkedInMobileSkin && location.pathname.startsWith('/staff/community');

  // sign-out handled globally elsewhere

  return (
    <div className="min-h-screen bg-gray-50" data-mobile-skin={useLinkedInMobileSkin ? 'linkedin' : undefined}>
      {showCommunityTopBar && <TopBarCollapsible />}
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {user?.name || user?.displayName || 'New User'}!
              </h1>
              <p className="text-gray-600 mt-1">
                {user?.storeName || user?.storeCode || 'Unknown Store'}
              </p>
            </div>
            {/* User menu removed here to avoid duplicate with global SW menu */}
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="container mx-auto px-4 py-6" style={showCommunityTopBar ? { paddingTop: 56 } : undefined}>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar - Vertical on desktop, Horizontal on mobile */}
          <div className="md:w-64 flex-shrink-0">
            <nav className="bg-white shadow rounded-lg p-4">
              <ul className="flex flex-row md:flex-col space-y-0 space-x-2 md:space-x-0 md:space-y-2 overflow-x-auto md:overflow-x-visible">
                <li>
                  <NavLink
                    to="/staff/community"
                    className={({ isActive }) =>
                      `block px-4 py-2 rounded-md transition-colors ${
                        isActive
                          ? 'bg-sage-green/10 text-deep-moss'
                          : 'text-warm-gray hover:text-deep-moss hover:bg-oat-beige'
                      }`
                    }
                  >
                    Community
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/staff/verification"
                    className={({ isActive }) =>
                      `block px-4 py-2 rounded-md transition-colors ${
                        isActive
                          ? 'bg-brand-primary text-white'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    Verification
                  </NavLink>
                </li>
                
                <li>
                  <NavLink
                    to="/staff/my-brands"
                    className={({ isActive }) =>
                      `block px-4 py-2 rounded-md transition-colors ${
                        isActive
                          ? 'bg-brand-primary text-white'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    My Brands
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/staff/learning"
                    className={({ isActive }) =>
                      `block px-4 py-2 rounded-md transition-colors ${
                        isActive
                          ? 'bg-brand-primary text-white'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    Learning
                  </NavLink>
                </li>
              </ul>
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <div className="bg-white shadow rounded-lg p-6">
              <Outlet />
            </div>
          </div>
        </div>
      </div>

      {/* Fixed bottom nav (mobile, LinkedIn skin only) */}
      {useLinkedInMobileSkin && (
        <NavBarBottom />
      )}
    </div>
  );
}
