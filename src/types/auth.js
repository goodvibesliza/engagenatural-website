// Authentication and authorization types and constants

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  BRAND_ADMIN: 'brand_admin',
  RETAIL_ADMIN: 'retail_admin',
  USER: 'user'
}

export const VERIFICATION_METHODS = {
  PHOTO_BADGE: 'photo_badge',
  MANAGER_CODE: 'manager_code',
  INVITATION: 'invitation',
  STORE_VERIFICATION: 'store_verification'
}

export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired'
}

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING_VERIFICATION: 'pending_verification'
}

export const BRAND_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING_APPROVAL: 'pending_approval',
  SUSPENDED: 'suspended'
}

export const ADMIN_ACTIONS = {
  CREATE_USER: 'create_user',
  UPDATE_USER: 'update_user',
  DELETE_USER: 'delete_user',
  APPROVE_VERIFICATION: 'approve_verification',
  REJECT_VERIFICATION: 'reject_verification',
  CREATE_BRAND: 'create_brand',
  UPDATE_BRAND: 'update_brand',
  SUSPEND_USER: 'suspend_user',
  ACTIVATE_USER: 'activate_user'
}
