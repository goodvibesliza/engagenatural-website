import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

// Define user roles and permissions
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  BRAND_ADMIN: 'brand_admin', 
  RETAIL_ADMIN: 'retail_admin',
  USER: 'user'
}

export const PERMISSIONS = {
  // Super Admin permissions
  MANAGE_ALL_USERS: 'manage_all_users',
  MANAGE_ALL_BRANDS: 'manage_all_brands',
  MANAGE_SYSTEM_SETTINGS: 'manage_system_settings',
  VIEW_ALL_ANALYTICS: 'view_all_analytics',
  APPROVE_VERIFICATIONS: 'approve_verifications',
  MANAGE_CONTENT: 'manage_content',
  
  // Brand Admin permissions
  MANAGE_BRAND_USERS: 'manage_brand_users',
  MANAGE_BRAND_CONTENT: 'manage_brand_content',
  VIEW_BRAND_ANALYTICS: 'view_brand_analytics',
  MANAGE_BRAND_PRODUCTS: 'manage_brand_products',
  
  // Retail Admin permissions
  MANAGE_RETAIL_USERS: 'manage_retail_users',
  VIEW_RETAIL_ANALYTICS: 'view_retail_analytics',
  SUBMIT_VERIFICATION: 'submit_verification',
  
  // Common permissions
  VIEW_DASHBOARD: 'view_dashboard',
  EDIT_PROFILE: 'edit_profile'
}

// Role-based permissions mapping
const ROLE_PERMISSIONS = {
  [USER_ROLES.SUPER_ADMIN]: [
    PERMISSIONS.MANAGE_ALL_USERS,
    PERMISSIONS.MANAGE_ALL_BRANDS,
    PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
    PERMISSIONS.VIEW_ALL_ANALYTICS,
    PERMISSIONS.APPROVE_VERIFICATIONS,
    PERMISSIONS.MANAGE_CONTENT,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.EDIT_PROFILE
  ],
  [USER_ROLES.BRAND_ADMIN]: [
    PERMISSIONS.MANAGE_BRAND_USERS,
    PERMISSIONS.MANAGE_BRAND_CONTENT,
    PERMISSIONS.VIEW_BRAND_ANALYTICS,
    PERMISSIONS.MANAGE_BRAND_PRODUCTS,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.EDIT_PROFILE
  ],
  [USER_ROLES.RETAIL_ADMIN]: [
    PERMISSIONS.MANAGE_RETAIL_USERS,
    PERMISSIONS.VIEW_RETAIL_ANALYTICS,
    PERMISSIONS.SUBMIT_VERIFICATION,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.EDIT_PROFILE
  ],
  [USER_ROLES.USER]: [
    PERMISSIONS.EDIT_PROFILE
  ]
}

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      
      if (firebaseUser) {
        try {
          // Try to get user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (userDoc.exists()) {
            setUserProfile(userDoc.data())
          } else {
            // Fallback: check if user is admin based on email
            const adminEmails = [
              'admin@engagenatural.com',
              'liza@engagenatural.com'
            ]
            
            setUserProfile({
              role: adminEmails.includes(firebaseUser.email) ? USER_ROLES.SUPER_ADMIN : USER_ROLES.USER,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName
            })
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
          setUserProfile({
            role: USER_ROLES.USER,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName
          })
        }
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const role = userProfile?.role || USER_ROLES.USER
  const permissions = ROLE_PERMISSIONS[role] || []
  
  const hasPermission = (permission) => {
    return permissions.includes(permission)
  }
  
  const hasRole = (requiredRole) => {
    return role === requiredRole
  }
  
  const isAdmin = [USER_ROLES.SUPER_ADMIN, USER_ROLES.BRAND_ADMIN, USER_ROLES.RETAIL_ADMIN].includes(role)
  
  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    role,
    permissions,
    hasPermission,
    hasRole,
    isAdmin,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
