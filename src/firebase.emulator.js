// src/firebase.emulator.js
// EMULATOR VERSION - Use this file for local development with Firebase emulators
// This file contains all the necessary logic to detect and connect to Firebase emulators
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// Check if we're running locally (treat 127.0.0.1 the same as localhost)
const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// Create a robust initialize function that handles all edge cases
function initializeFirebase() {
  // For local development with emulators
const firebaseConfig = {
    apiKey: isLocalhost ? "demo-api-key" : "AIzaSyCO65kN7L3OR7VnORRwYZckzoUEUJAoJQg",
  authDomain: "engagenatural-app.firebaseapp.com",
  projectId: "engagenatural-app",
  storageBucket: "engagenatural-app.appspot.com",
  messagingSenderId: "314471463344",
  appId: "1:314471463344:web:db0916256301b9eb6fbe75"
};

  // Log the bucket being used – helps catch missing / wrong bucket setups
  console.log(
    `[firebase] Using storageBucket: ${firebaseConfig.storageBucket || "undefined"}`
  );

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
    connectAuthEmulator(
      auth,
      "http://127.0.0.1:9099",
      { disableWarnings: true }
    );
    console.log("✓ Connected to Auth emulator");
  } catch (error) {
    console.error("Failed to connect to Auth emulator:", error);
  }
  
  try {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    console.log("✓ Connected to Firestore emulator");
  } catch (error) {
    console.error("Failed to connect to Firestore emulator:", error);
  }
  
  try {
    connectStorageEmulator(storage, "127.0.0.1", 9199);
    console.log("✓ Connected to Storage emulator (127.0.0.1:9199)");

    // Quick sanity-check request to confirm the emulator is responding
    fetch("http://127.0.0.1:9199/", { method: "HEAD" })
      .then((res) => {
        if (res.ok) {
          console.log("✓ Storage emulator responded (status " + res.status + ")");
        } else {
          console.warn(
            "⚠️  Storage emulator responded with status " + res.status
          );
        }
      })
      .catch((e) =>
        console.warn("⚠️  Could not reach Storage emulator:", e.message)
      );
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
