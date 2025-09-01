// src/contexts/auth-context.jsx
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { auth, db } from "../lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import {
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

/* ---------------------------------------------------------------------------+
|  Role / Permission constants – restored                                     |
+-------------------------------------------------------------------------- */
export const PERMISSIONS = {
  MANAGE_USERS: "manage_users",
  APPROVE_VERIFICATIONS: "approve_verifications",
  MANAGE_BRANDS: "manage_brands",
  MANAGE_BRAND_CONTENT: "manage_brand_content",
  MANAGE_BRAND_PRODUCTS: "manage_brand_products",
  VIEW_ANALYTICS: "view_analytics",
  MANAGE_CONTENT: "manage_content",
  SYSTEM_SETTINGS: "system_settings",
};

export const USER_ROLES = [
  { value: "super_admin",    label: "Super Admin" },
  { value: "brand_manager",  label: "Brand Manager" },
  { value: "staff",          label: "Staff" },
  { value: "verified_staff", label: "Verified Staff" },
  { value: "retail_staff",   label: "Retail Staff" },
  { value: "user",           label: "User" },
  { value: "guest",          label: "Guest" },
];

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  BRAND_MANAGER: "brand_manager",
  STAFF: "staff",
  VERIFIED_STAFF: "verified_staff",
  RETAIL_STAFF: "retail_staff",
  USER: "user",
  GUEST: "guest",
};

const ROLE_PERMISSIONS = {
  super_admin: Object.values(PERMISSIONS),
  brand_manager: [
    PERMISSIONS.MANAGE_BRAND_CONTENT,
    PERMISSIONS.MANAGE_BRAND_PRODUCTS,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  staff: [],
  verified_staff: [],
  retail_staff: [],
  user: [],
  guest: [],
};

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [firestoreProfile, setFirestoreProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Keep the listener unsub ref so we can clean it up on sign out
  const userDocUnsubRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      // Tear down old profile listener
      if (userDocUnsubRef.current) {
        userDocUnsubRef.current();
        userDocUnsubRef.current = null;
      }

      setFirebaseUser(user);
      if (!user) {
        setFirestoreProfile(null);
        setLoading(false);
        return;
      }

      // Live-subscribe to this user's profile
      const userRef = doc(db, "users", user.uid);

      // Ensure a minimal doc exists (safe merge)
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(
          userRef,
          {
            uid: user.uid,
            email: user.email || "",
            // Default to "staff" role so the account can at least log in.
            // The "approved" flag is intentionally omitted — this should
            // only ever be set (or modified) by a privileged admin action
            // in the dashboard, never automatically by the client.
            role: "staff",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: false }
        );
      }

      userDocUnsubRef.current = onSnapshot(userRef, (ds) => {
        setFirestoreProfile(ds.exists() ? ds.data() : null);
        setLoading(false);
      });
    });

    return () => {
      unsub();
      if (userDocUnsubRef.current) userDocUnsubRef.current();
    };
  }, []);

  async function signIn(email, password) {
    // Persistent session
    await setPersistence(auth, browserLocalPersistence);
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }

  async function signOut() {
    try {
      // Stop any live Firestore listener on the user profile
      if (userDocUnsubRef.current) {
        userDocUnsubRef.current();
        userDocUnsubRef.current = null;
      }

      // Firebase sign-out
      await fbSignOut(auth);
    } finally {
      // Clear local React state
      setFirebaseUser(null);
      setFirestoreProfile(null);
      setLoading(false);
    }
  }

  const value = useMemo(() => {
    // Safely coerce types from Firestore profile
    const approved = firestoreProfile?.approved === true;
    const role = typeof firestoreProfile?.role === 'string' ? firestoreProfile.role : undefined;
    const brandId = firestoreProfile?.brandId || null;
    const retailerId = firestoreProfile?.retailerId || null;
    // Prefer Auth displayName → Firestore displayName → Firestore name
    const displayName =
      firebaseUser?.displayName ||
      firestoreProfile?.displayName ||
      firestoreProfile?.name ||
      "";

    // Extra profile fields with safe defaults
    const verified = firestoreProfile?.verified === true;
    const verificationStatus =
      typeof firestoreProfile?.verificationStatus === "string"
        ? firestoreProfile.verificationStatus
        : (verified ? "approved" : "pending");
    const joinedCommunities = Array.isArray(firestoreProfile?.joinedCommunities)
      ? firestoreProfile.joinedCommunities
      : [];
    const storeName =
      typeof firestoreProfile?.storeName === "string" ? firestoreProfile.storeName : "";
    const level =
      typeof firestoreProfile?.level === "number" ? firestoreProfile.level : null;
    const points =
      typeof firestoreProfile?.points === "number" ? firestoreProfile.points : 0;
    const profileImage =
      typeof firestoreProfile?.profileImage === "string"
        ? firestoreProfile.profileImage
        : null;
    const storeCode =
      typeof firestoreProfile?.storeCode === "string" ? firestoreProfile.storeCode : "";

    // Combine Firebase Auth user with Firestore profile data
    const user = firebaseUser
      ? {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName,
          role,
          approved,
          brandId,
          retailerId,
          verified,
          verificationStatus,
          joinedCommunities,
          storeName,
          storeCode,
          level,
          points,
          profileImage,
        }
      : null;

    // -----------------------------------------------------------------------
    // Helper booleans & permission utilities (restored)
    // -----------------------------------------------------------------------
    const isAuthenticated = !!user;
    const isSuperAdmin = role === ROLES.SUPER_ADMIN;
    const isBrandManager = role === ROLES.BRAND_MANAGER;
    const isVerified = verified;

    const isRetailUser = ["retail_staff", "verified_staff", "staff"].includes(role || "");
    const isCommunityUser = false; // placeholder for future community roles

    function hasRole(required) {
      if (!isAuthenticated) return false;
      if (!required) return true;
      const req = Array.isArray(required) ? required : [required];
      return req.includes(role);
    }

    function hasPermission(perm) {
      if (!isAuthenticated) return false;
      if (isSuperAdmin) return true; // super_admin bypass
      const list = ROLE_PERMISSIONS[role] || [];
      return list.includes(perm);
    }

    return {
      user,
      loading,
      signIn,
      signOut,
      // restored helpers
      isAuthenticated,
      role,
      isSuperAdmin,
      isBrandManager,
      isVerified,
      hasRole,
      hasPermission,
      isRetailUser,
      isCommunityUser,
    };
  }, [firebaseUser, firestoreProfile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
