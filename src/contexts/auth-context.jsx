// src/contexts/auth-context.jsx
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { app, auth, db, isLocalhost } from "../lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  setPersistence,
  browserLocalPersistence,
  getAuth,
} from "firebase/auth";
import {
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { getCurrentUserClaims, clearEmulatorClaims } from "../utils/emulatorAuthHelper";

/* ---------------------------------------------------------------------------+
|  Role / Permission constants – preserved                                    |
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
  // Added for community features
  VIEW_COMMUNITIES: "view_communities",
  POST_IN_COMMUNITIES: "post_in_communities",
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
  staff: [PERMISSIONS.VIEW_COMMUNITIES],
  verified_staff: [PERMISSIONS.VIEW_COMMUNITIES],
  retail_staff: [PERMISSIONS.VIEW_COMMUNITIES],
  user: [],
  guest: [],
};

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || 'admin@engagenatural.com,liza@engagenatural.com')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

/* Helpers to merge roles from Firestore and Auth/emulator claims */
function normalizeRole(v) {
  return String(v || "").trim().toLowerCase().replace(/[ -]+/g, "_");
}
function extractFirestoreRoles(profile) {
  if (!profile) return [];
  const out = new Set();
  const add = (v) => { const n = normalizeRole(v); if (n) out.add(n); };
  const fromVal = (v) => {
    if (!v) return;
    if (typeof v === "string") add(v);
    else if (Array.isArray(v)) v.forEach(add);
    else if (typeof v === "object") Object.entries(v).forEach(([k, val]) => { if (val) add(k); });
  };
  fromVal(profile.role);
  fromVal(profile.roles);
  return Array.from(out);
}
function extractClaimRoles(claims) {
  if (!claims) return [];
  const out = new Set();
  if (claims.admin === true) out.add("super_admin"); // treat admin claim as super_admin
  if (claims.role) out.add(normalizeRole(claims.role)); // e.g., "admin", "brand", "super_admin"
  if (Array.isArray(claims.roles)) claims.roles.forEach((r) => out.add(normalizeRole(r)));
  if (typeof claims.roles === "object") {
    Object.entries(claims.roles).forEach(([k, v]) => { if (v) out.add(normalizeRole(k)); });
  }
  return Array.from(out);
}
const PRIORITY = ["super_admin","brand_manager","verified_staff","retail_staff","staff","user","guest"];
function deriveRoleFromSources(profile, claims) {
  const roles = new Set([...extractFirestoreRoles(profile), ...extractClaimRoles(claims)]);
  // alias mapping
  if (roles.has("admin")) roles.add("super_admin");
  if (roles.has("brand")) roles.add("brand_manager");
  for (const r of PRIORITY) if (roles.has(r)) return r;
  return "staff";
}

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [firestoreProfile, setFirestoreProfile] = useState(null);
  const [claims, setClaims] = useState(null);
  const [loading, setLoading] = useState(true);

  // Resolve a safe auth instance:
  //   1. use the exported singleton `auth` when available
  //   2. otherwise fall back to getAuth(app) if the app is initialised
  const authInstance = auth ?? (app ? getAuth(app) : null);

  // Keep the listener unsub ref so we can clean it up on sign out
  const userDocUnsubRef = useRef(null);

  useEffect(() => {
    // Defensive: if authInstance is unavailable, stop here to avoid crashes
    if (!authInstance) {
      setLoading(false);
      return () => {};
    }

    const unsub = onAuthStateChanged(authInstance, async (user) => {
      // Tear down old profile listener
      if (userDocUnsubRef.current) {
        userDocUnsubRef.current();
        userDocUnsubRef.current = null;
      }

      setFirebaseUser(user);
      setClaims(null);

      if (!user) {
        setFirestoreProfile(null);
        setLoading(false);
        return;
      }

      // Load custom claims from token and merge emulator-local claims when on localhost
      try {
        const res = await user.getIdTokenResult(true);
        let merged = res?.claims || null;
        if (isLocalhost) {
          try {
            const emClaims = getCurrentUserClaims();
            if (emClaims && typeof emClaims === "object") {
              merged = { ...(merged || {}), ...emClaims };
            }
          } catch {}
        }
        setClaims(merged);
      } catch {
        // Fall back to emulator claims if available
        try {
          const emClaims = isLocalhost ? getCurrentUserClaims() : null;
          setClaims(emClaims || null);
        } catch {
          setClaims(null);
        }
      }

      // Live-subscribe to this user's profile
      const userRef = doc(db, "users", user.uid);

      // Ensure a minimal doc exists (safe, one-time init)
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(
          userRef,
          {
            uid: user.uid,
            email: user.email || "",
            role: "staff", // default
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
    await setPersistence(authInstance, browserLocalPersistence);
    const cred = await signInWithEmailAndPassword(
      authInstance,
      email,
      password
    );
    return cred.user;
  }

  async function signOut() {
    try {
      if (userDocUnsubRef.current) {
        userDocUnsubRef.current();
        userDocUnsubRef.current = null;
      }
      if (authInstance) {
        await fbSignOut(authInstance);
      }
      // Clear any locally stored emulator claims
      try {
        if (isLocalhost) clearEmulatorClaims();
      } catch {}
    } finally {
      setFirebaseUser(null);
      setFirestoreProfile(null);
      setClaims(null);
      setLoading(false);
    }
  }

  const value = useMemo(() => {
    // Safely coerce types from Firestore profile
    const approved = firestoreProfile?.approved === true;
    const effectiveRole = deriveRoleFromSources(firestoreProfile, claims);
    
    let resolvedRole = effectiveRole;
    if (isLocalhost && firebaseUser?.email) {
      const emailLc = String(firebaseUser.email).toLowerCase();
      if (ADMIN_EMAILS.includes(emailLc)) {
        resolvedRole = ROLES.SUPER_ADMIN;
      }
    }

    const brandId = firestoreProfile?.brandId || claims?.brandId || null;
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

    const user = firebaseUser
      ? {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName,
          role: resolvedRole,
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
    /* ------------------------------------------------------------------
     * Compatibility helpers (CommunityFeed & legacy components)
     * ---------------------------------------------------------------- */
    // Minimal user profile shape
    const [firstName, ...restName] = displayName.trim().split(" ");
    const userProfile = {
      id: user?.uid || null,
      firstName: firstName || "",
      lastName: restName.join(" ") || "",
      brandId,
    };

    // Legacy helper signatures
    const isBrandManagerFn = () => isBrandManager;
    const canAccessContent = () => true; // permissive stub (dev)


    // Helpers & permissions
    const isAuthenticated = !!user;
    const isSuperAdmin = resolvedRole === ROLES.SUPER_ADMIN;
    const isBrandManager = resolvedRole === ROLES.BRAND_MANAGER;
    const isVerified = verified;
    const isRetailUser = ["retail_staff", "verified_staff", "staff"].includes(resolvedRole || "");
    const isCommunityUser = false;

    function hasRole(required) {
      if (!isAuthenticated) return false;
      const req = Array.isArray(required) ? required : [required];
      return req.includes(resolvedRole);
    }

    function hasPermission(perm) {
      if (!isAuthenticated) return false;
      if (isSuperAdmin) return true;
      const list = ROLE_PERMISSIONS[resolvedRole] || [];
      return list.includes(perm);
    }

    return {
      user,
      loading,
      signIn,
      signOut,
      // helpers
      isAuthenticated,
      role: resolvedRole,
      isSuperAdmin,
      isBrandManager,
      isVerified,
      hasRole,
      hasPermission,
      isRetailUser,
      isCommunityUser,
      brandId,
      // compatibility / community helpers
      PERMISSIONS,
      isBrandManagerFn,                       // function form
      canAccessContent,                       // TEMP stub
      userProfile,                            // minimal profile
    };
  }, [firebaseUser, firestoreProfile, claims, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
