// src/services/demoSeed.ts
import { db } from '../lib/firebase.js';
import { auth } from '../lib/firebase.js';
// Additional imports to create an isolated Firebase Auth instance
import {
  initializeApp,
  getApps,
  getApp,
  FirebaseApp,
} from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  Auth,
} from 'firebase/auth';
// Re-use the primary app's options for the secondary instance
import { app as primaryApp } from '../lib/firebase.js';
import { 
  collection, 
  doc, 
  writeBatch, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  serverTimestamp, 
  setDoc, 
  getDoc, 
  updateDoc,
  addDoc
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';

// Deterministic brand IDs for consistent references across emulator restarts  
const DEMO_BRANDS = {
  rescue: 'rescue-remedy',
  bach: 'bach-flower-remedies', 
  spatone: 'spatone-iron'
};

/**
 * Tests basic Firestore permissions to ensure the user can perform seeding operations
 * @param uid User ID to test permissions for
 * @returns Promise that resolves if permissions are valid, rejects with error details if not
 */
async function testFirestorePermissions(uid: string): Promise<boolean> {
  console.log('🧪 Testing Firestore permissions before seeding demo data...');
  
  try {
    // Step 1: Check if the user exists and has super_admin role
    console.log('  • Checking if user has super_admin role...');
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error(`User document not found for UID: ${uid}`);
    }
    
    const userData = userSnap.data();
    if (userData.role !== 'super_admin') {
      throw new Error(`User does not have super_admin role. Current role: ${userData.role}`);
    }
    
    console.log('    ✓ User has super_admin role');
    
    // Step 2: Create a test document to verify write permissions
    console.log('  • Testing write permissions with test document...');
    const testRef = await addDoc(collection(db, 'test_permissions'), {
      message: 'Permission test for demo seeding',
      createdBy: uid,
      createdAt: serverTimestamp(),
      isTest: true
    });
    
    console.log('    ✓ Successfully created test document');
    
    // Step 3: Delete the test document
    console.log('  • Testing delete permissions...');
    await deleteDoc(testRef);
    console.log('    ✓ Successfully deleted test document');
    
    console.log('✅ All permission tests passed! Proceeding with demo data seeding.');
    return true;
  } catch (err: any) {
    console.error('❌ Firestore permission test failed:', err);
    console.error('   code:', err.code, '| name:', err.name, '| message:', err.message);
    throw new Error(`Permission test failed: ${err.message || err}`);
  }
}

/**
 * Creates Firebase Auth accounts for demo users
 * @param users Array of user objects with email, password, and displayName
 * @returns Promise with array of created user records (uid, email, displayName)
 */
async function createDemoAuthAccounts(
  users: { email: string; password: string; displayName: string }[]
): Promise<{ uid: string; email: string; displayName: string }[]> {
  console.log('🔐 Creating Firebase Auth accounts for demo users...');

  /* --------------------------------------------------------------
   *  Use a secondary Firebase Auth instance so the main user
   *  (super_admin) stays signed-in during account creation.
   * -------------------------------------------------------------- */
  let seedApp: FirebaseApp;
  const existing = getApps().find((a) => a.name === 'seed');
  if (existing) {
    seedApp = existing;
  } else {
    seedApp = initializeApp(primaryApp.options, 'seed');
  }

  const seedAuth: Auth = getAuth(seedApp);

  /* ------------------------------------------------------------------
   *  Connect the secondary Auth instance to the local emulator.
   *  • Avoids build-time import.meta.env references (works in Node & browser)
   *  • Idempotent – won't throw if another module already connected it
   * ------------------------------------------------------------------ */
  const onLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1');

  if (onLocalhost && !(seedAuth as any)._emuConnected) {
    try {
      connectAuthEmulator(
        seedAuth,
        'http://127.0.0.1:9099',
        { disableWarnings: true }
      );
    } catch {
      /* Swallow duplicate-connection errors (race conditions, hot reloads) */
    } finally {
      // Mark so other modules skip re-connecting
      (seedAuth as any)._emuConnected = true;
    }
  }

  // Store the currently-signed-in user so we can restore the session later
  const currentUser = auth.currentUser;
  const createdUsers: { uid: string; email: string; displayName: string }[] = [];

  for (const userData of users) {
    try {
      console.log(`  • Creating auth account for ${userData.email}…`);

      // Attempt to create the account
      const cred = await createUserWithEmailAndPassword(
        seedAuth,
        userData.email,
        userData.password
      );

      createdUsers.push({
        uid: cred.user.uid,
        email: userData.email,
        displayName: userData.displayName
      });

      console.log(`    ✓ Created auth account with UID: ${cred.user.uid}`);
      await signOut(seedAuth); // Immediately sign the new user out
    } catch (error: any) {
      /* ----------------------------------------------------------------
       * Creation failed – the Auth emulator sometimes returns 400 for
       * weak-password, recaptcha, or unknown reasons.  Try sign-in next.
       * -------------------------------------------------------------- */
      console.warn(
        `    ⚠️ Create failed for ${userData.email} → attempting sign-in…`,
        error?.code || error?.message || error
      );

      try {
        const existingCred = await signInWithEmailAndPassword(
          seedAuth,
          userData.email,
          userData.password
        );
        createdUsers.push({
          uid: existingCred.user.uid,
          email: userData.email,
          displayName: userData.displayName
        });
        console.log(
          `    ✓ Using existing account with UID: ${existingCred.user.uid}`
        );
        await signOut(seedAuth);
      } catch (signInErr: any) {
        if (signInErr.code === 'auth/invalid-credential') {
          // Password mismatch: fall back to placeholder UID so seeding continues
          console.warn(
            `    ⚠️ Existing account password mismatch for ${userData.email}. Using placeholder UID.`
          );
          const placeholderUid = `EXISTING_ACCOUNT_${userData.email
            .replace(/[@.]/g, '_')
            .toUpperCase()}_${Date.now()}`;
          createdUsers.push({
            uid: placeholderUid,
            email: userData.email,
            displayName: userData.displayName
          });
          console.log(`    ✓ Placeholder UID assigned for ${userData.email}`);
        } else if (signInErr.code === 'auth/user-not-found') {
          // Neither create nor sign-in succeeded – surface concise error
          throw new Error(
            `Create and sign-in failed for ${userData.email}: ${error?.message || 'unknown error'}`
          );
        } else {
          console.error(
            `    ❌ Sign-in fallback failed for ${userData.email}:`,
            signInErr
          );
          throw new Error(
            `Account flow failed for ${userData.email}: ${signInErr?.message || 'unknown error'}`
          );
        }
      }
    }
  }

  // Restore the original session if one existed
  if (currentUser) {
    console.log('  • Restoring original user session…');
    // In most cases, Firebase automatically restores the session.
    // If not, developers can manually re-authenticate here.
  }

  console.log(`✅ Created/verified ${createdUsers.length} Firebase Auth accounts`);
  return createdUsers;
}

