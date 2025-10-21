import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

try { admin.app(); } catch { admin.initializeApp(); }
const db = admin.firestore();

const GEOFENCE_RADIUS_M = 250;
const FRESHNESS_MS = 10 * 60 * 1000;

function metersBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return Math.round(R * c);
}

function normalizeName(s?: string) {
  return (s || '').toLowerCase().replace(/[^a-z\s]/g, '').trim();
}

export const onVerificationScore = functions.firestore
  .document('verification_requests/{id}')
  .onWrite(async (change, ctx) => {
    const after = change.after.exists ? change.after.data() as any : null;
    if (!after) return;

    const id = ctx.params.id;
    const storeId = after.storeId || after.store_id || null;

    // Prefer device location if present (support multiple shapes)
    let deviceLat: number | null = null;
    let deviceLng: number | null = null;
    let capturedAtMs: number | null = null;
    if (after.loc?.lat && after.loc?.lng) {
      deviceLat = Number(after.loc.lat); deviceLng = Number(after.loc.lng);
      capturedAtMs = Number(after.loc.obtainedAt || after.capturedAt || Date.now());
    } else if (after.metadata?.geolocation?.latitude && after.metadata?.geolocation?.longitude) {
      deviceLat = Number(after.metadata.geolocation.latitude);
      deviceLng = Number(after.metadata.geolocation.longitude);
      capturedAtMs = Number(after.metadata.geolocation.timestamp || Date.now());
    }

    // Fall back to EXIF GPS from prior function
    let source: 'device' | 'exif' | null = null;
    let lat: number | null = null;
    let lng: number | null = null;
    if (deviceLat != null && deviceLng != null) {
      source = 'device'; lat = deviceLat; lng = deviceLng;
    } else if (after.gps?.lat && after.gps?.lng) {
      source = 'exif'; lat = Number(after.gps.lat); lng = Number(after.gps.lng);
    }

    // If we lack required inputs, set minimal reasons and score
    if (!storeId) {
      await change.after.ref.set({ autoScore: 0, reasons: ['NO_STORE_ID'] }, { merge: true });
      return;
    }

    const storeSnap = await db.collection('stores').doc(storeId).get();
    const store = storeSnap.exists ? storeSnap.data() as any : null;
    const reasons: string[] = [];
    let distance_m: number | null = null;
    let geoPts = 0;
    let rosterPts = 0;
    let freshnessPts = 0;

    if (!store || store.lat == null || store.lng == null || (lat == null || lng == null)) {
      if (lat == null || lng == null) reasons.push('NO_GPS');
      if (!store || store.lat == null || store.lng == null) reasons.push('NO_STORE_COORDS');
    } else {
      distance_m = metersBetween({ lat, lng }, { lat: Number(store.lat), lng: Number(store.lng) });
      if (source === 'device') {
        if (distance_m <= GEOFENCE_RADIUS_M) reasons.push(`GEO_DEVICE_MATCH(${distance_m}m)`);
        else if (distance_m <= 800) reasons.push(`GEO_NEAR(${distance_m}m)`);
        else reasons.push(`GEO_OUT_OF_RANGE(${distance_m}m)`);
      } else if (source === 'exif') {
        if (distance_m <= GEOFENCE_RADIUS_M) reasons.push(`GEO_EXIF_MATCH(${distance_m}m)`);
        else if (distance_m <= 800) reasons.push(`GEO_NEAR(${distance_m}m)`);
        else reasons.push(`GEO_OUT_OF_RANGE(${distance_m}m)`);
      } else {
        reasons.push('NO_GPS');
      }

      // geo points: 60 at <=200m, linear to 0 by 1500m
      const d = distance_m;
      if (d <= 200) geoPts = 60;
      else if (d >= 1500) geoPts = 0;
      else geoPts = Math.max(0, Math.round(60 * (1 - (d - 200) / (1500 - 200))));
    }

    // roster matching
    let emailHit = false;
    let nameHit = false;
    try {
      const email = (after.userEmail || '').toLowerCase();
      const name = normalizeName(after.userName || '');
      const rosterCol = db.collection('stores').doc(storeId).collection('roster');
      if (email) {
        const emailDoc = await rosterCol.doc(email).get();
        if (emailDoc.exists) emailHit = true;
        else {
          // fallback query by normalized field
          const q = await rosterCol.where('rosterEmailLower', '==', email).limit(1).get();
          emailHit = !q.empty;
        }
      }
      if (!emailHit && name) {
        const snap = await rosterCol.limit(50).get();
        for (const d of snap.docs) {
          const rn = normalizeName((d.data() as any).rosterName);
          if (rn && name && (rn.includes(name) || name.includes(rn))) { nameHit = true; break; }
        }
      }
    } catch {}

    if (emailHit) { reasons.push('ROSTER_EMAIL_MATCH'); rosterPts = 30; }
    else if (nameHit) { reasons.push('ROSTER_NAME_MATCH'); rosterPts = 20; }
    else { reasons.push('NO_ROSTER_HIT'); }

    // freshness
    const now = Date.now();
    if (capturedAtMs && Math.abs(now - capturedAtMs) <= FRESHNESS_MS) {
      reasons.push('FRESH_CAPTURE');
      freshnessPts = 10;
    } else if (capturedAtMs) {
      reasons.push('STALE_CAPTURE');
    }

    const autoScore = Math.max(0, Math.min(100, Math.round(geoPts + rosterPts + freshnessPts)));

    await change.after.ref.set({ autoScore, reasons, distance_m, locSource: source || null }, { merge: true });
  });
