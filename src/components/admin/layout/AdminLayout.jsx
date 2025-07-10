// src/components/admin/layout/AdminLayout.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/auth-context';

export default function AdminLayout({ children, requireSuperAdmin = false }) {
  const auth = useAuth();
  const { user, loading } = auth;
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireSuperAdmin && !auth.isSuperAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Admin Panel</h2>
        </div>
        
        <nav className="p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Content
          </p>
          
          {auth.isSuperAdmin && (
            <a href="/admin/templates" className="block py-2 px-4 text-gray-600 hover:bg-gray-50 rounded">
              Templates
            </a>
          )}
          
          <a href="/admin/brands" className="block py-2 px-4 text-gray-600 hover:bg-gray-50 rounded">
            Brands
          </a>
          
          {auth.isSuperAdmin && (
            <a href="/admin/users" className="block py-2 px-4 text-gray-600 hover:bg-gray-50 rounded">
              Users
            </a>
          )}
          
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2">
            Analytics
          </p>
          
          <a href="/admin/analytics" className="block py-2 px-4 text-gray-600 hover:bg-gray-50 rounded">
            Dashboard
          </a>
        </nav>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}