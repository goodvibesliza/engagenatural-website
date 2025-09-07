// src/App-debug.jsx
import { useState, createContext, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';

// -----------------------------------------------------------------------
// Mock Auth Context - No Firebase dependency
// -----------------------------------------------------------------------
const AuthContext = createContext(null);

// Mock auth provider with hardcoded state and extensive logging
function MockAuthProvider({ children }) {
  console.log(`[${new Date().toISOString()}] MockAuthProvider: Rendering`);
  
  // HARDCODED AUTH STATE - Change these values to test different scenarios
  const [authState, setAuthState] = useState({
    loading: false,  // Set to false to avoid loading state issues
    isAuthenticated: true,  // Set to true to simulate logged in user
    user: {
      uid: 'test-user-123',
      email: 'test@example.com',
      role: 'super_admin', // Change to test different roles: 'super_admin', 'brand_manager', etc.
      verified: true
    },
    isSuperAdmin: true,  // Match this with the role above
    isBrandManager: false,
    isVerified: true,
    hasRole: (roles) => {
      console.log(`[${new Date().toISOString()}] hasRole check:`, roles);
      const userRole = 'super_admin'; // Change to match role above
      return Array.isArray(roles) ? roles.includes(userRole) : roles === userRole;
    }
  });

  // Mock sign in function that just logs and updates state
  const signIn = (email, password) => {
    console.log(`[${new Date().toISOString()}] MockAuth: Sign in attempt with ${email}`);
    setAuthState(prev => ({
      ...prev,
      loading: false,
      isAuthenticated: true,
      user: { uid: 'test-user-123', email, role: 'super_admin', verified: true },
      isSuperAdmin: true,
      isBrandManager: false,
      isVerified: true
    }));
    return Promise.resolve({ uid: 'test-user-123', email });
  };

  // Mock sign out function
  const signOut = () => {
    console.log(`[${new Date().toISOString()}] MockAuth: Sign out`);
    setAuthState(prev => ({
      ...prev,
      isAuthenticated: false,
      user: null,
      isSuperAdmin: false,
      isBrandManager: false,
      isVerified: false
    }));
    return Promise.resolve();
  };

  const value = {
    ...authState,
    signIn,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context with logging
function useAuth() {
  const context = useContext(AuthContext);
  console.log(`[${new Date().toISOString()}] useAuth called:`, {
    loading: context.loading,
    isAuthenticated: context.isAuthenticated,
    role: context?.user?.role || 'none'
  });
  return context;
}

// -----------------------------------------------------------------------
// Simplified Components with Logging
// -----------------------------------------------------------------------

// Simple Admin Dashboard
function AdminDashboard() {
  console.log(`[${new Date().toISOString()}] AdminDashboard: Rendering`);
  
  useEffect(() => {
    console.log(`[${new Date().toISOString()}] AdminDashboard: Mounted`);
    return () => console.log(`[${new Date().toISOString()}] AdminDashboard: Unmounted`);
  }, []);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <p className="mb-4">This is a simplified admin dashboard for debugging.</p>
    </div>
  );
}

// Simple Login Component
function LoginPage() {
  console.log(`[${new Date().toISOString()}] LoginPage: Rendering`);
  
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const auth = useAuth();
  const location = useLocation();
  
  // Log every render with auth state
  console.log(`[${new Date().toISOString()}] LoginPage state:`, { 
    authLoading: auth.loading,
    isAuthenticated: auth.isAuthenticated,
    location: location.pathname
  });
  
  useEffect(() => {
    console.log(`[${new Date().toISOString()}] LoginPage: Mounted`);
    return () => console.log(`[${new Date().toISOString()}] LoginPage: Unmounted`);
  }, []);
  
  // IMPORTANT: Wait for auth to finish loading before any redirects
  if (auth.loading) {
    console.log(`[${new Date().toISOString()}] LoginPage: Auth still loading, showing loading UI`);
    return <div className="p-8 text-center">Loading auth state...</div>;
  }
  
  // Handle already logged in users
  if (auth.isAuthenticated) {
    console.log(`[${new Date().toISOString()}] LoginPage: User already authenticated, redirecting based on role`);
    
    if (auth.isSuperAdmin) {
      console.log(`[${new Date().toISOString()}] LoginPage: Redirecting to /admin (super_admin)`);
      return <Navigate to="/admin" replace />;
    }
    
    if (auth.isBrandManager) {
      console.log(`[${new Date().toISOString()}] LoginPage: Redirecting to /brand (brand_manager)`);
      return <Navigate to="/brand" replace />;
    }
    
    console.log(`[${new Date().toISOString()}] LoginPage: Redirecting to /staff (default)`);
    return <Navigate to="/staff" replace />;
  }
  
  const handleLogin = async (e) => {
    e.preventDefault();
    console.log(`[${new Date().toISOString()}] LoginPage: Login form submitted`);
    setLoading(true);
    setError('');
    
    try {
      await auth.signIn(email, password);
      console.log(`[${new Date().toISOString()}] LoginPage: Login successful`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] LoginPage: Login error`, error);
      setError(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Debug Login</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Logging in...' : 'Login (Debug)'}
          </button>
        </form>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Role-based redirect with logging - DEFINED OUTSIDE APP ROUTES
// -----------------------------------------------------------------------
function RoleBasedRedirect() {
  console.log(`[${new Date().toISOString()}] RoleBasedRedirect: Rendering`);
  
  const auth = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    console.log(`[${new Date().toISOString()}] RoleBasedRedirect: Mounted`);
    return () => console.log(`[${new Date().toISOString()}] RoleBasedRedirect: Unmounted`);
  }, []);
  
  console.log(`[${new Date().toISOString()}] RoleBasedRedirect state:`, {
    loading: auth.loading,
    isAuthenticated: auth.isAuthenticated,
    role: auth.user?.role,
    location: location.pathname
  });
  
  // While auth is loading, show loading UI
  if (auth.loading) {
    console.log(`[${new Date().toISOString()}] RoleBasedRedirect: Auth still loading, showing loading UI`);
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600">Loading user session...</p>
      </div>
    );
  }
  
  // Not authenticated – send to login
  if (!auth.isAuthenticated) {
    console.log(`[${new Date().toISOString()}] RoleBasedRedirect: Not authenticated, redirecting to /login`);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // ---- Authenticated role-based redirects ----
  if (auth.isSuperAdmin) {
    console.log(`[${new Date().toISOString()}] RoleBasedRedirect: Is super_admin, redirecting to /admin`);
    return <Navigate to="/admin" replace />;
  } else if (auth.isBrandManager) {
    console.log(`[${new Date().toISOString()}] RoleBasedRedirect: Is brand_manager, redirecting to /brand`);
    return <Navigate to="/brand" replace />;
  } else if (auth.user?.verified === true) {
    console.log(`[${new Date().toISOString()}] RoleBasedRedirect: Is verified, redirecting to /staff`);
    return <Navigate to="/staff" replace />;
  }
  
  // Fallback: unverified or unknown role
  console.log(`[${new Date().toISOString()}] RoleBasedRedirect: Unknown role or unverified, redirecting to /login`);
  return <Navigate to="/login" replace />;
}

// -----------------------------------------------------------------------
// Simplified Role Guard with Logging
// -----------------------------------------------------------------------
function RoleGuard({ children, roles = [] }) {
  console.log(`[${new Date().toISOString()}] RoleGuard: Rendering with roles:`, roles);
  
  const auth = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    console.log(`[${new Date().toISOString()}] RoleGuard: Mounted`);
    return () => console.log(`[${new Date().toISOString()}] RoleGuard: Unmounted`);
  }, []);
  
  // While auth is loading, show loading UI
  if (auth.loading) {
    console.log(`[${new Date().toISOString()}] RoleGuard: Auth still loading, showing loading UI`);
    return <div className="p-8 text-center">Loading...</div>;
  }
  
  // Not logged in → go to login
  if (!auth.isAuthenticated) {
    console.log(`[${new Date().toISOString()}] RoleGuard: Not authenticated, redirecting to /login`);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Role check (supports array or empty = any)
  if (roles.length > 0 && !auth.hasRole(roles)) {
    console.log(`[${new Date().toISOString()}] RoleGuard: Wrong role, redirecting to /login`);
    return <Navigate to="/login" replace />;
  }
  
  console.log(`[${new Date().toISOString()}] RoleGuard: Authorized, rendering children`);
  return children;
}

// -----------------------------------------------------------------------
// Main App Components
// -----------------------------------------------------------------------

// Main App Component
function App() {
  console.log(`[${new Date().toISOString()}] App: Rendering`);
  
  useEffect(() => {
    console.log(`[${new Date().toISOString()}] App: Mounted`);
    return () => console.log(`[${new Date().toISOString()}] App: Unmounted`);
  }, []);
  
  return (
    <MockAuthProvider>
      <AppRoutes />
    </MockAuthProvider>
  );
}

// Separate component for routes
function AppRoutes() {
  console.log(`[${new Date().toISOString()}] AppRoutes: Rendering`);
  
  useEffect(() => {
    console.log(`[${new Date().toISOString()}] AppRoutes: Mounted`);
    return () => console.log(`[${new Date().toISOString()}] AppRoutes: Unmounted`);
  }, []);
  
  return (
    <Router>
      <div className="bg-gray-100 min-h-screen">
        {/* Debug header */}
        <div className="bg-yellow-200 p-2 text-sm">
          <strong>DEBUG MODE</strong> - Using mock auth provider
        </div>
        
        <Routes>
          {/* Login route */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Admin route */}
          <Route
            path="/admin"
            element={
              <RoleGuard roles={['super_admin']}>
                <div className="p-4">
                  <h1 className="text-xl font-bold mb-4">Admin Layout</h1>
                  <AdminDashboard />
                </div>
              </RoleGuard>
            }
          />
          
          {/* Brand manager route */}
          <Route
            path="/brand"
            element={
              <RoleGuard roles={['brand_manager']}>
                <div className="p-4">
                  <h1 className="text-xl font-bold mb-4">Brand Manager Dashboard</h1>
                  <p>This is a simplified brand dashboard for debugging.</p>
                </div>
              </RoleGuard>
            }
          />
          
          {/* Staff route */}
          <Route
            path="/staff"
            element={
              <RoleGuard roles={['staff', 'verified_staff', 'retail_staff']}>
                <div className="p-4">
                  <h1 className="text-xl font-bold mb-4">Staff Dashboard</h1>
                  <p>This is a simplified staff dashboard for debugging.</p>
                </div>
              </RoleGuard>
            }
          />
          
          {/* Default route - role-based redirect */}
          <Route path="/" element={<RoleBasedRedirect />} />
          
          {/* Catch-all for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
