// src/utils/emulatorDiagnostics.js
import { auth, db, storage, isLocalhost } from '../lib/firebase';
import { 
  signInAnonymously, 
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  limit, 
  deleteDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import { 
  ref, 
  uploadString, 
  getDownloadURL, 
  deleteObject,
  listAll
} from 'firebase/storage';

/**
 * Comprehensive diagnostics utility for Firebase emulators
 * Helps troubleshoot connectivity issues with Auth, Firestore, and Storage emulators
 */

// Constants for emulator ports and hosts
const EMULATOR_PORTS = {
  auth: 9099,
  firestore: 8080,
  storage: 9199,
  ui: 4000
};

/**
 * Run a complete diagnostic check on all Firebase emulators
 * @returns {Promise<Object>} Results of all diagnostic tests
 */
export async function runEmulatorDiagnostics() {
  if (!isLocalhost) {
    console.warn('Emulator diagnostics can only be run in local development environment');
    return {
      isLocalhost: false,
      message: 'Not running in localhost - emulators are only available in local development'
    };
  }

  console.log('🔍 Running Firebase emulator diagnostics...');
  
  try {
    // Run all diagnostics in parallel
    const [authResults, firestoreResults, storageResults] = await Promise.all([
      checkAuthEmulator(),
      checkFirestoreEmulator(),
      checkStorageEmulator()
    ]);
    
    // Check UI emulator separately (just a network check)
    const uiResults = await checkEmulatorUIAvailable();
    
    // Compile results
    const allResults = {
      timestamp: new Date().toISOString(),
      isLocalhost,
      emulators: {
        auth: authResults,
        firestore: firestoreResults,
        storage: storageResults,
        ui: uiResults
      },
      summary: {
        allOperational: 
          authResults.operational && 
          firestoreResults.operational && 
          storageResults.operational &&
          uiResults.available,
        issuesDetected: 
          !authResults.operational || 
          !firestoreResults.operational || 
          !storageResults.operational ||
          !uiResults.available
      }
    };
    
    console.log('✅ Emulator diagnostics complete:', allResults);
    return allResults;
  } catch (error) {
    console.error('❌ Error running emulator diagnostics:', error);
    return {
      isLocalhost,
      error: error.message,
      timestamp: new Date().toISOString(),
      message: 'Failed to run diagnostics - check console for details'
    };
  }
}

/**
 * Check if the Auth emulator is operational
 * @returns {Promise<Object>} Results of the Auth emulator check
 */
export async function checkAuthEmulator() {
  console.log('🔍 Checking Auth emulator...');
  
  const results = {
    operational: false,
    connected: false,
    readOperations: false,
    writeOperations: false,
    errors: [],
    details: {}
  };
  
  try {
    // Check if we're connected to the emulator
    const authUrl = `http://127.0.0.1:${EMULATOR_PORTS.auth}/__/auth/handler`;
    const connectionCheck = await fetch(authUrl, { 
      method: 'HEAD',
      // Short timeout to avoid hanging
      signal: AbortSignal.timeout(2000)
    }).catch(() => null);
    
    results.connected = connectionCheck?.ok || connectionCheck?.status === 200;
    results.details.connectionCheck = {
      url: authUrl,
      status: connectionCheck?.status || 'failed',
      ok: connectionCheck?.ok || false
    };
    
    if (!results.connected) {
      results.errors.push('Cannot connect to Auth emulator');
      return results;
    }
    
    // Test read operation - fetch sign in methods for a test email
    try {
      const readResult = await fetchSignInMethodsForEmail(auth, 'test@example.com');
      results.readOperations = true;
      results.details.readOperation = {
        success: true,
        result: readResult
      };
    } catch (error) {
      results.errors.push(`Auth read operation failed: ${error.message}`);
      results.details.readOperation = {
        success: false,
        error: error.message
      };
    }
    
    // Test write operation - sign in anonymously
    try {
      const writeResult = await signInAnonymously(auth);
      results.writeOperations = true;
      results.details.writeOperation = {
        success: true,
        uid: writeResult.user.uid
      };
      
      // Sign out after successful test
      await auth.signOut();
    } catch (error) {
      results.errors.push(`Auth write operation failed: ${error.message}`);
      results.details.writeOperation = {
        success: false,
        error: error.message
      };
    }
    
    // Overall operational status
    results.operational = results.connected && results.readOperations && results.writeOperations;
    
  } catch (error) {
    results.errors.push(`Auth emulator check failed: ${error.message}`);
    results.details.error = error.message;
  }
  
  console.log(`${results.operational ? '✅' : '❌'} Auth emulator check:`, results);
  return results;
}

/**
 * Check if the Firestore emulator is operational
 * @returns {Promise<Object>} Results of the Firestore emulator check
 */
export async function checkFirestoreEmulator() {
  console.log('🔍 Checking Firestore emulator...');
  
  const results = {
    operational: false,
    connected: false,
    readOperations: false,
    writeOperations: false,
    errors: [],
    details: {}
  };
  
  try {
    // Check if we're connected to the emulator
    const firestoreUrl = `http://127.0.0.1:${EMULATOR_PORTS.firestore}/`;
    const connectionCheck = await fetch(firestoreUrl, { 
      method: 'HEAD',
      // Short timeout to avoid hanging
      signal: AbortSignal.timeout(2000)
    }).catch(() => null);
    
    results.connected = connectionCheck?.ok || connectionCheck?.status === 200;
    results.details.connectionCheck = {
      url: firestoreUrl,
      status: connectionCheck?.status || 'failed',
      ok: connectionCheck?.ok || false
    };
    
    if (!results.connected) {
      results.errors.push('Cannot connect to Firestore emulator');
      return results;
    }
    
    // Test write operation - add a test document
    const testCollectionName = `diagnostics_${Date.now()}`;
    const testDocData = { 
      timestamp: new Date().toISOString(),
      test: true 
    };
    
    try {
      const docRef = await addDoc(collection(db, testCollectionName), testDocData);
      results.writeOperations = true;
      results.details.writeOperation = {
        success: true,
        docId: docRef.id,
        collection: testCollectionName
      };
      
      // Test read operation - read the document we just created
      try {
        const docSnapshot = await getDoc(doc(db, testCollectionName, docRef.id));
        results.readOperations = docSnapshot.exists();
        results.details.readOperation = {
          success: docSnapshot.exists(),
          data: docSnapshot.data()
        };
        
        // Clean up - delete the test document
        await deleteDoc(doc(db, testCollectionName, docRef.id));
      } catch (error) {
        results.errors.push(`Firestore read operation failed: ${error.message}`);
        results.details.readOperation = {
          success: false,
          error: error.message
        };
      }
    } catch (error) {
      results.errors.push(`Firestore write operation failed: ${error.message}`);
      results.details.writeOperation = {
        success: false,
        error: error.message
      };
    }
    
    // Overall operational status
    results.operational = results.connected && results.readOperations && results.writeOperations;
    
  } catch (error) {
    results.errors.push(`Firestore emulator check failed: ${error.message}`);
    results.details.error = error.message;
  }
  
  console.log(`${results.operational ? '✅' : '❌'} Firestore emulator check:`, results);
  return results;
}

/**
 * Check if the Storage emulator is operational
 * @returns {Promise<Object>} Results of the Storage emulator check
 */
export async function checkStorageEmulator() {
  console.log('🔍 Checking Storage emulator...');
  
  const results = {
    operational: false,
    connected: false,
    readOperations: false,
    writeOperations: false,
    errors: [],
    details: {}
  };
  
  try {
    // Check if we're connected to the emulator
    const storageUrl = `http://127.0.0.1:${EMULATOR_PORTS.storage}/`;
    const connectionCheck = await fetch(storageUrl, { 
      method: 'HEAD',
      // Short timeout to avoid hanging
      signal: AbortSignal.timeout(2000)
    }).catch(() => null);
    
    results.connected = connectionCheck?.ok || connectionCheck?.status === 200;
    results.details.connectionCheck = {
      url: storageUrl,
      status: connectionCheck?.status || 'failed',
      ok: connectionCheck?.ok || false
    };
    
    if (!results.connected) {
      results.errors.push('Cannot connect to Storage emulator');
      return results;
    }
    
    // Test write operation - upload a small test file
    const testFileName = `diagnostics_test_${Date.now()}.txt`;
    const testFileContent = 'This is a test file for Firebase Storage emulator diagnostics';
    const testFileRef = ref(storage, `diagnostics/${testFileName}`);
    
    try {
      await uploadString(testFileRef, testFileContent);
      results.writeOperations = true;
      results.details.writeOperation = {
        success: true,
        path: `diagnostics/${testFileName}`
      };
      
      // Test read operation - get download URL for the file we just uploaded
      try {
        const downloadUrl = await getDownloadURL(testFileRef);
        results.readOperations = !!downloadUrl;
        results.details.readOperation = {
          success: true,
          downloadUrl
        };
        
        // Clean up - delete the test file
        await deleteObject(testFileRef);
      } catch (error) {
        results.errors.push(`Storage read operation failed: ${error.message}`);
        results.details.readOperation = {
          success: false,
          error: error.message
        };
      }
    } catch (error) {
      results.errors.push(`Storage write operation failed: ${error.message}`);
      results.details.writeOperation = {
        success: false,
        error: error.message
      };
    }
    
    // Overall operational status
    results.operational = results.connected && results.readOperations && results.writeOperations;
    
  } catch (error) {
    results.errors.push(`Storage emulator check failed: ${error.message}`);
    results.details.error = error.message;
  }
  
  console.log(`${results.operational ? '✅' : '❌'} Storage emulator check:`, results);
  return results;
}

/**
 * Check if the Emulator UI is available
 * @returns {Promise<Object>} Results of the Emulator UI check
 */
export async function checkEmulatorUIAvailable() {
  console.log('🔍 Checking Emulator UI availability...');
  
  const results = {
    available: false,
    url: `http://127.0.0.1:${EMULATOR_PORTS.ui}/`,
    errors: []
  };
  
  try {
    const uiCheck = await fetch(results.url, { 
      method: 'HEAD',
      // Short timeout to avoid hanging
      signal: AbortSignal.timeout(2000)
    }).catch(() => null);
    
    results.available = uiCheck?.ok || uiCheck?.status === 200;
    results.status = uiCheck?.status || 'failed';
    
    if (!results.available) {
      results.errors.push('Cannot connect to Emulator UI');
    }
  } catch (error) {
    results.errors.push(`Emulator UI check failed: ${error.message}`);
    results.error = error.message;
  }
  
  console.log(`${results.available ? '✅' : '❌'} Emulator UI check:`, results);
  return results;
}

/**
 * Get troubleshooting recommendations based on diagnostic results
 * @param {Object} diagnosticResults - Results from runEmulatorDiagnostics()
 * @returns {Object} Troubleshooting recommendations
 */
export function getTroubleshootingRecommendations(diagnosticResults) {
  if (!diagnosticResults) {
    return {
      general: [
        'Run diagnostics first using runEmulatorDiagnostics()'
      ]
    };
  }
  
  const recommendations = {
    general: [],
    auth: [],
    firestore: [],
    storage: [],
    ui: []
  };
  
  // General recommendations
  if (!diagnosticResults.isLocalhost) {
    recommendations.general.push(
      'Firebase emulators only work in a local development environment (localhost)'
    );
  }
  
  if (diagnosticResults.summary?.issuesDetected) {
    recommendations.general.push(
      'Make sure firebase emulators:start is running in a terminal window',
      'Check if any other applications are using the same ports as the emulators',
      'Try restarting the emulators with firebase emulators:start --force'
    );
  }
  
  // Auth emulator recommendations
  const auth = diagnosticResults.emulators?.auth;
  if (auth && !auth.operational) {
    if (!auth.connected) {
      recommendations.auth.push(
        `Check if Auth emulator is running on port ${EMULATOR_PORTS.auth}`,
        'Make sure firebase.json has auth emulator configured correctly'
      );
    }
    
    if (!auth.writeOperations) {
      recommendations.auth.push(
        'Auth emulator write operations are failing',
        'Check browser console for specific error messages',
        'Try clearing browser localStorage and cookies for localhost'
      );
    }
    
    if (!auth.readOperations) {
      recommendations.auth.push(
        'Auth emulator read operations are failing',
        'Check browser console for specific error messages'
      );
    }
  }
  
  // Firestore emulator recommendations
  const firestore = diagnosticResults.emulators?.firestore;
  if (firestore && !firestore.operational) {
    if (!firestore.connected) {
      recommendations.firestore.push(
        `Check if Firestore emulator is running on port ${EMULATOR_PORTS.firestore}`,
        'Make sure firebase.json has firestore emulator configured correctly'
      );
    }
    
    if (!firestore.writeOperations) {
      recommendations.firestore.push(
        'Firestore emulator write operations are failing',
        'Check Firestore security rules in firestore.rules',
        'Make sure the rules allow write operations for your test data'
      );
    }
    
    if (!firestore.readOperations) {
      recommendations.firestore.push(
        'Firestore emulator read operations are failing',
        'Check Firestore security rules in firestore.rules',
        'Make sure the rules allow read operations for your test data'
      );
    }
  }
  
  // Storage emulator recommendations
  const storage = diagnosticResults.emulators?.storage;
  if (storage && !storage.operational) {
    if (!storage.connected) {
      recommendations.storage.push(
        `Check if Storage emulator is running on port ${EMULATOR_PORTS.storage}`,
        'Make sure firebase.json has storage emulator configured correctly'
      );
    }
    
    if (!storage.writeOperations) {
      recommendations.storage.push(
        'Storage emulator write operations are failing',
        'Check Storage security rules in storage.rules',
        'Make sure the rules allow write operations for your test paths'
      );
    }
    
    if (!storage.readOperations) {
      recommendations.storage.push(
        'Storage emulator read operations are failing',
        'Check Storage security rules in storage.rules',
        'Make sure the rules allow read operations for your test paths'
      );
    }
  }
  
  // UI recommendations
  const ui = diagnosticResults.emulators?.ui;
  if (ui && !ui.available) {
    recommendations.ui.push(
      `Check if Emulator UI is running on port ${EMULATOR_PORTS.ui}`,
      'Make sure firebase.json has ui.enabled set to true'
    );
  }
  
  return recommendations;
}

/**
 * Restart Firebase emulators using the Firebase CLI
 * (This requires the Firebase CLI to be installed)
 * @returns {Promise<boolean>} Success status
 */
export async function restartEmulators() {
  if (!isLocalhost) {
    console.warn('Cannot restart emulators outside of local development');
    return false;
  }
  
  try {
    console.log('🔄 Attempting to restart Firebase emulators...');
    
    // This is a client-side function, so we can't directly execute CLI commands
    // Instead, we'll provide instructions to the user
    console.log('To restart the emulators, run these commands in your terminal:');
    console.log('1. Press Ctrl+C to stop the current emulator process');
    console.log('2. Run: firebase emulators:start --force');
    
    return true;
  } catch (error) {
    console.error('❌ Error providing restart instructions:', error);
    return false;
  }
}

/**
 * Get a summary of the emulator status
 * @returns {Promise<Object>} Summary of emulator status
 */
export async function getEmulatorStatusSummary() {
  if (!isLocalhost) {
    return {
      running: false,
      message: 'Not in local development environment'
    };
  }
  
  try {
    // Check if emulators are running by making simple requests to each one
    const [authAvailable, firestoreAvailable, storageAvailable, uiAvailable] = await Promise.all([
      fetch(`http://127.0.0.1:${EMULATOR_PORTS.auth}/`, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(1000)
      }).then(() => true).catch(() => false),
      
      fetch(`http://127.0.0.1:${EMULATOR_PORTS.firestore}/`, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(1000)
      }).then(() => true).catch(() => false),
      
      fetch(`http://127.0.0.1:${EMULATOR_PORTS.storage}/`, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(1000)
      }).then(() => true).catch(() => false),
      
      fetch(`http://127.0.0.1:${EMULATOR_PORTS.ui}/`, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(1000)
      }).then(() => true).catch(() => false)
    ]);
    
    const allRunning = authAvailable && firestoreAvailable && storageAvailable;
    
    return {
      running: allRunning,
      ui: uiAvailable,
      services: {
        auth: authAvailable,
        firestore: firestoreAvailable,
        storage: storageAvailable
      },
      message: allRunning 
        ? 'All emulators appear to be running' 
        : 'Some emulators are not running'
    };
  } catch (error) {
    console.error('Error checking emulator status:', error);
    return {
      running: false,
      error: error.message,
      message: 'Error checking emulator status'
    };
  }
}
