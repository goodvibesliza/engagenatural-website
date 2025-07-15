// src/firebase.js
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// Check if we're running locally
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

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
  console.log("🔥 Connecting to Firebase emulators using 127.0.0.1 (explicit IP)");
  
  // Auth emulator connection
  try {
    const authEmulatorUrl = 'http://127.0.0.1:9099';
    console.debug(`Connecting to Auth emulator at: ${authEmulatorUrl}`);
    connectAuthEmulator(auth, authEmulatorUrl, { disableWarnings: true });
    console.log("✓ Connected to Auth emulator at", authEmulatorUrl);
    
    // Verify connection
    fetch(`${authEmulatorUrl}/__/auth/handler`, { method: 'HEAD' })
      .then(response => {
        console.debug(`Auth emulator connection check: ${response.status}`);
        if (!response.ok) {
          console.warn(`Auth emulator responded with status ${response.status} - may not be fully operational`);
        }
      })
      .catch(error => {
        console.error(`Auth emulator connection check failed: ${error.message}`);
      });
  } catch (error) {
    console.error("Failed to connect to Auth emulator:", error.message, error.stack);
    console.warn("Auth operations will use production environment!");
  }
  
  // Firestore emulator connection
  try {
    const firestoreHost = '127.0.0.1';
    const firestorePort = 8080;
    console.debug(`Connecting to Firestore emulator at: ${firestoreHost}:${firestorePort}`);
    connectFirestoreEmulator(db, firestoreHost, firestorePort);
    console.log(`✓ Connected to Firestore emulator at ${firestoreHost}:${firestorePort}`);
    
    // Verify connection
    fetch(`http://${firestoreHost}:${firestorePort}/`, { method: 'HEAD' })
      .then(response => {
        console.debug(`Firestore emulator connection check: ${response.status}`);
        if (!response.ok) {
          console.warn(`Firestore emulator responded with status ${response.status} - may not be fully operational`);
        }
      })
      .catch(error => {
        console.error(`Firestore emulator connection check failed: ${error.message}`);
      });
  } catch (error) {
    console.error("Failed to connect to Firestore emulator:", error.message, error.stack);
    console.warn("Firestore operations will use production environment!");
  }
  
  // Storage emulator connection
  try {
    const storageHost = '127.0.0.1';
    const storagePort = 9199;
    console.debug(`Connecting to Storage emulator at: ${storageHost}:${storagePort}`);
    connectStorageEmulator(storage, storageHost, storagePort);
    console.log(`✓ Connected to Storage emulator at ${storageHost}:${storagePort}`);
    
    // Verify connection
    fetch(`http://${storageHost}:${storagePort}/`, { method: 'HEAD' })
      .then(response => {
        console.debug(`Storage emulator connection check: ${response.status}`);
        if (!response.ok) {
          console.warn(`Storage emulator responded with status ${response.status} - may not be fully operational`);
        }
      })
      .catch(error => {
        console.error(`Storage emulator connection check failed: ${error.message}`);
      });
  } catch (error) {
    console.error("Failed to connect to Storage emulator:", error.message, error.stack);
    console.warn("Storage operations will use production environment!");
  }
  
  // Log emulator UI URL
  console.log("📊 Firebase Emulator UI available at: http://127.0.0.1:4000");
}

// For development in emulator mode, create a helper to sign in automatically
const signInWithEmailPassword = async (email, password) => {
  if (isLocalhost && email === 'admin@example.com') {
    try {
      // In emulator mode, use a standard password for the test account
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      console.debug(`Attempting emulator sign-in with test account: ${email}`);
      return signInWithEmailAndPassword(auth, email, password || 'password');
    } catch (error) {
      console.error("Failed to sign in with test account:", error.code, error.message);
      console.debug("Auth emulator state:", auth.emulatorConfig ? "Connected" : "Not connected");
      throw error;
    }
  } else {
    // Normal sign in flow
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    return signInWithEmailAndPassword(auth, email, password);
  }
};

export { app, auth, db, storage, isLocalhost, signInWithEmailPassword };
