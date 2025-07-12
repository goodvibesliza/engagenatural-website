// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/auth-context';
import { useState, useEffect } from 'react';
import './App.css';
import { isLocalhost } from './firebase';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminTemplatesPage from './pages/admin/AdminTemplatesPage';
import TemplateEditorPage from './pages/admin/TemplateEditorPage';
import TemplateViewPage from './pages/admin/TemplateViewPage';

// Brand Management Pages (Admin)
import AdminBrandsPage from './pages/admin/AdminBrandsPage';
import BrandEditorPage from './pages/admin/BrandEditorPage';
import BrandDetailPage from './pages/admin/BrandDetailPage';

// Brand Manager Pages
import BrandDashboardPage from './pages/brand/BrandDashboardPage';
import BrandTemplatesPage from './pages/brand/BrandTemplatesPage';
import BrandContentListPage from './pages/brand/BrandContentListPage';
import BrandAnalyticsPage from './pages/brand/BrandAnalyticsPage';
import BrandTemplateViewPage from './pages/brand/BrandTemplateViewPage';
import BrandContentEditorPage from './pages/brand/BrandContentEditorPage';
import BrandContentViewPage from './pages/brand/BrandContentViewPage';
//import BrandTemplateListPage from './pages/brand/BrandTemplateListPage';
//import BrandTemplatePreviewPage from './pages/brand/BrandTemplatePreviewPage';
import BrandROICalculatorPage from './pages/brand/BrandROICalculatorPage';


// Other brand pages can be uncommented as they're implemented

// Utility for seeding emulator auth
import { seedEmulatorAuth } from './utils/seedEmulatorAuth';

