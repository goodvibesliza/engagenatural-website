export interface RoleAccessResult {
  role?: string
  brandId?: string
  canAccess: (required: string | string[]) => boolean
  canViewAnalytics: (scope?: 'all' | 'brand' | 'retail') => boolean
  isSuperAdmin: boolean
  isBrandManager: boolean
  isRetailUser: boolean
  isCommunityUser: boolean
}

export function useRoleAccess(): RoleAccessResult
