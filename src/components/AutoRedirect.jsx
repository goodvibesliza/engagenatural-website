import React, { useEffect } from 'react';
import { useAuth } from '../contexts/auth-context';
import { useNavigate, useLocation } from 'react-router-dom';

const AutoRedirect = () => {
  const { userProfile, role, brandId, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't redirect if still loading or no user profile
    if (loading || !userProfile) return;

    // Auto-redirect brand managers to their dashboard
    if (role === 'brand_manager' && brandId) {
      // Define paths that should NOT trigger a redirect for brand managers
      const isOnBrandPage = location.pathname.startsWith('/brand/');
      const isOnAdminPage = location.pathname.startsWith('/admin');
      const isOnProfilePage = location.pathname.startsWith('/retailer/profile'); // <-- FIX: Add exception for profile page
      const isOnAuthPage = ['/login', '/signup', '/forgot-password'].includes(location.pathname);

      // Check if the current page is one of the allowed exceptions
      const isExceptionPage = isOnBrandPage || isOnAdminPage || isOnProfilePage || isOnAuthPage;

      /* -------------------------------------------------------------
       * DEBUG: NEW AutoRedirect v2 – trace evaluation
       * ------------------------------------------------------------- */
      /* eslint-disable no-console */
      console.log('[AutoRedirect-DEBUG]', {
        pathname: location.pathname,
        isOnBrandPage,
        isOnAdminPage,
        isOnProfilePage,
        isOnAuthPage,
        isExceptionPage,
        brandId,
      });
      /* eslint-enable no-console */
      
      if (!isExceptionPage) {
        console.log(`[AutoRedirect] Redirecting brand manager from ${location.pathname} to /brand/${brandId}`);
        navigate(`/brand/${brandId}`);
      }
    }
  }, [userProfile, role, brandId, loading, navigate, location]);

  return null; // This component doesn't render anything
};

export default AutoRedirect;
