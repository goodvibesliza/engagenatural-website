import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './App.css';

// Auth context
import { AuthProvider, useAuth } from './contexts/auth-context';

// Role Guard and Landing Route Helper
import RoleGuard from './utils/roleGuard';
import getLandingRouteFor from './utils/landing';
import { isLocalhost } from './lib/firebase';

// Page Components
import Login from './pages/auth/Login';
import PublicWebsite from './components/PublicWebsite';

// Admin Components
import AdminLayout from './components/admin/layout/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import UsersPage from './pages/admin/Users';
import VerifyStaff from './pages/admin/VerifyStaff';
import AdminBrandsPage from './pages/admin/AdminBrandsPage';
import AdminTemplatesPage from './pages/admin/AdminTemplatesPage';
import TemplateEditorPage from './pages/admin/TemplateEditorPage';
import TemplateViewPage from './pages/admin/TemplateViewPage';
import AnalyticsPage from './pages/admin/Analytics';
import ProductsPage from './pages/admin/Products';
import ActivityPage from './pages/admin/Activity';
import SettingsPage from './pages/admin/Settings';
import DemoData from './pages/admin/DemoData';
import DevTools from './pages/admin/DevTools';
import PendingApproval from './pages/PendingApproval';   // ⬅️ pending-approval page

// Brand Manager Components
import BrandDashboard from './pages/brand/Dashboard';
import BrandContentManager from './pages/brand/BrandContentManager';
// Brand Training Detail
import BrandTrainingDetail from './pages/brand/TrainingDetail.jsx';

// Staff Components
import StaffDashboard from './pages/staff/Dashboard';
// Staff Training Detail
import StaffTrainingDetail from './pages/staff/TrainingDetail.jsx';

// Emulator Components
import EmulatorTestDashboard from './pages/EmulatorTestDashboard';
import EmulatorDiagnosticPage from './pages/EmulatorDiagnosticPage';
// Community Feed
import CommunityFeed from './pages/community/CommunityFeed';

// Dev-only debug card (renders nothing in production)
import UserDebugCard from './components/dev/UserDebugCard';
import EnvBadge from './components/dev/EnvBadge';

// Simple spinner component for loading states
const LoadingSpinner = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
  </div>
);

// ---------------------------------------------------------------------------
// Protected Route – keeps returnUrl so users can be sent back after login
// ---------------------------------------------------------------------------
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (!user) {
    const returnUrl = encodeURIComponent(
      location.pathname + location.search + location.hash,
    );
    return (
      <Navigate
        to={`/?returnUrl=${returnUrl}`}
        state={{ from: location }}
        replace
      />
    );
  }

  return children;
};

// Root entry – simplified component that handles auth state and routing
const RootEntry = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  
  // Check if we have a logout flag
  const hasLogoutFlag = params.has('logout') || 
    (typeof window !== 'undefined' && localStorage.getItem('FORCE_PUBLIC_WEBSITE') === 'true');
  
  // Clear the flag if it exists
  if (typeof window !== 'undefined' && localStorage.getItem('FORCE_PUBLIC_WEBSITE') === 'true') {
    localStorage.removeItem('FORCE_PUBLIC_WEBSITE');
  }

  // Show spinner while loading
  if (loading) {
    return <LoadingSpinner />;
  }

  // Show PublicWebsite if there's a logout flag
  if (hasLogoutFlag) {
    return <PublicWebsite />;
  }

  // Show PublicWebsite if not authenticated (contains integrated login widget)
  if (!user) {
    return <PublicWebsite />;
  }

  // Redirect to appropriate landing page based on role
  const landingRoute = getLandingRouteFor(user);
  // Prevent infinite redirects – only navigate if we're not already
  // on the desired landing route.
  if (location.pathname !== landingRoute) {
    return <Navigate to={landingRoute} state={{ from: location }} replace />;
  }
  
  // If we're already at the landing route, render null so that the matching
  // <Route> elsewhere in the tree can take over.
  return null;
};

