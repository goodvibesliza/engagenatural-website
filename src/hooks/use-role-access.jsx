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
   * Check if user can manage another user based on roles
   * @param {string} targetUserRole - Role of the user to be managed
   * @returns {boolean}
   */
  const canManageUser = (targetUserRole) => {
    if (!user || loading) return false
    
    // Super admin can manage everyone
    if (hasRole('super_admin')) return true
    
    // Brand admin can manage retail admins and users
    if (hasRole('brand_admin')) {
      return ['retail_admin', 'user'].includes(targetUserRole)
    }
    
    // Retail admin can manage users
    if (hasRole('retail_admin')) {
      return targetUserRole === 'user'
    }
    
    return false
  }

  /**
   * Check if user can view analytics of specified type
   * @param {string} analyticsType - Type of analytics (all, brand, retail)
   * @returns {boolean}
   */
  const canViewAnalytics = (analyticsType) => {
    if (!user || loading) return false
    
    switch (analyticsType) {
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
   * Get the appropriate dashboard route for user's role
   * @returns {string}
   */
  const getDashboardRoute = () => {
    if (!user) return '/admin/login'
    return '/admin'
  }

  /**
   * Get navigation items based on user permissions
   * @returns {Array}
   */
  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Overview', href: '/admin', icon: 'Home', permission: null }
    ]

    const conditionalItems = [
      { 
        name: 'Users', 
        href: '/admin/users', 
        icon: 'Users', 
        permission: ['manage_all_users', 'manage_brand_users', 'manage_retail_users'] 
      },
      { 
        name: 'Verifications', 
        href: '/admin/verifications', 
        icon: 'UserCheck', 
        permission: ['approve_verifications'] 
      },
      { 
        name: 'Brands', 
        href: '/admin/brands', 
        icon: 'Building', 
        permission: ['manage_all_brands', 'manage_brand_content', 'manage_brand_products'] 
      },
      { 
        name: 'Analytics', 
        href: '/admin/analytics', 
        icon: 'TrendingUp', 
        permission: ['view_all_analytics', 'view_brand_analytics', 'view_retail_analytics'] 
      },
      { 
        name: 'Content', 
        href: '/admin/content', 
        icon: 'FileText', 
        permission: ['manage_content', 'manage_brand_content'] 
      },
      { 
        name: 'Products', 
        href: '/admin/products', 
        icon: 'Package', 
        permission: ['manage_brand_products'] 
      },
      { 
        name: 'Activity', 
        href: '/admin/activity', 
        icon: 'Activity', 
        permission: ['view_all_analytics'] 
      },
      { 
        name: 'Settings', 
        href: '/admin/settings', 
        icon: 'Settings', 
        permission: ['manage_system_settings'] 
      }
    ]

    return [
      ...baseItems,
      ...conditionalItems.filter(item => 
        !item.permission || canAccess(item.permission)
      )
    ]
  }

  return {
    user,
    userProfile,
    role,
    permissions,
    loading,
    isAdmin,
    hasPermission,
    hasRole,
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
