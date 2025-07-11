// src/contexts/auth-context.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { app, isLocalhost } from '../firebase';

// Define the roles constants
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  BRAND_MANAGER: 'brand_manager',
};

// Create auth context
const AuthContext = createContext();

// Hook for child components to get the auth object
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component that wraps app and makes auth object available
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRoles, setUserRoles] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // Sign in function
  const signIn = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Sign out function
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserRoles(null);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  // Subscribe to user on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (isLocalhost) {
        console.log('Setting up auth state listener in emulator mode');
      }
      
      setUser(user);
      
      if (user) {
        try {
          // Fetch user roles
          const userRolesRef = doc(db, 'user_roles', user.uid);
          const userRolesSnap = await getDoc(userRolesRef);
          
          if (userRolesSnap.exists()) {
            setUserRoles(userRolesSnap.data().roles || []);
          } else {
            // If no roles document exists, set empty array
            setUserRoles([]);
          }
        } catch (error) {
          console.error('Error fetching user roles:', error);
          setUserRoles([]);
        }
      } else {
        setUserRoles(null);
      }
      
      setLoading(false);
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth, db]);
  
  // Context value that will be supplied to any descendants
  const value = {
    user,
    userRoles,
    isAuthenticated: !!user,
    loading,
    signIn,
    signOut
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;