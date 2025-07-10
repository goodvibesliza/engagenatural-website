// src/contexts/auth-context.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isLocalhost, signInWithEmailPassword } from '../firebase';

// Create auth context
const AuthContext = createContext();

// Define roles
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  BRAND_MANAGER: 'brand_manager',
  USER: 'user'
};

// Define the useAuth hook here - make sure this is exported
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Handle auth state changes
  useEffect(() => {
    // For development/emulator environment
    if (isLocalhost) {
      console.log("Setting up auth state listener in emulator mode");
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // For emulator, create a default admin profile in memory when Firestore might fail
          let userProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            role: ROLES.USER
          };

          try {
            // Try to get the user profile from Firestore
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            
            if (userDoc.exists()) {
              userProfile = {
                ...userProfile,
                ...userDoc.data()
              };
            }
          } catch (error) {
            console.warn("Error fetching user profile:", error);
            // In emulator mode, give the user super admin role for testing
            if (isLocalhost) {
              console.log("Emulator mode: Assigning super_admin role");
              userProfile.role = ROLES.SUPER_ADMIN;
            }
          }

          // Check if the user is a super admin by email
          const isSuperAdmin = ['admin@engagenatural.com', 'admin@example.com'].includes(firebaseUser.email);
          if (isSuperAdmin) {
            userProfile.role = ROLES.SUPER_ADMIN;
          }

          setUser(userProfile);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error in auth state change handler:", error);
        setAuthError(error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sign in function
  const signIn = async (email, password) => {
    try {
      setAuthError(null);
      return await signInWithEmailPassword(email, password);
    } catch (error) {
      console.error("Sign in error:", error);
      setAuthError(error);
      throw error;
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
      setAuthError(error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    error: authError,
    signIn,
    signOut,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === ROLES.SUPER_ADMIN,
    isBrandManager: user?.role === ROLES.BRAND_MANAGER
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}