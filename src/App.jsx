import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { auth } from './lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import './App.css'

// Import components
import PublicWebsite from './components/PublicWebsite'
import BrandsLanding from './components/BrandsLanding'
import AdminDashboard from './components/AdminDashboard'
import AdminLogin from './components/AdminLogin'
import RetailerProfile from './components/RetailerProfile'

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
    <Router>
      <div className="min-h-screen bg-white">
        <Routes>
          {/* Public website route */}
          <Route path="/" element={<PublicWebsite />} />
          
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
          
          {/* Admin login route */}
          <Route 
            path="/admin/login" 
            element={
              user && isAdmin ? (
                <Navigate to="/admin/dashboard" replace />
              ) : (
                <AdminLogin />
              )
            } 
          />
          
          {/* Admin dashboard route */}
          <Route 
            path="/admin/dashboard" 
            element={
              user && isAdmin ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/admin/login" replace />
              )
            } 
          />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

