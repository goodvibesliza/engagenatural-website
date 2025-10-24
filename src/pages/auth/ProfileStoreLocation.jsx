import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { geocodeAddress } from '@/lib/geocoding';
import { Link } from 'react-router-dom';

export default function ProfileStoreLocation() {
  const { user } = useAuth();
  const [addressText, setAddressText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [storeLoc, setStoreLoc] = useState(null);

  useEffect(() => {
    (async () => {
      if (!user?.uid) return;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const d = snap.data();
          setAddressText(d.storeAddressText || '');
          setStoreLoc(d.storeLoc || null);
        }
      } catch (e) {
        console.error('Failed to load profile:', e);
      }
    })();
  }, [user?.uid]);

  // geocodeAddress imported from shared module

  async function setStoreLocation() {
    if (!user?.uid) return;
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const addr = (addressText || '').trim();
      const payload = { storeAddressText: addr };

      // 1) Geocode address → storeAddressGeo (reference only), never into storeLoc
      if (addr) {
        try {
          const g = await geocodeAddress(addr);
          if (g) {
            payload.storeAddressGeo = {
              lat: g.lat,
              lng: g.lng,
              setAt: serverTimestamp(),
              source: 'address',
              provider: g.provider
            };
          }
        } catch (e) {
          console.error('Address geocoding failed', e);
        }
      }

      // 2) Get device GPS → storeLoc (device-only)
      let deviceLoc = null;
      if ('geolocation' in navigator) {
        try {
          await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition((pos) => {
              const lat = pos.coords.latitude; const lng = pos.coords.longitude;
              deviceLoc = { lat, lng, setAt: serverTimestamp(), source: 'device' };
              resolve();
            }, (err) => reject(err), { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 });
          });
        } catch (e) {
          console.error('Device geolocation failed', e);
        }
      }

      if (deviceLoc) {
        payload.storeLoc = deviceLoc; // device-only
      }

      await updateDoc(doc(db, 'users', user.uid), payload);

      // Update local state: use pending placeholder for setAt (avoid local Date)
      if (deviceLoc) setStoreLoc({ lat: deviceLoc.lat, lng: deviceLoc.lng, source: 'device', setAt: null });
      setSuccess(deviceLoc ? 'Store location (device GPS) saved.' : 'Address saved. Device GPS not captured.');
    } catch (e) {
      console.error('Failed to save store location:', e);
      setError('Failed to save store information. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const mapHref = storeLoc?.lat != null && storeLoc?.lng != null
    ? `https://maps.google.com/?q=${storeLoc.lat},${storeLoc.lng}`
    : null;

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6">
      <div className="mb-4">
        <Link to="/staff/profile" className="text-sm text-blue-600 hover:underline">← Back to Profile</Link>
      </div>
      <h1 className="text-2xl font-bold mb-1">Store Location</h1>
      <p className="text-sm text-gray-600 mb-6">Save your store location once. We’ll compare verification selfies to this location.</p>

      <label className="block text-sm font-medium text-gray-700 mb-1">Store address (for humans)</label>
      <input
        type="text"
        value={addressText}
        onChange={(e) => setAddressText(e.target.value)}
        placeholder="123 Main St, Springfield…"
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
      />

      <button
        type="button"
        onClick={setStoreLocation}
        disabled={saving}
        className="mt-3 rounded bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Saving…' : 'Set Store Location'}
      </button>

      {error && <div className="mt-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {success && <div className="mt-3 rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800">{success}</div>}

      <div className="mt-6 rounded border p-3">
        <div className="text-sm font-medium mb-1">Saved Coordinates</div>
        {storeLoc?.lat != null ? (
          <div className="text-sm text-gray-800">
            <div>Lat: {storeLoc.lat}</div>
            <div>Lng: {storeLoc.lng}</div>
            {mapHref && (
              <a href={mapHref} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-blue-600 hover:underline">Test Map</a>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-600">No store location saved yet.</div>
        )}
      </div>
    </div>
  );
}
