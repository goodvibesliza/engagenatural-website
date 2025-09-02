/**
 * Custom hook for handling user logout functionality
 * 
 * @module hooks/useLogout
 * @description Provides a consistent way to handle user logout across the application,
 * including navigation to the home page and clearing persistent state
 */

import { useCallback } from 'react';
import { useAuth } from '../contexts/auth-context';

/**
 * Hook that provides a logout function
 * 
 * @returns {Object} Object containing the logout function
 * @returns {Function} logout - Function to handle user logout
 * 
 * @example
 * // In a component:
 * const { logout } = useLogout();
 * 
 * // Then use it in a button or other event handler:
 * <button onClick={logout}>Sign Out</button>
 */
export function useLogout() {
  const { signOut } = useAuth();
  
  /**
   * Handles user logout by signing out, navigating to home page,
   * and reloading the page to clear any persistent state
   */
  const logout = useCallback(async () => {
    try {
      // 1. Set a flag in localStorage to force the public website to show
      localStorage.setItem('FORCE_PUBLIC_WEBSITE', 'true');

      // 2. Small delay to ensure the flag is written before navigation logic runs
      await new Promise((res) => setTimeout(res, 50));

      // 3. Sign out from Firebase auth
      await signOut();
      
      // Clear all storage that might affect auth state
      try {
        // Keep the FORCE_PUBLIC_WEBSITE flag
        const publicWebsiteFlag = localStorage.getItem('FORCE_PUBLIC_WEBSITE');
        
        // Clear storages
        localStorage.clear();
        sessionStorage.clear();
        
        // Restore the flag
        localStorage.setItem('FORCE_PUBLIC_WEBSITE', publicWebsiteFlag);
      } catch (storageErr) {
        console.warn('Storage clearing failed:', storageErr);
      }

      // 5. Most forceful redirect approach – full hard reload
      window.location.href = '/?forcepublic=true&ts=' + new Date().getTime();
    } catch (error) {
      console.error('Failed to sign out:', error);
      // Even if sign-out fails, ensure user is taken to public website
      window.location.href = '/?forcepublic=true&ts=' + new Date().getTime();
    }
  }, [signOut]);
  
  return { logout };
}

export default useLogout;
