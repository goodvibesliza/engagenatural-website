// src/hooks/usePermissions.js
import { useAuth } from '../contexts/auth-context';
import { ROLES } from '../contexts/auth-context';

export function usePermissions() {
  const { user } = useAuth();
  
  if (!user) {
    return {
      canCreateTemplate: false,
      canEditTemplate: false,
      canCreateBrand: false,
      canManageBrand: () => false,
      canManageUsers: false,
      canCreateLesson: () => false,
      canEditLesson: () => false,
      canCreateCommunity: () => false,
      canEditCommunity: () => false
    };
  }
  
  const isSuperAdmin = user.role === ROLES.SUPER_ADMIN;
  const isBrandManager = user.role === ROLES.BRAND_MANAGER;
  
  return {
    canCreateTemplate: isSuperAdmin,
    canEditTemplate: isSuperAdmin,
    canCreateBrand: isSuperAdmin,
    canManageBrand: (brandId) => {
      if (isSuperAdmin) return true;
      // Check if user is a manager of this brand
      return user.managedBrands && user.managedBrands.includes(brandId);
    },
    canManageUsers: isSuperAdmin,
    canCreateLesson: (brandId) => {
      if (isSuperAdmin) return true;
      return isBrandManager && user.managedBrands && user.managedBrands.includes(brandId);
    },
    canEditLesson: (brandId) => {
      if (isSuperAdmin) return true;
      return isBrandManager && user.managedBrands && user.managedBrands.includes(brandId);
    },
    canCreateCommunity: (brandId) => {
      if (isSuperAdmin) return true;
      return isBrandManager && user.managedBrands && user.managedBrands.includes(brandId);
    },
    canEditCommunity: (brandId) => {
      if (isSuperAdmin) return true;
      return isBrandManager && user.managedBrands && user.managedBrands.includes(brandId);
    }
  };
}