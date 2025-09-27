// src/debug-firebase.js
// Firebase Debug Utility - Tests Firebase initialization and connection

import { auth, db, storage } from '@/lib/firebase';
import { getApp, getApps } from 'firebase/app';
import { onAuthStateChanged, fetchSignInMethodsForEmail } from 'firebase/auth';
import { getDocs, collection, limit, query } from 'firebase/firestore';

console.log('🔍 Firebase Debug Utility Starting...');

// 1. Check if Firebase is initialized
const apps = getApps();
console.log(`🔥 Firebase Apps Initialized: ${apps.length}`);

if (apps.length > 0) {
  const app = getApp();
  console.log('✅ Firebase App Details:');
  console.log(`   - App Name: ${app.name}`);
  console.log(`   - Project ID: ${app.options.projectId}`);
  console.log(`   - API Key: ${app.options.apiKey.substring(0, 5)}...${app.options.apiKey.substring(app.options.apiKey.length - 4)}`);
  console.log(`   - Auth Domain: ${app.options.authDomain}`);
} else {
  console.error('❌ No Firebase apps initialized!');
}

// 2. Check Auth State
console.log('🔐 Checking Auth State...');
const unsubscribe = onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('✅ User is signed in:');
    console.log(`   - User ID: ${user.uid}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Email Verified: ${user.emailVerified}`);
  } else {
    console.log('ℹ️ No user is currently signed in');
  }
});

// 3. Test API Key by checking sign-in methods for a test email
console.log('🔑 Testing API Key validity...');
fetchSignInMethodsForEmail(auth, 'test@example.com')
  .then(methods => {
    console.log('✅ API Key is valid! Sign-in methods available:');
    console.log(methods.length > 0 ? methods : '   - No methods for this email');
  })
  .catch(error => {
    console.error('❌ API Key test failed:');
    console.error(`   - Error Code: ${error.code}`);
    console.error(`   - Error Message: ${error.message}`);
    
    if (error.code === 'auth/invalid-api-key') {
      console.error('   - The API key is invalid or has been restricted');
    } else if (error.code === 'auth/network-request-failed') {
      console.error('   - Network issue - check your internet connection or CORS settings');
    }
  });

// 4. Test Firestore Connection
console.log('📚 Testing Firestore connection...');
getDocs(query(collection(db, 'users'), limit(1)))
  .then(snapshot => {
    console.log(`✅ Firestore connection successful! Found ${snapshot.size} documents in 'users' collection`);
  })
  .catch(error => {
    console.error('❌ Firestore connection failed:');
    console.error(`   - Error Code: ${error.code}`);
    console.error(`   - Error Message: ${error.message}`);
  });

// 5. Check for common test accounts
const testEmails = ['admin@example.com', 'brand@example.com', 'lizapoole@gmail.com'];
console.log('👤 Checking for common test accounts...');

testEmails.forEach(email => {
  fetchSignInMethodsForEmail(auth, email)
    .then(methods => {
      if (methods.length > 0) {
        console.log(`✅ Account exists for ${email}. Sign-in methods: ${methods.join(', ')}`);
      } else {
        console.log(`❌ No account found for ${email}`);
      }
    })
    .catch(error => {
      console.error(`❌ Error checking ${email}:`, error.message);
    });
});

// Export cleanup function
export function cleanupDebugListeners() {
  console.log('🧹 Cleaning up Firebase debug listeners');
  unsubscribe();
}

// Instructions for use
console.log('\n📋 DEBUG INSTRUCTIONS:');
console.log('1. Check console logs above for Firebase initialization status');
console.log('2. Verify API Key is valid');
console.log('3. Confirm Firestore connection is working');
console.log('4. Check if test accounts exist in Firebase Auth');
console.log('5. To clean up listeners, call: cleanupDebugListeners()');
console.log('\n⚠️ If you see API Key errors, verify your Firebase configuration');
console.log('⚠️ If accounts don\'t exist, create them in Firebase Console');
