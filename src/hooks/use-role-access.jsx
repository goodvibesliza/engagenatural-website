import { useAuth, USER_ROLES, PERMISSIONS, ROLE_PERMISSIONS } from '../contexts/auth-context';

/**
 * A custom hook to manage role-based access control (RBAC) throughout the application.
 * It provides functions to check permissions based on the current user's role.
 */
export function useRoleAccess() {
  const { role, brandId } = useAuth();

  /**
   * Checks if the current user has at least one of the required permissions.
   * @param {string|string[]} requiredPermissions - A single permission or an array of permissions to check.
   * @returns {boolean} - True if the user has at least one of the required permissions, otherwise false.
   */
  const canAccess = (requiredPermissions) => {
    if (!role || !ROLE_PERMISSIONS[role]) {
      return false;
    }

    const userPermissions = ROLE_PERMISSIONS[role];
    const permissionsToCheck = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];

    // Returns true if the user's role includes any of the permissions in the permissionsToCheck array.
    return permissionsToCheck.some(permission => userPermissions.includes(permission));
  };

  /**
   * Checks if the user can view analytics, potentially scoped to a certain level.
   * @param {string} scope - The scope of analytics to check ('all', 'brand', 'retail').
   * @returns {boolean} - True if the user can view the specified scope of analytics.
   */
  const canViewAnalytics = (scope = 'all') => {
    if (!role) return false;

    // Super admins can view all analytics scopes.
    if (role === USER_ROLES.SUPER_ADMIN) {
      return true;
    }
    
    // Brand managers can only view analytics for their own brand.
    if (role === USER_ROLES.BRAND_MANAGER) {
      return scope === 'brand' && brandId;
    }
    
    // For other roles, we can fall back to the generic permission check.
    // This could be expanded with more specific logic for 'retail' scope if needed.
    if (scope === 'all') {
        return canAccess(PERMISSIONS.VIEW_ANALYTICS);
    }

    return false;
  };

  // --- Role-checking helper functions for convenience ---

  const isSuperAdmin = () => role === USER_ROLES.SUPER_ADMIN;
  const isBrandManager = () => role === USER_ROLES.BRAND_MANAGER;
  const isRetailUser = () => role === USER_ROLES.RETAIL_USER;
  const isCommunityUser = () => role === USER_ROLES.COMMUNITY_USER;

  return {
    // Current user's role and brandId
    role,
    brandId,
    
    // Permission checking functions
    canAccess,
    canViewAnalytics,

    // Role helper functions
    isSuperAdmin,
    isBrandManager,
    isRetailUser,
    isCommunityUser,
  };
}
