import { useAuth, PERMISSIONS } from '../contexts/auth-context';

/**
 * A custom hook to manage role-based access control (RBAC) throughout the application.
 * It provides functions to check permissions based on the current user's role by using
 * the hasPermission function from the AuthContext.
 */
export function useRoleAccess() {
  const { 
    role, 
    brandId, 
    hasPermission, 
    isSuperAdmin, 
    isBrandManager, 
    isRetailUser, 
    isCommunityUser 
  } = useAuth();

  /**
   * Checks if the current user has at least one of the required permissions.
   * @param {string|string[]} requiredPermissions - A single permission or an array of permissions to check.
   * @returns {boolean} - True if the user has at least one of the required permissions, otherwise false.
   */
  const canAccess = (requiredPermissions) => {
    if (!role) {
      return false;
    }
    
    const permissionsToCheck = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];

    // Use the hasPermission function from the AuthContext to check if the user has any of the required permissions.
    return permissionsToCheck.some(permission => hasPermission(permission));
  };

  /**
   * Checks if the user can view analytics, potentially scoped to a certain level.
   * @param {string} scope - The scope of analytics to check ('all', 'brand', 'retail').
   * @returns {boolean} - True if the user can view the specified scope of analytics.
   */
  const canViewAnalytics = (scope = 'all') => {
    // Super admins can view all analytics scopes.
    if (isSuperAdmin) {
      return true;
    }
    
    // Brand managers can only view analytics for their own brand.
    if (scope === 'brand' && isBrandManager && brandId) {
      return true;
    }
    
    // For other roles, fall back to the generic permission check for viewing analytics.
    if (scope === 'all') {
        return hasPermission(PERMISSIONS.VIEW_ANALYTICS);
    }

    return false;
  };

  return {
    // Current user's role and brandId from context
    role,
    brandId,
    
    // Permission checking functions
    canAccess,
    canViewAnalytics,

    // Role helper functions from context
    isSuperAdmin,
    isBrandManager,
    isRetailUser,
    isCommunityUser,
  };
}
