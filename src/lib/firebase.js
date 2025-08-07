// src/lib/firebase.js - PRODUCTION ONLY CONFIGURATION
// This file initializes Firebase services for production use only.
// No emulator connections or development-specific code included.

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, signInWithEmailAndPassword as firebaseSignIn } from "firebase/auth";

// Firebase production configuration
const firebaseConfig = {
  apiKey: "AIzaSyCO65kN7L3OR7VnORRwYZckzoUEUJAoJQg",
  authDomain: "engagenatural-app.firebaseapp.com",
  projectId: "engagenatural-app",
  storageBucket: "engagenatural-app.appspot.com",
  messagingSenderId: "314471463344",
  appId: "1:314471463344:web:db0916256301b9eb6fbe75"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Helper function for email/password authentication
const signInWithEmailPassword = (email, password) => {
  return firebaseSignIn(auth, email, password);
};

// Export initialized services
export { app, auth, db, storage, signInWithEmailPassword };
