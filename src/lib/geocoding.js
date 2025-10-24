// Shared geocoding helper
// Uses OpenStreetMap Nominatim with required identifying headers.
// Note: Browsers may strip certain headers (User-Agent/Referer). We include them for policy compliance;
// the browser will still send a Referer automatically from the page origin.

/**
 * Convert a free-form address into geographic coordinates using OpenStreetMap Nominatim.
 * @param {string} query - Free-form address text; if missing or not a string the function returns `null`.
 * @returns {{lat:number,lng:number,provider:string}|null} An object with numeric `lat` and `lng` and `provider: 'nominatim'`, or `null` when no valid coordinates are available.
 */
export async function geocodeAddress(query) {
  if (!query || typeof query !== 'string') return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const headers = {
    Accept: 'application/json',
    // Identification per Nominatim usage policy
    'User-Agent': 'EngageNatural/1.0 (support@engagenatural.com)',
  };
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Geocode failed: ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const first = data[0];
    const lat = Number(first.lat);
    const lng = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng, provider: 'nominatim' };
  } catch (e) {
    console.error('geocodeAddress error', e);
    throw e;
  }
}