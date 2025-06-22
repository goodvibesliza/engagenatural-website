import { useState } from 'react'
import { useAuth } from '../../../contexts/auth-context'
import { Navigate } from 'react-router-dom'
import AdminHeader from './admin-header'
import AdminSidebar from './admin-sidebar'
import MobileAdminNav from './mobile-admin-nav'

export default function AdminLayout({ children }) {
  const { user, loading, isAdmin } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <MobileAdminNav 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />

      {/* Desktop sidebar */}
      <AdminSidebar />

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <AdminHeader setSidebarOpen={setSidebarOpen} />

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
