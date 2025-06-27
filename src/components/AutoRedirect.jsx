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
      // Only redirect if not already on a brand page and not on admin pages
      const isOnBrandPage = location.pathname.includes('/brand/');
      const isOnAdminPage = location.pathname.includes('/admin');
      const isOnAuthPage = location.pathname.includes('/login') || 
                          location.pathname.includes('/signup') || 
                          location.pathname.includes('/forgot-password');
      
      if (!isOnBrandPage && !isOnAdminPage && !isOnAuthPage) {
        console.log(`Redirecting brand manager to /brand/${brandId}`);
        navigate(`/brand/${brandId}`);
      }
    }
  }, [userProfile, role, brandId, loading, navigate, location]);

  return null; // This component doesn't render anything
};

export default AutoRedirect;

