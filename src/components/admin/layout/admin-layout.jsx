import { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/auth-context'
import AdminHeader from './admin-header'
import AdminSidebar from './admin-sidebar'
import MobileAdminNav from './mobile-admin-nav'

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)

  // Check authorization once on mount and when user changes
  useEffect(() => {
    if (user) {
      // Check if user is admin based on email
      const adminEmails = [
        'admin@engagenatural.com',
        'liza@engagenatural.com'
      ]
      const userIsAdmin = adminEmails.includes(user.email)
      setIsAuthorized(userIsAdmin)
      
      console.log('Admin authorization check:', userIsAdmin ? 'Authorized' : 'Not authorized')
    } else {
      setIsAuthorized(false)
    }
  }, [user])

  // Show loading state
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

  // Show unauthorized message instead of redirecting
  if (!user || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Restricted</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access the admin panel. Please log in with an administrator account.
          </p>
          <a 
            href="/" 
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </a>
        </div>
      </div>
    )
  }

  // Render admin layout for authorized users
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
