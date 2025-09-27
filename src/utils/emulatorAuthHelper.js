// src/utils/emulatorAuthHelper.js
import { auth, db, isLocalhost } from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Constants
const EMULATOR_CLAIMS_KEY = 'firebase_emulator_claims';
const EMULATOR_ROLES_KEY = 'firebase_emulator_roles';

/**
 * Initialize emulator with test users
 */
export async function initializeEmulatorUsers(skipUserCreation = false) {
  if (!isLocalhost) {
    console.warn('Not in emulator mode - skipping user initialization');
    return false;
  }

  try {
    console.log('🔧 Initializing emulator users...');
    
    const adminClaims = {
      displayName: 'Admin User',
      role: 'admin',
      admin: true
    };

    const brandClaims = {
      displayName: 'Brand Manager',
      role: 'brand',
      brandId: 'brand1'
    };

    if (skipUserCreation) {
      // Just make sure claims are present for already-existing users
      try {
        const adminCred = await signInWithEmailAndPassword(auth, 'admin@example.com', 'password');
        await setEmulatorClaims(adminCred.user.uid, adminClaims);
      } catch (_) {/* ignore */}

      try {
        const brandCred = await signInWithEmailAndPassword(auth, 'brand@example.com', 'password');
        await setEmulatorClaims(brandCred.user.uid, brandClaims);
      } catch (_) {/* ignore */}
    } else {
      // Create users (or ensure they exist) and set claims
      await createEmulatorUser('admin@example.com', 'password', adminClaims);
      await createEmulatorUser('brand@example.com', 'password', brandClaims);
    }
    
    console.log('✅ Emulator users initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing emulator users:', error);
    return false;
  }
}

/**
 * Create or update an emulator user with custom claims
 */
async function createEmulatorUser(email, password, claims = {}) {
  try {
    // Try to create the user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Store user data in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: claims.displayName || email.split('@')[0],
      role: claims.role || 'user',
      brandId: claims.brandId || null,
      createdAt: new Date().toISOString()
    });
    
    // Set custom claims
    await setEmulatorClaims(user.uid, claims);
    
    console.log(`✅ Test user created: ${email}`);
    return user;
  } catch (error) {
    // If user already exists
    if (error.code === 'auth/email-already-in-use') {
      console.log(`✅ Test user already exists: ${email}`);
      return true;
    }
    throw error;
  }
}

/**
 * Sign in with emulator and set custom claims
 */
export async function signInWithEmulatorClaims(email, password, claims = {}) {
  if (!isLocalhost) {
    console.warn('Not in emulator mode - using regular sign in');
    return signInWithEmailAndPassword(auth, email, password);
  }
  
  try {
    // Sign in the user
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Set custom claims for emulator
    await setEmulatorClaims(user.uid, claims);
    
    return userCredential;
  } catch (error) {
    console.error('Error signing in with emulator claims:', error);
    throw error;
  }
}

/**
 * Set custom claims for a user in the emulator
 */
export async function setEmulatorClaims(uid, claims = {}) {
  if (!isLocalhost) {
    console.warn('Not in emulator mode - cannot set custom claims');
    return false;
  }
  
  try {
    // Store claims in localStorage
    const allClaims = getStoredEmulatorClaims() || {};
    allClaims[uid] = claims;
    localStorage.setItem(EMULATOR_CLAIMS_KEY, JSON.stringify(allClaims));
    
    // Also update the current user's claims if it matches
    if (auth.currentUser && auth.currentUser.uid === uid) {
      localStorage.setItem(EMULATOR_ROLES_KEY, JSON.stringify(claims));
    }
    
    console.log(`✅ Emulator claims set for user ${uid}:`, claims);
    return true;
  } catch (error) {
    console.error('Error setting emulator claims:', error);
    return false;
  }
}

/**
 * Get custom claims for the current user
 */
export function getCurrentUserClaims() {
  if (!isLocalhost || !auth.currentUser) {
    return null;
  }
  
  try {
    // Try to get from localStorage first
    const storedRoles = localStorage.getItem(EMULATOR_ROLES_KEY);
    if (storedRoles) {
      return JSON.parse(storedRoles);
    }
    
    // Fall back to all claims storage
    const allClaims = getStoredEmulatorClaims() || {};
    return allClaims[auth.currentUser.uid] || null;
  } catch (error) {
    console.error('Error getting current user claims:', error);
    return null;
  }
}

/**
 * Get all stored emulator claims
 */
export function getStoredEmulatorClaims() {
  try {
    const claimsJson = localStorage.getItem(EMULATOR_CLAIMS_KEY);
    return claimsJson ? JSON.parse(claimsJson) : {};
  } catch (error) {
    console.error('Error parsing stored emulator claims:', error);
    return {};
  }
}

/**
 * Get claims for a specific user
 */
export function getEmulatorClaims(uid) {
  if (!isLocalhost) {
    return null;
  }
  
  try {
    const allClaims = getStoredEmulatorClaims();
    return allClaims[uid] || null;
  } catch (error) {
    console.error('Error getting emulator claims for user:', error);
    return null;
  }
}

/**
 * Clear all emulator claims
 */
export function clearEmulatorClaims() {
  if (!isLocalhost) {
    return false;
  }
  
  try {
    localStorage.removeItem(EMULATOR_CLAIMS_KEY);
    localStorage.removeItem(EMULATOR_ROLES_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing emulator claims:', error);
    return false;
  }
}

/**
 * Sign out and clear emulator claims
 */
export async function signOutAndClearClaims() {
  try {
    await signOut(auth);
    clearEmulatorClaims();
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    return false;
  }
}

/**
 * Check if user has a specific role
 */
export function hasRole(role) {
  const claims = getCurrentUserClaims();
  return claims && claims.role === role;
}

/**
 * Check if user is an admin
 */
export function isAdmin() {
  const claims = getCurrentUserClaims();
  return claims && (claims.role === 'admin' || claims.admin === true);
}

/**
 * Check if user is a brand manager
 */
export function isBrandManager() {
  const claims = getCurrentUserClaims();
  return claims && claims.role === 'brand';
}

/**
 * Get the current user's brand ID
 */
export function getCurrentBrandId() {
  const claims = getCurrentUserClaims();
  return claims ? claims.brandId : null;
}
