import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import sharp from 'sharp';
import * as exifr from 'exifr';
import { v4 as uuidv4 } from 'uuid';

try { admin.app(); } catch { admin.initializeApp(); }
const db = admin.firestore();
const bucket = admin.storage().bucket();

export const onPhotoEXIF = functions.storage
  .object()
  .onFinalize(async (object) => {
    const name = object.name || '';
    // Only handle user verification selfies path
    if (!name.startsWith('verification/')) return;
    const contentType = object.contentType || 'image/jpeg';

    // Download into memory
    const [buf] = await bucket.file(name).download();

    // Parse EXIF GPS (if available)
    let gpsLat: number | null = null;
    let gpsLng: number | null = null;
    try {
      const parsed: any = await exifr.parse(buf, { gps: true });
      if (parsed?.latitude && parsed?.longitude) {
        gpsLat = Number(parsed.latitude);
        gpsLng = Number(parsed.longitude);
      }
    } catch (err) {
      // ignore; set hasGps false below if not found
    }

    // Create redacted copy (strip EXIF) in a parallel path
    const redactedPath = name.replace(/^verification\//, 'verification-redacted/');
    const token = uuidv4();
    const redacted = await sharp(buf).withMetadata({ exif: undefined }).toFormat('jpeg').toBuffer();
    await bucket.file(redactedPath).save(redacted, {
      contentType: 'image/jpeg',
      metadata: { metadata: { firebaseStorageDownloadTokens: token } },
      resumable: false,
      public: false,
      validation: false,
    });
    const photoRedactedUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(redactedPath)}?alt=media&token=${token}`;

    // Try to find the verification doc: match by userId (from path) and photoURL contains the object path
    const parts = name.split('/'); // verification/{uid}/{file}
    const userId = parts[1];
    const candidatesSnap = await db.collection('verification_requests')
      .where('userId', '==', userId)
      .orderBy('submittedAt', 'desc')
      .limit(10)
      .get();

    let matchedDoc: FirebaseFirestore.DocumentReference | null = null;
    for (const docSnap of candidatesSnap.docs) {
      const v = docSnap.data() as any;
      const url: string | undefined = v?.photoURL;
      if (url && (url.includes(encodeURIComponent(name)) || url.includes(name))) {
        matchedDoc = docSnap.ref;
        break;
      }
    }

    // If no match, try to at least update the most recent pending doc for the user
    if (!matchedDoc && !candidatesSnap.empty) {
      matchedDoc = candidatesSnap.docs[0].ref;
    }

    if (matchedDoc) {
      const update: any = {
        hasGps: !!(gpsLat && gpsLng),
        exifParsedAt: admin.firestore.FieldValue.serverTimestamp(),
        photoRedactedUrl,
        photoPath: name,
      };
      if (gpsLat && gpsLng) {
        update.gps = { lat: gpsLat, lng: gpsLng, source: 'exif' };
      } else {
        update.hasGps = false;
      }
      await matchedDoc.set(update, { merge: true });
    }
  });
