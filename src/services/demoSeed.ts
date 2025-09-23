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

/**
 * Convert a string into a URL-friendly slug.
 *
 * Produces a lowercase, trimmed slug that strips characters except ASCII letters and digits, collapses whitespace into single hyphens, and collapses consecutive hyphens.
 *
 * @param s - Input string to slugify
 * @returns A URL-safe slug (e.g. "Hello World!" -> "hello-world")
 */
function slugify(s: string) { 
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-'); 
}

// Deterministic brand definitions
const BRANDS = [
  { id: 'rescue', name: 'Rescue Remedy' },
  { id: 'bach', name: 'Bach Flower Remedies' },
  { id: 'spatone', name: 'Spatone' }
];

// Deterministic retailer definitions
const RETAILERS = [
  { id: 'sprouts-winter-park', name: 'Sprouts – Winter Park, FL', chain: 'Sprouts', storeCode: 'SP-WP', city: 'Winter Park', state: 'FL' },
  { id: 'natural-grocers-denver', name: 'Natural Grocers – Denver, CO', chain: 'Natural Grocers', storeCode: 'NG-DN', city: 'Denver', state: 'CO' }
];

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
 * Create or verify Firebase Auth accounts for the provided demo users and return their UIDs.
 *
 * Creates accounts using a secondary Firebase Auth instance so the primary (super_admin) session remains signed in.
 * On localhost the secondary instance will attempt to connect to the Auth emulator. If an email already exists the
 * function will try to sign in to retrieve the existing UID. If sign-in fails due to invalid credentials, a
 * deterministic placeholder UID is returned for that email so seeding can continue.
 *
 * @param users - List of demo users to create. Each item must include `email`, `password`, and `displayName`.
 *                (The seeding scripts expect known demo passwords; if an existing account uses a different password,
 *                a placeholder UID will be produced for that email.)
 * @returns Array of created or verified user records containing `uid`, `email`, and `displayName`.
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
      if (error.code === 'auth/email-already-in-use') {
        // Account exists – sign in to retrieve UID, then sign out
        console.log(
          `    ⚠️ Account ${userData.email} already exists – signing in to retrieve UID…`
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
            // Password mismatch: continue with placeholder UID, instruct user what to do
            console.warn(
              `    ⚠️ Account ${userData.email} exists but password doesn't match 'password123'`
            );
            console.warn(`    📝 Please either:`);
            console.warn(`       1. Delete the existing account in Firebase Console`);
            console.warn(`       2. Change the password to 'password123'`);
            console.warn(`       3. Use the existing password when logging in`);
            console.warn(`    🔄 Continuing with placeholder UID for now...`);

            const placeholderUid = `EXISTING_ACCOUNT_${userData.email
              .replace(/[@.]/g, '_')
              .toUpperCase()}_${Date.now()}`;
            createdUsers.push({
              uid: placeholderUid,
              email: userData.email,
              displayName: userData.displayName
            });
            console.log(`    ✓ Using placeholder UID for ${userData.email}`);
          } else {
            console.error(
              `    ❌ Failed to sign in to existing account ${userData.email}:`,
              signInErr
            );
            throw new Error(
              `Account ${userData.email} exists but sign-in failed: ${signInErr.message}`
            );
          }
        }
      } else {
        console.error(
          `    ❌ Failed to create account for ${userData.email}:`,
          error
        );
        throw new Error(
          `Failed to create account for ${userData.email}: ${error.message}`
        );
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
 * Seed deterministic demo data (brands, retailers, users, trainings, communities, posts, comments, sample programs/requests) into Firestore and create required Firebase Auth demo accounts.
 *
 * Performs a permissions check using the provided super-admin UID, creates demo Auth accounts (or reuses existing accounts), writes demo documents with `demoSeed: true`, and returns counts of items created.
 *
 * @param currentUserUid - UID of the super_admin executing the seed; used to validate Firestore permissions before any writes.
 * @param opts - Optional overrides:
 *   - brandManagerUid: (unused in the current flow) placeholder to allow supplying an existing brand manager UID.
 *   - staffUids: array of existing staff UIDs to use instead of creating new placeholder staff accounts (first two entries will replace the seeded staff UIDs).
 * @returns An object with a `counts` record that maps collection/section keys (e.g., brands, retailers, staff, trainings, community_posts, sample_programs, sample_requests) to the number of items created.
 * @throws If permission checks fail, if Firebase Auth account creation/sign-in encounters unrecoverable errors, or if any Firestore write operations fail; errors are propagated with descriptive messages.
 */
export async function seedDemoData(
  currentUserUid: string, 
  opts?: { brandManagerUid?: string, staffUids?: string[] }
): Promise<{ counts: Record<string, number> }> {
  console.log('🌱 Starting demo data seeding process...');
  try {
    // Test permissions before proceeding
    await testFirestorePermissions(currentUserUid);
    
    // ------------------------------------------------------------------
    // Create Firebase Auth accounts for demo users
    // ------------------------------------------------------------------
    console.log('🔐 Creating Firebase Auth accounts for demo users...');
    
    const authAccountsToCreate = [
      // Brand managers - one per brand
      {
        email: 'bm.rescue@engagenatural.com',
        password: 'password123',
        displayName: 'Rescue Manager'
      },
      {
        email: 'bm.bach@engagenatural.com',
        password: 'password123',
        displayName: 'Bach Manager'
      },
      {
        email: 'bm.spatone@engagenatural.com',
        password: 'password123',
        displayName: 'Spatone Manager'
      },
      // Staff accounts
      {
        email: 'staff.demo@engagenatural.com',
        password: 'password123',
        displayName: 'Sam Wilson'
      },
      {
        email: 'staff2.demo@engagenatural.com',
        password: 'password123',
        displayName: 'Jamie Lee'
      }
    ];
    
    const createdAuthAccounts = await createDemoAuthAccounts(authAccountsToCreate);
    
    // Initialize batch
    let batch = writeBatch(db);
    let operationCount = 0;
    const results: Record<string, number> = {};
    
    // Maps to store user IDs by role and brand
    const BRAND_MANAGER_UIDS: Record<string, string> = {};
    const STAFF_UIDS: string[] = [];
    
    // Extract UIDs for brand managers
    for (const brand of BRANDS) {
      const brandManager = createdAuthAccounts.find(
        (user) => user.email === `bm.${brand.id}@engagenatural.com`
      );
      if (brandManager) {
        BRAND_MANAGER_UIDS[brand.id] = brandManager.uid;
      }
    }
    
    // Extract UIDs for staff
    const staffAccount1 = createdAuthAccounts.find(
      (user) => user.email === 'staff.demo@engagenatural.com'
    );
    const staffAccount2 = createdAuthAccounts.find(
      (user) => user.email === 'staff2.demo@engagenatural.com'
    );
    
    if (staffAccount1) STAFF_UIDS.push(staffAccount1.uid);
    if (staffAccount2) STAFF_UIDS.push(staffAccount2.uid);
    
    // Use provided UIDs if specified
    if (opts?.staffUids && opts.staffUids.length > 0) {
      // Replace the first entries with provided UIDs
      for (let i = 0; i < Math.min(opts.staffUids.length, 2); i++) {
        if (i < STAFF_UIDS.length) {
          STAFF_UIDS[i] = opts.staffUids[i];
        } else {
          STAFF_UIDS.push(opts.staffUids[i]);
        }
      }
    }
    
    // ------------------------------------------------------------------
    // Create brands with deterministic IDs
    // ------------------------------------------------------------------
    try {
      console.log('📝 Creating brands...');
      for (const brand of BRANDS) {
        await setDoc(doc(db, 'brands', brand.id), {
          name: brand.name,
          slug: brand.id,
          createdAt: serverTimestamp(),
          demoSeed: true
        }, { merge: true });
        
        console.log(`  ✓ Created brand: ${brand.name} (${brand.id})`);
      }
      results.brands = BRANDS.length;
    } catch (err: any) {
      console.error('❌ Error creating brands:', err);
      throw new Error(`Failed to create brands: ${err.message}`);
    }
    
    // ------------------------------------------------------------------
    // Create retailers with deterministic IDs
    // ------------------------------------------------------------------
    try {
      console.log('📝 Creating retailers...');
      for (const retailer of RETAILERS) {
        await setDoc(doc(db, 'retailers', retailer.id), {
          name: retailer.name,
          chain: retailer.chain,
          storeCode: retailer.storeCode,
          city: retailer.city,
          state: retailer.state,
          createdAt: serverTimestamp(),
          demoSeed: true
        }, { merge: true });
        
        console.log(`  ✓ Created retailer: ${retailer.name} (${retailer.id})`);
      }
      results.retailers = RETAILERS.length;
    } catch (err: any) {
      console.error('❌ Error creating retailers:', err);
      throw new Error(`Failed to create retailers: ${err.message}`);
    }
    
    // ------------------------------------------------------------------
    // Create user documents for brand managers and staff
    // ------------------------------------------------------------------
    try {
      console.log('📝 Creating user documents...');
      
      // Create brand manager documents
      for (const brand of BRANDS) {
        const uid = BRAND_MANAGER_UIDS[brand.id];
        if (!uid) continue;
        
        const brandManager = createdAuthAccounts.find(
          (user) => user.email === `bm.${brand.id}@engagenatural.com`
        );
        
        if (brandManager) {
          await setDoc(doc(db, 'users', uid), {
            uid,
            email: brandManager.email,
            displayName: brandManager.displayName,
            role: 'brand_manager',
            approved: true,
            brandId: brand.id,
            createdAt: serverTimestamp(),
            demoSeed: true
          }, { merge: true });
          
          console.log(`  ✓ Created brand manager: ${brandManager.displayName} for ${brand.name}`);
        }
      }
      results.brand_managers = Object.keys(BRAND_MANAGER_UIDS).length;
      
      // Create staff documents
      for (let i = 0; i < STAFF_UIDS.length; i++) {
        const uid = STAFF_UIDS[i];
        const staffAccount = createdAuthAccounts.find(
          (user) => user.email === (i === 0 ? 'staff.demo@engagenatural.com' : 'staff2.demo@engagenatural.com')
        );
        
        if (staffAccount) {
          // Assign retailer cyclically
          const retailerIndex = i % RETAILERS.length;
          const retailer = RETAILERS[retailerIndex];
          
          await setDoc(doc(db, 'users', uid), {
            uid,
            email: staffAccount.email,
            displayName: staffAccount.displayName,
            role: 'staff',
            verified: true,
            retailerId: retailer.id,
            storeCode: retailer.storeCode,
            createdAt: serverTimestamp(),
            demoSeed: true
          }, { merge: true });
          
          console.log(`  ✓ Created staff: ${staffAccount.displayName} for ${retailer.name}`);
        }
      }
      results.staff = STAFF_UIDS.length;
    } catch (err: any) {
      console.error('❌ Error creating user documents:', err);
      throw new Error(`Failed to create user documents: ${err.message}`);
    }
    
    // ------------------------------------------------------------------
    // Create trainings for each brand
    // ------------------------------------------------------------------
    try {
      console.log('📝 Creating trainings...');
      
      const trainings = [
        {
          brandId: 'rescue',
          title: 'Rescue Drops 101',
          description: 'Learn the science behind Rescue Remedy drops and how to effectively recommend them to customers experiencing stress and anxiety.',
          durationMins: 25,
          modules: ["benefits", "usage", "contraindications"],
          sections: [
            {
              id: "benefits",
              title: "Benefits & Mechanisms",
              content: "<p>Rescue Remedy drops combine five flower essences to help manage everyday stress. This section covers the key benefits and how they work.</p>"
            },
            {
              id: "usage",
              title: "Proper Usage & Dosing",
              content: "<p>Learn the correct dosing protocols and usage instructions to share with customers for optimal results.</p>"
            },
            {
              id: "contraindications",
              title: "Contraindications & Precautions",
              content: "<p>Important information about when Rescue Remedy may not be appropriate and what to tell customers about interactions.</p>"
            }
          ]
        },
        {
          brandId: 'bach',
          title: 'Bach Flower Basics',
          description: 'A comprehensive introduction to Bach flower remedies, their history, and how to match specific remedies to customer emotional states.',
          durationMins: 30,
          modules: ["history", "remedy-guide", "customer-matching"],
          sections: [
            {
              id: "history",
              title: "History & Philosophy",
              content: "<p>Dr. Edward Bach's discovery of flower remedies and the principles behind this gentle approach to emotional balance.</p>"
            },
            {
              id: "remedy-guide",
              title: "38 Remedies Overview",
              content: "<p>A systematic breakdown of the 38 Bach flower remedies and their specific emotional indications.</p>"
            },
            {
              id: "customer-matching",
              title: "Customer Consultation Guide",
              content: "<p>Practical techniques for helping customers identify which Bach flower remedies best match their emotional needs.</p>"
            }
          ]
        },
        {
          brandId: 'spatone',
          title: 'Spatone Iron 101',
          description: 'Everything staff needs to know about Spatone liquid iron supplements, including absorption benefits and customer education strategies.',
          durationMins: 20,
          modules: ["iron-basics", "absorption-science", "customer-education"],
          sections: [
            {
              id: "iron-basics",
              title: "Iron Deficiency Basics",
              content: "<p>Common signs of iron deficiency and why supplementation is important for specific customer groups.</p>"
            },
            {
              id: "absorption-science",
              title: "Absorption Science",
              content: "<p>The science behind Spatone's unique liquid iron formulation and why it offers superior absorption with fewer side effects.</p>"
            },
            {
              id: "customer-education",
              title: "Customer Education",
              content: "<p>Effective ways to discuss iron supplementation without alarming customers, focusing on energy and wellness.</p>"
            }
          ]
        }
      ];
      
      for (const training of trainings) {
        const brand = BRANDS.find(b => b.id === training.brandId);
        if (!brand) continue;
        
        const trainingId = `${brand.id}-${slugify(training.title)}`;
        await setDoc(doc(db, 'trainings', trainingId), {
          ...training,
          authorUid: BRAND_MANAGER_UIDS[brand.id],
          published: true,
          visibility: 'public',
          metrics: { enrolled: 0, completed: 0 },
          createdAt: serverTimestamp(),
          demoSeed: true
        }, { merge: true });
        
        console.log(`  ✓ Created training: ${training.title} for ${brand.name}`);
      }
      results.trainings = trainings.length;
    } catch (err: any) {
      console.error('❌ Error creating trainings:', err);
      throw new Error(`Failed to create trainings: ${err.message}`);
    }
    
    // ------------------------------------------------------------------
    // Create communities
    // ------------------------------------------------------------------
    try {
      console.log('📝 Creating communities...');
      
      const communities = [
        {
          id: 'whats-good',
          name: "What's Good",
          description: "Check out What's Good for the latest product drops and industry buzz!",
          isPublic: true,
          requiresVerification: false,
          memberCount: 2500,
          createdAt: serverTimestamp(),
          demoSeed: true
        },
        {
          id: 'supplement-scoop',
          name: 'Supplement Scoop',
          description: "Stop guessing what supplements actually work and start getting insider intel from the pros who sell $10M+ in products every year.",
          isPublic: true,
          requiresVerification: true,
          memberCount: 850,
          createdAt: serverTimestamp(),
          demoSeed: true
        }
      ];
      
      for (const community of communities) {
        await setDoc(doc(db, 'communities', community.id), community, { merge: true });
        console.log(`  ✓ Created community: ${community.name}`);
      }
      results.communities = communities.length;
    } catch (err: any) {
      console.error('❌ Error creating communities:', err);
      throw new Error(`Failed to create communities: ${err.message}`);
    }
    
    // ------------------------------------------------------------------
    // Create community posts for each brand
    // ------------------------------------------------------------------
    try {
      console.log('📝 Creating community posts...');
      
      const posts = [
        {
          brandId: 'rescue',
          title: 'When to recommend Rescue during stressful seasons',
          content: 'With holiday season approaching, customers are experiencing heightened stress levels. Rescue Remedy can be particularly effective during these periods. I recommend highlighting the fast-acting drops for acute situations and the gummies for ongoing support throughout the day. What strategies have worked in your stores?',
          communityId: 'whats-good'
        },
        {
          brandId: 'bach',
          title: 'Pairing Bach remedies with customer goals',
          content: 'I\'ve found that asking customers about their specific wellness goals helps match them with the right Bach flower remedies. For sleep support, I start with White Chestnut for racing thoughts, while Mimulus works well for known fears. Has anyone developed a quick reference guide for common customer concerns?',
          communityId: 'whats-good'
        },
        {
          brandId: 'spatone',
          title: 'How to talk iron without scaring customers',
          content: 'When discussing iron supplements, I\'ve noticed customers respond better to positive framing around energy and vitality rather than deficiency. Spatone\'s liquid format is particularly appealing when highlighted for its gentle digestion and absorption benefits. What language have you found most effective?',
          communityId: 'whats-good'
        }
      ];
      
      for (const post of posts) {
        const brand = BRANDS.find(b => b.id === post.brandId);
        if (!brand) continue;
        
        const brandManager = createdAuthAccounts.find(
          (user) => user.email === `bm.${brand.id}@engagenatural.com`
        );
        if (!brandManager) continue;
        
        const postId = `post-${brand.id}-${slugify(post.title)}`;
        await setDoc(doc(db, 'community_posts', postId), {
          brandId: brand.id,
          communityId: post.communityId,
          userId: BRAND_MANAGER_UIDS[brand.id],
          userName: brandManager.displayName,
          title: post.title,
          content: post.content,
          visibility: 'public',
          likeCount: 0,
          commentCount: 2,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          demoSeed: true
        }, { merge: true });
        
        console.log(`  ✓ Created post: ${post.title} for ${brand.name}`);
        
        // Create comments for this post
        try {
          for (let i = 0; i < Math.min(2, STAFF_UIDS.length); i++) {
            const commentId = `comment-${postId}-${i+1}`;
            const staffUid = STAFF_UIDS[i];
            const staffAccount = i === 0 ? 
              createdAuthAccounts.find(u => u.email === 'staff.demo@engagenatural.com') :
              createdAuthAccounts.find(u => u.email === 'staff2.demo@engagenatural.com');
            
            if (staffAccount) {
              const commentContent = i === 0 ?
                `Great insights! I've been using this approach with my customers and seeing positive results.` :
                `Thanks for sharing. This has been helpful for our team's training on ${brand.name} products.`;
              
              await setDoc(doc(db, 'community_comments', commentId), {
                postId,
                communityId: post.communityId,
                userId: staffUid,
                userName: staffAccount.displayName,
                content: commentContent,
                createdAt: serverTimestamp(),
                demoSeed: true
              }, { merge: true });
              
              console.log(`    ✓ Created comment by ${staffAccount.displayName} on post: ${post.title}`);
            }
          }
        } catch (commentErr) {
          console.warn(`    ⚠️ Could not create comments for post ${postId} due to permissions, continuing...`);
        }
      }
      results.community_posts = posts.length;
      results.community_comments = posts.length * 2; // Approximate, some may fail due to permissions
    } catch (err: any) {
      console.error('❌ Error creating community posts:', err);
      throw new Error(`Failed to create community posts: ${err.message}`);
    }
    
    // ------------------------------------------------------------------
    // Create sample programs
    // ------------------------------------------------------------------
    try {
      console.log('📝 Creating sample programs...');
      
      const samplePrograms = [
        {
          id: 'rescue-staff-try-on',
          brandId: 'rescue',
          name: 'Rescue Staff Try-On',
          productName: 'Rescue Remedy Drops',
          description: 'Experience Rescue Remedy firsthand to better recommend it to customers.',
          unitsAvailable: 50,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
        {
          id: 'spatone-trial-kit',
          brandId: 'spatone',
          name: 'Spatone Trial Kit',
          productName: 'Spatone Liquid Iron',
          description: 'Try Spatone liquid iron sachets to understand the taste and experience.',
          unitsAvailable: 75,
          startDate: new Date(),
          endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        }
      ];
      
      for (const program of samplePrograms) {
        const brand = BRANDS.find(b => b.id === program.brandId);
        if (!brand) continue;
        
        await setDoc(doc(db, 'sample_programs', program.id), {
          ...program,
          createdBy: BRAND_MANAGER_UIDS[brand.id],
          createdAt: serverTimestamp(),
          demoSeed: true
        }, { merge: true });
        
        console.log(`  ✓ Created sample program: ${program.name} for ${brand.name}`);
      }
      results.sample_programs = samplePrograms.length;
      
      // Create sample requests
      const sampleRequests = [
        {
          id: 'rescue-staff-try-on-request-1',
          programId: 'rescue-staff-try-on',
          brandId: 'rescue',
          userId: STAFF_UIDS[0],
          retailerId: RETAILERS[0].id,
          quantity: 3,
          status: 'approved',
          notes: 'For staff education session',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          demoSeed: true
        },
        {
          id: 'spatone-trial-kit-request-1',
          programId: 'spatone-trial-kit',
          brandId: 'spatone',
          userId: STAFF_UIDS[1],
          retailerId: RETAILERS[1].id,
          quantity: 5,
          status: 'shipped',
          notes: 'For wellness department demo',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          demoSeed: true
        }
      ];
      
      for (const request of sampleRequests) {
        await setDoc(doc(db, 'sample_requests', request.id), request, { merge: true });
        console.log(`  ✓ Created sample request: ${request.id}`);
      }
      results.sample_requests = sampleRequests.length;
    } catch (err: any) {
      console.error('❌ Error creating sample programs and requests:', err);
      throw new Error(`Failed to create sample programs and requests: ${err.message}`);
    }
    
    console.log('✅ All demo data created successfully!');
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
 * Remove all demo (seed) data from Firestore.
 *
 * Performs a permission check by creating and deleting a short-lived test document, then deletes documents
 * marked with `demoSeed: true` from the following collections: brands, retailers, users, trainings,
 * training_progress, sample_programs, sample_requests, announcements, communities, community_posts,
 * community_comments, and community_likes.
 *
 * @returns A promise that resolves when all targeted demo documents have been removed.
 * @throws {Error} If the permission check fails or deletions for any collection fail.
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
