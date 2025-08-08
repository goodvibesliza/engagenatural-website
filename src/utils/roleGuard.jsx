import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';

const RoleGuard = ({ roles, requireVerified = false, children }) => {
  const { user, loading, hasRole, isSuperAdmin } = useAuth();

  // Display a minimal loader while auth state is resolving
  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  // Redirect unauthenticated users to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role check (supports string or array). Super admins always pass.
  if (roles && !isSuperAdmin && !hasRole(roles)) {
    return <Navigate to="/" replace />;
  }

  // Verification check unless super admin bypasses
  if (requireVerified && !isSuperAdmin && user.verified !== true) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RoleGuard;
