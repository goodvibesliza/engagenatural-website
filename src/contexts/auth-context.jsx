import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext({});

// Export USER_ROLES for use in other components
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  BRAND_MANAGER: 'brand_manager',
  RETAIL_USER: 'retail_user',
  COMMUNITY_USER: 'community_user'
};

// Permission constants for different actions
export const PERMISSIONS = {
  // Community permissions
  VIEW_COMMUNITIES: 'view_communities',
  POST_IN_COMMUNITIES: 'post_in_communities',
  POST_AS_BRAND: 'post_as_brand',
  MODERATE_COMMUNITIES: 'moderate_communities',
  
  // Challenge permissions
  VIEW_ALL_CHALLENGES: 'view_all_challenges',
  VIEW_OWN_BRAND_CHALLENGES: 'view_own_brand_challenges',
  TAKE_CHALLENGES: 'take_challenges',
  CREATE_CHALLENGES: 'create_challenges',
  
  // Content permissions
  VIEW_ALL_CONTENT: 'view_all_content',
  VIEW_OWN_BRAND_CONTENT: 'view_own_brand_content',
  ACCESS_COMPETITOR_CONTENT: 'access_competitor_content',
  UPLOAD_CONTENT: 'upload_content',
  
  // Admin permissions
  MANAGE_USERS: 'manage_users',
  MANAGE_BRANDS: 'manage_brands',
  VIEW_ANALYTICS: 'view_analytics',
  SYSTEM_SETTINGS: 'system_settings'
};

