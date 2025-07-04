import React, { useEffect } from 'react';
import { useAuth } from '../contexts/auth-context';
import { useNavigate, useLocation } from 'react-router-dom';

const AutoRedirect = () => {
  const { user, userProfile, role, brandId, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't redirect if still loading
    if (loading) return;

    // Check if user is authenticated
    const isAuthenticated = !!user;
    
    // Define path checks
    const isOnBrandPage = location.pathname.includes('/brand/');
    const isOnAdminPage = location.pathname.includes('/admin');
    const isOnAuthPage = location.pathname.includes('/login') || 
                        location.pathname.includes('/signup') || 
                        location.pathname.includes('/forgot-password');
    const isHomePage = location.pathname === '/';
    
    // Redirect unauthenticated users to login page
    if (!isAuthenticated && !isOnAuthPage && !isHomePage) {
      console.log('Redirecting unauthenticated user to login page');
      navigate('/admin/login');
      return;
    }

    // If authenticated and has user profile, handle role-specific redirects
    if (isAuthenticated && userProfile) {
      // Auto-redirect brand managers to their dashboard (only if they're not already on a specific page)
      if (role === 'brand_manager' && brandId) {
        if (!isOnBrandPage && !isOnAdminPage && !isOnAuthPage) {
          console.log(`Redirecting brand manager to /brand/${brandId}`);
          navigate(`/brand/${brandId}`);
        }
      }
    }
  }, [user, userProfile, role, brandId, loading, navigate, location]);

  return null; // This component doesn't render anything
};

export default AutoRedirect;
