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
 * Create or verify Firebase Auth accounts for demo users using a secondary "seed" Auth instance.
 *
 * Attempts to create each account with the secondary Auth instance (so the primary/super_admin session is preserved).
 * If creation fails, it attempts to sign in with the provided credentials. On password mismatch it assigns a
 * deterministic placeholder UID so the overall seed flow can continue. When running on localhost the secondary
 * Auth instance will be connected to the local emulator if available. The function returns a list of created or
 * resolved user records and does not change the primary application's signed-in session.
 *
 * @param users - Array of user objects each containing `email`, `password`, and `displayName`.
 * @returns Promise that resolves to an array of user records `{ uid, email, displayName }` for created or verified accounts.
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
 * Seed Firestore with comprehensive demo data used for local testing and development.
 *
 * This creates deterministic demo entities (brand, retailers, users, trainings, sample programs/requests,
 * announcements, and communities) and writes them in idempotent/batched operations. The function verifies
 * Firestore write/delete permissions before seeding and uses deterministic IDs for key demo resources.
 *
 * @param currentUserUid - UID of the super_admin performing the seed; used as owners/creators on seeded docs.
 * @param opts - Optional overrides to reuse existing UIDs instead of generating placeholders:
 *   - brandManagerUid: reuse this UID for the brand manager user document
 *   - staffUids: array of UIDs to assign to staff users (matched by index)
 * @returns An object with a `counts` record summarizing how many items of each type were created.
 * @throws If Firestore (`db`) is not initialized, if permission checks fail, or if any critical write/commit operation fails.
 */