/**
 * Seeds the database with demo data for testing and development
 * @param currentUserUid The UID of the current user (super_admin) creating the demo data
 * @param opts Optional parameters for using existing UIDs instead of creating placeholders
 * @returns Promise with counts of created items
 */
export async function seedDemoData(
  currentUserUid: string, 
  opts?: { brandManagerUid?: string, staffUids?: string[] }
): Promise<{ counts: Record<string, number> }> {
  // ------------------------------------------------------------------
  // DEBUG: Confirm the updated demoSeed.ts file is loaded/executing
  // ------------------------------------------------------------------
  console.log('🔥 DEBUGGING: Updated demoSeed.ts file is being used!');
  try {
    // Test permissions before proceeding
    await testFirestorePermissions(currentUserUid);
    
    // ------------------------------------------------------------------
    // Create Firebase Auth accounts for demo users
    // ------------------------------------------------------------------
    console.log('🔐 Creating Firebase Auth accounts for demo users...');
    
    const authAccountsToCreate = [
      {
        email: 'bm.demo@engagenatural.com',
        password: 'password123',
        displayName: 'Alex Morgan'
      },
      {
        email: 'staff.demo@engagenatural.com',
        password: 'password123',
        displayName: 'Sam Wilson'
      }
    ];
    
    const createdAuthAccounts = await createDemoAuthAccounts(authAccountsToCreate);
    
    // Extract UIDs for use in Firestore documents
    const brandManagerAuthUid = createdAuthAccounts.find(
      (user) => user.email === 'bm.demo@engagenatural.com'
    )?.uid;
    const staffAuthUid = createdAuthAccounts.find(
      (user) => user.email === 'staff.demo@engagenatural.com'
    )?.uid;
    
    if (!brandManagerAuthUid || !staffAuthUid) {
      throw new Error('Failed to create required Firebase Auth accounts');
    }
    
    // Initialize batch
    let batch = writeBatch(db);
    let operationCount = 0;
    const results: Record<string, number> = {};
    // Will hold the brand ID so it can be reused later  
    let brandId = DEMO_BRANDS.rescue; // Default to rescue brand for legacy references
    // References for created users – must be global to this function
    const brandManagerRefs: { id: string; approved: boolean }[] = [];
    const staffRefs: { id: string; email: string }[] = [];

    // ------------------------------------------------------------------
    // Brand manager and staff data arrays - must be global to this function
    // ------------------------------------------------------------------
    const brandManagerData = [
      {
        email: 'bm.demo@engagenatural.com',
        displayName: 'Alex Morgan',
        role: 'brand_manager',
        approved: true
      },
      {
        email: 'bm.pending@demo.com',
        displayName: 'Jordan Taylor',
        role: 'brand_manager',
        approved: false
      }
    ];

    const staffData = [
      { 
        email: 'staff.demo@engagenatural.com', 
        displayName: 'Sam Wilson',
        retailerIndex: 0 // Sprouts
      },
      { 
        email: 'staff.b@demo.com', 
        displayName: 'Jamie Lee',
        retailerIndex: 0 // Sprouts
      },
      { 
        email: 'staff.c@demo.com', 
        displayName: 'Casey Brown',
        retailerIndex: 1 // Natural Grocers
      },
      { 
        email: 'staff.d@demo.com', 
        displayName: 'Riley Johnson',
        retailerIndex: 1 // Natural Grocers
      }
    ];
    
    // ------------------------------------------------------------------
    // Quick test write to see if **any** collection accepts writes.
    // If this succeeds but the real 'brands' write fails, we know the
    // problem is isolated to the 'brands' collection rules.
    // ------------------------------------------------------------------
    console.log('🧪 Testing write to different collection first...');
    try {
      const testBrandRef = doc(collection(db, 'test_brands'));
      await setDoc(testBrandRef, {
        test: true,
        createdAt: serverTimestamp(),
        uid: currentUserUid
      });
      console.log('  ✅ Successfully wrote to test_brands collection');

      // Clean up the test document
      await deleteDoc(testBrandRef);
      console.log('  ✅ Successfully deleted test document');
    } catch (testErr: any) {
      console.error('  ❌ Failed to write to test_brands:', testErr.message);
    }

    try {
      console.log('📝 Creating brand...');
      // ------------------------------------------------------------------
      // Use deterministic brand ID instead of auto-generated ID
      // ------------------------------------------------------------------
      const brandRef = doc(db, 'brands', DEMO_BRANDS.rescue);

      const brand = {
        name: "Calm Well Co",
        slug: "calm-well-co",
        ownerUid: currentUserUid,
        createdAt: serverTimestamp(),
        demoSeed: true
      };

      // Use setDoc with merge option for idempotent updates
      await setDoc(brandRef, brand, { merge: true });
      results.brands = 1;
      console.log(`  ✓ Brand created with ID: ${brandId}`);
      console.log('  ✓ Brand committed successfully (direct write)');
    } catch (err: any) {
      console.error('❌ Error creating brand:', err);
      throw new Error(`Failed to create brand: ${err.message}`);
    }
    
    // Create retailers
    const retailerRefs = [];
    try {
      console.log('📝 Creating retailers...');
      const retailers = [
        {
          chain: "Sprouts",
          name: "Sprouts – Winter Park",
          storeCode: "SP-WP",
          city: "Winter Park",
          state: "FL",
          createdAt: serverTimestamp(),
          demoSeed: true
        },
        {
          chain: "Natural Grocers",
          name: "Natural Grocers – Denver",
          storeCode: "NG-DN",
          city: "Denver",
          state: "CO",
          createdAt: serverTimestamp(),
          demoSeed: true
        }
      ];
      
      for (const retailer of retailers) {
        const retailerRef = doc(collection(db, 'retailers'));
        retailerRefs.push({ id: retailerRef.id, storeCode: retailer.storeCode });
        batch.set(retailerRef, retailer);
        operationCount++;
      }
      results.retailers = retailers.length;
      console.log(`  ✓ Created ${retailers.length} retailers`);

      // Commit batch after RETAILERS creation
      if (operationCount > 0) {
        console.log('  ⚡ Committing batch after RETAILERS creation...');
        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
        console.log('  ✓ Batch committed successfully');
      }
    } catch (err: any) {
      console.error('❌ Error creating retailers:', err);
      throw new Error(`Failed to create retailers: ${err.message}`);
    }
    
    /* ------------------------------------------------------------------
     *  Create user documents - either with provided UIDs or placeholders
     * ------------------------------------------------------------------ */
    try {
      console.log('📝 Creating user documents...');
      // Add brandId to brandManagerData objects now that we know it
      brandManagerData.forEach((bm) => Object.assign(bm, { brandId }));

      // Create brand manager document(s)
      const brandManagerUid = opts?.brandManagerUid || brandManagerAuthUid;
      const brandManagerDoc = {
        uid: brandManagerUid,
        email: brandManagerData[0].email,
        displayName: brandManagerData[0].displayName,
        role: 'brand_manager',
        approved: true,
        brandId,
        createdAt: serverTimestamp(),
        demoSeed: true
      };
      
      batch.set(doc(db, 'users', brandManagerUid), brandManagerDoc);
      brandManagerRefs.push({ id: brandManagerUid, approved: true });
      operationCount++;
      console.log(`  ✓ Created brand manager with ID: ${brandManagerUid}`);

      // Create staff documents
      const staffUids = opts?.staffUids || [];
      for (let i = 0; i < staffData.length; i++) {
        const staff = staffData[i];
        // Use provided UID if available, otherwise create placeholder
        const uid = (i === 0 && staffAuthUid) ? staffAuthUid : (staffUids[i] || `DEMO_STAFF_${i}_${Date.now()}`);
        staffRefs.push({ id: uid, email: staff.email });
        
        const retailerRef = retailerRefs[staff.retailerIndex];
        
        batch.set(doc(db, 'users', uid), {
          uid,
          email: staff.email,
          displayName: staff.displayName,
          role: 'staff',
          verified: true,
          verificationStatus: (i === 0 ? 'approved' : 'pending'),
          retailerId: retailerRef.id,
          storeCode: retailerRef.storeCode,
          createdAt: serverTimestamp(),
          demoSeed: true
        });
        operationCount++;
      }
      results.brand_managers = 1;
      results.staff = staffRefs.length;
      console.log(`  ✓ Created ${staffRefs.length} staff users`);

      // Commit batch if getting close to limit
      if (operationCount > 350) {
        console.log('  ⚡ Committing batch due to size limit...');
        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
        console.log('  ✓ Batch committed successfully');
      }

      // Commit batch after USER creation
      if (operationCount > 0) {
        console.log('  ⚡ Committing batch after USER creation...');
        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
        console.log('  ✓ Batch committed successfully');
      }
    } catch (err: any) {
      console.error('❌ Error creating user documents:', err);
      throw new Error(`Failed to create user documents: ${err.message}`);
    }
    
    // Create trainings
    try {
      console.log('📝 Creating trainings and progress...');
      const trainingRefs = [];
      const trainings = [
        {
          brandId,
          authorUid: brandManagerRefs[0].id,
          title: "Rescue Sleep: How to Recommend",
          description: "Learn how to effectively recommend Rescue Sleep products to customers with sleep concerns.",
          durationMins: 30,
          modules: ["Sleep Basics", "Product Information", "Customer Scenarios"],
          published: true,
          visibility: 'public',
          createdAt: serverTimestamp(),
          metrics: { enrolled: 0, completed: 0 },
          sections: [
            {
              id: "section1",
              title: "Understanding Sleep Issues",
              type: "text",
              content: "<h2>Common Sleep Problems</h2><p>This section covers the most common sleep issues customers face...</p>"
            },
            {
              id: "section2",
              title: "Product Features & Benefits",
              type: "text",
              content: "<h2>Key Ingredients</h2><p>Our sleep formula contains scientifically-backed ingredients...</p>"
            },
            {
              id: "section3",
              title: "Customer Interactions",
              type: "video",
              videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
            }
          ],
          demoSeed: true
        },
        {
          brandId,
          authorUid: brandManagerRefs[0].id,
          title: "Bach Flower Basics for Floor Staff",
          description: "Essential knowledge about Bach Flower remedies for retail staff.",
          durationMins: 45,
          modules: ["History of Bach Flowers", "Core Remedies", "Recommendation Guide"],
          published: true,
          visibility: 'public',
          createdAt: serverTimestamp(),
          metrics: { enrolled: 0, completed: 0 },
          sections: [
            {
              id: "section1",
              title: "Bach Flower History",
              type: "text",
              content: "<h2>Dr. Edward Bach</h2><p>Learn about the founder of Bach flower remedies...</p>"
            },
            {
              id: "section2",
              title: "38 Flower Remedies",
              type: "text",
              content: "<h2>Core Remedies</h2><p>Understanding the key flower essences and their properties...</p>"
            }
          ],
          demoSeed: true
        },
        {
          brandId,
          authorUid: brandManagerRefs[0].id,
          title: "Spatone Iron: Absorption 101",
          description: "Understand the science behind Spatone's liquid iron and its superior absorption.",
          durationMins: 20,
          modules: ["Iron Basics", "Absorption Science", "Customer FAQs"],
          published: true,
          visibility: 'public',
          createdAt: serverTimestamp(),
          metrics: { enrolled: 0, completed: 0 },
          sections: [
            {
              id: "section1",
              title: "Iron Deficiency Basics",
              type: "text",
              content: "<h2>Signs and Symptoms</h2><p>Understanding iron deficiency and its impact...</p>"
            },
            {
              id: "section2",
              title: "Absorption Science",
              type: "text",
              content: "<h2>Liquid vs. Pill Form</h2><p>Why liquid iron has superior absorption rates...</p>"
            }
          ],
          demoSeed: true
        },
        {
          brandId,
          authorUid: brandManagerRefs[0].id,
          title: "Stress & Anxiety Support Products",
          description: "Comprehensive guide to recommending products for stress and anxiety relief.",
          durationMins: 35,
          modules: ["Understanding Stress", "Product Categories", "Personalized Recommendations"],
          published: true,
          visibility: 'public',
          createdAt: serverTimestamp(),
          metrics: { enrolled: 0, completed: 0 },
          sections: [
            {
              id: "section1",
              title: "Stress Physiology",
              type: "text",
              content: "<h2>Stress Response</h2><p>The body's response to stress and anxiety...</p>"
            }
          ],
          demoSeed: true
        },
        {
          brandId,
          authorUid: brandManagerRefs[0].id,
          title: "Immune Support Essentials",
          description: "Learn about our immune support product line and seasonal recommendations.",
          durationMins: 25,
          modules: ["Immune System Basics", "Product Overview", "Seasonal Strategies"],
          published: true,
          visibility: 'public',
          createdAt: serverTimestamp(),
          metrics: { enrolled: 0, completed: 0 },
          sections: [
            {
              id: "section1",
              title: "Immune System Overview",
              type: "text",
              content: "<h2>Innate vs. Adaptive Immunity</h2><p>Understanding the immune system components...</p>"
            },
            {
              id: "section2",
              title: "Key Ingredients",
              type: "text",
              content: "<h2>Vitamin C, D, and Zinc</h2><p>The science behind key immune supporting nutrients...</p>"
            },
            {
              id: "section3",
              title: "Elderberry Benefits",
              type: "text",
              content: "<h2>Elderberry Research</h2><p>Clinical studies on elderberry for immune support...</p>"
            },
            {
              id: "section4",
              title: "Seasonal Recommendations",
              type: "text",
              content: "<h2>Winter vs Summer</h2><p>Adjusting recommendations based on seasonal needs...</p>"
            }
          ],
          demoSeed: true
        }
      ];
      
      for (const training of trainings) {
        const trainingRef = doc(collection(db, 'trainings'));
        trainingRefs.push({ id: trainingRef.id, title: training.title });
        batch.set(trainingRef, training);
        operationCount++;
      }
      results.trainings = trainings.length;
      console.log(`  ✓ Created ${trainings.length} trainings`);
      
      // Commit batch if getting close to limit
      if (operationCount > 350) {
        console.log('  ⚡ Committing batch due to size limit...');
        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
        console.log('  ✓ Batch committed successfully');
      }

      // Commit batch after TRAININGS creation
      if (operationCount > 0) {
        console.log('  ⚡ Committing batch after TRAININGS creation...');
        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
        console.log('  ✓ Batch committed successfully');
      }

      /* ------------------------------------------------------------------
       *  TEMPORARILY DISABLED – training_progress creation & metrics update
       *  Permissions require further investigation.  Once Firestore rules
       *  are finalized, remove this block comment to re-enable seeding of
       *  training progress documents & metric updates.
       * ------------------------------------------------------------------
       *
       *  NOTE:  The entire block below (from "// Create training progress"
       *  down to "console.log('  ✓ Updated training metrics');") was the
       *  original code responsible for:
       *    • Creating staff × training progress docs
       *    • Updating the metrics.enrolled / metrics.completed fields
       *  Commenting it out prevents the batch from writing to the
       *  training_progress collection while we resolve security-rule issues.
       *
       * ------------------------------------------------------------------ */
      /*
      // Create training progress
      const trainingProgressCount = {
        enrolled: 0,
        completed: 0
      };
      
      // Staff A: 2 trainings → one completed, one in_progress
      const staffAProgressCompleted = {
        id: `${staffRefs[0].id}_${trainingRefs[0].id}`,
        userId: staffRefs[0].id,
        trainingId: trainingRefs[0].id,
        status: 'completed',
        startedAt: serverTimestamp(),
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        completedSections: ['section1', 'section2', 'section3'], // Example section IDs
        timeSpentMins: 28,
        demoSeed: true
      };
      
      const staffAProgressInProgress = {
        id: `${staffRefs[0].id}_${trainingRefs[1].id}`,
        userId: staffRefs[0].id,
        trainingId: trainingRefs[1].id,
        status: 'in_progress',
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        completedSections: ['section1'], // Partially completed
        currentSection: 1,
        timeSpentMins: 15,
        demoSeed: true
      };
      
      batch.set(doc(db, 'training_progress', staffAProgressCompleted.id), staffAProgressCompleted);
      batch.set(doc(db, 'training_progress', staffAProgressInProgress.id), staffAProgressInProgress);
      trainingProgressCount.enrolled += 2;
      trainingProgressCount.completed += 1;
      operationCount += 2;
      
      // Staff B: 2 trainings → both in_progress
      const staffBProgress1 = {
        id: `${staffRefs[1].id}_${trainingRefs[2].id}`,
        userId: staffRefs[1].id,
        trainingId: trainingRefs[2].id,
        status: 'in_progress',
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        completedSections: ['section1', 'section2'],
        currentSection: 2,
        timeSpentMins: 12,
        demoSeed: true
      };
      
      const staffBProgress2 = {
        id: `${staffRefs[1].id}_${trainingRefs[3].id}`,
        userId: staffRefs[1].id,
        trainingId: trainingRefs[3].id,
        status: 'in_progress',
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        completedSections: [],
        currentSection: 0,
        timeSpentMins: 5,
        demoSeed: true
      };
      
      batch.set(doc(db, 'training_progress', staffBProgress1.id), staffBProgress1);
      batch.set(doc(db, 'training_progress', staffBProgress2.id), staffBProgress2);
      trainingProgressCount.enrolled += 2;
      operationCount += 2;
      
      // Staff C: 1 training → completed
      const staffCProgress = {
        id: `${staffRefs[2].id}_${trainingRefs[4].id}`,
        userId: staffRefs[2].id,
        trainingId: trainingRefs[4].id,
        status: 'completed',
        startedAt: serverTimestamp(),
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        completedSections: ['section1', 'section2', 'section3', 'section4'],
        timeSpentMins: 23,
        demoSeed: true
      };
      
      batch.set(doc(db, 'training_progress', staffCProgress.id), staffCProgress);
      trainingProgressCount.enrolled += 1;
      trainingProgressCount.completed += 1;
      operationCount += 1;
      
      results.training_progress = trainingProgressCount.enrolled;
      console.log(`  ✓ Created ${trainingProgressCount.enrolled} training progress records (${trainingProgressCount.completed} completed)`);
      
      // Commit batch if getting close to limit
      if (operationCount > 350) {
        console.log('  ⚡ Committing batch due to size limit...');
        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
        console.log('  ✓ Batch committed successfully');
      }
      
      // Update training metrics based on actual progress data
      const trainingEnrollments = {
        [trainingRefs[0].id]: 1, // Staff A completed
        [trainingRefs[1].id]: 1, // Staff A in progress
        [trainingRefs[2].id]: 1, // Staff B in progress
        [trainingRefs[3].id]: 1, // Staff B in progress
        [trainingRefs[4].id]: 1  // Staff C completed
      };
      
      const trainingCompletions = {
        [trainingRefs[0].id]: 1, // Staff A completed
        [trainingRefs[1].id]: 0, // Staff A in progress
        [trainingRefs[2].id]: 0, // Staff B in progress
        [trainingRefs[3].id]: 0, // Staff B in progress
        [trainingRefs[4].id]: 1  // Staff C completed
      };
      
      for (let i = 0; i < trainingRefs.length; i++) {
        const trainingRef = doc(db, 'trainings', trainingRefs[i].id);
        const enrolled = trainingEnrollments[trainingRefs[i].id] || 0;
        const completed = trainingCompletions[trainingRefs[i].id] || 0;
        
        batch.update(trainingRef, {
          'metrics.enrolled': enrolled,
          'metrics.completed': completed
        });
        operationCount++;
      }
      console.log('  ✓ Updated training metrics');
      */
    } catch (err: any) {
      console.error('❌ Error creating trainings and progress:', err);
      throw new Error(`Failed to create trainings and progress: ${err.message}`);
    }
    
    // Create sample programs and requests
    try {
      console.log('📝 Creating sample programs and requests...');
      // Create sample programs
      const sampleProgramRefs = [];
      const samplePrograms = [
        {
          brandId,
          name: "Spring Wellness Sampler",
          productName: "Calm Well Essentials Pack",
          unitsAvailable: 100,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          createdBy: brandManagerRefs[0].id,
          createdAt: serverTimestamp(),
          demoSeed: true
        },
        {
          brandId,
          name: "Staff Education Program",
          productName: "Sleep Support Kit",
          unitsAvailable: 50,
          startDate: new Date(),
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
          createdBy: brandManagerRefs[0].id,
          createdAt: serverTimestamp(),
          demoSeed: true
        }
      ];
      
      for (const program of samplePrograms) {
        const programRef = doc(collection(db, 'sample_programs'));
        sampleProgramRefs.push({ id: programRef.id, name: program.name });
        batch.set(programRef, program);
        operationCount++;
      }
      results.sample_programs = samplePrograms.length;
      console.log(`  ✓ Created ${samplePrograms.length} sample programs`);
      
      // Create sample requests using staff user IDs
      const sampleRequests = [
        {
          programId: sampleProgramRefs[0].id,
          brandId,
          userId: staffRefs[0].id, // Staff A
          retailerId: retailerRefs[0].id,
          quantity: 5,
          status: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          demoSeed: true
        },
        {
          programId: sampleProgramRefs[0].id,
          brandId,
          userId: staffRefs[1].id, // Staff B
          retailerId: retailerRefs[0].id,
          quantity: 3,
          status: 'approved',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          demoSeed: true
        },
        {
          programId: sampleProgramRefs[1].id,
          brandId,
          userId: staffRefs[2].id, // Staff C
          retailerId: retailerRefs[1].id,
          quantity: 10,
          status: 'shipped',
          notes: "Please deliver to store manager",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          demoSeed: true
        },
        {
          programId: sampleProgramRefs[1].id,
          brandId,
          userId: staffRefs[3].id, // Staff D
          retailerId: retailerRefs[1].id,
          quantity: 2,
          status: 'denied',
          notes: "Exceeds store allocation",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          demoSeed: true
        },
        {
          programId: sampleProgramRefs[0].id,
          brandId,
          userId: staffRefs[0].id, // Staff A (second request)
          retailerId: retailerRefs[0].id,
          quantity: 15,
          status: 'shipped',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          demoSeed: true
        },
        {
          programId: sampleProgramRefs[1].id,
          brandId,
          userId: staffRefs[1].id, // Staff B (second request)
          retailerId: retailerRefs[0].id,
          quantity: 8,
          status: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          demoSeed: true
        }
      ];
      
      for (const request of sampleRequests) {
        const requestRef = doc(collection(db, 'sample_requests'));
        batch.set(requestRef, request);
        operationCount++;
      }
      results.sample_requests = sampleRequests.length;
      console.log(`  ✓ Created ${sampleRequests.length} sample requests`);
      
      // Commit batch if getting close to limit
      if (operationCount > 350) {
        console.log('  ⚡ Committing batch due to size limit...');
        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
        console.log('  ✓ Batch committed successfully');
      }
    } catch (err: any) {
      console.error('❌ Error creating sample programs and requests:', err);
      throw new Error(`Failed to create sample programs and requests: ${err.message}`);
    }
    
    // Create announcements and communities
    try {
      console.log('📝 Creating announcements and communities...');
      // Create announcements
      const announcements = [
        {
          brandId,
          title: "New Product Training Available",
          message: "We've just released a new training module for our Sleep Support line. Complete it by the end of the month for special recognition!",
          audience: ['staff'],
          retailerIds: [retailerRefs[0].id], // Store-specific announcement
          createdBy: brandManagerRefs[0].id,
          createdAt: serverTimestamp(),
          demoSeed: true
        },
        {
          brandId,
          title: "Upcoming Seasonal Promotion",
          message: "Get ready for our spring wellness campaign! New promotional materials will be arriving next week. Please set up displays according to the planogram.",
          audience: ['staff'],
          // No retailerIds means this is for all retailers
          createdBy: brandManagerRefs[0].id,
          createdAt: serverTimestamp(),
          demoSeed: true
        }
      ];
      
      for (const announcement of announcements) {
        const announcementRef = doc(collection(db, 'announcements'));
        batch.set(announcementRef, announcement);
        operationCount++;
      }
      results.announcements = announcements.length;
      console.log(`  ✓ Created ${announcements.length} announcements`);
      
      // Create communities
      const communityRefs = [];
      const communities = [
        {
          id: 'whats-good',
          createdByRole: 'super_admin',
          createdBy: currentUserUid,
          name: "What's Good",
          description: "Check out What's Good for the latest product drops and industry buzz!",
          members: 2500,
          isPublic: true,
          requiresVerification: false,
          hasEasterEggs: true,
          badge: "🌟 Open to All",
          createdAt: serverTimestamp(),
          demoSeed: true
        },
        {
          id: 'supplement-scoop',
          createdByRole: 'super_admin',
          createdBy: currentUserUid,
          name: 'Supplement Scoop',
          description: "Stop guessing what supplements actually work and start getting insider intel from the pros who sell $10M+ in products every year.",
          members: 850,
          isPublic: false,
          requiresVerification: true,
          hasEasterEggs: false,
          badge: "🔒 Verification Required",
          createdAt: serverTimestamp(),
          demoSeed: true
        }
      ];
      
      for (const community of communities) {
        const communityRef = doc(collection(db, 'communities'), community.id);
        communityRefs.push({ id: communityRef.id, name: community.name });
        // Ensure each community includes brandId
        batch.set(communityRef, { ...community, brandId });
        operationCount++;
      }
      results.communities = communities.length;
      console.log(`  ✓ Created ${communities.length} communities`);
      
      /* ------------------------------------------------------------------
       * TEMPORARILY DISABLED – community collections have permissions issues
       * Enable once Firestore rules are finalized for:
       *   • community_posts
       *   • community_comments
       *   • community_likes
       * ------------------------------------------------------------------ */
      /*
      // Create community posts
      const communityPosts = [
        {
          communityId: 'whats-good',
          authorId: staffRefs[0].id,
          authorName: staffData[0].displayName,
          title: "Just tried the new Calm Well Sleep Formula",
          content: "Has anyone else tried the new sleep formula? My customers are loving it and I'm seeing repeat purchases already!",
          likes: 24,
          comments: 8,
          createdAt: serverTimestamp(),
          demoSeed: true
        },
        {
          communityId: 'whats-good',
          authorId: staffRefs[1].id,
          authorName: staffData[1].displayName,
          title: "Upcoming Wellness Workshop Ideas",
          content: "Our store is planning a series of wellness workshops for the fall. What topics have you found most engaging for customers?",
          likes: 15,
          comments: 12,
          createdAt: serverTimestamp(),
          demoSeed: true
        },
        {
          communityId: 'supplement-scoop',
          authorId: staffRefs[2].id,
          authorName: staffData[2].displayName,
          title: "Iron Supplement Comparison Chart",
          content: "I've created a comparison chart of the top-selling iron supplements in our store, including absorption rates and customer feedback. Let me know if you'd like me to share it!",
          likes: 32,
          comments: 17,
          createdAt: serverTimestamp(),
          demoSeed: true
        }
      ];
      
      const postRefs = [];
      for (const post of communityPosts) {
        const postRef = doc(collection(db, 'community_posts'));
        postRefs.push({ id: postRef.id, title: post.title });
        batch.set(postRef, post);
        operationCount++;
      }
      results.community_posts = communityPosts.length;
      console.log(`  ✓ Created ${communityPosts.length} community posts`);
      
      // Create community comments
      const communityComments = [
        {
          postId: postRefs[0].id,
          authorId: staffRefs[2].id,
          authorName: staffData[2].displayName,
          content: "Yes! We've had great feedback too. Customers especially like that it doesn't leave them groggy in the morning.",
          likes: 8,
          createdAt: serverTimestamp(),
          demoSeed: true
        },
        {
          postId: postRefs[0].id,
          authorId: staffRefs[3].id,
          authorName: staffData[3].displayName,
          content: "What dosage are you recommending for first-time users? We've been starting with half dose for sensitive customers.",
          likes: 5,
          createdAt: serverTimestamp(),
          demoSeed: true
        },
        {
          postId: postRefs[1].id,
          authorId: staffRefs[0].id,
          authorName: staffData[0].displayName,
          content: "Stress management workshops have been very popular at our location. We also did a 'Supplements 101' session that filled up quickly!",
          likes: 12,
          createdAt: serverTimestamp(),
          demoSeed: true
        },
        {
          postId: postRefs[2].id,
          authorId: staffRefs[1].id,
          authorName: staffData[1].displayName,
          content: "I'd love to see this! We're always looking for better ways to explain absorption differences to customers.",
          likes: 9,
          createdAt: serverTimestamp(),
          demoSeed: true
        }
      ];
      
      for (const comment of communityComments) {
        const commentRef = doc(collection(db, 'community_comments'));
        batch.set(commentRef, comment);
        operationCount++;
      }
      results.community_comments = communityComments.length;
      console.log(`  ✓ Created ${communityComments.length} community comments`);
      
      // Create community likes
      const communityLikes = [
        {
          postId: postRefs[0].id,
          userId: staffRefs[1].id,
          createdAt: serverTimestamp(),
          demoSeed: true
        },
        {
          postId: postRefs[0].id,
          userId: staffRefs[2].id,
          createdAt: serverTimestamp(),
          demoSeed: true
        },
        {
          postId: postRefs[1].id,
          userId: staffRefs[0].id,
          createdAt: serverTimestamp(),
          demoSeed: true
        },
        {
          postId: postRefs[2].id,
          userId: staffRefs[3].id,
          createdAt: serverTimestamp(),
          demoSeed: true
        }
      ];
      
      for (const like of communityLikes) {
        const likeRef = doc(collection(db, 'community_likes'));
        batch.set(likeRef, like);
        operationCount++;
      }
      results.community_likes = communityLikes.length;
      console.log(`  ✓ Created ${communityLikes.length} community likes`);
      */
    } catch (err: any) {
      console.error('❌ Error creating announcements and communities:', err);
      throw new Error(`Failed to create announcements and communities: ${err.message}`);
    }
    
    // Final commit
    try {
      console.log('📝 Committing final batch...');
      await batch.commit();
      console.log('✅ All demo data created successfully!');
    } catch (err: any) {
      console.error('❌ Error committing final batch:', err);
      throw new Error(`Failed to commit final batch: ${err.message}`);
    }
    
    // Return counts
    return { counts: results };
  } catch (error: any) {
    console.error("❌ Error seeding demo data:", error);
    // Provide detailed error information
    const errorDetails = {
      message: error.message || 'Unknown error',
      code: error.code || 'unknown',
      stack: error.stack || 'No stack trace available'
    };
    console.error("Error details:", errorDetails);
    throw error; // Throw errors upward with enhanced details
  }
}

