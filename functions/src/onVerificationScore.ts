import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

try { admin.app(); } catch { admin.initializeApp(); }
const db = admin.firestore();

const GEOFENCE_MATCH_M = 250;
const GEOFENCE_NEAR_M = 800;
const FRESHNESS_MS = 10 * 60 * 1000; // informational tag only

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

    const applicantUid: string | null = after.userId || after.applicantUid || null;

    // Prefer device location if present (support multiple shapes)
    let deviceLat: number | null = null;
    let deviceLng: number | null = null;
    let capturedAtMs: number | null = null;
    if (after.deviceLoc?.lat != null && after.deviceLoc?.lng != null) {
      deviceLat = Number(after.deviceLoc.lat); deviceLng = Number(after.deviceLoc.lng);
      capturedAtMs = after.deviceLoc.obtainedAt != null
        ? Number(after.deviceLoc.obtainedAt)
        : (after.capturedAt != null ? Number(after.capturedAt) : null);
    } else if (after.metadata?.geolocation?.latitude != null && after.metadata?.geolocation?.longitude != null) {
      deviceLat = Number(after.metadata.geolocation.latitude);
      deviceLng = Number(after.metadata.geolocation.longitude);
      capturedAtMs = after.metadata.geolocation.timestamp != null
        ? Number(after.metadata.geolocation.timestamp)
        : null;
    }

    // Fall back to EXIF GPS from prior function
    let source: 'device' | 'exif' | null = null;
    let lat: number | null = null;
    let lng: number | null = null;
    if (deviceLat != null && deviceLng != null) {
      source = 'device'; lat = deviceLat; lng = deviceLng;
    } else if (after.exif?.hasGps && after.exif?.lat != null && after.exif?.lng != null) {
      source = 'exif'; lat = Number(after.exif.lat); lng = Number(after.exif.lng);
    } else if (after.gps?.lat != null && after.gps?.lng != null) { // backward compat
      source = 'exif'; lat = Number(after.gps.lat); lng = Number(after.gps.lng);
    }

    // Load user's saved store location
    let storeLoc: { lat: number; lng: number } | null = null;
    if (applicantUid) {
      const userSnap = await db.collection('users').doc(applicantUid).get();
      if (userSnap.exists) {
        const u = userSnap.data() as any;
        if (u?.storeLoc?.lat != null && u?.storeLoc?.lng != null) {
          storeLoc = { lat: Number(u.storeLoc.lat), lng: Number(u.storeLoc.lng) };
        }
      }
    }
    const reasons: string[] = [];
    let distance_m: number | null = null;
    let geoPts = 0;

    if (!storeLoc || (lat == null || lng == null)) {
      if (lat == null || lng == null) reasons.push('NO_VERIFICATION_GPS');
      if (!storeLoc) reasons.push('NO_STORE_LOC');
    } else {
      distance_m = metersBetween(
        { lat: Number(lat), lng: Number(lng) },
        { lat: Number(storeLoc.lat), lng: Number(storeLoc.lng) }
      );
      if (!Number.isFinite(distance_m)) {
        reasons.push('INVALID_COORDS');
        distance_m = null;
      }
      if (source === 'device') {
        if (distance_m != null && distance_m <= GEOFENCE_MATCH_M) reasons.push('GEO_DEVICE_MATCH');
        else if (distance_m != null && distance_m <= GEOFENCE_NEAR_M) reasons.push('GEO_DEVICE_NEAR');
        else if (distance_m != null) reasons.push('GEO_OUT_OF_RANGE');
      } else if (source === 'exif') {
        if (distance_m != null && distance_m <= GEOFENCE_MATCH_M) reasons.push('GEO_EXIF_MATCH');
        else if (distance_m != null && distance_m <= GEOFENCE_NEAR_M) reasons.push('GEO_EXIF_NEAR');
        else if (distance_m != null) reasons.push('GEO_OUT_OF_RANGE');
      } else {
        reasons.push('NO_VERIFICATION_GPS');
      }
      // geo points: 100 at 0–50m, linear to 0 by 1500m
      if (distance_m != null) {
        const d = distance_m;
        if (d <= 50) geoPts = 100;
        else if (d >= 1500) geoPts = 0;
        else geoPts = Math.max(0, Math.round(100 * (1 - (d - 50) / (1500 - 50))));
      }
    }

    // freshness
    const now = Date.now();
    if (capturedAtMs != null && Number.isFinite(capturedAtMs) && Math.abs(now - capturedAtMs) <= FRESHNESS_MS) {
      reasons.push('FRESH_CAPTURE');
    } else if (capturedAtMs != null) {
      reasons.push('STALE_CAPTURE');
    }

    const autoScore = Math.max(0, Math.min(100, Math.round(geoPts)));
    const before = change.before.exists ? (change.before.data() as any) : null;
    const sameArr = (a?: unknown[], b?: unknown[]) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]);
    if (
      before &&
      before.autoScore === autoScore &&
      (before.distance_m ?? null) === (distance_m ?? null) &&
      (before.locSource ?? null) === (source ?? null) &&
      sameArr(before.reasons, reasons)
    ) {
      return;
    }
    await change.after.ref.set({ autoScore, reasons, distance_m, locSource: source || null }, { merge: true });
  });