export async function seedDemoData(
  currentUserUid: string, 
  opts?: { brandManagerUid?: string, staffUids?: string[] }
): Promise<{ counts: Record<string, number> }> {
  // ------------------------------------------------------------------
  // DEBUG: Confirm the updated demoSeed.ts file is loaded/executing
  // ------------------------------------------------------------------
  console.log('🔥 DEBUGGING: Comprehensive updated demoSeed.ts file is being used!');
  
  // Explicit guard for undefined Firestore db - ADDED FIX
  if (!db) {
    const errorMsg = '❌ CRITICAL ERROR: Firestore database instance is undefined or null. Cannot proceed with seeding. Please check your Firebase configuration and ensure db is properly initialized.';
    console.error(errorMsg);
    throw new Error('Firestore database not initialized - check Firebase configuration');
  }
  
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
      // Fix: Use proper brand name and slug matching the deterministic ID
      // ------------------------------------------------------------------
      const brandRef = doc(db, 'brands', DEMO_BRANDS.rescue);

      const brand = {
        name: "Rescue Remedy",        // Fixed: was "Calm Well Co"
        slug: "rescue-remedy",        // Fixed: was "calm-well-co"
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
    
    // Create comprehensive trainings
    try {
      console.log('📝 Creating comprehensive trainings...');
      const trainingRefs = [];
      const trainings = [
        {
          brandId,
          authorUid: brandManagerRefs[0].id,
          title: "Rescue Sleep: How to Recommend",
          description: "Learn how to effectively recommend Rescue Sleep products to customers with sleep concerns. This comprehensive training covers the science behind natural sleep support and practical customer interaction strategies.",
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
              content: "<h2>Common Sleep Problems</h2><p>This section covers the most common sleep issues customers face, from difficulty falling asleep to staying asleep throughout the night. Understanding these challenges helps you recommend appropriate solutions.</p><h3>Types of Sleep Issues</h3><ul><li>Difficulty falling asleep (sleep onset insomnia)</li><li>Frequent nighttime awakenings</li><li>Early morning awakening</li><li>Non-restorative sleep</li></ul><p>Each type may require different approaches and product recommendations.</p>"
            },
            {
              id: "section2",
              title: "Product Features & Benefits",
              type: "text",
              content: "<h2>Key Ingredients</h2><p>Our sleep formula contains scientifically-backed ingredients that work synergistically to promote natural sleep.</p><h3>Active Ingredients:</h3><ul><li><strong>Valerian Root Extract:</strong> Traditional sleep aid that helps reduce the time it takes to fall asleep</li><li><strong>Passionflower:</strong> Calms the nervous system and reduces anxiety</li><li><strong>Lemon Balm:</strong> Promotes relaxation and improves sleep quality</li><li><strong>Chamomile:</strong> Gentle sedative properties for peaceful sleep</li></ul><p>These ingredients are carefully selected for their synergistic effects and safety profile.</p>"
            },
            {
              id: "section3",
              title: "Customer Interaction Scenarios",
              type: "video",
              content: "<h2>Practical Customer Scenarios</h2><p>This video module demonstrates real customer interactions and how to handle common questions about sleep products.</p>",
              videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
            },
            {
              id: "section4",
              title: "Dosage and Safety Guidelines",
              type: "text",
              content: "<h2>Proper Dosage Recommendations</h2><p>Understanding correct dosage is crucial for customer satisfaction and safety.</p><h3>Standard Dosing:</h3><ul><li>Adults: 2-3 drops under tongue 30 minutes before bedtime</li><li>Sensitive individuals: Start with 1 drop</li><li>Maximum: 4 drops per night</li></ul><h3>Safety Considerations:</h3><ul><li>Not recommended during pregnancy or nursing</li><li>May interact with sedative medications</li><li>Advise customers to consult healthcare providers if on medications</li></ul>"
            }
          ],
          demoSeed: true
        },
        {
          brandId,
          authorUid: brandManagerRefs[0].id,
          title: "Bach Flower Basics for Floor Staff",
          description: "Essential knowledge about Bach Flower remedies for retail staff. Learn the history, philosophy, and practical application of these time-tested natural remedies.",
          durationMins: 45,
          modules: ["History of Bach Flowers", "Core Remedies", "Recommendation Guide"],
          published: true,
          visibility: 'public',
          createdAt: serverTimestamp(),
          metrics: { enrolled: 0, completed: 0 },
          sections: [
            {
              id: "section1",
              title: "Bach Flower History & Philosophy",
              type: "text",
              content: "<h2>Dr. Edward Bach's Legacy</h2><p>Learn about the founder of Bach flower remedies and his revolutionary approach to natural healing through emotional balance.</p><h3>Dr. Bach's Discovery</h3><p>In the 1930s, Dr. Edward Bach, a prominent physician and homeopath, discovered that emotional states directly impact physical health. He identified 38 flower essences that address specific emotional imbalances.</p><h3>Core Philosophy</h3><ul><li>Treat the person, not just the symptoms</li><li>Address emotional root causes</li><li>Gentle, natural healing without side effects</li><li>Self-healing through emotional balance</li></ul><p>This holistic approach revolutionized natural healthcare and remains relevant today.</p>"
            },
            {
              id: "section2",
              title: "The 38 Flower Remedies",
              type: "text",
              content: "<h2>Understanding the Core Remedies</h2><p>The 38 Bach flower remedies are organized into seven emotional groups, each addressing specific psychological states.</p><h3>The Seven Groups:</h3><ol><li><strong>Fear:</strong> Rock Rose, Mimulus, Cherry Plum, Aspen, Red Chestnut</li><li><strong>Uncertainty:</strong> Cerato, Scleranthus, Gentian, Gorse, Hornbeam, Wild Oat</li><li><strong>Insufficient Interest:</strong> Clematis, Honeysuckle, Wild Rose, Olive, White Chestnut, Mustard, Chestnut Bud</li><li><strong>Loneliness:</strong> Water Violet, Impatiens, Heather</li><li><strong>Over-sensitivity:</strong> Agrimony, Centaury, Walnut, Holly</li><li><strong>Despondency:</strong> Larch, Pine, Elm, Sweet Chestnut, Star of Bethlehem, Willow, Oak, Crab Apple</li><li><strong>Over-care:</strong> Chicory, Vervain, Vine, Beech, Rock Water</li></ol><p>Understanding these groups helps in making appropriate recommendations.</p>"
            },
            {
              id: "section3",
              title: "Practical Recommendation Guide",
              type: "text",
              content: "<h2>How to Recommend Bach Flowers</h2><p>Practical guidance for helping customers select the most appropriate remedies for their emotional needs.</p><h3>Assessment Questions:</h3><ul><li>What emotional challenges are you facing?</li><li>How long have you been experiencing this?</li><li>What triggers these feelings?</li><li>How do you typically cope with stress?</li></ul><h3>Common Combinations:</h3><ul><li><strong>Stress & Anxiety:</strong> Rock Rose + Impatiens + Clematis</li><li><strong>Work Pressure:</strong> Elm + Olive + Oak</li><li><strong>Sleep Issues:</strong> White Chestnut + Rock Rose</li><li><strong>Decision Making:</strong> Scleranthus + Cerato</li></ul><h3>Usage Instructions:</h3><p>4 drops, 4 times daily under the tongue or in water. Can be used individually or in combinations up to 7 remedies.</p>"
            }
          ],
          demoSeed: true
        },
        {
          brandId,
          authorUid: brandManagerRefs[0].id,
          title: "Spatone Iron: Absorption Science",
          description: "Understand the science behind Spatone's liquid iron and its superior absorption compared to traditional iron supplements.",
          durationMins: 25,
          modules: ["Iron Deficiency Basics", "Absorption Science", "Customer Education"],
          published: true,
          visibility: 'public',
          createdAt: serverTimestamp(),
          metrics: { enrolled: 0, completed: 0 },
          sections: [
            {
              id: "section1",
              title: "Iron Deficiency: Recognition and Impact",
              type: "text",
              content: "<h2>Understanding Iron Deficiency</h2><p>Iron deficiency is one of the most common nutritional deficiencies worldwide, particularly affecting women, vegetarians, and athletes.</p><h3>Signs and Symptoms:</h3><ul><li>Fatigue and weakness</li><li>Pale skin, nails, or inner eyelids</li><li>Shortness of breath</li><li>Cold hands and feet</li><li>Brittle or spoon-shaped nails</li><li>Cravings for ice or starch</li><li>Restless leg syndrome</li></ul><h3>Who's at Risk:</h3><ul><li>Menstruating women (especially heavy periods)</li><li>Pregnant and breastfeeding women</li><li>Vegetarians and vegans</li><li>Endurance athletes</li><li>People with digestive disorders</li><li>Frequent blood donors</li></ul><p>Understanding these risk factors helps identify customers who may benefit from iron supplementation.</p>"
            },
            {
              id: "section2",
              title: "Superior Absorption Science",
              type: "text",
              content: "<h2>Why Liquid Iron Works Better</h2><p>Spatone's unique liquid iron format offers significant advantages over traditional iron tablets and capsules.</p><h3>Absorption Advantages:</h3><ul><li><strong>Natural Iron Form:</strong> Spatone contains iron in its natural sulfate form, which is readily absorbed</li><li><strong>Low Iron Content:</strong> 5mg per sachet - gentle on the stomach while being highly bioavailable</li><li><strong>No Additives:</strong> Pure iron-rich water without synthetic additives that can interfere with absorption</li><li><strong>Optimal pH:</strong> Natural acidity enhances iron absorption in the digestive tract</li></ul><h3>Comparison to Tablets:</h3><table><tr><th>Factor</th><th>Spatone Liquid</th><th>Iron Tablets</th></tr><tr><td>Absorption Rate</td><td>Up to 40%</td><td>5-20%</td></tr><tr><td>Stomach Irritation</td><td>Minimal</td><td>Common</td></tr><tr><td>Constipation</td><td>Rare</td><td>Frequent</td></tr><tr><td>Metallic Taste</td><td>Mild</td><td>Strong</td></tr></table><p>This superior absorption means customers need less iron to achieve better results.</p>"
            },
            {
              id: "section3",
              title: "Customer Education & FAQs",
              type: "text",
              content: "<h2>Common Customer Questions</h2><p>Prepare for the most frequently asked questions about iron supplementation and Spatone specifically.</p><h3>Frequently Asked Questions:</h3><h4>Q: Why is Spatone better than my current iron supplement?</h4><p>A: Spatone offers superior absorption with fewer side effects. Many customers experience less stomach upset and constipation compared to traditional iron tablets.</p><h4>Q: How quickly will I see results?</h4><p>A: Most customers notice increased energy within 2-4 weeks of consistent use. Full iron stores may take 2-3 months to replenish.</p><h4>Q: Can I take it with other supplements?</h4><p>A: Yes, but avoid taking with calcium, zinc, or coffee as these can reduce absorption. Take with vitamin C (orange juice) to enhance absorption.</p><h4>Q: Is it safe during pregnancy?</h4><p>A: Spatone is safe for pregnancy and breastfeeding. Many healthcare providers recommend it specifically because of its gentle nature.</p><h4>Q: What if I forget a dose?</h4><p>A: Simply take it when you remember, but don't double up. Consistency is more important than perfection.</p><h3>Usage Tips for Customers:</h3><ul><li>Take on an empty stomach for best absorption</li><li>Mix with orange juice to enhance absorption and improve taste</li><li>Take away from coffee, tea, and dairy products</li><li>Be consistent with daily use</li><li>Monitor energy levels and consider retesting iron levels after 3 months</li></ul>"
            }
          ],
          demoSeed: true
        },
        {
          brandId,
          authorUid: brandManagerRefs[0].id,
          title: "Stress & Anxiety Support Products",
          description: "Comprehensive guide to recommending products for stress and anxiety relief, including natural alternatives and lifestyle recommendations.",
          durationMins: 35,
          modules: ["Understanding Stress", "Product Categories", "Holistic Approaches"],
          published: true,
          visibility: 'public',
          createdAt: serverTimestamp(),
          metrics: { enrolled: 0, completed: 0 },
          sections: [
            {
              id: "section1",
              title: "Stress Physiology & Modern Triggers",
              type: "text",
              content: "<h2>The Science of Stress Response</h2><p>Understanding how stress affects the body helps you recommend appropriate natural solutions to customers.</p><h3>The Stress Response System:</h3><ul><li><strong>Acute Stress:</strong> Fight-or-flight response - short-term, adaptive</li><li><strong>Chronic Stress:</strong> Long-term activation leading to health problems</li><li><strong>Hormonal Impact:</strong> Cortisol, adrenaline, and other stress hormones</li><li><strong>Physical Symptoms:</strong> Tension, digestive issues, sleep problems</li></ul><h3>Modern Stress Triggers:</h3><ul><li>Work pressure and deadlines</li><li>Financial concerns</li><li>Relationship challenges</li><li>Health issues</li><li>Information overload</li><li>Social media and constant connectivity</li></ul><h3>Signs Customers May Mention:</h3><ul><li>Feeling overwhelmed or anxious</li><li>Difficulty concentrating</li><li>Muscle tension or headaches</li><li>Sleep disturbances</li><li>Digestive upset</li><li>Irritability or mood swings</li><li>Fatigue despite adequate sleep</li></ul><p>Recognizing these patterns helps you suggest targeted natural solutions.</p>"
            },
            {
              id: "section2",
              title: "Natural Stress Relief Categories",
              type: "text",
              content: "<h2>Categories of Stress Support Products</h2><p>Different types of stress and anxiety benefit from different natural approaches and products.</p><h3>Adaptogenic Herbs:</h3><ul><li><strong>Ashwagandha:</strong> Reduces cortisol levels, improves stress resilience</li><li><strong>Rhodiola:</strong> Enhances energy and mental clarity under stress</li><li><strong>Holy Basil:</strong> Balances stress hormones, promotes calm alertness</li><li><strong>Schisandra:</strong> Supports adrenal function and mental endurance</li></ul><h3>Calming Nervines:</h3><ul><li><strong>Passionflower:</strong> Reduces anxiety without drowsiness</li><li><strong>Lemon Balm:</strong> Calms nervous tension and improves mood</li><li><strong>Chamomile:</strong> Gentle relaxation for mild anxiety</li><li><strong>Lavender:</strong> Promotes relaxation and better sleep</li></ul><h3>Amino Acids & Nutrients:</h3><ul><li><strong>L-Theanine:</strong> Promotes calm alertness without sedation</li><li><strong>GABA:</strong> Naturally calming neurotransmitter</li><li><strong>Magnesium:</strong> Muscle relaxation and nervous system support</li><li><strong>B-Complex:</strong> Supports healthy stress response and energy</li></ul><h3>Bach Flower Remedies for Stress:</h3><ul><li><strong>Rescue Remedy:</strong> Emergency stress relief blend</li><li><strong>Impatiens:</strong> For irritability and impatience</li><li><strong>Rock Rose:</strong> For panic and terror</li><li><strong>White Chestnut:</strong> For repetitive worried thoughts</li></ul>"
            },
            {
              id: "section3",
              title: "Holistic Stress Management Approach",
              type: "text",
              content: "<h2>Beyond Supplements: Complete Stress Support</h2><p>While natural products provide valuable support, customers benefit most from a holistic approach to stress management.</p><h3>Lifestyle Recommendations:</h3><h4>Sleep Hygiene:</h4><ul><li>Consistent bedtime routine</li><li>Limit screens before bed</li><li>Create a calming bedroom environment</li><li>Consider sleep-supporting supplements</li></ul><h4>Nutrition for Stress:</h4><ul><li>Regular, balanced meals to stabilize blood sugar</li><li>Limit caffeine, especially in the afternoon</li><li>Increase omega-3 rich foods</li><li>Consider probiotic foods for gut-brain connection</li></ul><h4>Movement & Exercise:</h4><ul><li>Regular physical activity reduces stress hormones</li><li>Yoga or tai chi for mind-body connection</li><li>Nature walks for natural stress relief</li><li>Even 10 minutes of movement helps</li></ul><h4>Mindfulness Practices:</h4><ul><li>Meditation apps for beginners</li><li>Deep breathing exercises</li><li>Journaling for emotional processing</li><li>Gratitude practices to shift perspective</li></ul><h3>When to Recommend Professional Help:</h3><ul><li>Symptoms interfere with daily functioning</li><li>Persistent anxiety or panic attacks</li><li>Depression or mood changes</li><li>Substance use as coping mechanism</li><li>Customer expresses thoughts of self-harm</li></ul><p>Remember: Natural products support overall wellness but don't replace professional mental health care when needed.</p><h3>Creating Personalized Recommendations:</h3><p>Ask customers about:</p><ul><li>Primary stress triggers</li><li>Time of day symptoms are worst</li><li>Current coping strategies</li><li>Sleep quality and energy levels</li><li>Any current medications or supplements</li></ul><p>This information helps you suggest the most appropriate combination of products and lifestyle strategies.</p>"
            }
          ],
          demoSeed: true
        },
        {
          brandId,
          authorUid: brandManagerRefs[0].id,
          title: "Immune Support Essentials",
          description: "Learn about immune system basics and seasonal support strategies to help customers maintain optimal health year-round.",
          durationMins: 30,
          modules: ["Immune System Basics", "Key Nutrients", "Seasonal Strategies"],
          published: true,
          visibility: 'public',
          createdAt: serverTimestamp(),
          metrics: { enrolled: 0, completed: 0 },
          sections: [
            {
              id: "section1",
              title: "Immune System Overview",
              type: "text",
              content: "<h2>Understanding Immune Function</h2><p>The immune system is our body's defense network against pathogens, toxins, and other harmful substances.</p><h3>Two Types of Immunity:</h3><h4>Innate Immunity (First Line of Defense):</h4><ul><li>Physical barriers: skin, mucous membranes</li><li>Chemical barriers: stomach acid, enzymes</li><li>Cellular defenses: white blood cells, macrophages</li><li>Responds quickly but non-specifically</li></ul><h4>Adaptive Immunity (Learned Defense):</h4><ul><li>B cells: produce antibodies</li><li>T cells: cell-mediated immunity</li><li>Memory cells: remember past threats</li><li>Highly specific but slower to respond</li></ul><h3>Factors That Weaken Immunity:</h3><ul><li>Chronic stress and lack of sleep</li><li>Poor nutrition and dehydration</li><li>Sedentary lifestyle</li><li>Excessive alcohol consumption</li><li>Smoking and environmental toxins</li><li>Age-related immune decline</li><li>Certain medications</li></ul><h3>Signs of Compromised Immunity:</h3><ul><li>Frequent colds or infections</li><li>Slow wound healing</li><li>Persistent fatigue</li><li>Recurring digestive issues</li><li>Seasonal allergies</li></ul>"
            },
            {
              id: "section2",
              title: "Key Immune Supporting Nutrients",
              type: "text",
              content: "<h2>Essential Nutrients for Immune Health</h2><p>Certain vitamins, minerals, and compounds play crucial roles in maintaining optimal immune function.</p><h3>Vitamin C:</h3><ul><li><strong>Function:</strong> Antioxidant, supports white blood cell function</li><li><strong>Sources:</strong> Citrus fruits, berries, leafy greens</li><li><strong>Supplementation:</strong> 500-1000mg daily for prevention, up to 3000mg during illness</li><li><strong>Benefits:</strong> Reduces duration and severity of colds</li></ul><h3>Vitamin D:</h3><ul><li><strong>Function:</strong> Regulates immune cell activity, antimicrobial peptide production</li><li><strong>Sources:</strong> Sun exposure, fatty fish, fortified foods</li><li><strong>Supplementation:</strong> 1000-4000 IU daily (test levels first)</li><li><strong>Note:</strong> Deficiency linked to increased infection risk</li></ul><h3>Zinc:</h3><ul><li><strong>Function:</strong> Essential for immune cell development and function</li><li><strong>Sources:</strong> Oysters, meat, pumpkin seeds, legumes</li><li><strong>Supplementation:</strong> 8-11mg daily for adults</li><li><strong>Timing:</strong> Take on empty stomach or with small amount of food</li></ul><h3>Probiotics:</h3><ul><li><strong>Function:</strong> Support gut-associated lymphoid tissue (70% of immune system)</li><li><strong>Strains:</strong> Lactobacillus acidophilus, Bifidobacterium bifidum</li><li><strong>Benefits:</strong> Reduce respiratory and digestive infections</li><li><strong>Sources:</strong> Fermented foods, quality supplements</li></ul><h3>Elderberry:</h3><ul><li><strong>Function:</strong> Antiviral properties, immune modulation</li><li><strong>Research:</strong> May reduce flu duration by 3-4 days</li><li><strong>Forms:</strong> Syrup, gummies, capsules</li><li><strong>Dosage:</strong> Follow product instructions, start at first symptoms</li></ul>"
            },
            {
              id: "section3",
              title: "Seasonal Immune Strategies",
              type: "text",
              content: "<h2>Year-Round Immune Support</h2><p>Different seasons present unique challenges and opportunities for immune support.</p><h3>Fall/Winter Strategy (Cold & Flu Season):</h3><h4>Prevention Focus:</h4><ul><li>Daily vitamin D supplementation (higher doses)</li><li>Consistent vitamin C intake</li><li>Zinc lozenges at first sign of symptoms</li><li>Elderberry syrup for family use</li><li>Probiotic maintenance</li></ul><h4>Lifestyle Support:</h4><ul><li>Adequate sleep (7-9 hours)</li><li>Hand hygiene and surface cleaning</li><li>Stay hydrated with warm liquids</li><li>Manage stress levels</li><li>Indoor air quality (humidifiers, air purifiers)</li></ul><h3>Spring Strategy (Allergy Season):</h3><h4>Natural Antihistamines:</h4><ul><li>Quercetin with bromelain</li><li>Nettle leaf extract</li><li>Vitamin C for mast cell stabilization</li><li>Local honey for seasonal allergies</li></ul><h4>Detox Support:</h4><ul><li>Liver supporting herbs (milk thistle, dandelion)</li><li>Increased water intake</li><li>Fresh, seasonal produce</li><li>Gentle exercise to support lymphatic drainage</li></ul><h3>Summer Strategy (Travel & Activity Season):</h3><h4>On-the-Go Support:</h4><ul><li>Portable immune support packets</li><li>Electrolyte replacement</li><li>Digestive enzymes for varied diets</li><li>Travel-size hand sanitizers</li></ul><h4>Heat Stress Management:</h4><ul><li>Increased fluid intake</li><li>Cooling foods and herbs (mint, cucumber)</li><li>Adaptogens for physical stress</li><li>Sun protection for skin barrier function</li></ul><h3>Customizing Recommendations:</h3><h4>For Frequent Travelers:</h4><ul><li>Immune support packs</li><li>Probiotic maintenance</li><li>Vitamin C powder for flights</li><li>Sleep support for jet lag</li></ul><h4>For Parents/Teachers:</h4><ul><li>Family-friendly immune products</li><li>Hand hygiene education</li><li>Stress management tools</li><li>Back-to-school immune prep</li></ul><h4>For Active Individuals:</h4><ul><li>Post-workout recovery support</li><li>Anti-inflammatory nutrients</li><li>Electrolyte balance</li><li>Sleep optimization</li></ul><h4>For Seniors:</h4><ul><li>Higher vitamin D doses</li><li>B-complex for energy and immune function</li><li>Antioxidants for cellular protection</li><li>Digestive support for nutrient absorption</li></ul>"
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
      console.log(`  ✓ Created ${trainings.length} comprehensive trainings`);
      
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
    } catch (err: any) {
      console.error('❌ Error creating trainings:', err);
      throw new Error(`Failed to create trainings: ${err.message}`);
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
          productName: "Rescue Remedy Essentials Pack",
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
          isActive: true,        // ADDED FIX: Fix for Firestore rules requirement
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
          isActive: true,        // ADDED FIX: Fix for Firestore rules requirement
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
    } catch (err: any) {
      console.error('❌ Error creating announcements and communities:', err);
      throw new Error(`Failed to create announcements and communities: ${err.message}`);
    }
    
    // Final commit
    try {
      console.log('📝 Committing final batch...');
      await batch.commit();
      console.log('✅ All comprehensive demo data created successfully!');
    } catch (err: any) {
      console.error('❌ Error committing final batch:', err);
      throw new Error(`Failed to commit final batch: ${err.message}`);
    }
    
    // Return counts
    return { counts: results };
  } catch (error: any) {
    console.error("❌ Error seeding comprehensive demo data:", error);
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
      'training_progress',
      'sample_programs',
      'sample_requests',
      'announcements',
      'communities',
      'community_posts',
      'community_comments',
      'community_likes'
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
 * Delete all documents in the given collection that were marked as demo seed data.
 *
 * Queries the collection for documents where `demoSeed === true` and deletes them using
 * Firestore batched writes. Deletes are grouped into batches of up to 400 operations and
 * committed (commits run in parallel via Promise.all). If no demo documents are found the
 * function returns without performing any writes.
 *
 * @param collectionName - The Firestore collection name to scan for `demoSeed` documents.
 * @throws If querying or committing deletions fails, the original error is rethrown.
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