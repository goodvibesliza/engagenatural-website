// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/auth-context';
import { useState, useEffect } from 'react';
import './App.css';
import { isLocalhost } from './firebase';

// Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminTemplatesPage from './pages/admin/AdminTemplatesPage';
import TemplateEditorPage from './pages/admin/TemplateEditorPage';
import TemplateViewPage from './pages/admin/TemplateViewPage';

// Utility for seeding emulator auth
// We'll create this file next
import { seedEmulatorAuth } from './utils/seedEmulatorAuth';

// Simple Login Component
function LoginPage() {
  const [email, setEmail] = useState(isLocalhost ? 'admin@example.com' : '');
  const [password, setPassword] = useState(isLocalhost ? 'password' : '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const auth = useAuth();
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      console.log('Attempting login with:', email);
      await auth.signIn(email, password);
    } catch (error) {
      console.error('Login error:', error);
      
      // Special handling for emulator
      if (isLocalhost && error.code === 'auth/user-not-found') {
        try {
          // Try to seed the emulator auth again
          await seedEmulatorAuth();
          // Try login once more
          await auth.signIn(email, password);
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
  
  // Redirect if already logged in
  if (auth.isAuthenticated) {
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
              <button
                type="button"
                onClick={async () => {
                  await seedEmulatorAuth();
                  alert('Emulator user created/reset');
                }}
                className="mt-2 text-blue-500 hover:underline"
              >
                Reset Emulator User
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const auth = useAuth();
  
  if (auth.loading) {
    return <div>Loading...</div>;
  }
  
  if (!auth.isAuthenticated) {
    return <Navigate to="/login" />;
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
  const [emulatorInitialized, setEmulatorInitialized] = useState(false);
  
  // Seed the emulator with test user when in localhost
  useEffect(() => {
    if (isLocalhost && !emulatorInitialized) {
      seedEmulatorAuth().then(success => {
        if (success) {
          setEmulatorInitialized(true);
        }
      });
    }
  }, [emulatorInitialized]);
  
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
        
        {/* Template Management Routes */}
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
        
        {/* Keep the existing route for backward compatibility */}
        <Route path="/admin/templates/:id" element={
          <ProtectedRoute>
            <TemplateViewPage />
          </ProtectedRoute>
        } />
        
        {/* Add explicit view route */}
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
        
        {/* Default redirect to admin dashboard if logged in, otherwise login */}
        <Route path="/" element={<Navigate to="/admin" />} />
        
        {/* Catch-all for unknown routes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
