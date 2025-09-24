/**
 * Utility function to determine the appropriate landing route based on user role
 * @param {Object} user - The user object containing role information
 * @param {string} user.role - The role string (super_admin | brand_manager | staff)
 * @param {boolean} [user.approved] - For brand_manager users, whether the account
 *   has been approved by an administrator. Unapproved managers are routed to
 *   "/pending".
 * @returns {string} The appropriate landing route path
 */
export default function getLandingRouteFor(user) {
  /*
    Route rules:
      1. If no user → '/'
      2. super_admin → '/admin'
      3. brand_manager & approved=true → '/brand'
      4. brand_manager & approved!==true → '/pending'
      5. staff → '/staff'
      6. Anything else → '/'
  */

  // 1. No user (null/undefined) – fallback to public root.
  if (!user) return '/';

  // Ensure role comparisons use strict equality.
  const { role } = user;

  // 2. Super admin
  if (role === 'super_admin') return '/admin';

  // 3 & 4. Brand manager routes (approval gate)
  if (role === 'brand_manager') {
    return user.approved === true ? '/brand' : '/pending';
  }

  // 5. Staff (land on new Community by default)
  //    Accept any staff-family role aliases
  if (role === 'staff' || role === 'verified_staff' || role === 'retail_staff') {
    return '/community';
  }

  // 6. Default fallback
  return '/';
}
