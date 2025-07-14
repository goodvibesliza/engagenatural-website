// src/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// Check if we're running locally
const isLocalhost = window.location.hostname === 'localhost';

// Create a global variable to track initialization status
let _initialized = false;
let _app = null;
let _auth = null;
let _db = null;
let _storage = null;

// Firebase configuration
const firebaseConfig = {
  /*
   * SECURITY WARNING
   * ------------------------------------------------------------------
   * Never commit real Firebase API keys (or any secret) to source-control.
   *
   * • When developing locally with the **emulator** (`isLocalhost === true`)
   *   the actual value is irrelevant, so we use a harmless placeholder
   *   string: `"demo-api-key"`.
   *
   * • In all other cases we read the real key from a Vite environment
   *   variable injected at build time:  VITE_FIREBASE_API_KEY
   *   – Define it in `.env.production` for local production builds
   *   – Or add it in Netlify / CI environment-variables UI
   */
  apiKey: isLocalhost ? "demo-api-key" : import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "engagenatural-app.firebaseapp.com",
  projectId: "engagenatural-app",
  storageBucket: "engagenatural-app.appspot.com",
  messagingSenderId: "314471463344",
  appId: "1:314471463344:web:db0916256301b9eb6fbe75"
};

function initializeFirebase() {
  if (_initialized) {
    console.log("Firebase already initialized, reusing existing instance");
    return {
      app: _app,
      auth: _auth,
      db: _db,
      storage: _storage
    };
  }
  
  try {
    // Check if Firebase is already initialized
    if (!_app) {
      if (getApps().length === 0) {
        console.log("Initializing new Firebase app");
        _app = initializeApp(firebaseConfig);
      } else {
        console.log("Using existing Firebase app");
        _app = getApp();
      }
    }
    
    // Initialize services (only once)
    if (!_auth) _auth = getAuth(_app);
    if (!_db) _db = getFirestore(_app);
    if (!_storage) _storage = getStorage(_app);
    
    // Connect to emulators in development
    if (isLocalhost && !_initialized) {
      console.log("Connecting to Firebase emulators");
      
      try {
        connectAuthEmulator(_auth, 'http://localhost:9099', { disableWarnings: true });
        console.log("✓ Connected to Auth emulator");
      } catch (e) {
        console.warn("Auth emulator connection failed:", e);
      }
      
      try {
        connectFirestoreEmulator(_db, 'localhost', 8080);
        console.log("✓ Connected to Firestore emulator");
      } catch (e) {
        console.warn("Firestore emulator connection failed:", e);
      }
      
      try {
        connectStorageEmulator(_storage, 'localhost', 9199);
        console.log("✓ Connected to Storage emulator");
      } catch (e) {
        console.warn("Storage emulator connection failed:", e);
      }
    }
    
    _initialized = true;
    
    return {
      app: _app,
      auth: _auth,
      db: _db,
      storage: _storage
    };
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    throw error;
  }
}

// Initialize Firebase
const { app, auth, db, storage } = initializeFirebase();

// Helper for login in emulator mode
const signInWithEmailPassword = async (email, password) => {
  try {
    if (isLocalhost && email === 'admin@example.com') {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      return signInWithEmailAndPassword(auth, email, password || 'password');
    } else {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      return signInWithEmailAndPassword(auth, email, password);
    }
  } catch (error) {
    console.error("Sign in error:", error);
    throw error;
  }
};

export { app, auth, db, storage, isLocalhost, signInWithEmailPassword };
