import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { promises as fs } from 'fs';

const SEED_DATA_PATH = './seed-data.json';

async function initializeFirebase() {
  console.log('🔥 Connecting to Firestore emulator with project ID "engagenatural-app"...');
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  initializeApp({ projectId: 'engagenatural-app' });
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
    await initializeFirebase();
    const db = getFirestore();
    console.log('📁 Loading seed data...');
    const seedFileContent = await fs.readFile(SEED_DATA_PATH, 'utf8');
    const rawSeedData = JSON.parse(seedFileContent);
    const seedData = convertTimestamps(rawSeedData);
    for (const collectionName in seedData) {
      await seedCollection(db, collectionName, seedData[collectionName]);
    }
    console.log('\n🎉 All collections seeded with project ID: engagenatural-app');
    console.log('➡️ Check: http://127.0.0.1:4000/firestore/engagenatural-app/data');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();