/**
 * Resets (deletes) all demo data from the database
 * @returns Promise that resolves when complete
 */
export async function resetDemoData(): Promise<void> {
  console.log('🗑️ Starting demo data reset...');
  
  try {
    // First test if we have delete permissions
    console.log('  • Testing delete permissions...');
    const testRef = await addDoc(collection(db, 'test_permissions'), {
      message: 'Reset permission test',
      createdAt: serverTimestamp(),
      isTest: true
    });
    
    await deleteDoc(testRef);
    console.log('    ✓ Delete permissions verified');
    
    const collections = [
      'brands',
      'retailers',
      'users',
      'trainings',
      // 'training_progress', // TEMPORARILY DISABLED - permissions issue
      'sample_programs',
      'sample_requests',
      'announcements',
      'communities',
      // 'community_posts',    // TEMPORARILY DISABLED - permissions issue
      // 'community_comments', // TEMPORARILY DISABLED - permissions issue
      // 'community_likes'     // TEMPORARILY DISABLED - permissions issue
    ];
    
    for (const collectionName of collections) {
      try {
        console.log(`  • Deleting demo documents from ${collectionName}...`);
        await deleteCollectionDocs(collectionName);
      } catch (err: any) {
        console.error(`❌ Error deleting from ${collectionName}:`, err);
        throw new Error(`Failed to delete from ${collectionName}: ${err.message}`);
      }
    }
    
    console.log('✅ All demo data reset successfully!');
  } catch (error: any) {
    console.error("❌ Error resetting demo data:", error);
    const errorDetails = {
      message: error.message || 'Unknown error',
      code: error.code || 'unknown',
      stack: error.stack || 'No stack trace available'
    };
    console.error("Error details:", errorDetails);
    throw error; // Throw errors upward with enhanced details
  }
}

/**
 * Helper function to delete all demo documents in a collection
 * @param collectionName Name of the collection to delete documents from
 */
async function deleteCollectionDocs(collectionName: string): Promise<void> {
  const collectionRef = collection(db, collectionName);
  const demoQuery = query(collectionRef, where("demoSeed", "==", true));
  
  try {
    const snapshot = await getDocs(demoQuery);
    
    if (snapshot.empty) {
      console.log(`    ✓ No demo documents found in ${collectionName}`);
      return;
    }
    
    console.log(`    • Found ${snapshot.size} demo documents to delete in ${collectionName}`);
    
    const batchSize = 400;
    const batches = [];
    let batch = writeBatch(db);
    let operationCount = 0;
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      operationCount++;
      
      if (operationCount >= batchSize) {
        batches.push(batch.commit());
        batch = writeBatch(db);
        operationCount = 0;
      }
    });
    
    if (operationCount > 0) {
      batches.push(batch.commit());
    }
    
    await Promise.all(batches);
    console.log(`    ✓ Deleted ${snapshot.size} demo documents from ${collectionName}`);
  } catch (err: any) {
    console.error(`❌ Error querying or deleting from ${collectionName}:`, err);
    throw err;
  }
}
