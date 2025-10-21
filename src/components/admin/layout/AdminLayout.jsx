// src/components/admin/layout/AdminLayout.jsx
import React, { useState } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/auth-context';
import AdminSidebar from './admin-sidebar';

/**
 * Provides an admin-only layout wrapper that enforces super_admin access and renders a persistent sidebar with a main content area.
 *
 * When authentication is loading, renders a full-screen loading indicator. If the authenticated user is absent or does not
 * have the role "super_admin", redirects to the root path. Otherwise, renders the admin sidebar and places `children` in the
 * scrollable main content area.
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.children - Content to display inside the admin main area.
 * @returns {JSX.Element} The admin layout element: a loading indicator, a redirect to "/", or the sidebar plus content area containing `children`.
 */
export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const handleSignOut = () => { window.location.href = '/?logout=true'; };
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
    </div>;
  }
  
  // Defensive check: redirect if not authenticated or not super_admin
  if (!user || user.role !== "super_admin") {
    return <Navigate to="/" replace />;
  }
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Content Column */}
      <div className="flex flex-1 flex-col lg:ml-64">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}