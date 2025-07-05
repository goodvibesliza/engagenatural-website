import React, { useEffect } from 'react';
import { useAuth } from '../contexts/auth-context';
import { useNavigate, useLocation } from 'react-router-dom';

const AutoRedirect = () => {
  const { user, userProfile, role, brandId, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Completely disabled - no redirections will occur
  useEffect(() => {
    // All redirection logic has been disabled
    // This component will no longer automatically redirect users
    console.log('AutoRedirect component is disabled');
    
    // No redirections will happen
    return;
  }, []);

  return null; // This component doesn't render anything
};

export default AutoRedirect;