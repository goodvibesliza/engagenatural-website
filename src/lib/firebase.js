// src/lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, initializeFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: "***************************************",
  authDomain: "engagenatural-app.firebaseapp.com",
  projectId: "engagenatural-app",
  storageBucket: "engagenatural-app.appspot.com",
  messagingSenderId: "314471463344",
  appId: "1:314471463344:web:db0916256301b9eb6fbe75",
};

// initialise only once in any environment (SSR / hot-reload / tests)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

let __db;
try {
  __db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    useFetchStreams: false,
    ...(import.meta.env.VITE_FORCE_LONG_POLLING === 'true' ? { experimentalForceLongPolling: true } : {}),
  });
} catch (e) {
  // If Firestore was already initialized (e.g., HMR), fall back to the existing instance
  __db = getFirestore(app);
}

export const db = __db;
export const storage = getStorage(app);

// exposed helper (used by other modules)
export const isLocalhost = window?.location?.hostname === "localhost";

const useEmu = import.meta.env.VITE_USE_EMULATOR === 'true';
const host = import.meta.env.VITE_EMULATOR_HOST || '127.0.0.1';
if (useEmu && !globalThis.__EMU_CONNECTED__) {
  try {
    connectFirestoreEmulator(db, host, Number(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT || 8080));
  } catch {}
  try {
    connectAuthEmulator(auth, `http://${host}:${import.meta.env.VITE_AUTH_EMULATOR_PORT || 9099}`, { disableWarnings: true });
  } catch {}
  try {
    connectStorageEmulator(storage, host, Number(import.meta.env.VITE_STORAGE_EMULATOR_PORT || 9199));
  } catch {}
  globalThis.__EMU_CONNECTED__ = true;
}

export { app };
