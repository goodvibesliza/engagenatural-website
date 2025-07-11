// src/utils/seedEmulatorAuth.js
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, setDoc, doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '../firebase';

export async function seedEmulatorAuth() {
  try {
    console.log('Attempting to create test user in emulator');
    
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    // Admin user credentials
    const adminEmail = 'admin@example.com';
    const adminPassword = 'password';
    
    // Brand Manager credentials
    const brandManagerEmail = 'brandmanager@example.com';
    const brandManagerPassword = 'password';
    
    // Try to create admin user
    let adminUser;
    try {
      const adminUserCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      adminUser = adminUserCredential.user;
    } catch (error) {
      console.log('User already exists, signing in');
      const adminUserCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      adminUser = adminUserCredential.user;
    }
    
    // Create admin user's roles
    await setDoc(doc(db, 'user_roles', adminUser.uid), {
      roles: ['super_admin'],
      updatedAt: serverTimestamp()
    });
    
    // Try to create brand manager user
    let brandManagerUser;
    try {
      const bmUserCredential = await createUserWithEmailAndPassword(auth, brandManagerEmail, brandManagerPassword);
      brandManagerUser = bmUserCredential.user;
    } catch (error) {
      console.log('Brand manager already exists, signing in');
      const bmUserCredential = await signInWithEmailAndPassword(auth, brandManagerEmail, brandManagerPassword);
      brandManagerUser = bmUserCredential.user;
    }
    
    // Create brand manager's roles
    await setDoc(doc(db, 'user_roles', brandManagerUser.uid), {
      roles: ['brand_manager'],
      updatedAt: serverTimestamp()
    });
    
    // Create sample brand for the brand manager if it doesn't exist
    const sampleBrand = {
      name: 'Sample Brand',
      description: 'A sample brand for testing',
      managerId: brandManagerUser.uid,
      managerEmail: brandManagerEmail,
      managerName: 'Brand Manager',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      website: 'https://example.com',
      logoUrl: null
    };
    
    // Add the brand to the brands collection
    await addDoc(collection(db, 'brands'), sampleBrand);
    
    console.log('✓ Test users created and brand assigned');
    console.log(`✓ Admin user ID: ${adminUser.uid}`);
    console.log(`✓ Brand manager user ID: ${brandManagerUser.uid}`);
    
    return true;
  } catch (error) {
    console.error('Error seeding emulator auth:', error);
    return false;
  }
}