// src/lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// ---------------------------------------------------------------------------
// NOTE: Hard-coded production Firebase config.
// These values are already publicly available in the client bundle once built,
// so placing them here does NOT introduce any new security risk.
// ---------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCTv263abYUAbveuFraYSLdPpvsbaq08p0",
  authDomain: "engagenatural-app.firebaseapp.com",
  projectId: "engagenatural-app",
  storageBucket: "engagenatural-app.appspot.com",
  messagingSenderId: "314471463344",
  appId: "1:314471463344:web:db0916256301b9eb6fbe75",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ---------------------------------------------------------------------------
// Emulator Configuration for Development
// ---------------------------------------------------------------------------
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
export const isLocalhost = window.location.hostname === 'localhost';

/**
 * We only connect to local emulators when ALL of the following are true:
 *   1. We’re running the dev build (`import.meta.env.DEV`)
 *   2. The browser is pointing at localhost
 *   3. The optional flag  VITE_USE_EMULATOR  is not explicitly set to 'false'
 *
 * When these conditions are met we wire up the Auth, Firestore, and Storage
 * SDKs to their respective localhost emulator ports. In production builds or
 * when running against the real Firebase project this block is skipped.
 */
// ------------------------------------------------------------
// Emulator toggle (opt-in):
// Set VITE_USE_EMULATOR='true' to connect to local emulators.
// Any other value (or unset) will use production Firebase.
// ------------------------------------------------------------
const useEmulator = import.meta.env.VITE_USE_EMULATOR === 'true';

if (useEmulator && !getApps().find(app => app.name === '[DEFAULT]')?._options?.emulator) {
  try {
    // Connect to Firestore emulator
    connectFirestoreEmulator(db, 'localhost', 8080);
    
    // Connect to Auth emulator  
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    
    // Connect to Storage emulator
    connectStorageEmulator(storage, 'localhost', 9199);
  } catch (error) {
    console.warn('⚠️ Failed to connect to emulators:', error);
  }
}
