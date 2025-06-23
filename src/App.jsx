import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { auth } from './lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import './App.css'

// Import contexts
import { AuthProvider } from './contexts/auth-context'

// Import components
import PublicWebsite from './components/PublicWebsite'
import BrandsLanding from './components/BrandsLanding'
import AdminDashboard from './components/AdminDashboard'
import AdminLogin from './components/AdminLogin'
import RetailerProfile from './components/RetailerProfile'
import CommunityPage from './components/CommunityPage'

// Import new auth components
import LoginForm from './components/auth/login-form'
import PasswordReset from './components/auth/password-reset'
import SignupForm from './components/auth/signup-form'

// Import new admin components
import AdminLayout from './components/admin/layout/admin-layout'
import AdminOverview from './components/admin/dashboard/admin-overview'
import VerificationManagement from './components/admin/verification/verification-management'
import UserManagement from './components/admin/users/user-management'
import AnalyticsDashboard from './components/admin/analytics/analytics-dashboard'
import BrandManagement from './components/admin/brand/brand-management'
import ContentManagement from './components/admin/content/content-management'
import ActivityFeed from './components/admin/activity/activity-feed'
import SystemSettings from './components/admin/settings/system-settings'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      
      if (user) {
        // Check if user is admin (you can customize this logic)
        const adminEmails = [
          'admin@engagenatural.com',
          'liza@engagenatural.com',
          // Add more admin emails as needed
        ]
        setIsAdmin(adminEmails.includes(user.email))
      } else {
        setIsAdmin(false)
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-600 font-body">Loading EngageNatural...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-white">
          <Routes>
            {/* Public website route */}
            <Route path="/" element={<PublicWebsite />} />

            {/* Community route */}
            <Route path="/community/:communityId" element={<CommunityPage />} />
                        
            {/* Hidden brands landing page - only accessible via direct link */}
            <Route path="/brands" element={<BrandsLanding />} />
            
            {/* Retailer profile route */}
            <Route 
              path="/retailer/profile" 
              element={
                user ? (
                  <RetailerProfile />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            
            {/* Admin authentication routes */}
            <Route 
              path="/admin/login" 
              element={
                user && isAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                    <LoginForm />
                  </div>
                )
              } 
            />
            
            <Route 
              path="/admin/forgot-password" 
              element={
                <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                  <PasswordReset />
                </div>
              } 
            />
            
            <Route 
              path="/admin/signup" 
              element={
                <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                  <SignupForm />
                </div>
              } 
            />
            
            {/* Legacy admin dashboard route - redirect to new admin */}
            <Route 
              path="/admin/dashboard" 
              element={<Navigate to="/admin" replace />}
            />

            {/* New Admin Routes with Layout */}
            <Route 
              path="/admin/*" 
              element={
                <AdminLayout>
                  <Routes>
                    {/* Main admin overview */}
                    <Route index element={<AdminOverview />} />
                    
                    {/* Legacy dashboard route */}
                    <Route path="legacy" element={<AdminDashboard />} />
                    
                   {/* Admin feature routes */}
<Route path="users" element={<UserManagement />} />
<Route path="verifications" element={<VerificationManagement />} />
<Route path="brands" element={<BrandManagement />} />
<Route path="analytics" element={<AnalyticsDashboard />} />
<Route path="content" element={<ContentManagement />} />
<Route path="products" element={<div className="p-6"><h1 className="text-2xl font-bold">Product Distribution</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
<Route path="activity" element={<ActivityFeed />} />
<Route path="settings" element={<SystemSettings />} />

                    
                    {/* Catch all admin route */}
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                  </Routes>
                </AdminLayout>
              } 
            />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App

