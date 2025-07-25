// src/firebase.js
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// Check if we're running locally
const isLocalhost = window.location.hostname === 'localhost';

// Create a robust initialize function that handles all edge cases
function initializeFirebase() {
  // For local development with emulators
  /*
   * SECURITY NOTE
   * ------------------------------------------------------------------
   * Never commit real Firebase API keys to source control.
   *  – When running **locally** (isLocalhost === true) we use a fake
   *    string `"demo-api-key"` because the emulator ignores it anyway.
   *  – In all other cases we read the **real key** from an environment
   *    variable that Vite injects at build-time: `import.meta.env.VITE_FIREBASE_API_KEY`.
   *
   * Make sure the real key is defined:
   *   • Locally:  add it to  .env.production   (or Netlify UI)
   *   • Netlify:  Settings → Build & deploy → Environment variables
   */
  const firebaseConfig = {
    apiKey: isLocalhost
      ? "demo-api-key"
      : import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: "engagenatural-app.firebaseapp.com",
    projectId: "engagenatural-app",
    storageBucket: "engagenatural-app.appspot.com",
    messagingSenderId: "314471463344",
    appId: "1:314471463344:web:db0916256301b9eb6fbe75"
  };

  let firebaseApp;
  
  // Handle initialization carefully to avoid duplicate app errors
  try {
    if (getApps().length === 0) {
      // No Firebase app initialized yet
      console.log("Initializing new Firebase app");
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      // Firebase app already initialized - use it
      console.log("Using existing Firebase app");
      firebaseApp = getApp();
      
      // Since we're in development, we want to ensure we're using the emulator
      // even if the app was previously initialized with production config
      if (isLocalhost) {
        // Reconnect to emulators below when we initialize services
        console.log("Using emulator mode with existing Firebase app");
      }
    }
  } catch (error) {
    console.error("Error during Firebase initialization:", error);
    
    // Last resort - try to use existing app if available
    if (getApps().length > 0) {
      console.log("Falling back to existing Firebase app");
      firebaseApp = getApp();
    } else {
      throw new Error("Failed to initialize Firebase: " + error.message);
    }
  }

  return firebaseApp;
}

// Initialize Firebase in a safe way
const app = initializeFirebase();

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Connect to emulators in development mode
if (isLocalhost) {
  console.log("Connecting to Firebase emulators");
  
  // Wrap each emulator connection in try/catch to isolate failures
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    console.log("✓ Connected to Auth emulator");
  } catch (error) {
    console.error("Failed to connect to Auth emulator:", error);
  }
  
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log("✓ Connected to Firestore emulator");
  } catch (error) {
    console.error("Failed to connect to Firestore emulator:", error);
  }
  
  try {
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log("✓ Connected to Storage emulator");
  } catch (error) {
    console.error("Failed to connect to Storage emulator:", error);
  }
}

// For development in emulator mode, create a helper to sign in automatically
const signInWithEmailPassword = async (email, password) => {
  if (isLocalhost && email === 'admin@example.com') {
    try {
      // In emulator mode, use a standard password for the test account
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      return signInWithEmailAndPassword(auth, email, password || 'password');
    } catch (error) {
      console.error("Failed to sign in with test account:", error);
      throw error;
    }
  } else {
    // Normal sign in flow
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    return signInWithEmailAndPassword(auth, email, password);
  }
};

export { app, auth, db, storage, isLocalhost, signInWithEmailPassword };
