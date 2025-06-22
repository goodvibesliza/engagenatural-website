import { useAuth } from '../contexts/auth-context'

/**
 * Custom hook for role-based access control
 * Provides utilities for checking user permissions and roles
 */
export function useRoleAccess() {
  const { 
    user, 
    userProfile, 
    role, 
    permissions, 
    hasPermission, 
    hasRole, 
    isAdmin,
    loading 
  } = useAuth()

  /**
   * Check if user has any of the specified permissions
   * @param {string|string[]} requiredPermissions - Permission(s) to check
   * @returns {boolean}
   */
  const canAccess = (requiredPermissions) => {
    if (!user || loading) return false
    
    if (Array.isArray(requiredPermissions)) {
      return requiredPermissions.some(permission => hasPermission(permission))
    }
    
    return hasPermission(requiredPermissions)
  }

  /**
   * Check if user has all of the specified permissions
   * @param {string[]} requiredPermissions - Permissions to check
   * @returns {boolean}
   */
  const canAccessAll = (requiredPermissions) => {
    if (!user || loading) return false
    
    return requiredPermissions.every(permission => hasPermission(permission))
  }

  /**
   * Check if user has any of the specified roles
   * @param {string|string[]} requiredRoles - Role(s) to check
   * @returns {boolean}
   */
  const hasAnyRole = (requiredRoles) => {
    if (!user || loading) return false
    
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.some(requiredRole => hasRole(requiredRole))
    }
    
    return hasRole(requiredRoles)
  }

  /**
   * Check if user can manage other users
   * @param {string} targetUserId - ID of user to manage
   * @returns {boolean}
   */
  const canManageUser = (targetUserId) => {
    if (!user || loading) return false
    
    // Super admin can manage all users
    if (hasPermission('manage_all_users')) return true
    
    // Brand admin can manage users in their brand
    if (hasPermission('manage_brand_users') && userProfile?.brandId) {
      // Would need to check if target user belongs to same brand
      return true
    }
    
    // Retail admin can manage users in their retail location
    if (hasPermission('manage_retail_users') && userProfile?.retailLocationId) {
      // Would need to check if target user belongs to same retail location
      return true
    }
    
    return false
  }

  /**
   * Check if user can view analytics for a specific scope
   * @param {string} scope - 'all', 'brand', 'retail'
   * @returns {boolean}
   */
  const canViewAnalytics = (scope = 'all') => {
    if (!user || loading) return false
    
    switch (scope) {
      case 'all':
        return hasPermission('view_all_analytics')
      case 'brand':
        return hasPermission('view_brand_analytics') || hasPermission('view_all_analytics')
      case 'retail':
        return hasPermission('view_retail_analytics') || hasPermission('view_all_analytics')
      default:
        return false
    }
  }

  /**
   * Get appropriate dashboard route based on user role
   * @returns {string}
   */
  const getDashboardRoute = () => {
    if (!user || loading) return '/login'
    
    switch (role) {
      case 'super_admin':
        return '/admin/super-admin'
      case 'brand_admin':
        return '/admin/brand'
      case 'retail_admin':
        return '/admin/retail'
      default:
        return '/dashboard'
    }
  }

  /**
   * Get navigation items based on user permissions
   * @returns {Array}
   */
  const getNavigationItems = () => {
    if (!user || loading) return []
    
    const navItems = []
    
    // Dashboard (available to all authenticated users)
    if (hasPermission('view_dashboard')) {
      navItems.push({
        id: 'overview',
        label: 'Overview',
        icon: 'BarChart3',
        path: getDashboardRoute(),
        show: true
      })
    }
    
    // User Management
    if (canAccess(['manage_all_users', 'manage_brand_users', 'manage_retail_users'])) {
      navItems.push({
        id: 'users',
        label: 'Users',
        icon: 'Users',
        path: '/admin/users',
        show: true
      })
    }
    
    // Brand Management
    if (canAccess(['manage_all_brands', 'manage_brand_content', 'manage_brand_products'])) {
      navItems.push({
        id: 'brands',
        label: 'Brands',
        icon: 'Building',
        path: '/admin/brands',
        show: true
      })
    }
    
    // Verification Management
    if (hasPermission('approve_verifications')) {
      navItems.push({
        id: 'verifications',
        label: 'Verifications',
        icon: 'UserCheck',
        path: '/admin/verifications',
        show: true
      })
    }
    
    // Analytics
    if (canViewAnalytics('all') || canViewAnalytics('brand') || canViewAnalytics('retail')) {
      navItems.push({
        id: 'analytics',
        label: 'Analytics',
        icon: 'TrendingUp',
        path: '/admin/analytics',
        show: true
      })
    }
    
    // Content Management
    if (canAccess(['manage_content', 'manage_brand_content'])) {
      navItems.push({
        id: 'content',
        label: 'Content',
        icon: 'FileText',
        path: '/admin/content',
        show: true
      })
    }
    
    // System Settings (Super Admin only)
    if (hasPermission('manage_system_settings')) {
      navItems.push({
        id: 'settings',
        label: 'Settings',
        icon: 'Settings',
        path: '/admin/settings',
        show: true
      })
    }
    
    return navItems.filter(item => item.show)
  }

  return {
    user,
    userProfile,
    role,
    permissions,
    isAdmin,
    loading,
    canAccess,
    canAccessAll,
    hasAnyRole,
    canManageUser,
    canViewAnalytics,
    getDashboardRoute,
    getNavigationItems
  }
}

export default useRoleAccess
