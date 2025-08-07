// src/UpdatedAppWithIntegration.jsx
import React, { createContext, useContext, useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';

// Import components - using dynamic imports with React.lazy for better performance
const EnhancedBrandHome = React.lazy(() => import('./pages/EnhancedBrandHome'));
const EnhancedBrandDashboard = React.lazy(() => import('./pages/EnhancedBrandDashboard'));
const BrandComponentAdapter = React.lazy(() => import('./BrandComponentAdapter'));
const IntegratedContentManager = React.lazy(() => import('./pages/IntegratedContentManager'));
const BrandStyleGuide = React.lazy(() => import('./pages/BrandStyleGuide')); // NEW
const AdminVerify = React.lazy(() => import('./pages/AdminVerify.jsx')); // NEW

// App-level Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("Error caught by App ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
            <div className="flex items-center justify-center mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-6 text-center">
              We're sorry, but the application encountered an unexpected error.
            </p>
            <details className="mb-6 bg-gray-50 p-4 rounded-lg">
              <summary className="cursor-pointer font-medium text-gray-700">Error Details</summary>
              <div className="mt-3">
                <p className="text-red-600 font-mono text-sm whitespace-pre-wrap">
                  {this.state.error && this.state.error.toString()}
                </p>
                <p className="text-gray-600 font-mono text-sm mt-2 whitespace-pre-wrap">
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </p>
              </div>
            </details>
            <div className="flex justify-center">
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.href = '/';
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading Component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading application...</p>
    </div>
  </div>
);

// Auth Context
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
      {!loading ? children : <LoadingScreen />}
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
      return <Navigate to="/brand-dashboard" />;
    }
    // Default fallback for any other authenticated role
    return <Navigate to="/admin" />;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-2xl">
            E
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2 text-center">EngageNatural</h1>
        <p className="text-gray-600 text-center mb-6">Sign in to access your dashboard</p>
        
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
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:bg-green-300"
          >
            {loading ? 'Signing in...' : 'Sign In'}
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
    return <LoadingScreen />;
  }
  
  if (!auth.isAuthenticated) {
    // Redirect to login page with the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
}

// Dashboard Selector Component
function DashboardSelector() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-2xl mr-4">
              E
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">EngageNatural Dashboard</h1>
              <p className="text-gray-600">Select a dashboard version to continue</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold mb-2">Enhanced Dashboard</h2>
              <p className="text-gray-600 mb-4">
                Enhanced dashboard with all brand components integrated and improved UI matching the mockups.
              </p>
              <Link 
                to="/brand-dashboard" 
                className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Launch Enhanced Dashboard
              </Link>
            </div>
            
            <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold mb-2">Admin Dashboard</h2>
              <p className="text-gray-600 mb-4">
                Admin dashboard for super admin users.
              </p>
              <Link 
                to="/admin" 
                className="inline-block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Launch Admin Dashboard
              </Link>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <button
            onClick={() => {
              const auth = useAuth();
              auth.signOut();
            }}
            className="text-gray-600 hover:text-gray-800 underline"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

// Mock Admin Dashboard
function AdminDashboard() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <Link 
              to="/" 
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Back to Dashboard Selector
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800">Brands</h3>
              <p className="text-2xl font-bold">12</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800">Users</h3>
              <p className="text-2xl font-bold">248</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-800">Templates</h3>
              <p className="text-2xl font-bold">36</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-800">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/brand-dashboard')}
                className="p-4 border border-green-200 rounded-lg hover:bg-green-50 text-left"
              >
                <h3 className="font-medium text-green-800">View Brand Dashboard</h3>
                <p className="text-sm text-gray-600">Access the enhanced brand dashboard</p>
              </button>
              
              <button
                onClick={() => navigate('/simple-dashboard')}
                className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 text-left"
              >
                <h3 className="font-medium text-blue-800">View Simple Dashboard</h3>
                <p className="text-sm text-gray-600">Access the simplified dashboard</p>
              </button>
              
              <button
                onClick={() => navigate('/brand')}
                className="p-4 border border-purple-200 rounded-lg hover:bg-purple-50 text-left"
              >
                <h3 className="font-medium text-purple-800">View Original Brand Home</h3>
                <p className="text-sm text-gray-600">Access the original brand home implementation</p>
              </button>
              
              {/* Verify Staff button */}
              <button
                onClick={() => navigate('/admin/verify')}
                className="p-4 border border-orange-200 rounded-lg hover:bg-orange-50 text-left"
              >
                <h3 className="font-medium text-orange-800">Verify Staff</h3>
                <p className="text-sm text-gray-600">
                  Review and approve user verification requests
                </p>
              </button>
              
              <button
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <h3 className="font-medium text-gray-800">Manage Users</h3>
                <p className="text-sm text-gray-600">View and manage user accounts</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main App Component
function UpdatedAppWithIntegration() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

// Separate component to use hooks
function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* Dashboard Selector - Main landing page after login */}
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardSelector />
        </ProtectedRoute>
      } />
      
      {/* Admin Dashboard */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      
      {/* Admin Verify Staff */}
      <Route path="/admin/verify" element={
        <ProtectedRoute>
          <Suspense fallback={<LoadingScreen />}>
            <AdminVerify />
          </Suspense>
        </ProtectedRoute>
      } />

      {/* Enhanced Brand Dashboard - New implementation */}
      <Route path="/brand-dashboard" element={
        <ProtectedRoute>
          <Suspense fallback={<LoadingScreen />}>
            <EnhancedBrandHome />
          </Suspense>
        </ProtectedRoute>
      } />
      
      <Route path="/brand-dashboard/:brandId/*" element={
        <ProtectedRoute>
          <Suspense fallback={<LoadingScreen />}>
            <EnhancedBrandHome />
          </Suspense>
        </ProtectedRoute>
      } />

      {/* Integrated Content Manager (direct route) */}
      <Route path="/brand-dashboard/:brandId/content" element={
        <ProtectedRoute>
          <Suspense fallback={<LoadingScreen />}>
            <IntegratedContentManager />
          </Suspense>
        </ProtectedRoute>
      } />

      {/* Brand Style Guide (direct route) */}
      <Route path="/brand-dashboard/:brandId/style-guide" element={
        <ProtectedRoute>
          <Suspense fallback={<LoadingScreen />}>
            <BrandStyleGuide />
          </Suspense>
        </ProtectedRoute>
      } />

      {/* Direct access to dashboard component */}
      <Route path="/brand-dashboard/:brandId/dashboard" element={
        <ProtectedRoute>
          <Suspense fallback={<LoadingScreen />}>
            <EnhancedBrandDashboard />
          </Suspense>
        </ProtectedRoute>
      } />
      
      {/* Catch-all for unknown routes */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default UpdatedAppWithIntegration;
