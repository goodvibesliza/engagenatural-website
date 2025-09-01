// src/components/admin/layout/AdminLayout.jsx
import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/auth-context';
import AdminSidebar from './admin-sidebar';

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  
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
      
      {/* Main Content */}
      {/*  
        lg:ml-64  ->  pushes the main content to the right by the sidebar width
        so that the fixed sidebar no longer overlaps the page on large screens
      */}
      <main className="flex-1 overflow-y-auto p-8 lg:ml-64">
        {children}
      </main>
    </div>
  );
}
