import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Check if we're running locally
export const isLocalhost = 
  typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Required environment variables
const req = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

// Check for missing environment variables
const miss = req.filter(k => !import.meta.env[k]);
const host = typeof window !== 'undefined' ? window.location.hostname : '';
const isPreview = (
  import.meta.env.DEV ||
  import.meta.env.VITE_NETLIFY_CONTEXT === 'deploy-preview' ||
  host.includes('deploy-preview-')
);
if (miss.length) {
  // Expose missing list for UIs like EnvCheckPublic without crashing
  globalThis.__FIREBASE_MISSING_ENV__ = miss;
  // Do NOT throw; allow app to remain undefined so the site can render
}

// initialise only once in any environment (SSR / hot-reload / tests)
let app;
if (!miss.length) {
  const existingApps = getApps();
  if (existingApps.length === 0) {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
    app = initializeApp(firebaseConfig);
  } else {
    app = existingApps[0];
  }
} else {
  app = undefined; // skip init when env missing
}

// Get service instances
export const db = app ? getFirestore(app) : undefined;
export const auth = app ? getAuth(app) : undefined;
export const storage = app ? getStorage(app) : undefined;
export const functions = app ? getFunctions(app) : undefined;

// Connect to emulators if running locally and emulator flag is set
if (isLocalhost && import.meta.env.VITE_USE_EMULATOR === 'true') {
  if (db) connectFirestoreEmulator(db, 'localhost', 8080);
  if (auth) connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  if (storage) connectStorageEmulator(storage, 'localhost', 9199);
  if (functions) connectFunctionsEmulator(functions, 'localhost', 5001);
}

export { app };
