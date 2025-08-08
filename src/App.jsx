// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import "./App.css";

import { AuthProvider, useAuth } from "./contexts/auth-context";
import RoleGuard from "./utils/roleGuard";

import BrandDashboard from "./pages/brand/Dashboard";
import ContentManager from "./pages/brand/ContentManager";
import StyleGuide from "./pages/brand/StyleGuide";

import AdminDashboard from "./pages/admin/Dashboard";
import VerifyStaff from "./pages/admin/VerifyStaff";

import Login from "./pages/auth/Login";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <RoleGuard roles={["super_admin"]}>
                <AdminDashboard />
              </RoleGuard>
            }
          />
          <Route
            path="/admin/verify"
            element={
              <RoleGuard roles={["super_admin"]}>
                <VerifyStaff />
              </RoleGuard>
            }
          />

          {/* Brand Manager */}
          <Route
            path="/brand"
            element={
              <RoleGuard roles={["brand_manager"]}>
                <BrandDashboard />
              </RoleGuard>
            }
          />
          <Route
            path="/brand/:brandId/*"
            element={
              <RoleGuard roles={["brand_manager"]}>
                <BrandDashboard />
              </RoleGuard>
            }
          />
          <Route
            path="/brand/:brandId/content"
            element={
              <RoleGuard roles={["brand_manager"]}>
                <ContentManager />
              </RoleGuard>
            }
          />
          <Route
            path="/brand/:brandId/style-guide"
            element={
              <RoleGuard roles={["brand_manager"]}>
                <StyleGuide />
              </RoleGuard>
            }
          />

          {/* Default root – role-based redirect */}
          <Route path="/" element={<RoleBasedRedirect />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

function LoginRoute() {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();
  if (isAuthenticated) {
    return <Navigate to={dashboardHome(role)} state={{ from: location }} replace />;
  }
  return <Login />;
}

// send users to the right home based on role
function dashboardHome(role) {
  if (role === "super_admin") return "/admin";
  if (role === "brand_manager") return "/brand";
  return "/"; // if you add staff later: return "/staff"
}

function RoleBasedRedirect() {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Navigate to={dashboardHome(role)} replace />;
}

export default App;
