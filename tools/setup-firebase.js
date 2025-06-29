import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { promises as fs } from 'fs';

// Use simple relative path for Windows compatibility
const SEED_DATA_PATH = './seed-data.json';

function parseArgs() {
  const args = process.argv.slice(2);
  const isEmulator = args.includes('--emulator');
  if (!isEmulator) {
    throw new Error('Please run with --emulator flag');
  }
  return { environment: 'emulator' };
}

async function initializeFirebase() {
  console.log('🔥 Connecting to local Firestore emulator...');
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  initializeApp({ projectId: 'demo-engagenatural' });
}

function convertTimestamps(data) {
  if (data === null || typeof data !== 'object') return data;
  if (data.hasOwnProperty('_seconds') && data.hasOwnProperty('_nanoseconds')) {
    return new Timestamp(data._seconds, data._nanoseconds);
  }
  if (Array.isArray(data)) return data.map(convertTimestamps);
  const newData = {};
  for (const key in data) {
    newData[key] = convertTimestamps(data[key]);
  }
  return newData;
}

async function seedCollection(db, collectionName, documents) {
  console.log(`🔥 Seeding collection: ${collectionName} (${documents.length} documents)...`);
  const collectionRef = db.collection(collectionName);
  const batch = db.batch();

  documents.forEach((docData) => {
    const docRef = collectionRef.doc();
    batch.set(docRef, docData);
  });

  await batch.commit();
  console.log(`✅ Collection "${collectionName}" seeded successfully.`);
}

async function main() {
  try {
    parseArgs();
    await initializeFirebase();
    const db = getFirestore();

    console.log(`📁 Loading seed data from: ${SEED_DATA_PATH}`);
    const seedFileContent = await fs.readFile(SEED_DATA_PATH, 'utf8');
    const rawSeedData = JSON.parse(seedFileContent);
    const seedData = convertTimestamps(rawSeedData);

    for (const collectionName in seedData) {
      await seedCollection(db, collectionName, seedData[collectionName]);
    }

    console.log('\n🎉 All collections seeded successfully!');
    console.log('➡️  View your data at: http://127.0.0.1:4000');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
