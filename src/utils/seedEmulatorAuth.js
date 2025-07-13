// src/utils/seedEmulatorAuth.js
import { isLocalhost } from '../firebase';

/**
 * Seed the Firebase Auth emulator with test users
 * This function only works in localhost/emulator mode
 * @returns {Promise<boolean>} Success status
 */
export async function seedEmulatorAuth() {
  // Only run in localhost/emulator mode
  if (!isLocalhost) {
    console.warn('seedEmulatorAuth: Not in localhost mode, skipping');
    return false;
  }

  console.log('seedEmulatorAuth: Starting to seed emulator with test users');
  
  try {
    // Create admin test user
    await createTestUser({
      email: 'admin@example.com',
      password: 'password',
      displayName: 'Admin User',
      role: 'super_admin'
    });
    
    // Create brand manager test user
    await createTestUser({
      email: 'brand@example.com',
      password: 'password',
      displayName: 'Brand Manager',
      role: 'brand_manager',
      brandId: 'test-brand-1',
      brandName: 'Test Brand'
    });
    
    console.log('seedEmulatorAuth: Successfully created test users');
    return true;
  } catch (error) {
    console.error('seedEmulatorAuth: Failed to create test users', error);
    return false;
  }
}

/**
 * Create a test user in the Firebase Auth emulator
 * @param {Object} userData User data
 * @returns {Promise<Object>} Created user data
 */
async function createTestUser(userData) {
  const { email, password, displayName, role, brandId, brandName } = userData;
  
  try {
    console.log(`seedEmulatorAuth: Creating test user ${email} with role ${role}`);
    
    // First, create the user in Auth emulator
    const authResponse = await fetch('http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    });
    
    if (!authResponse.ok) {
      const errorData = await authResponse.json();
      
      // If user already exists, that's fine - we'll just update the Firestore data
      if (errorData.error?.message === 'EMAIL_EXISTS') {
        console.log(`seedEmulatorAuth: User ${email} already exists, continuing`);
      } else {
        throw new Error(`Failed to create auth user: ${errorData.error?.message || 'Unknown error'}`);
      }
    }
    
    // Now create/update the user profile in Firestore emulator
    const firestoreResponse = await fetch(`http://localhost:8080/v1/projects/engagenatural-app/databases/(default)/documents/users/${email.replace('@', '_at_')}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          email: { stringValue: email },
          displayName: { stringValue: displayName },
          firstName: { stringValue: displayName.split(' ')[0] },
          lastName: { stringValue: displayName.split(' ')[1] || '' },
          role: { stringValue: role },
          ...(brandId ? { brandId: { stringValue: brandId } } : {}),
          ...(brandName ? { brandName: { stringValue: brandName } } : {})
        }
      })
    });
    
    if (!firestoreResponse.ok) {
      console.warn(`seedEmulatorAuth: Failed to create/update user profile in Firestore for ${email}`, await firestoreResponse.text());
    } else {
      console.log(`seedEmulatorAuth: Successfully created/updated user profile for ${email}`);
    }
    
    // If this is a brand manager, create the brand document if it doesn't exist
    if (role === 'brand_manager' && brandId) {
      await createTestBrand(brandId, brandName, email);
    }
    
    return userData;
  } catch (error) {
    console.error(`seedEmulatorAuth: Error creating test user ${email}`, error);
    throw error;
  }
}

/**
 * Create a test brand in the Firestore emulator
 * @param {string} brandId Brand ID
 * @param {string} brandName Brand name
 * @param {string} managerEmail Manager email
 * @returns {Promise<void>}
 */
async function createTestBrand(brandId, brandName, managerEmail) {
  try {
    console.log(`seedEmulatorAuth: Creating test brand ${brandId}`);
    
    // Create the brand document
    const brandResponse = await fetch(`http://localhost:8080/v1/projects/engagenatural-app/databases/(default)/documents/brands/${brandId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          name: { stringValue: brandName },
          isActive: { booleanValue: true },
          createdAt: { timestampValue: new Date().toISOString() },
          managerId: { stringValue: managerEmail.replace('@', '_at_') }
        }
      })
    });
    
    if (!brandResponse.ok) {
      console.warn(`seedEmulatorAuth: Failed to create brand ${brandId}`, await brandResponse.text());
    }
    
    // Create brand users subcollection with the manager
    const brandUserResponse = await fetch(`http://localhost:8080/v1/projects/engagenatural-app/databases/(default)/documents/brands/${brandId}/users/${managerEmail.replace('@', '_at_')}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          email: { stringValue: managerEmail },
          role: { stringValue: 'manager' },
          addedAt: { timestampValue: new Date().toISOString() }
        }
      })
    });
    
    if (!brandUserResponse.ok) {
      console.warn(`seedEmulatorAuth: Failed to add user to brand ${brandId}`, await brandUserResponse.text());
    }
    
    // Create a test community for this brand
    await createTestCommunity(brandId, brandName);
    
    console.log(`seedEmulatorAuth: Successfully created brand ${brandId} with manager ${managerEmail}`);
  } catch (error) {
    console.error(`seedEmulatorAuth: Error creating test brand ${brandId}`, error);
  }
}

/**
 * Create a test community in the Firestore emulator
 * @param {string} brandId Brand ID
 * @param {string} brandName Brand name
 * @returns {Promise<void>}
 */
async function createTestCommunity(brandId, brandName) {
  try {
    const communityId = `${brandId}-community`;
    console.log(`seedEmulatorAuth: Creating test community ${communityId} for brand ${brandId}`);
    
    // Create the community document
    const communityResponse = await fetch(`http://localhost:8080/v1/projects/engagenatural-app/databases/(default)/documents/communities/${communityId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          name: { stringValue: `${brandName} Community` },
          description: { stringValue: `Official community for ${brandName}` },
          brandId: { stringValue: brandId },
          isPublic: { booleanValue: true },
          isActive: { booleanValue: true },
          members: { integerValue: 42 },
          createdAt: { timestampValue: new Date().toISOString() }
        }
      })
    });
    
    if (!communityResponse.ok) {
      console.warn(`seedEmulatorAuth: Failed to create community for brand ${brandId}`, await communityResponse.text());
    } else {
      console.log(`seedEmulatorAuth: Successfully created community ${communityId} for brand ${brandId}`);
    }
  } catch (error) {
    console.error(`seedEmulatorAuth: Error creating test community for brand ${brandId}`, error);
  }
}
