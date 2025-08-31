// src/utils/seedEmulatorAuth.js
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db, isLocalhost } from '../lib/firebase';

export async function seedEmulatorAuth() {
  if (!isLocalhost) {
    console.log('Not in local environment - skipping auth seeding');
    return false;
  }
  
  // Test user credentials
  const email = 'admin@example.com';
  const password = 'password';
  
  /**
   * Helper to create or sign-in a user in the emulator and ensure
   * a corresponding Firestore profile document exists.
   */
  async function ensureUser(userEmail, userPassword, profileData) {
    let user;
    try {
      const cred = await createUserWithEmailAndPassword(auth, userEmail, userPassword);
      user = cred.user;
      console.log(`✅ Created test user: ${userEmail}`);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        const cred = await signInWithEmailAndPassword(auth, userEmail, userPassword);
        user = cred.user;
        console.log(`✅ Test user already exists: ${userEmail}`);
      } else {
        console.error(`❌ Error creating/signing-in ${userEmail}:`, err);
        throw err;
      }
    }

    // Upsert Firestore profile
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          // 🚫  Do NOT write any `approved` field here.
          // ℹ️  Only essential identity fields plus timestamps.
          email: userEmail,
          displayName: profileData.displayName,
          role: profileData.role,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { merge: true }
      );
      console.log(`✅ Firestore profile ensured for ${userEmail}`);
    } catch (err) {
      console.error(`❌ Error setting Firestore profile for ${userEmail}:`, err);
      throw err;
    }
  }

  try {
    // Ensure super admin user
    await ensureUser(email, password, {
      displayName: 'Admin User',
      role: 'super_admin'
    });

    // Ensure brand manager user
    await ensureUser('brand@example.com', 'password', {
      displayName: 'Brand Manager',
      role: 'brand_manager'
    });

    // ------------------------------------------------------------------
    // Ensure staff user (test@gmail.com) so we can log in as a staff role
    // ------------------------------------------------------------------
    await ensureUser('test@gmail.com', 'password', {
      displayName: 'Test Staff',
      role: 'staff'
    });

    return true;
  } catch {
    return false;
  }
}
