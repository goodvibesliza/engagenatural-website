import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
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
import EnvCheck from './pages/admin/EnvCheck';
import PendingApproval from './pages/PendingApproval';   // ⬅️ pending-approval page

// Brand Manager Components
import BrandDashboard from './pages/brand/Dashboard';
import BrandContentManager from './pages/brand/BrandContentManager';
// Brand Training Detail
import BrandTrainingDetail from './pages/brand/TrainingDetail.jsx';
// Brand Community Management
import CommunityList from './pages/brand/CommunityList.jsx';
import CommunityComposer from './pages/brand/CommunityComposer.jsx';

// Staff Components
import StaffDashboard from './pages/staff/Dashboard';
// Staff Training Detail
import StaffTrainingDetail from './pages/staff/TrainingDetail.jsx';
// Error boundary to catch runtime errors in heavy pages
import ErrorBoundary from './components/ErrorBoundary';
// New sidebar layout & pages
import StaffDashboardLayout from './pages/staff/dashboard/StaffDashboardLayout.jsx';
import ProfilePage from './pages/staff/dashboard/ProfilePage.jsx';
import VerificationPage from './pages/staff/dashboard/VerificationPage.jsx';
import CommunitiesPage from './pages/staff/dashboard/CommunitiesPage.jsx';
import MyBrandsPage from './pages/staff/dashboard/MyBrandsPage.jsx';
import LearningPage from './pages/staff/dashboard/LearningPage.jsx';
import RequireVerification from './pages/staff/dashboard/RequireVerification.jsx';

// Emulator Components
import EmulatorTestDashboard from './pages/EmulatorTestDashboard';
import EmulatorDiagnosticPage from './pages/EmulatorDiagnosticPage';
// Community (phone-first IA)
import Community from './pages/Community';
const PostDetail = lazy(() => import('./pages/PostDetail'));

// Dev-only debug card (renders nothing in production)
import UserDebugCard from './components/dev/UserDebugCard';
import EnvBadge from './components/dev/EnvBadge';
// Global user dropdown
import UserDropdownMenu from './components/UserDropdownMenu';

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

/**
 * Root application component that sets up authentication context, global UI chrome, feature flags, and the entire client-side route tree.
 *
 * Renders AuthProvider and Router with:
 * - a global UserDropdownMenu and environment badge,
 * - RootEntry mounted at "/",
 * - role-guarded admin, brand, and staff areas,
 * - protected community routes (new nested feeds and legacy post view),
 * - emulator/debug routes gated by environment or feature flags,
 * - redirects for unknown routes.
 *
 * The component reads VITE_SHOW_DEMO_TOOLS to enable demo/dev routes and sets an internal emulator-initialized flag on mount.
 *
 * @returns {JSX.Element} The application root element containing routing and global UI.
 */
function App() {
  const [emulatorInitialized, setEmulatorInitialized] = useState(false);
  // Feature flag for demo / dev tools & env check
  const showDemoTools = import.meta.env.VITE_SHOW_DEMO_TOOLS === 'true';
  
  // Skip emulator setup since using production Firebase
  useEffect(() => {
    setEmulatorInitialized(true);
  }, []);

  return (
    <AuthProvider>
      <Router>
        {/* Global user menu (top-right, visible on every route) */}
        <div className="fixed top-3 right-3 z-50">
          <UserDropdownMenu />
        </div>
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
          {/* Demo / Dev / Env routes – only when flag enabled */}
          {showDemoTools && (
            <>
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
              <Route 
                path="/admin/env-check" 
                element={
                  <RoleGuard allowedRoles={['super_admin']}>
                    <AdminLayout>
                      <EnvCheck />
                    </AdminLayout>
                  </RoleGuard>
                } 
              />
            </>
          )}
          
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
          >
            {/* Community management routes */}
            <Route path="community" element={<CommunityList />} />
            <Route path="community/new" element={<CommunityComposer mode="create" />} />
            <Route path="community/:postId/edit" element={<CommunityComposer mode="edit" />} />
          </Route>
          
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
          {/* Staff Dashboard – new sidebar layout */}
          {/* bare /staff → redirect to community */}
          <Route
            path="/staff"
            element={<Navigate to="/community" replace />}
          />

          {/* Nested staff routes under sidebar layout */}
          <Route
            path="/staff/*"
            element={
              <RoleGuard allowedRoles={['staff']}>
                <ErrorBoundary>
                  <StaffDashboardLayout />
                </ErrorBoundary>
              </RoleGuard>
            }
          >
            <Route index element={<Navigate to="/staff/profile" replace />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="verification" element={<VerificationPage />} />
            <Route
              path="communities"
              element={<CommunitiesPage />}
            />
            <Route
              path="my-brands"
              element={
                <RequireVerification>
                  <MyBrandsPage />
                </RequireVerification>
              }
            />
            <Route
              path="learning"
              element={
                <RequireVerification>
                  <LearningPage />
                </RequireVerification>
              }
            />
          </Route>

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

          {/* Community Routes */}
          <Route path="/community" element={<Navigate to="/community/whats-good" replace />} />
          <Route
            path="/community/whats-good"
            element={
              <ProtectedRoute>
                <Community />
              </ProtectedRoute>
            }
          />
          <Route
            path="/community/post/:postId"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <PostDetail />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* Legacy Community Feed route removed */}

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