// Main App Component
function App() {
  const [emulatorInitialized, setEmulatorInitialized] = useState(false);
  
  // Skip emulator setup since using production Firebase
  useEffect(() => {
    setEmulatorInitialized(true);
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Root path with simplified routing logic */}
          <Route
            path="/"
            element={<RootEntry />}
          />

          {/* Admin Routes - Protected for super_admin role */}
          <Route
            path="/admin"
            element={
              <RoleGuard allowedRoles={['super_admin']}>
                <AdminLayout>
                  <Dashboard />
                </AdminLayout>
              </RoleGuard>
            }
          />
          <Route 
            path="/admin/users" 
            element={
              <RoleGuard allowedRoles={['super_admin']}>
                <AdminLayout>
                  <UsersPage />
                </AdminLayout>
              </RoleGuard>
            } 
          />
          <Route 
            path="/admin/verifications" 
            element={
              <RoleGuard allowedRoles={['super_admin']}>
                <AdminLayout>
                  <VerifyStaff />
                </AdminLayout>
              </RoleGuard>
            } 
          />
          <Route 
            path="/admin/brands" 
            element={
              <RoleGuard allowedRoles={['super_admin']}>
                <AdminLayout>
                  <AdminBrandsPage />
                </AdminLayout>
              </RoleGuard>
            } 
          />
          <Route 
            path="/admin/analytics" 
            element={
              <RoleGuard allowedRoles={['super_admin']}>
                <AdminLayout>
                  <AnalyticsPage />
                </AdminLayout>
              </RoleGuard>
            } 
          />
          <Route 
            path="/admin/content" 
            element={
              <RoleGuard allowedRoles={['super_admin']}>
                <AdminLayout>
                  <AdminTemplatesPage />
                </AdminLayout>
              </RoleGuard>
            } 
          />
          <Route 
            path="/admin/products" 
            element={
              <RoleGuard allowedRoles={['super_admin']}>
                <AdminLayout>
                  <ProductsPage />
                </AdminLayout>
              </RoleGuard>
            } 
          />
          <Route 
            path="/admin/activity" 
            element={
              <RoleGuard allowedRoles={['super_admin']}>
                <AdminLayout>
                  <ActivityPage />
                </AdminLayout>
              </RoleGuard>
            } 
          />
          <Route 
            path="/admin/settings" 
            element={
              <RoleGuard allowedRoles={['super_admin']}>
                <AdminLayout>
                  <SettingsPage />
                </AdminLayout>
              </RoleGuard>
            } 
          />
          <Route 
            path="/admin/demo" 
            element={
              <RoleGuard allowedRoles={['super_admin']}>
                <AdminLayout>
                  <DemoData />
                </AdminLayout>
              </RoleGuard>
            } 
          />
          <Route 
            path="/admin/dev" 
            element={
              <RoleGuard allowedRoles={['super_admin']}>
                <AdminLayout>
                  <DevTools />
                </AdminLayout>
              </RoleGuard>
            } 
          />

          {/* Template Management Routes */}
          <Route 
            path="/admin/templates" 
            element={
              <RoleGuard allowedRoles={['super_admin']}>
                <AdminLayout>
                  <AdminTemplatesPage />
                </AdminLayout>
              </RoleGuard>
            } 
          />
          
          <Route 
            path="/admin/templates/new" 
            element={
              <RoleGuard allowedRoles={['super_admin']}>
                <AdminLayout>
                  <TemplateEditorPage />
                </AdminLayout>
              </RoleGuard>
            } 
          />
          
          {/* Keep the existing route for backward compatibility */}
          <Route 
            path="/admin/templates/:id" 
            element={
              <RoleGuard allowedRoles={['super_admin']}>
                <AdminLayout>
                  <TemplateViewPage />
                </AdminLayout>
              </RoleGuard>
            } 
          />
          
          {/* Add explicit view route */}
          <Route 
            path="/admin/templates/:id/view" 
            element={
              <RoleGuard allowedRoles={['super_admin']}>
                <AdminLayout>
                  <TemplateViewPage />
                </AdminLayout>
              </RoleGuard>
            } 
          />
          
          <Route 
            path="/admin/templates/:id/edit" 
            element={
              <RoleGuard allowedRoles={['super_admin']}>
                <AdminLayout>
                  <TemplateEditorPage />
                </AdminLayout>
              </RoleGuard>
            } 
          />

          {/* Pending Approval Route - For unapproved brand managers */}
          <Route
            path="/pending"
            element={
              <RoleGuard allowedRoles={['brand_manager']} requireApprovedBrandManager={false}>
                <PendingApproval />
              </RoleGuard>
            }
          />

          {/* Brand Manager Routes - Protected for brand_manager role with approved=true */}
          <Route 
            path="/brand" 
            element={
              <RoleGuard allowedRoles={['brand_manager']} requireApprovedBrandManager>
                <BrandDashboard />
              </RoleGuard>
            } 
          />
          
          <Route 
            path="/brand/*" 
            element={
              <RoleGuard allowedRoles={['brand_manager']} requireApprovedBrandManager>
                <BrandDashboard />
              </RoleGuard>
            } 
          />
          
          <Route 
            path="/brand/content" 
            element={
              <RoleGuard allowedRoles={['brand_manager']} requireApprovedBrandManager>
                <BrandContentManager />
              </RoleGuard>
            } 
          />

          {/* Brand Training Detail */}
          <Route 
            path="/brand/trainings/:id" 
            element={
              <RoleGuard allowedRoles={['brand_manager']} requireApprovedBrandManager>
                <BrandTrainingDetail />
              </RoleGuard>
            } 
          />

          {/* Staff Routes - Protected for staff role */}
          {/* Staff Dashboard - Exact route */}
          <Route 
            path="/staff" 
            element={
              <RoleGuard allowedRoles={['staff']}>
                <StaffDashboard />
              </RoleGuard>
            } 
          />

          <Route 
            path="/staff/*" 
            element={
              <RoleGuard allowedRoles={['staff']}>
                <StaffDashboard />
              </RoleGuard>
            } 
          />

          {/* Staff Training Detail */}
          <Route 
            path="/staff/trainings/:id" 
            element={
              <RoleGuard allowedRoles={['staff']}>
                <StaffTrainingDetail />
              </RoleGuard>
            } 
          />

          {/* Emulator Test Dashboard (local only, auth required) */}
          {isLocalhost && (
            <Route 
              path="/emulator" 
              element={
                <RoleGuard allowedRoles={[]}>
                  <EmulatorTestDashboard />
                </RoleGuard>
              } 
            />
          )}

          {/* Public Firebase Emulator Diagnostics (no auth) */}
          <Route path="/emulator-diagnostics" element={<EmulatorDiagnosticPage />} />

          {/* Community Feed (any authenticated user) */}
          <Route
            path="/community/:id"
            element={
              <ProtectedRoute>
                <CommunityFeed />
              </ProtectedRoute>
            }
          />

          {/* Catch-all for unknown routes */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
      {/* Dev-only user debug widget */}
      <UserDebugCard />
      {/* Environment badge (Emulator / Production) */}
      <EnvBadge />
    </AuthProvider>
  );
}

export default App;
