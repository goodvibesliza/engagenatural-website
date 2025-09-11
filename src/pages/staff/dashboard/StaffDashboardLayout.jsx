import { NavLink, Outlet, Link } from 'react-router-dom';

export default function StaffDashboardLayout() {
  // No per-page user menu; global menu now handles sign-out and profile actions.

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left – Home link */}
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="text-brand-primary hover:text-brand-primary/80 font-medium"
              >
                ← Home
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
            </div>

            {/* Right – User menu */}
            {/* global UserDropdownMenu rendered in App.jsx */}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar - stacks on top on small screens */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <nav className="space-y-1">
                <NavLink 
                  to="/staff/profile" 
                  className={({ isActive }) => 
                    `flex items-center px-4 py-3 rounded-md transition-colors ${
                      isActive 
                        ? 'bg-brand-primary text-white' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <span className="mr-3">👤</span>
                  <span>Profile</span>
                </NavLink>

                <NavLink 
                  to="/staff/verification" 
                  className={({ isActive }) => 
                    `flex items-center px-4 py-3 rounded-md transition-colors ${
                      isActive 
                        ? 'bg-brand-primary text-white' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <span className="mr-3">🔐</span>
                  <span>Verification</span>
                </NavLink>

                <NavLink 
                  to="/staff/communities" 
                  className={({ isActive }) => 
                    `flex items-center px-4 py-3 rounded-md transition-colors ${
                      isActive 
                        ? 'bg-brand-primary text-white' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <span className="mr-3">👥</span>
                  <span>Communities</span>
                </NavLink>

                <NavLink 
                  to="/staff/my-brands" 
                  className={({ isActive }) => 
                    `flex items-center px-4 py-3 rounded-md transition-colors ${
                      isActive 
                        ? 'bg-brand-primary text-white' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <span className="mr-3">🏢</span>
                  <span>My Brands</span>
                </NavLink>

                <NavLink 
                  to="/staff/learning" 
                  className={({ isActive }) => 
                    `flex items-center px-4 py-3 rounded-md transition-colors ${
                      isActive 
                        ? 'bg-brand-primary text-white' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <span className="mr-3">📚</span>
                  <span>Learning</span>
                </NavLink>
              </nav>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