// Permission matrix - defines what each role can do
const ROLE_PERMISSIONS = {
  [USER_ROLES.SUPER_ADMIN]: [
    // Super admins can do everything
    ...Object.values(PERMISSIONS)
  ],
  
  [USER_ROLES.BRAND_MANAGER]: [
    // Community access
    PERMISSIONS.VIEW_COMMUNITIES,
    PERMISSIONS.POST_IN_COMMUNITIES,
    PERMISSIONS.POST_AS_BRAND,
    
    // Limited challenge access - only their own brand
    PERMISSIONS.VIEW_OWN_BRAND_CHALLENGES,
    PERMISSIONS.CREATE_CHALLENGES,
    PERMISSIONS.TAKE_CHALLENGES, // Can take their own brand challenges for quality assurance
    // NOTE: Brand managers can only take/view their own brand challenges, not competitors
    
    // Limited content access - only their own brand
    PERMISSIONS.VIEW_OWN_BRAND_CONTENT,
    PERMISSIONS.UPLOAD_CONTENT,
    // NOTE: Brand managers CANNOT access competitor content
    
    // Analytics for their brand
    PERMISSIONS.VIEW_ANALYTICS
  ],
  
  [USER_ROLES.RETAIL_USER]: [
    // Community access
    PERMISSIONS.VIEW_COMMUNITIES,
    PERMISSIONS.POST_IN_COMMUNITIES,
    
    // Full challenge access
    PERMISSIONS.VIEW_ALL_CHALLENGES,
    PERMISSIONS.TAKE_CHALLENGES,
    
    // Full content access
    PERMISSIONS.VIEW_ALL_CONTENT,
    PERMISSIONS.ACCESS_COMPETITOR_CONTENT
  ],
  
  [USER_ROLES.COMMUNITY_USER]: [
    // Basic community access
    PERMISSIONS.VIEW_COMMUNITIES,
    PERMISSIONS.POST_IN_COMMUNITIES,
    
    // Limited challenge access
    PERMISSIONS.VIEW_ALL_CHALLENGES,
    PERMISSIONS.TAKE_CHALLENGES,
    
    // Limited content access
    PERMISSIONS.VIEW_ALL_CONTENT,
    PERMISSIONS.ACCESS_COMPETITOR_CONTENT
  ]
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [brandId, setBrandId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await loadUserProfile(firebaseUser.uid, firebaseUser);
      } else {
        setUser(null);
        setUserProfile(null);
        setRole(null);
        setBrandId(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loadUserProfile = async (uid, firebaseUser = null) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserProfile(userData);
        setRole(userData.role || USER_ROLES.COMMUNITY_USER);
        setBrandId(userData.brandId || null);
      } else {
        // Create default user profile if doesn't exist
        const defaultProfile = {
          email: firebaseUser?.email || '',
          role: USER_ROLES.COMMUNITY_USER,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await setDoc(doc(db, 'users', uid), defaultProfile);
        setUserProfile(defaultProfile);
        setRole(USER_ROLES.COMMUNITY_USER);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const signIn = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signUp = async (email, password, additionalData = {}) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      const userProfile = {
        email,
        role: additionalData.role || USER_ROLES.COMMUNITY_USER,
        brandId: additionalData.brandId || null,
        firstName: additionalData.firstName || '',
        lastName: additionalData.lastName || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'users', result.user.uid), userProfile);
      
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateUserProfile = async (updates) => {
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date()
      });
      
      // Reload profile
      await loadUserProfile(user.uid, user);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Permission checking functions
  const hasPermission = (permission) => {
    if (!role) return false;
    const rolePermissions = ROLE_PERMISSIONS[role] || [];
    return rolePermissions.includes(permission);
  };

  const canAccessContent = (contentBrandId) => {
    // Super admins can access everything
    if (role === USER_ROLES.SUPER_ADMIN) return true;
    
    // Brand managers can only access their own brand content
    if (role === USER_ROLES.BRAND_MANAGER) {
      return contentBrandId === brandId;
    }
    
    // Retail and community users can access all content
    return hasPermission(PERMISSIONS.ACCESS_COMPETITOR_CONTENT);
  };

  const canTakeChallenge = (challengeBrandId) => {
    // Super admins can do everything
    if (role === USER_ROLES.SUPER_ADMIN) return true;
    
    // Brand managers can ONLY take challenges from their own brand (for quality assurance)
    if (role === USER_ROLES.BRAND_MANAGER) {
      return challengeBrandId === brandId;
    }
    
    // Other users can take challenges
    return hasPermission(PERMISSIONS.TAKE_CHALLENGES);
  };

  const canViewChallenge = (challengeBrandId) => {
    // Super admins can view everything
    if (role === USER_ROLES.SUPER_ADMIN) return true;
    
    // Brand managers can only view their own brand challenges
    if (role === USER_ROLES.BRAND_MANAGER) {
      return challengeBrandId === brandId && hasPermission(PERMISSIONS.VIEW_OWN_BRAND_CHALLENGES);
    }
    
    // Other users can view all challenges
    return hasPermission(PERMISSIONS.VIEW_ALL_CHALLENGES);
  };

  const canCreateChallenge = () => {
    return hasPermission(PERMISSIONS.CREATE_CHALLENGES);
  };

  const canPostAsBrand = () => {
    return hasPermission(PERMISSIONS.POST_AS_BRAND);
  };

  const canModerateContent = () => {
    return hasPermission(PERMISSIONS.MODERATE_COMMUNITIES);
  };

  // Helper functions for role checking
  const isSuperAdmin = () => role === USER_ROLES.SUPER_ADMIN;
  const isBrandManager = () => role === USER_ROLES.BRAND_MANAGER;
  const isRetailUser = () => role === USER_ROLES.RETAIL_USER;
  const isCommunityUser = () => role === USER_ROLES.COMMUNITY_USER;

  const value = {
    user,
    userProfile,
    role,
    brandId,
    loading,
    signIn,
    signUp,
    signOut,
    updateUserProfile,
    
    // Permission functions
    hasPermission,
    canAccessContent,
    canTakeChallenge,
    canViewChallenge,
    canCreateChallenge,
    canPostAsBrand,
    canModerateContent,
    
    // Role checking functions
    isSuperAdmin,
    isBrandManager,
    isRetailUser,
    isCommunityUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

