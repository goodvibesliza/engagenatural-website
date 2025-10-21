import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';

function parseCsv(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n').filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    // naive CSV split; handles simple values without embedded commas
    const cols = line.split(',').map((c) => c.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cols[i] ?? ''; });
    return obj;
  });
  return { headers, rows };
}

export default function RosterUpload() {
  const [summary, setSummary] = useState(null);
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErrors([]);
    try {
      const text = await file.text();
      const { headers, rows } = parseCsv(text);
      const required = ['storeId', 'storeName', 'lat', 'lng', 'rosterEmail', 'rosterName'];
      const missing = required.filter((k) => !headers.includes(k));
      if (missing.length) {
        throw new Error(`Missing required columns: ${missing.join(', ')}`);
      }

      // Group rows by storeId
      const byStore = new Map();
      for (const r of rows) {
        const sid = String(r.storeId || '').trim();
        if (!sid) continue;
        if (!byStore.has(sid)) byStore.set(sid, { store: r, roster: [] });
        byStore.get(sid).roster.push(r);
      }

      let storeCount = 0;
      let staffCount = 0;
      const batch = writeBatch(db);

      for (const [sid, group] of byStore.entries()) {
        const lat = Number(group.store.lat);
        const lng = Number(group.store.lng);
        const storeDoc = {
          storeId: sid,
          storeName: String(group.store.storeName || '').trim(),
          lat: isNaN(lat) ? null : lat,
          lng: isNaN(lng) ? null : lng,
          address: String(group.store.address || '').trim() || undefined,
          updatedAt: new Date().toISOString(),
        };
        batch.set(doc(db, 'stores', sid), storeDoc, { merge: true });
        storeCount += 1;

        for (const r of group.roster) {
          const email = String(r.rosterEmail || '').trim().toLowerCase();
          const name = String(r.rosterName || '').trim();
          if (!email) continue;
          const rosterDoc = {
            rosterEmail: email,
            rosterEmailLower: email,
            rosterName: name,
            storeId: sid,
            storeName: storeDoc.storeName,
          };
          batch.set(doc(collection(db, 'stores', sid, 'roster'), email), rosterDoc, { merge: true });
          staffCount += 1;
        }
      }

      await batch.commit();
      setSummary({ stores: storeCount, staff: staffCount });
    } catch (err) {
      setErrors((prev) => [...prev, err.message || String(err)]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-2">Roster CSV Import</h1>
      <p className="text-sm text-gray-600 mb-4">Columns required: storeId, storeName, lat, lng, rosterEmail, rosterName. Optional: address.</p>
      <input type="file" accept=".csv" onChange={onFile} disabled={busy} />
      {busy && <div className="mt-3 text-gray-700">Importing…</div>}
      {summary && (
        <div className="mt-4 rounded border bg-white p-3">
          <div className="font-medium">Import Summary</div>
          <div className="text-sm text-gray-700">Stores: {summary.stores}</div>
          <div className="text-sm text-gray-700">Staff: {summary.staff}</div>
        </div>
      )}
      {errors.length > 0 && (
        <div className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {errors.map((e, i) => (<div key={i}>• {e}</div>))}
        </div>
      )}
    </div>
  );
}
