// src/pages/admin/VerifyStaff.jsx (super_admin review UI for verification requests)
import { useEffect, useMemo, useState } from "react";
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  addDoc,
  doc,
  serverTimestamp,
  writeBatch,
  arrayUnion,
} from "firebase/firestore";
import { getDoc } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { getVerifyStrings, getReasonText } from '@/lib/i18nVerification';
import { metersBetween } from '@/lib/haversine';

/**
 * Render the staff verification queue UI for reviewing and managing verification requests.
 *
 * Subscribes to the Firestore 'verification_requests' collection and presents a searchable,
 * status-filterable table of requests. Exposes actions in a detail dialog to approve, reject,
 * or request more information; those actions update the corresponding user and request
 * documents in Firestore and update component state to reflect changes.
 *
 * @returns {JSX.Element} The verification queue UI component.
 */
export default function VerifyStaff() {
  const { user: admin } = useAuth();
  const strings = getVerifyStrings(admin?.locale || (typeof navigator !== 'undefined' ? navigator.language : 'en'));
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [zoomPhoto, setZoomPhoto] = useState(false);
  const [zoomCode, setZoomCode] = useState(false);
  const [requestingInfo, setRequestingInfo] = useState(false);
  const [requestInfoMsg, setRequestInfoMsg] = useState('');
  const [storeInfo, setStoreInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [processing, setProcessing] = useState(false);
  // Staff replies under messages subcollection
  const [messages, setMessages] = useState([]);
  // Localized reject modal state (UI-only, no change to writes)
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('LOCATION_FAR');

  // Subscribe to staff replies for the currently selected request
  useEffect(() => {
    if (!selected?.id) { setMessages([]); return; }
    try {
      const q = query(
        collection(db, 'verification_requests', selected.id, 'messages'),
        orderBy('createdAt', 'asc')
      );
      const unsub = onSnapshot(
        q,
        (snap) => {
          const arr = [];
          snap.forEach((d) => arr.push({ id: d.id, ...(d.data() || {}) }));
          setMessages(arr);
        },
        (err) => {
          console.error('VerifyStaff: messages subscription error', { requestId: selected?.id, err });
          setMessages([]);
        }
      );
      return () => { try { unsub(); } catch (e) { console.error('VerifyStaff: messages unsubscribe failed', e); } };
    } catch (e) {
      console.error('VerifyStaff: failed to subscribe to messages', { requestId: selected?.id, error: e });
      setMessages([]);
    }
  }, [selected?.id]);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    const q = query(collection(db, 'verification_requests'), orderBy('submittedAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => {
          const v = d.data();
          return {
            id: d.id,
            applicantUid: v.userId || v.applicantUid || '',
            applicantName: v.userName || v.applicantName || 'Unknown',
            applicantEmail: v.userEmail || v.applicantEmail || '',
            storeId: v.storeId || '',
            storeName: v.storeName || '',
            storeAddress: v.storeAddress || '',
            photoUrl: v.photoURL || v.photoUrl || '',
            codeImageUrl: v.codeImageUrl || '',
            submittedCodeText: v.submittedCodeText || v.verificationCode || '',
            status: v.status || 'pending',
            submittedAt: v.submittedAt?.toDate ? v.submittedAt.toDate() : (v.submittedAt ? new Date(v.submittedAt) : null),
            autoScore: typeof v.autoScore === 'number' ? v.autoScore : null,
            reasons: Array.isArray(v.reasons) ? v.reasons : [],
            distance_m: typeof v.distance_m === 'number' ? v.distance_m : null,
            photoRedactedUrl: v.photoRedactedUrl || '',
            gps: v.gps || null,
            deviceLoc: v.deviceLoc || null,
            metadata: v.metadata || null,
            locSource: v.locSource || null,
            locDenied: !!v.locDenied,
            // Info request history (new) + legacy backfill fields
            infoRequests: Array.isArray(v.infoRequests) ? v.infoRequests : null,
            infoRequestMessage: v.infoRequestMessage || '',
            infoRequestedAt: v.infoRequestedAt?.toDate ? v.infoRequestedAt.toDate() : (v.infoRequestedAt ? new Date(v.infoRequestedAt) : null),
          };
        });
        setItems(rows);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to fetch verification requests:', err);
        setLoadError('Failed to load verification requests. Please refresh the page.');
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    (async () => {
      if (selected?.applicantUid) {
        try {
          const s = await getDoc(doc(db, 'users', selected.applicantUid));
          setStoreInfo(s.exists() ? s.data() : null);
        } catch (e) {
          console.error(
            'VerifyStaff: Failed to fetch store info',
            { applicantUid: selected?.applicantUid, error: e }
          );
          setStoreInfo(null);
        }
      } else {
        setStoreInfo(null);
      }
    })();
  }, [selected?.applicantUid]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return items.filter((it) => {
      const statusOk = statusFilter === 'all' || it.status === statusFilter;
      const searchOk = !s ||
        (it.applicantEmail?.toLowerCase().includes(s)) ||
        (it.storeName?.toLowerCase().includes(s));
      return statusOk && searchOk;
    });
  }, [items, search, statusFilter]);

  const fmt = (d) => d ? d.toLocaleString() : '—';

  async function approve(v) {
    if (!v?.applicantUid) return;
    if (processing) return;
    if (!confirm(`Approve verification for ${v.applicantName || 'this user'}?`)) return;
    setProcessing(true);
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'users', v.applicantUid), {
        verified: true,
        verificationStatus: 'approved',
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, 'verification_requests', v.id), {
        status: 'approved',
        reviewedAt: serverTimestamp(),
      });
      await batch.commit();
      setSelected(null);
      alert('Verification approved.');
    } catch (err) {
      console.error('Failed to approve verification:', err);
      alert('Failed to approve verification. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  async function reject(v, reason) {
    if (!v?.applicantUid) return;
    if (processing) return;
    setProcessing(true);
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'users', v.applicantUid), {
        verified: false,
        verificationStatus: 'rejected',
        rejectionReason: reason,
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, 'verification_requests', v.id), {
        status: 'rejected',
        rejectionReason: reason,
        reviewedAt: serverTimestamp(),
      });
      await batch.commit();
      setSelected(null);
      alert('Verification rejected.');
    } catch (error) {
      console.error('Failed to reject verification:', error);
      alert('Failed to reject verification. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  async function requestInfo(v) {
    if (!v?.id) return;
    if (processing) return;
    if (!confirm(`Request more info from ${v.applicantName || 'this user'}?`)) return;
    setProcessing(true);
    try {
      const adminUid = admin?.uid || null;
      // Append-only history for questions
      await updateDoc(doc(db, 'verification_requests', v.id), {
        status: 'needs_info',
        infoRequestedAt: serverTimestamp(),
        infoRequestMessage: requestInfoMsg || '',
        infoRequests: arrayUnion({
          message: requestInfoMsg || '',
          // Use client-side Date so Firestore stores a Timestamp; serverTimestamp() isn't allowed inside arrayUnion
          createdAt: new Date(),
          adminUid: adminUid,
        }),
      });
      // System notification to applicant
      if (v.applicantUid) {
        try {
          await addDoc(collection(db, 'notifications', v.applicantUid, 'system'), {
            type: 'verification_info_request',
            title: 'More info requested for your verification',
            body: requestInfoMsg || 'An admin requested more information to complete your verification.',
            link: '/staff/verification',
            unread: true,
            createdAt: serverTimestamp(),
            meta: { requestId: v.id },
          });
          if (import.meta.env.DEV) {
            console.debug?.('VerifyStaff: wrote system notification', { applicantUid: v.applicantUid, requestId: v.id });
          }
        } catch (e) {
          console.error('VerifyStaff: failed to write system notification', e);
        }
      }
      if (import.meta.env.DEV) {
        console.debug?.('VerifyStaff: requestInfo updated request', { requestId: v.id, applicantUid: v.applicantUid });
      }
      setRequestingInfo(false);
      setRequestInfoMsg('');
      setSelected(null);
      alert('Info request sent.');
    } catch (err) {
      console.error('Failed to request info:', err);
      alert('Failed to request info. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  async function sendReminder(v) {
    if (!v?.id) return;
    if (processing) return;
    setProcessing(true);
    try {
      if (v.applicantUid) {
        await addDoc(collection(db, 'notifications', v.applicantUid, 'system'), {
          type: 'verification_info_reminder',
          title: 'Reminder: more info needed for your verification',
          body: 'Please respond to the admin questions to complete your verification.',
          link: '/staff/verification',
          unread: true,
          createdAt: serverTimestamp(),
          meta: { requestId: v.id },
        });
        if (import.meta.env.DEV) {
          console.debug?.('VerifyStaff: sent reminder notification', { applicantUid: v.applicantUid, requestId: v.id });
        }
      }
      alert('Reminder sent.');
    } catch (err) {
      console.error('Failed to send reminder:', err);
      alert('Failed to send reminder. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 mx-auto w-full max-w-7xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Verification Queue</h1>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by email or store name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-64 rounded border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
          <select
            className="h-10 rounded border border-gray-300 px-3 text-sm focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="needs_info">Needs info</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Store</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Auto Score</th>
              <th className="px-4 py-3">Geo</th>
              <th className="px-4 py-3">Roster</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Photo</th>
              <th className="px-4 py-3">Code Img</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => {
              const codeImg = v.codeImageUrl || v.photoUrl || '';
              const img = v.photoRedactedUrl || v.photoUrl || '';
              const reasons = v.reasons || [];
              const rosterBadge = reasons.includes('ROSTER_EMAIL_MATCH') ? 'email' : (reasons.includes('ROSTER_NAME_MATCH') ? 'name' : 'none');
              const geoBadge = v.distance_m == null ? 'nogps' : (v.distance_m <= 250 ? 'match' : v.distance_m <= 800 ? 'near' : 'far');
              const openRow = () => { setSelected(v); setZoomPhoto(false); setZoomCode(false); };
              const onRowKey = (e) => {
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                  e.preventDefault();
                  openRow();
                }
              };
              return (
                <tr
                  key={v.id}
                  className="cursor-pointer hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                  onClick={openRow}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open details for ${v.applicantName}`}
                  onKeyDown={onRowKey}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{v.applicantName}</td>
                  <td className="px-4 py-3 text-gray-700">{v.applicantEmail || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{v.storeName || '—'}</td>
                  <td className="px-4 py-3 font-mono">{v.submittedCodeText || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{fmt(v.submittedAt)}</td>
                  <td className="px-4 py-3 text-gray-900">{v.autoScore ?? '—'}</td>
                  <td className="px-4 py-3">
                    {geoBadge === 'match' && <span className="inline-flex rounded-full bg-green-100 text-green-800 px-2 py-0.5 text-xs">Match</span>}
                    {geoBadge === 'near' && <span className="inline-flex rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs">Near</span>}
                    {geoBadge === 'far' && <span className="inline-flex rounded-full bg-red-100 text-red-800 px-2 py-0.5 text-xs">Out</span>}
                    {geoBadge === 'nogps' && <span className="inline-flex rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs">No GPS</span>}
                  </td>
                  <td className="px-4 py-3">
                    {rosterBadge === 'email' && <span className="inline-flex rounded-full bg-green-100 text-green-800 px-2 py-0.5 text-xs">Email</span>}
                    {rosterBadge === 'name' && <span className="inline-flex rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs">Name</span>}
                    {rosterBadge === 'none' && <span className="inline-flex rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs">None</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      v.status === 'approved' ? 'bg-green-100 text-green-800' : v.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {v.status || 'pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {img ? (
                      <img src={img} alt={`Photo of ${v.applicantName}`} className="h-24 w-24 rounded object-cover" />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded bg-gray-100 text-xs text-gray-500">No photo</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {codeImg ? (
                      <img src={codeImg} alt={`Code image for ${v.applicantName}`} className="h-24 w-24 rounded object-cover" />
                    ) : (
                      <span className="inline-flex rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">No code image</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {loading && (
              <tr>
                <td className="px-4 py-8 text-center text-gray-500" colSpan={11}>Loading verification requests...</td>
              </tr>
            )}
            {loadError && (
              <tr>
                <td className="px-4 py-8 text-center text-red-600" colSpan={11}>{loadError}</td>
              </tr>
            )}
            {!loading && !loadError && filtered.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-gray-500" colSpan={11}>No verification requests found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setZoomPhoto(false); setZoomCode(false); setRequestingInfo(false); setRequestInfoMsg(''); } }}>
        <DialogContent className="w-[95vw] sm:w-auto max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Verification Detail</DialogTitle>
            <DialogDescription>Review submission and take action</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-6">
              {(() => {
                // Derived geo calcs as fallback if Cloud Function hasn't populated yet
                const storeLat = storeInfo?.storeLoc?.lat;
                const storeLng = storeInfo?.storeLoc?.lng;
                const selLat = (selected.deviceLoc?.lat ?? selected.gps?.lat ?? selected.metadata?.geolocation?.latitude ?? null);
                const selLng = (selected.deviceLoc?.lng ?? selected.gps?.lng ?? selected.metadata?.geolocation?.longitude ?? null);
                let derivedDistance = null;
                if (storeLat != null && storeLng != null && selLat != null && selLng != null) {
                  const a = { lat: Number(selLat), lng: Number(selLng) };
                  const b = { lat: Number(storeLat), lng: Number(storeLng) };
                  const d = metersBetween(a, b);
                  if (Number.isFinite(d)) derivedDistance = d;
                }
                // 100 @ <=50m, linear to 0 @ >=1500m
                let derivedScore = null;
                if (derivedDistance != null) {
                  const d = derivedDistance;
                  if (d <= 50) derivedScore = 100;
                  else if (d >= 1500) derivedScore = 0;
                  else derivedScore = Math.max(0, Math.round(100 * (1 - (d - 50) / (1500 - 50))));
                }
                // Expose to scoped variables by mutating a shallow copy of selected for render-only usage
                selected.__derivedDistance = derivedDistance;
                selected.__derivedScore = derivedScore;
                return null;
              })()}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm font-medium mb-1">Photo</div>
                  {(selected.photoRedactedUrl || selected.photoUrl) ? (
                    <img
                      src={selected.photoRedactedUrl || selected.photoUrl}
                      alt={`Photo of ${selected.applicantName}`}
                      onClick={() => setZoomPhoto((z) => !z)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); setZoomPhoto((z) => !z); } }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Toggle zoom of photo for ${selected.applicantName}`}
                      className={`w-full rounded border object-contain focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${zoomPhoto ? 'max-h-[80vh] cursor-zoom-out' : 'max-h-96 cursor-zoom-in'}`}
                    />
                  ) : (
                    <div className="rounded bg-gray-100 p-3 text-sm text-gray-600">No photo</div>
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Code Image</div>
                  {selected.codeImageUrl || selected.photoUrl ? (
                    <img
                      src={selected.codeImageUrl || selected.photoUrl}
                      alt={`Code image for ${selected.applicantName}`}
                      onClick={() => setZoomCode((z) => !z)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); setZoomCode((z) => !z); } }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Toggle zoom of code image for ${selected.applicantName}`}
                      className={`w-full rounded border object-contain focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${zoomCode ? 'max-h-[80vh] cursor-zoom-out' : 'max-h-96 cursor-zoom-in'}`}
                    />
                  ) : (
                    <span className="inline-flex rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">No code image</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Name" value={selected.applicantName} />
                <Field label="Email" value={selected.applicantEmail} />
                <Field label="Store Name" value={selected.storeName} />
                <Field label="Store ID" value={selected.storeId || '—'} />
                <Field label="Store Address" value={selected.storeAddress || '—'} />
                <Field label="Submitted Code" value={selected.submittedCodeText || '—'} mono />
                <Field label="Submitted At" value={fmt(selected.submittedAt)} />
                <Field label="Status" value={selected.status} />
              </div>

              {/* Signals Section */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded border p-3">
                  <div className="text-sm font-medium mb-2">Store</div>
                  <div className="text-sm text-gray-700">{storeInfo?.storeName || selected.storeName || '—'}</div>
                  <div className="text-xs text-gray-600">Address: {storeInfo?.storeAddressText || '—'}</div>
                  <div className="text-xs text-gray-600">Lat/Lng: {storeInfo?.storeLoc?.lat ?? '—'}, {storeInfo?.storeLoc?.lng ?? '—'}</div>
                  {storeInfo?.storeLoc?.lat != null && storeInfo?.storeLoc?.lng != null && (
                    <a
                      href={`https://maps.google.com/?q=${storeInfo.storeLoc.lat},${storeInfo.storeLoc.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-xs text-blue-600 hover:underline"
                    >
                      Store on Google Maps
                    </a>
                  )}
                </div>
                <div className="rounded border p-3">
                  <div className="text-sm font-medium mb-2">GPS</div>
                  <div className="text-sm text-gray-700">Lat/Lng: {(selected.deviceLoc?.lat ?? selected.gps?.lat) ?? '—'}, {(selected.deviceLoc?.lng ?? selected.gps?.lng) ?? '—'}</div>
                  <div className="text-sm text-gray-700">Distance: { (selected.distance_m ?? selected.__derivedDistance) != null ? `${(selected.distance_m ?? selected.__derivedDistance)} m` : '—'}</div>
                  {(selected.deviceLoc?.lat ?? selected.gps?.lat) != null &&
                   (selected.deviceLoc?.lng ?? selected.gps?.lng) != null && (
                    <a
                      href={`https://maps.google.com/?q=${(selected.deviceLoc?.lat ?? selected.gps?.lat)},${(selected.deviceLoc?.lng ?? selected.gps?.lng)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-xs text-blue-600 hover:underline"
                    >
                      Open in Google Maps
                    </a>
                  )}
                </div>
                <div className="rounded border p-3 md:col-span-2">
                  <div className="text-sm font-medium mb-2">Auto Score</div>
                  <div className="h-3 w-full rounded bg-gray-100">
                    <div
                      className={`h-3 rounded ${
                        ((selected.autoScore ?? selected.__derivedScore ?? 0) >= 85) ? 'bg-green-500' : ((selected.autoScore ?? selected.__derivedScore ?? 0) >= 50) ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, (selected.autoScore ?? selected.__derivedScore ?? 0)))}%` }}
                    />
                  </div>
                  <div className="mt-2 text-sm">Score: {selected.autoScore ?? selected.__derivedScore ?? 0}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(selected.reasons || []).map((r, i) => (
                      <span key={i} className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{r}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Questions history */}
              <div className="rounded border p-3">
                <div className="text-sm font-medium mb-2">Questions history</div>
                {Array.isArray(selected.infoRequests) && selected.infoRequests.length > 0 ? (
                  <ul className="space-y-2">
                    {[...selected.infoRequests]
                      .sort((a,b) => {
                        const ad = a?.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a?.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
                        const bd = b?.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b?.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
                        return bd - ad;
                      })
                      .map((it, idx) => (
                        <li key={idx} className="rounded bg-gray-50 p-2">
                          <div className="text-sm text-gray-900">{it?.message || '(no message)'}</div>
                          <div className="mt-0.5 text-xs text-gray-600">
                            {it?.createdAt?.toDate ? it.createdAt.toDate().toLocaleString?.() : ''}
                            {it?.adminUid ? ` · by ${it.adminUid}` : ''}
                          </div>
                        </li>
                      ))}
                  </ul>
                ) : (
                  // Backfill legacy single message (do not write; display only)
                  (selected.infoRequestMessage ? (
                    <div className="rounded bg-gray-50 p-2">
                      <div className="text-sm text-gray-900">{selected.infoRequestMessage}</div>
                      <div className="mt-0.5 text-xs text-gray-600">{selected.infoRequestedAt ? selected.infoRequestedAt.toLocaleString?.() : ''}</div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">No questions yet.</div>
                  ))
                )}
              </div>

              {/* Staff responses */}
              <div className="rounded border p-3">
                <div className="text-sm font-medium mb-2">Staff responses</div>
                {(!messages || messages.length === 0) ? (
                  <div className="text-sm text-gray-600">No replies yet.</div>
                ) : (
                  <ul className="space-y-2">
                    {messages.map((m) => (
                      <li key={m.id} className="rounded bg-gray-50 p-2 border border-gray-200">
                        <div className="text-sm text-gray-900">{m.message || ''}</div>
                        <div className="mt-0.5 text-xs text-gray-600">{m.createdAt?.toDate ? m.createdAt.toDate().toLocaleString?.() : ''}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded border px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Close
                </button>
                {(selected.status === 'pending' || selected.status === 'needs_info') && !requestingInfo && (
                  <>
                    <button
                      type="button"
                      onClick={() => setRequestingInfo(true)}
                      className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
                    >
                      {selected.status === 'needs_info' ? 'Ask Follow-up' : 'Request Info'}
                    </button>
                    <button
                      type="button"
                      onClick={() => sendReminder(selected)}
                      disabled={processing}
                      className="rounded border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? 'Sending…' : 'Send Reminder'}
                    </button>
                    <button
                      type="button"
                      onClick={() => approve(selected)}
                      disabled={processing}
                      className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? 'Processing…' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setRejecting(true); }}
                      disabled={processing}
                      className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? 'Processing…' : 'Reject'}
                    </button>
                  </>
                )}

                {(selected.status === 'pending' || selected.status === 'needs_info') && requestingInfo && (
                  <div className="w-full">
                    <div className="mb-2 text-sm font-medium text-gray-700">Message to applicant (optional)</div>
                    <textarea
                      value={requestInfoMsg}
                      onChange={(e) => setRequestInfoMsg(e.target.value)}
                      rows={3}
                      className="w-full rounded border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      placeholder="Please provide a clearer photo showing the code and your name tag..."
                    />
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => { setRequestingInfo(false); setRequestInfoMsg(''); }}
                        className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => requestInfo(selected)}
                        disabled={processing}
                        className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processing ? 'Sending...' : 'Send Request'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Localized Reject Modal */}
      <Dialog open={rejecting} onOpenChange={(o) => { setRejecting(o); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{strings.REJECT_TITLE}</DialogTitle>
            <DialogDescription>{strings.REJECT_BODY}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Reason</label>
            <select
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            >
              <option value="LOCATION_FAR">Location far</option>
              <option value="LOCATION_MISSING">Location missing</option>
              <option value="CODE_INVALID">Code invalid</option>
              <option value="FACE_NOT_VISIBLE">Face not visible</option>
              <option value="BLURRY">Blurry/Dark</option>
              <option value="MULTIPLE_PEOPLE">Multiple people</option>
              <option value="TIME_WINDOW">Time window</option>
              <option value="ROSTER_MISMATCH">Roster mismatch</option>
              <option value="IMAGE_EDIT">Edited/Upload</option>
              <option value="OTHER">Other</option>
            </select>
            {(() => {
              const { reason, fix } = getReasonText(admin?.locale, rejectReason, { distance_m: selected?.distance_m ?? undefined });
              return (
                <div className="rounded bg-gray-50 border border-gray-200 p-3 text-sm">
                  {reason && <p className="text-gray-900 mb-1">{reason}</p>}
                  {fix && <p className="text-gray-700">{fix}</p>}
                </div>
              );
            })()}
            <a
              href="/staff/dashboard/verification"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs text-blue-600 hover:underline"
            >
              {strings.REJECT_LINK_REQUIREMENTS}
            </a>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setRejecting(false)}
              className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => { const v = selected; const reason = rejectReason; setRejecting(false); reject(v, reason); }}
              disabled={processing}
              className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {strings.REJECT_BUTTON}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Render a labeled value pair for display in detail views.
 * @param {{label: string, value: any, mono?: boolean}} props
 * @param {string} props.label - The label text shown above the value.
 * @param {any} props.value - The value to display; if falsy, displays '—'.
 * @param {boolean} [props.mono] - When true, render the value using a monospaced font.
 * @returns {JSX.Element} The rendered element containing the label and value.
 */
function Field({ label, value, mono }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-600">{label}</div>
      <div className={`mt-1 text-sm ${mono ? 'font-mono' : ''}`}>{value || '—'}</div>
    </div>
  );
}