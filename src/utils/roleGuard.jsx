// src/utils/roleGuard.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/auth-context";

/**
 * RoleGuard wraps a route and enforces:
 * 1) user is authenticated
 * 2) user has at least one required role (if provided)
 * 3) optional: user.verified === true (requireVerified)
 *
 * Usage:
 * <RoleGuard roles={['super_admin']}><AdminDashboard /></RoleGuard>
 * <RoleGuard roles={['brand_manager']}><BrandDashboard /></RoleGuard>
 * <RoleGuard roles={['staff']} requireVerified><StaffDashboard /></RoleGuard>
 */
export default function RoleGuard({
  children,
  roles = [],             // allowed roles; [] = any authenticated user
  requireVerified = false, // if true, user.verified must be true (except super_admin)
}) {
  const { loading, isAuthenticated, role, isVerified, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  // Not logged in → go to login, preserve where they were headed
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check (supports array or empty = any)
  if (roles.length > 0 && !hasRole(roles)) {
    // Logged in but wrong role → send to a neutral place
    return <Navigate to="/" replace />;
  }

  // Verification gate: super_admin bypasses by design
  if (requireVerified && role !== "super_admin" && !isVerified) {
  return <div className="p-8 text-center">Your account is pending approval.</div>;
}


  return children;
}
