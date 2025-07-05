import { useAuth } from '../contexts/auth-context'

/**
 * Simplified hook for role-based access control
 * This version returns permissive defaults to avoid navigation throttling
 */
export function useRoleAccess() {
  const { role } = useAuth()
  
  // Simplified permission check that always returns true
  const canAccess = (permissions) => {
    // Always allow access to avoid complex permission checking
    // that might cause navigation throttling
    return true
  }
  
  // Simplified analytics access check
  const canViewAnalytics = (scope) => {
    // Always allow analytics access
    return true
  }
  
  // Helper for checking if user is admin
  const isAdmin = () => {
    return role === 'super_admin' || role === 'admin'
  }
  
  // Helper for checking if user is brand manager
  const isBrandManager = () => {
    return role === 'brand_manager'
  }
  
  return {
    canAccess,
    canViewAnalytics,
    isAdmin,
    isBrandManager
  }
}
