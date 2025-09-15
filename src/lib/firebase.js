import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// ---------------------------------------------------------------------------
// Local-host detection
// ---------------------------------------------------------------------------
// Broaden detection so development hostnames like 127.0.0.1, ::1 and
// sub-domains ending in “.localhost” (e.g. app.localhost) are treated as
// “localhost” for the purpose of connecting Firebase emulators.
//
// This allows Vite/Netlify Dev proxies or custom hosts in /etc/hosts to work
// seamlessly without additional configuration.
const __USE_EMU__ = import.meta.env.VITE_USE_EMULATOR === 'true';
export const isLocalhost = (() => {
  // When developer explicitly enables the emulator, always treat the
  // environment as “localhost” so helper logic (e.g. custom-claim merging)
  // engages even if the site is accessed via a non-localhost host header
  // such as 127.0.0.1, ::1, or a *.test/.local domain.
  if (__USE_EMU__) return true;

  if (typeof window === 'undefined') return false;
  const hn = window.location.hostname || '';
  return (
    hn === 'localhost' ||
    hn === '127.0.0.1' ||
    hn === '::1' ||
    hn.endsWith('.localhost')
  );
})();

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

// Initialise exactly once (SSR / hot-reload / tests)
let app;
const existingApps = getApps();
if (existingApps.length > 0) {
  // Re-use singleton if it already exists
  app = existingApps[0];
} else if (!miss.length) {
  // All required env vars present → use real project config
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  app = initializeApp(firebaseConfig);
} else if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  // Missing real keys but running with emulator → bootstrap with minimal config
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project';
  const firebaseConfig = {
    apiKey: 'demo',
    authDomain: `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: `${projectId}.appspot.com`,
    messagingSenderId: '1234567890',
    appId: 'demo-app-id',
  };
  app = initializeApp(firebaseConfig);
} else {
  // Not using emulator and vars missing → keep undefined (UI can handle gracefully)
  app = undefined;
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
