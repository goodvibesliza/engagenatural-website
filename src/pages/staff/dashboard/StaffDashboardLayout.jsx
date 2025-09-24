import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/auth-context';

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
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = () => {
    window.location.href = '/?logout=true';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div
          className="container mx-auto px-4 py-4"
          onClick={() => menuOpen && setMenuOpen(false)} /* close on outside click */
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {user?.name || user?.displayName || 'New User'}!
              </h1>
              <p className="text-gray-600 mt-1">
                {user?.storeName || user?.storeCode || 'Unknown Store'}
              </p>
            </div>
            {/* Avatar & menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((o) => !o);
                }}
                className="flex items-center focus:outline-none"
                aria-haspopup="true"
                aria-expanded={menuOpen ? 'true' : 'false'}
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="User avatar"
                    className="h-10 w-10 rounded-full border"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200 border flex items-center justify-center text-gray-600 font-semibold">
                    {(user?.name || user?.displayName || 'U')
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="px-4 py-3 border-b">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.name || user?.displayName || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email || ''}
                    </p>
                  </div>
                  <nav className="py-1">
                    <NavLink
                      to="/staff/profile"
                      className={({ isActive }) =>
                        `block px-4 py-2 text-sm ${
                          isActive
                            ? 'text-brand-primary'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`
                      }
                    >
                      My Profile
                    </NavLink>
                    <NavLink
                      to="/staff/my-brands"
                      className={({ isActive }) =>
                        `block px-4 py-2 text-sm ${
                          isActive
                            ? 'text-brand-primary'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`
                      }
                    >
                      My Brands
                    </NavLink>
                    <NavLink
                      to="/staff/learning"
                      className={({ isActive }) =>
                        `block px-4 py-2 text-sm ${
                          isActive
                            ? 'text-brand-primary'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`
                      }
                    >
                      Learning
                    </NavLink>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Sign Out
                    </button>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar - Vertical on desktop, Horizontal on mobile */}
          <div className="md:w-64 flex-shrink-0">
            <nav className="bg-white shadow rounded-lg p-4">
              <ul className="flex flex-row md:flex-col space-y-0 space-x-2 md:space-x-0 md:space-y-2 overflow-x-auto md:overflow-x-visible">
                <li>
                  <NavLink
                    to="/staff/communities"
                    className={({ isActive }) =>
                      `block px-4 py-2 rounded-md transition-colors ${
                        isActive
                          ? 'bg-sage-green/10 text-deep-moss'
                          : 'text-warm-gray hover:text-deep-moss hover:bg-oat-beige'
                      }`
                    }
                  >
                    Communities
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/community"
                    className={({ isActive }) =>
                      `block px-4 py-2 rounded-md transition-colors ${
                        isActive
                          ? 'bg-sage-green/10 text-deep-moss'
                          : 'text-warm-gray hover:text-deep-moss hover:bg-oat-beige'
                      }`
                    }
                  >
                    Community (New)
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
                    to="/community"
                    className={({ isActive }) =>
                      `block px-4 py-2 rounded-md transition-colors ${
                        isActive
                          ? 'bg-brand-primary text-white'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    Communities
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
    </div>
  );
}
