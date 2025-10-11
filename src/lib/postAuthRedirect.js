// src/lib/postAuthRedirect.js

/**
 * Determine the landing route immediately after successful authentication.
 * Priority:
 * 1) redirectTo query param (or returnUrl for backward-compat)
 * 2) en.lastRoute (only for staff-family roles, if valid)
 * 3) Role defaults (Brand/Admin unchanged). Staff default: /community?tab=whats-good
 *
 * @param {{ role?: string, approved?: boolean }} user
 * @param {{ search?: string }} [opts]
 * @returns {string}
 */
export default function postAuthRedirect(user = {}, opts = {}) {
  const role = String(user?.role || '').toLowerCase();
  const approved = user?.approved === true;
  const search = typeof opts.search === 'string' ? opts.search : (typeof window !== 'undefined' ? window.location.search : '');

  // 1) redirectTo / returnUrl override
  try {
    if (search) {
      const params = new URLSearchParams(search);
      const redirectTo = params.get('redirectTo') || params.get('returnUrl');
      if (
        redirectTo &&
        redirectTo.startsWith('/') &&
        (redirectTo.length === 1 || redirectTo[1] !== '/')
      ) {
        return redirectTo;
      }
    }
  } catch (e) { void e; }

  // helpers
  const isStaffFamily = ['staff', 'verified_staff', 'retail_staff'].includes(role);
  const isValidStaffPath = (p) => typeof p === 'string' && p.startsWith('/') && (p.startsWith('/community') || p.startsWith('/staff'));

  // 2) lastRoute for staff-family
  if (isStaffFamily && typeof window !== 'undefined') {
    try {
      const last = window.localStorage.getItem('en.lastRoute');
      if (isValidStaffPath(last)) return last;
    } catch (e) { void e; }
  }

  // 3) Role defaults
  if (role === 'super_admin') return '/admin';
  if (role === 'brand_manager') return approved ? '/brand' : '/pending';
  if (isStaffFamily) return '/community?tab=whats-good';
  return '/';
}
