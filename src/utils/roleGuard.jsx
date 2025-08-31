// src/utils/roleGuard.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/auth-context";

/**
 * RoleGuard component that enforces:
 * 1. User is authenticated
 * 2. User has an allowed role (if specified)
 * 3. Brand managers are approved (if required)
 */
export default function RoleGuard({
  children,
  /* --------------------------------------------------------------------
   * Modern API
   * ------------------------------------------------------------------ */
  allowedRoles,
  requireApprovedBrandManager = false,
  /* --------------------------------------------------------------------
   * Back-compat prop names (retain old API so existing code keeps working)
   * ------------------------------------------------------------------ */
  roles,               // old: array of roles
  requireApproved,     // old: brand manager approval flag (defaults to true)
  requireVerified,     // old: verified gate
}) {
  /* We only formally read `user` and `loading` to satisfy the requirement,
     but we still have access to the whole auth object if needed via
     additional destructuring in the future. */
  const { user, loading } = useAuth();

  // Show skeleton while loading
  if (loading) {
    return <div className="h-8 w-24 animate-pulse bg-gray-200 rounded"></div>;
  }

  // 1. If unauthenticated → home
  if (!user) {
    return <Navigate to="/" replace />;
  }

  /* --------------------------------------------------------------------
   * 2. Role check
   * ------------------------------------------------------------------ */
  const effectiveRoleList =
    (Array.isArray(allowedRoles) && allowedRoles.length > 0 && allowedRoles) ||
    (Array.isArray(roles) && roles.length > 0 && roles) ||
    [];

  if (
    effectiveRoleList.length > 0 &&
    (typeof user.role !== "string" || !effectiveRoleList.includes(user.role))
  ) {
    return <Navigate to="/" replace />;
  }

  /* --------------------------------------------------------------------
   * 3. Brand-manager approval gate
   * ------------------------------------------------------------------ */
  const mustBeApproved =
    requireApprovedBrandManager ||
    (requireApproved !== undefined ? requireApproved : true);

  if (
    mustBeApproved &&
    user.role === "brand_manager" &&
    user.approved !== true
  ) {
    return <Navigate to="/pending" replace />;
  }

  /* --------------------------------------------------------------------
   * 4. Legacy verified gate (kept for compatibility). Only when explicitly
   *    requested and user is not super_admin.
   * ------------------------------------------------------------------ */
  if (
    requireVerified &&
    user.role !== "super_admin" &&
    user.verified !== true
  ) {
    return <Navigate to="/" replace />;
  }

  // All checks passed, render children
  return children;
}
