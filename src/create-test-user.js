// src/create-test-user.js
// Firebase Authentication Test User Creator
// This script creates test users in Firebase Authentication that match existing Firestore documents

import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration - same as in lib/firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyCTv263abYUAbveuFraYSLdPpvsbaq08p0",
  authDomain: "engagenatural-app.firebaseapp.com",
  projectId: "engagenatural-app",
  storageBucket: "engagenatural-app.appspot.com",
  messagingSenderId: "314471463344",
  appId: "1:314471463344:web:db0916256301b9eb6fbe75",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/**
 * Creates a test user in Firebase Authentication
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {string} [displayName] - Optional display name
 */
async function createTestUser(email, password, displayName = null) {
  try {
    console.log(`Attempting to create user: ${email}`);
    
    // Check if a Firestore document exists for this user
    const userRef = doc(db, 'users', email);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      console.log(`✅ Found matching Firestore document for ${email}`);
      console.log(`   Role: ${userDoc.data().role || 'none'}`);
      console.log(`   Name: ${userDoc.data().name || displayName || 'none'}`);
    } else {
      console.warn(`⚠️ No Firestore document found for ${email}. Auth user will be created anyway.`);
    }
    
    // Create the user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log(`✅ Successfully created user: ${email}`);
    console.log(`   User ID: ${user.uid}`);
    
    return user;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`⚠️ User ${email} already exists. Attempting to sign in...`);
      
      try {
        // Try to sign in to verify the password works
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log(`✅ Successfully signed in as existing user: ${email}`);
        return userCredential.user;
      } catch (signInError) {
        console.error(`❌ Failed to sign in as existing user: ${signInError.message}`);
        console.log(`   If you need to reset the password, use the Firebase console.`);
        return null;
      }
    } else {
      console.error(`❌ Error creating user: ${error.code} - ${error.message}`);
      return null;
    }
  }
}

// Create test users
async function createTestUsers() {
  // Create lizapoole@gmail.com user to match existing Firestore document
  const lizaUser = await createTestUser('lizapoole@gmail.com', 'password123', 'Liza Poole');
  
  // Add more test users as needed
  // await createTestUser('admin@example.com', 'password123', 'Admin User');
  // await createTestUser('brand@example.com', 'password123', 'Brand Manager');
  
  console.log('\n🔑 Test User Creation Complete!');
  console.log('You can now log in with these credentials:');
  console.log('Email: lizapoole@gmail.com');
  console.log('Password: password123');
}

// Execute the function
createTestUsers()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    // Force exit after completion since Firebase keeps connections open
    setTimeout(() => process.exit(0), 2000);
  })
  .catch(error => {
    console.error(`\n❌ Script failed: ${error}`);
    process.exit(1);
  });

/**
 * HOW TO USE THIS SCRIPT:
 * 
 * 1. Make sure you have Node.js installed
 * 2. Run this script with Node.js:
 *    > node src/create-test-user.js
 * 
 * 3. After running, you should see success messages for each created user
 * 4. You can then use these test accounts to log in to your application
 * 
 * NOTE: This script creates Firebase Authentication users that match
 * existing Firestore documents. The Firestore documents should already exist
 * with the appropriate role, name, and other user data.
 */
