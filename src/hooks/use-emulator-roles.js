// src/hooks/use-emulator-roles.js
import { useState, useEffect } from 'react';
import { isLocalhost } from '../lib/firebase';
import { useAuth } from '../contexts/auth-context';
import { 
  getCurrentUserClaims, 
  setEmulatorClaims, 
  signInWithEmulatorClaims,
  signOutAndClearClaims
} from '../utils/emulatorAuthHelper';

/**
 * A hook for managing user roles in the Firebase emulator environment.
 * This hook is only functional when running in localhost/emulator mode.
 * 
 * @returns {Object} Functions and state for managing emulator roles
 */
export function useEmulatorRoles() {
  const { user } = useAuth();
  const [currentClaims, setCurrentClaims] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Not available outside of emulator mode
  const isAvailable = isLocalhost;
  
  // Load current claims on mount and when user changes
  useEffect(() => {
    if (!isLocalhost) {
      setLoading(false);
      return;
    }
    
    try {
      const claims = getCurrentUserClaims();
      setCurrentClaims(claims);
    } catch (err) {
      console.error('Error loading emulator claims:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  /**
   * Set the current user as an admin
   */
  const setAdminRole = async () => {
    if (!isLocalhost || !user) return false;
    
    try {
      setLoading(true);
      const claims = {
        role: 'admin',
        admin: true,
        displayName: user.displayName || 'Admin User'
      };
      
      await setEmulatorClaims(user.uid, claims);
      setCurrentClaims(claims);
      return true;
    } catch (err) {
      console.error('Error setting admin role:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Set the current user as a brand manager for a specific brand
   * @param {string} brandId - The ID of the brand to manage
   */
  const setBrandManagerRole = async (brandId) => {
    if (!isLocalhost || !user) return false;
    if (!brandId) {
      setError('brandId is required for brand manager role');
      return false;
    }
    
    try {
      setLoading(true);
      const claims = {
        role: 'brand',
        brandId,
        displayName: user.displayName || 'Brand Manager'
      };
      
      await setEmulatorClaims(user.uid, claims);
      setCurrentClaims(claims);
      return true;
    } catch (err) {
      console.error('Error setting brand manager role:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Set the current user as a regular user (no special permissions)
   */
  const setRegularUserRole = async () => {
    if (!isLocalhost || !user) return false;
    
    try {
      setLoading(true);
      const claims = {
        role: 'user',
        displayName: user.displayName || 'Regular User'
      };
      
      await setEmulatorClaims(user.uid, claims);
      setCurrentClaims(claims);
      return true;
    } catch (err) {
      console.error('Error setting regular user role:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Sign in with a specific role for testing
   * @param {string} email - Email to sign in with
   * @param {string} password - Password to sign in with
   * @param {Object} claims - Custom claims to set
   */
  const signInWithRole = async (email, password, claims = {}) => {
    if (!isLocalhost) return false;
    
    try {
      setLoading(true);
      await signInWithEmulatorClaims(email, password, claims);
      setCurrentClaims(claims);
      return true;
    } catch (err) {
      console.error('Error signing in with role:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Sign in as admin user
   */
  const signInAsAdmin = async () => {
    return signInWithRole('admin@example.com', 'password', {
      role: 'admin',
      admin: true,
      displayName: 'Admin User'
    });
  };
  
  /**
   * Sign in as brand manager
   * @param {string} brandId - The ID of the brand to manage
   */
  const signInAsBrandManager = async (brandId = 'brand1') => {
    return signInWithRole('brand@example.com', 'password', {
      role: 'brand',
      brandId,
      displayName: 'Brand Manager'
    });
  };
  
  /**
   * Sign out and clear all claims
   */
  const resetEmulatorAuth = async () => {
    if (!isLocalhost) return false;
    
    try {
      setLoading(true);
      await signOutAndClearClaims();
      setCurrentClaims(null);
      return true;
    } catch (err) {
      console.error('Error resetting emulator auth:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Get the current role from claims
   */
  const getCurrentRole = () => {
    if (!currentClaims) return null;
    return currentClaims.role || null;
  };
  
  /**
   * Get the current brandId from claims
   */
  const getCurrentBrandId = () => {
    if (!currentClaims) return null;
    return currentClaims.brandId || null;
  };
  
  return {
    // State
    isAvailable,
    loading,
    error,
    currentClaims,
    
    // Role getters
    getCurrentRole,
    getCurrentBrandId,
    
    // Role setters
    setAdminRole,
    setBrandManagerRole,
    setRegularUserRole,
    
    // Auth helpers
    signInAsAdmin,
    signInAsBrandManager,
    resetEmulatorAuth
  };
}
