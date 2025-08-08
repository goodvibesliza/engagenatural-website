// src/contexts/auth-context.jsx
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { auth, db } from "../lib/firebase"; // make sure firebase.js exports { auth, db }
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

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // keep the listener unsub ref so we can clean it up on sign out
  const userDocUnsubRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      // tear down old profile listener
      if (userDocUnsubRef.current) {
        userDocUnsubRef.current();
        userDocUnsubRef.current = null;
      }

      setFirebaseUser(user);
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // live-subscribe to this user's profile so admin approvals propagate instantly
      const userRef = doc(db, "users", user.uid);

      // ensure a minimal doc exists (safe merge)
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(
          userRef,
          {
            uid: user.uid,
            email: user.email || "",
            role: "staff",
            verified: false,
            verificationStatus: "pending",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      userDocUnsubRef.current = onSnapshot(userRef, (ds) => {
        setProfile(ds.exists() ? ds.data() : null);
        setLoading(false);
      });
    });

    return () => {
      unsub();
      if (userDocUnsubRef.current) userDocUnsubRef.current();
    };
  }, []);

  async function signIn(email, password) {
    // persistent session
    await setPersistence(auth, browserLocalPersistence);
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }

  async function signOut() {
    await fbSignOut(auth);
  }

  const value = useMemo(() => {
    const combinedUser = firebaseUser
      ? {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || profile?.name || "",
          // Firestore profile fields
          role: profile?.role || "staff",
          verified: !!profile?.verified,
          verificationStatus: profile?.verificationStatus || "pending",
          brandId: profile?.brandId || "",
          joinedCommunities: profile?.joinedCommunities || [],
          storeName: profile?.storeName || "",
          level: profile?.level ?? null,
          points: profile?.points ?? 0,
          profileImage: profile?.profileImage ?? null,
        }
      : null;

    const isAuthenticated = !!combinedUser;
    const role = combinedUser?.role || "guest";
    const isSuperAdmin = role === "super_admin";
    const isBrandManager = role === "brand_manager";
    const isVerified = !!combinedUser?.verified;

    function hasRole(required) {
      if (!isAuthenticated) return false;
      if (!required) return true;
      // allow string or array
      const req = Array.isArray(required) ? required : [required];
      return req.includes(role);
    }

    return {
      loading,
      user: combinedUser,
      isAuthenticated,
      role,
      isSuperAdmin,
      isBrandManager,
      isVerified,
      hasRole,
      signIn,
      signOut,
    };
  }, [firebaseUser, profile, loading]);

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
