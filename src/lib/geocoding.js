// Shared geocoding helper
// Uses OpenStreetMap Nominatim with required identifying headers.
// Note: Browsers may strip certain headers (User-Agent/Referer). We include them for policy compliance;
// the browser will still send a Referer automatically from the page origin.

/**
 * Geocode a free-form address string to { lat, lng } using Nominatim.
 * @param {string} query - Address text
 * @returns {Promise<{lat:number,lng:number,provider:string}|null>}
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
