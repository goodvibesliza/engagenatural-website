// src/components/admin/layout/AdminLayout.jsx
import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/auth-context';
import { useEffect } from 'react';
import AdminSidebar from './admin-sidebar';

export default function AdminLayout({ children, requireSuperAdmin = false }) {
  const auth = useAuth();
  const { user, loading } = auth;
  const location = useLocation();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireSuperAdmin && !auth.isSuperAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  // Debug logging for mounting/unmounting
  useEffect(() => {
    /* eslint-disable no-console */
    console.log('[AdminLayout] mounted');
    console.log('[AdminLayout] current path:', location.pathname);
    return () => console.log('[AdminLayout] unmounted');
    /* eslint-enable no-console */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Log on every navigation change
  useEffect(() => {
    /* eslint-disable no-console */
    console.log('[AdminLayout] navigated to:', location.pathname);
    /* eslint-enable no-console */
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