// Simple Login Component
function LoginPage() {
  const [email, setEmail] = useState(isLocalhost ? 'admin@example.com' : '');
  const [password, setPassword] = useState(isLocalhost ? 'password' : '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, isAuthenticated, loading: authLoading } = useAuth();
  
  // Don't redirect if auth is still loading
  if (isAuthenticated && !authLoading) {
    // Use replace to avoid adding to history
    return <Navigate to="/admin" replace />;
  }
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      console.log('Attempting login with:', email);
      await signIn(email, password);
    } catch (error) {
      console.error('Login error:', error);
      
      // Special handling for emulator
      if (isLocalhost && error.code === 'auth/user-not-found') {
        try {
          // Try to seed the emulator auth again
          await seedEmulatorAuth();
          // Try login once more
          await signIn(email, password);
        } catch (retryError) {
          setError('Failed to create or sign in with test user');
        }
      } else {
        setError(error.message || 'Failed to sign in');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
        
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
          
          {isLocalhost && (
            <div className="mt-4 text-center text-sm text-gray-500">
              <p>Emulator mode: Using admin@example.com / password</p>
              <p className="mt-1">or brandmanager@example.com / password</p>
              <button
                type="button"
                onClick={async () => {
                  await seedEmulatorAuth();
                  alert('Emulator users created/reset');
                }}
                className="mt-2 text-blue-500 hover:underline"
              >
                Reset Emulator Users
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// Protected Route Component - Much simpler with explicit redirect
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Main App Component
function App() {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  );
}

// Use a separate component for authentication-dependent logic
function AppWithAuth() {
  const [emulatorInitialized, setEmulatorInitialized] = useState(false);
  const { userRoles, loading } = useAuth();
  
  // Seed the emulator with test user when in localhost
  useEffect(() => {
    async function initEmulator() {
      if (isLocalhost && !emulatorInitialized) {
        try {
          await seedEmulatorAuth();
          setEmulatorInitialized(true);
        } catch (error) {
          console.error("Failed to seed emulator:", error);
        }
      }
    }
    
    initEmulator();
  }, [emulatorInitialized]);
  
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/templates" element={
          <ProtectedRoute>
            <AdminTemplatesPage />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/templates/new" element={
          <ProtectedRoute>
            <TemplateEditorPage />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/templates/:id" element={
          <ProtectedRoute>
            <TemplateViewPage />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/templates/:id/view" element={
          <ProtectedRoute>
            <TemplateViewPage />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/templates/:id/edit" element={
          <ProtectedRoute>
            <TemplateEditorPage />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/brands" element={
          <ProtectedRoute>
            <AdminBrandsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/brands/new" element={
          <ProtectedRoute>
            <BrandEditorPage />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/brands/:id" element={
          <ProtectedRoute>
            <BrandDetailPage />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/brands/:id/edit" element={
          <ProtectedRoute>
            <BrandEditorPage />
          </ProtectedRoute>
        } />
        
        {/* Brand Manager Routes */}
        <Route path="/brand/dashboard" element={
          <ProtectedRoute>
            <BrandDashboardPage />
          </ProtectedRoute>
        } />
        
        <Route path="/brand/templates" element={
          <ProtectedRoute>
            <BrandTemplatesPage />
          </ProtectedRoute>
        } />
        <Route path="/brand/content" element={
  <ProtectedRoute>
    <BrandContentListPage />
  </ProtectedRoute>
} />

<Route path="/brand/analytics" element={
  <ProtectedRoute>
    <BrandAnalyticsPage />
  </ProtectedRoute>
} />
<Route path="/brand/templates/:id" element={
  <ProtectedRoute>
    <BrandTemplateViewPage />
  </ProtectedRoute>
} />
<Route path="/brand/content" element={
  <ProtectedRoute>
    <BrandContentListPage />
  </ProtectedRoute>
} />
<Route path="/brand/content/new" element={
  <ProtectedRoute>
    <BrandContentEditorPage />
  </ProtectedRoute>
} />

<Route path="/brand/content/:id/edit" element={
  <ProtectedRoute>
    <BrandContentEditorPage />
  </ProtectedRoute>
} />
<Route path="/brand/content/:id" element={
  <ProtectedRoute>
    <BrandContentViewPage />
  </ProtectedRoute>
} />

{/** ------------------ Brand Manager Routes ------------------ */}
{/* Content Management */}
<Route path="/brand/content" element={
  <ProtectedRoute>
    <BrandContentListPage />
  </ProtectedRoute>
} />
<Route path="/brand/content/new" element={
  <ProtectedRoute>
    <BrandContentEditorPage />
  </ProtectedRoute>
} />
<Route path="/brand/content/:id/edit" element={
  <ProtectedRoute>
    <BrandContentEditorPage />
  </ProtectedRoute>
} />
<Route path="/brand/content/:id" element={
  <ProtectedRoute>
    <BrandContentViewPage />
  </ProtectedRoute>
} />

{/* Brand Analytics */}
<Route path="/brand/analytics" element={
  <ProtectedRoute>
    <BrandAnalyticsPage />
  </ProtectedRoute>
} />

{/* Templates for Brands */}
{/*
<Route path="/brand/templates" element={
  <ProtectedRoute>
    <BrandTemplateListPage />
  </ProtectedRoute>
} />
<Route path="/brand/templates/:id/preview" element={
  <ProtectedRoute>
    <BrandTemplatePreviewPage />
  </ProtectedRoute>
} />

{/* ROI Calculator */}
<Route path="/brand/roi-calculator" element={
  <ProtectedRoute>
    <BrandROICalculatorPage />
  </ProtectedRoute>
} />

{/* Redirect /brand to content list */}
<Route path="/brand" element={<Navigate to="/brand/content" />} />

        {/* Add more brand routes as they are implemented */}
        {/* 
        
               
        <Route path="/brand/content/new" element={
          <ProtectedRoute>
            <BrandContentEditorPage />
          </ProtectedRoute>
        } />
        
        <Route path="/brand/content/:id" element={
          <ProtectedRoute>
            <BrandContentViewPage />
          </ProtectedRoute>
        } />
        
        <Route path="/brand/content/:id/edit" element={
          <ProtectedRoute>
            <BrandContentEditorPage />
          </ProtectedRoute>
        } />
        */}
        
        {/* Root path - Redirect based on user role */}
        <Route path="/" element={
          loading ? (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-2">Loading...</p>
              </div>
            </div>
          ) : (
            userRoles?.includes('brand_manager') ? 
              <Navigate to="/brand/dashboard" replace /> : 
              <Navigate to="/admin" replace />
          )
        } />
        
        {/* Catch-all for unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
