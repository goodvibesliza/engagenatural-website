// src/utils/firebaseDebug.js
import { auth, db, storage, isLocalhost } from '../lib/firebase';
import { getApp } from 'firebase/app';
import { 
  collection, 
  getDocs, 
  query, 
  limit, 
  addDoc, 
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { signInAnonymously, signOut } from 'firebase/auth';
import { ref, uploadString, deleteObject, getDownloadURL } from 'firebase/storage';

/**
 * Runs a comprehensive diagnostic check on Firebase configuration and connections
 * @returns {Promise<Object>} Diagnostic results
 */
export async function runFirebaseDebugger() {
  console.group('🔍 Firebase Configuration Diagnostics');
  
  // Environment checks
  const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
  const useEmulator = isDevelopment && isLocalhost && import.meta.env.VITE_USE_EMULATOR !== 'false';
  
  console.log('📊 Environment Status:');
  console.log(`  • Development mode: ${isDevelopment ? '✅ Yes' : '❌ No'}`);
  console.log(`  • Localhost detected: ${isLocalhost ? '✅ Yes' : '❌ No'}`);
  console.log(`  • VITE_USE_EMULATOR: ${import.meta.env.VITE_USE_EMULATOR === undefined ? '⚠️ Not set' : import.meta.env.VITE_USE_EMULATOR}`);
  console.log(`  • Should use emulators: ${useEmulator ? '✅ Yes' : '❌ No'}`);
  
  // Firebase app config
  const app = getApp();
  const appConfig = app.options;
  
  console.log('\n📱 Firebase App Configuration:');
  console.log(`  • Project ID: ${appConfig.projectId}`);
  console.log(`  • Auth Domain: ${appConfig.authDomain}`);
  console.log(`  • Storage Bucket: ${appConfig.storageBucket}`);
  
  // Check emulator settings
  console.log('\n🧪 Emulator Configuration:');
  
  // Auth emulator check
  const authEmulator = auth._getRecaptchaConfig?.() && auth._getRecaptchaConfig().emailPasswordEnabled === false;
  console.log(`  • Auth emulator: ${authEmulator ? '✅ Connected' : '❌ Not connected'}`);
  console.log(`    → Endpoint: ${auth._config.emulator ? auth._config.emulator.url : 'Production'}`);
  
  // Firestore emulator check
  const firestoreEmulator = db._settings?.host?.includes('localhost');
  console.log(`  • Firestore emulator: ${firestoreEmulator ? '✅ Connected' : '❌ Not connected'}`);
  console.log(`    → Endpoint: ${firestoreEmulator ? db._settings.host : 'Production'}`);
  
  // Storage emulator check
  const storageEmulator = storage._customUrlOrRegion?.includes('localhost');
  console.log(`  • Storage emulator: ${storageEmulator ? '✅ Connected' : '❌ Not connected'}`);
  console.log(`    → Endpoint: ${storageEmulator ? storage._customUrlOrRegion : 'Production'}`);
  
  // Test connections
  console.log('\n🔌 Connection Tests:');
  
  // Test Firestore
  try {
    console.log('  • Testing Firestore connection...');
    const testQuery = query(collection(db, 'users'), limit(1));
    const snapshot = await getDocs(testQuery);
    console.log(`    ✅ Firestore read successful: ${snapshot.size} documents retrieved`);
    
    // Test write if using emulator
    if (firestoreEmulator) {
      const docRef = await addDoc(collection(db, '_debug_test'), {
        timestamp: serverTimestamp(),
        test: 'Connection test'
      });
      console.log(`    ✅ Firestore write successful: ${docRef.id}`);
      await deleteDoc(docRef);
      console.log(`    ✅ Firestore delete successful`);
    }
  } catch (error) {
    console.error(`    ❌ Firestore test failed: ${error.message}`);
  }
  
  // Test Auth
  try {
    console.log('  • Testing Auth connection...');
    if (auth.currentUser) {
      console.log(`    ℹ️ Already authenticated as: ${auth.currentUser.uid}`);
    } else {
      const userCred = await signInAnonymously(auth);
      console.log(`    ✅ Anonymous auth successful: ${userCred.user.uid}`);
      await signOut(auth);
      console.log(`    ✅ Sign out successful`);
    }
  } catch (error) {
    console.error(`    ❌ Auth test failed: ${error.message}`);
  }
  
  // Test Storage if using emulator
  if (storageEmulator) {
    try {
      console.log('  • Testing Storage connection...');
      const testRef = ref(storage, '_debug_test.txt');
      await uploadString(testRef, 'Test content');
      console.log(`    ✅ Storage upload successful`);
      
      const downloadUrl = await getDownloadURL(testRef);
      console.log(`    ✅ Storage URL generation successful: ${downloadUrl}`);
      
      await deleteObject(testRef);
      console.log(`    ✅ Storage delete successful`);
    } catch (error) {
      console.error(`    ❌ Storage test failed: ${error.message}`);
    }
  }
  
  // Recommendations
  console.log('\n🔧 Recommendations:');
  
  if (isDevelopment && !useEmulator) {
    console.warn('  ⚠️ Running in development but not using emulators.');
    console.warn('     → Start emulators with: firebase emulators:start');
    console.warn('     → Or set VITE_USE_EMULATOR=true in your .env file');
  }
  
  if (isDevelopment && useEmulator && (!authEmulator || !firestoreEmulator || !storageEmulator)) {
    console.error('  ❌ Emulator configuration issue detected!');
    console.error('     → Check if emulators are running: http://localhost:4000');
    console.error('     → Ensure firebase.json has proper emulator configuration');
  }
  
  if (!isDevelopment && (authEmulator || firestoreEmulator || storageEmulator)) {
    console.error('  ⚠️ Using emulators in production mode!');
    console.error('     → This is likely unintended and may cause data issues');
  }
  
  console.groupEnd();
  
  // Return diagnostic results
  return {
    environment: {
      isDevelopment,
      isLocalhost,
      useEmulatorEnv: import.meta.env.VITE_USE_EMULATOR,
      shouldUseEmulator: useEmulator
    },
    emulators: {
      auth: authEmulator,
      firestore: firestoreEmulator,
      storage: storageEmulator
    },
    endpoints: {
      auth: auth._config.emulator ? auth._config.emulator.url : 'Production',
      firestore: firestoreEmulator ? db._settings.host : 'Production',
      storage: storageEmulator ? storage._customUrlOrRegion : 'Production'
    }
  };
}

/**
 * Checks if Firebase emulators are available by testing connections
 * @returns {Promise<boolean>} True if emulators are available
 */
export async function areEmulatorsAvailable() {
  try {
    const testQuery = query(collection(db, 'users'), limit(1));
    await getDocs(testQuery);
    return true;
  } catch (error) {
    console.error('Emulator connection test failed:', error);
    return false;
  }
}

// Export a simple function to run the debugger from the console
window.debugFirebase = runFirebaseDebugger;
