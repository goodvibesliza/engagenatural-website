// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { createContext, useContext, useState, useEffect } from 'react';
import './App.css';

// Import components
import SimpleBrandHome from './pages/SimpleBrandHome';
import SimpleBrandDashboard from './pages/SimpleBrandDashboard';
import EnhancedBrandHome from './pages/EnhancedBrandHome';
import EnhancedBrandDashboard from './pages/EnhancedBrandDashboard';

// Mock components for admin pages
const AdminDashboardPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
    <p className="mb-4">Welcome to the admin dashboard.</p>
    <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
      <a 
        href="/brand" 
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        View Brand Dashboard
      </a>
      <a 
        href="/enhanced-brand" 
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        View Enhanced Dashboard
      </a>
    </div>
  </div>
);

// Simplified Auth Context
const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Role-based properties
  const isSuperAdmin = userRoles.includes('super_admin');
  const isBrandManager = userRoles.includes('brand_manager');
  
  // Mock sign in function
  const signIn = async (email, password) => {
    // Simple mock authentication
    if (email === 'admin@example.com' && password === 'password') {
      const user = {
        uid: 'admin-uid',
        email: 'admin@example.com',
        displayName: 'Admin User',
      };
      setCurrentUser(user);
      setUserRoles(['super_admin', 'brand_manager']);
      setIsAuthenticated(true);
      localStorage.setItem('mockUser', JSON.stringify(user));
      localStorage.setItem('mockRoles', JSON.stringify(['super_admin', 'brand_manager']));
      return user;
    } 
    else if (email === 'brand@example.com' && password === 'password') {
      const user = {
        uid: 'brand-uid',
        email: 'brand@example.com',
        displayName: 'Brand Manager',
      };
      setCurrentUser(user);
      setUserRoles(['brand_manager']);
      setIsAuthenticated(true);
      localStorage.setItem('mockUser', JSON.stringify(user));
      localStorage.setItem('mockRoles', JSON.stringify(['brand_manager']));
      return user;
    } 
    else {
      throw new Error('Invalid email or password');
    }
  };
  
  // Mock sign out function
  const signOut = async () => {
    setCurrentUser(null);
    setUserRoles([]);
    setIsAuthenticated(false);
    localStorage.removeItem('mockUser');
    localStorage.removeItem('mockRoles');
  };
  
  // Check for stored user on mount
  useEffect(() => {
    const checkStoredUser = () => {
      const storedUser = localStorage.getItem('mockUser');
      const storedRoles = localStorage.getItem('mockRoles');
      
      if (storedUser && storedRoles) {
        setCurrentUser(JSON.parse(storedUser));
        setUserRoles(JSON.parse(storedRoles));
        setIsAuthenticated(true);
      }
      
      setLoading(false);
    };
    
    checkStoredUser();
  }, []);
  
  // Auth context value
  const value = {
    currentUser,
    userRoles,
    loading,
    isAuthenticated,
    isSuperAdmin,
    isBrandManager,
    signIn,
    signOut,
    user: currentUser,
    hasPermission: () => true, // Simplified permission check
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Simple Login Component
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const auth = useAuth();
  const location = useLocation();
  
  // Get redirect path from location state or default to '/'
  const from = location.state?.from?.pathname || '/';
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await auth.signIn(email, password);
    } catch (error) {
      setError(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };
  
  // Redirect if already logged in
  if (auth.isAuthenticated) {
    // Role-based redirection
    if (auth.isSuperAdmin) {
      return <Navigate to="/admin" />;
    }
    if (auth.isBrandManager) {
      return <Navigate to="/brand" />;
    }
    // Default fallback for any other authenticated role
    return <Navigate to="/admin" />;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {/* Quick-fill test accounts */}
        <div className="mb-6 p-3 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-700 mb-2">
            Test Accounts:
          </h3>
          <div className="flex flex-col space-y-2">
            <button
              type="button"
              onClick={() => {
                setEmail('admin@example.com');
                setPassword('password');
              }}
              className="text-left px-3 py-2 bg-blue-100 rounded hover:bg-blue-200 flex justify-between items-center"
            >
              <span>admin@example.com</span>
              <span className="text-xs font-semibold bg-blue-700 text-white px-2 py-1 rounded">
                Super&nbsp;Admin
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('brand@example.com');
                setPassword('password');
              }}
              className="text-left px-3 py-2 bg-green-100 rounded hover:bg-green-200 flex justify-between items-center"
            >
              <span>brand@example.com</span>
              <span className="text-xs font-semibold bg-green-700 text-white px-2 py-1 rounded">
                Brand&nbsp;Manager
              </span>
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const auth = useAuth();
  const location = useLocation();
  
  if (auth.loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }
  
  if (!auth.isAuthenticated) {
    // Redirect to login page with the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
}

// Main App Component
function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

// Separate component to use hooks
function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Admin Dashboard */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        } />
        
        {/* ------------------------------------------------------------------- */}
        {/* Brand Manager Routes                                                */}
        {/* ------------------------------------------------------------------- */}
        {/* Base brand dashboard (no ID) – falls back to user's brand context */}        
        <Route path="/brand" element={
          <ProtectedRoute>
            <SimpleBrandHome />
          </ProtectedRoute>
        } />

        {/* Brand dashboard with explicit brandId + any nested tabs (/upload, /challenges, /configuration, etc.) */}
        <Route path="/brand/:brandId/*" element={
          <ProtectedRoute>
            <SimpleBrandHome />
          </ProtectedRoute>
        } />

        {/* ---------------------------------------------------------------- */}
        {/* Enhanced Brand Dashboard (matches mockup design)                 */}
        {/* ---------------------------------------------------------------- */}
        <Route path="/enhanced-brand" element={
          <ProtectedRoute>
            <EnhancedBrandHome />
          </ProtectedRoute>
        } />

        <Route path="/enhanced-brand/:brandId/*" element={
          <ProtectedRoute>
            <EnhancedBrandHome />
          </ProtectedRoute>
        } />

        {/* Direct access to enhanced dashboard component */}
        <Route path="/enhanced-brand/:brandId/dashboard" element={
          <ProtectedRoute>
            <EnhancedBrandDashboard />
          </ProtectedRoute>
        } />

        {/* ---------------------------------------------------------------- */}
        {/* Simplified Brand Dashboard (troubleshooting)                    */}
        {/* ---------------------------------------------------------------- */}
        <Route path="/simple-brand" element={
          <ProtectedRoute>
            <SimpleBrandDashboard />
          </ProtectedRoute>
        } />

        {/* ---------------------------------------------------------------- */}
        {/* Default root path – role-based redirection                      */}
        {/* ---------------------------------------------------------------- */}
        <Route path="/" element={<RoleBasedRedirect />} />
        
        {/* Catch-all for unknown routes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );

  /* --------------------------------------------------------------- */
  /* Local helper component for role-based landing page              */
  /* --------------------------------------------------------------- */
  function RoleBasedRedirect() {
    const auth = useAuth();
    const location = useLocation();

    // While auth is loading, just render nothing / could show spinner
    if (auth.loading) {
      return <div className="p-8 text-center">Loading...</div>;
    }

    if (!auth.isAuthenticated) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (auth.isSuperAdmin) {
      return <Navigate to="/admin" />;
    }

    if (auth.isBrandManager) {
      return <Navigate to="/enhanced-brand" />; // Updated to use the enhanced dashboard by default
    }

    // Fallback – send any other authenticated role to admin for now
    return <Navigate to="/admin" />;
  }
}

export default App;
