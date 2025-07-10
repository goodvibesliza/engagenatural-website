// src/utils/seedEmulatorAuth.js
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db, isLocalhost } from '../firebase';

export async function seedEmulatorAuth() {
  if (!isLocalhost) {
    console.log('Not in local environment - skipping auth seeding');
    return false;
  }
  
  // Test user credentials
  const email = 'admin@example.com';
  const password = 'password';
  
  try {
    console.log('Attempting to create test user in emulator');
    // Try to create the test user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Also create user document with roles
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      displayName: 'Admin User',
      roles: ['super_admin', 'brand_manager'],
      createdAt: new Date().toISOString()
    });
    
    console.log('✓ Test user created in Auth emulator with ID:', user.uid);
    return true;
  } catch (error) {
    // If user already exists, just log them in
    if (error.code === 'auth/email-already-in-use') {
      try {
        console.log('User already exists, signing in');
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('✓ Test user signed in with ID:', userCredential.user.uid);
        return true;
      } catch (signInError) {
        console.error('Error signing in test user:', signInError);
        return false;
      }
    } else {
      console.error('Error creating test user:', error);
      return false;
    }
  }
}
