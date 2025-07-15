// src/utils/seedEmulatorAuth.js
/**
 * Utility to seed the Firebase **emulator** with test users.
 * Relies on helper utilities in `emulatorAuthHelper.js` so that
 * custom claims are stored consistently and recognised by the
 * security rules used during local development.
 */
import { isLocalhost } from '../firebase';
import {
  initializeEmulatorUsers,
  signInWithEmulatorClaims,
} from './emulatorAuthHelper';

export async function seedEmulatorAuth() {
  if (!isLocalhost) {
    console.log('Not in local environment - skipping auth seeding');
    return false;
  }

  try {
    // Ensure emulator has the admin & brand accounts (with correct claims)
    let initSuccess = await initializeEmulatorUsers();

    // If the first attempt failed (often because the users already exist but claims
    // were not written) retry in *skipUserCreation* mode so we only patch claims.
    if (!initSuccess) {
      console.warn(
        '🔄 First attempt to create users failed. Retrying in skip-creation mode...'
      );
      initSuccess = await initializeEmulatorUsers(true /* skipUserCreation */);
    }

    if (!initSuccess) {
      console.error('❌ Failed to initialise emulator users');
      return false;
    }

    // Optionally sign-in the admin user so the UI can load immediately.
    try {
      await signInWithEmulatorClaims('admin@example.com', 'password');
    } catch (signInErr) {
      console.warn(
        '⚠️  Admin sign-in failed after seeding, attempting one more time...',
        signInErr?.message || signInErr
      );
      // Retry once more after a brief pause
      await new Promise((r) => setTimeout(r, 250));
      await signInWithEmulatorClaims('admin@example.com', 'password');
    }

    console.log('✅ Auth emulator seeding completed');
    return true;
  } catch (error) {
    console.error('❌ Error seeding Auth emulator:', error);
    return false;
  }
}
