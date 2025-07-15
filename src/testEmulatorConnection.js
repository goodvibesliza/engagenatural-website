// src/testEmulatorConnection.js
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInAnonymously } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, collection, addDoc, getDoc, doc } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, ref, uploadString, getDownloadURL } from 'firebase/storage';

console.log('🔥 Starting Firebase Emulator Connection Test');
console.log('📝 This file tests direct connections to all Firebase emulators');

// Minimal Firebase configuration
const firebaseConfig = {
  apiKey: 'demo-api-key',
  projectId: 'demo-project',
  // Added bucket so Storage SDK knows which bucket to reference
  storageBucket: 'engagenatural-app.appspot.com',
  appId: '1:123456789012:web:abcdef1234567890'
};

// Initialize Firebase with minimal config
console.log('⚙️ Initializing Firebase with minimal configuration');
const app = initializeApp(firebaseConfig);

// Initialize services
console.log('⚙️ Initializing Firebase services');
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Connect to Auth emulator
console.log('\n🔑 AUTH EMULATOR TEST');
console.log('⚙️ Connecting to Auth emulator at 127.0.0.1:9099');
try {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  console.log('✅ Successfully connected to Auth emulator');
} catch (error) {
  console.error('❌ Failed to connect to Auth emulator:', error);
}

// Connect to Firestore emulator
console.log('\n📄 FIRESTORE EMULATOR TEST');
console.log('⚙️ Connecting to Firestore emulator at 127.0.0.1:8080');
try {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  console.log('✅ Successfully connected to Firestore emulator');
} catch (error) {
  console.error('❌ Failed to connect to Firestore emulator:', error);
}

// Connect to Storage emulator
console.log('\n💾 STORAGE EMULATOR TEST');
console.log('⚙️ Connecting to Storage emulator at 127.0.0.1:9199');
try {
  connectStorageEmulator(storage, '127.0.0.1', 9199);
  console.log('✅ Successfully connected to Storage emulator');
} catch (error) {
  console.error('❌ Failed to connect to Storage emulator:', error);
}

// Test Auth operations
async function testAuthEmulator() {
  console.log('\n🧪 Testing Auth emulator operations');
  try {
    console.log('⚙️ Attempting anonymous sign-in');
    const userCredential = await signInAnonymously(auth);
    console.log('✅ Anonymous sign-in successful:', userCredential.user.uid);
    return true;
  } catch (error) {
    console.error('❌ Auth operation failed:', error.code, error.message);
    return false;
  }
}

// Test Firestore operations
async function testFirestoreEmulator() {
  console.log('\n🧪 Testing Firestore emulator operations');
  try {
    // Write operation
    console.log('⚙️ Attempting to write test document');
    const testDoc = { 
      timestamp: new Date().toISOString(),
      test: true,
      message: 'This is a test document'
    };
    
    const docRef = await addDoc(collection(db, 'emulator_test'), testDoc);
    console.log('✅ Document written successfully with ID:', docRef.id);
    
    // Read operation
    console.log('⚙️ Attempting to read test document');
    const docSnap = await getDoc(doc(db, 'emulator_test', docRef.id));
    
    if (docSnap.exists()) {
      console.log('✅ Document read successfully:', docSnap.data());
      return true;
    } else {
      console.error('❌ Document does not exist');
      return false;
    }
  } catch (error) {
    console.error('❌ Firestore operation failed:', error);
    return false;
  }
}

// Test Storage operations
async function testStorageEmulator() {
  console.log('\n🧪 Testing Storage emulator operations');
  try {
    // Upload operation
    console.log('⚙️ Attempting to upload test file');
    const testContent = 'This is a test file for Storage emulator';
    const testRef = ref(storage, 'emulator-diagnostics/test_file.txt');
    
    const snapshot = await uploadString(testRef, testContent);
    console.log('✅ File uploaded successfully:', snapshot.metadata.fullPath);
    
    // Download URL operation
    console.log('⚙️ Attempting to get download URL');
    const url = await getDownloadURL(testRef);
    console.log('✅ Download URL obtained:', url);
    
    return true;
  } catch (error) {
    console.error('❌ Storage operation failed:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n🚀 STARTING ALL EMULATOR TESTS');
  
  const authResult = await testAuthEmulator();
  const firestoreResult = await testFirestoreEmulator();
  const storageResult = await testStorageEmulator();
  
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log(`Auth Emulator: ${authResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Firestore Emulator: ${firestoreResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Storage Emulator: ${storageResult ? '✅ PASSED' : '❌ FAILED'}`);
  
  const allPassed = authResult && firestoreResult && storageResult;
  console.log(`\nOverall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (!allPassed) {
    console.log('\n🔍 TROUBLESHOOTING TIPS:');
    console.log('1. Make sure Firebase emulators are running: firebase emulators:start');
    console.log('2. Check if the emulator ports are correct (Auth: 9099, Firestore: 8080, Storage: 9199)');
    console.log('3. Verify your firebase.json has the correct emulator configuration');
    console.log('4. Try restarting your computer to clear any stuck processes');
    console.log('5. Check if any other applications are using the same ports');
  }
}

// Execute tests
runAllTests();

// Export for potential reuse
export {
  testAuthEmulator,
  testFirestoreEmulator,
  testStorageEmulator,
  runAllTests
};
