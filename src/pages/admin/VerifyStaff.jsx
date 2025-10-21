// src/pages/admin/VerifyStaff.jsx (super_admin review UI for verification requests)
import { useEffect, useMemo, useState } from "react";
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

export default function VerifyStaff() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [zoomPhoto, setZoomPhoto] = useState(false);
  const [zoomCode, setZoomCode] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'verification_requests'), orderBy('submittedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
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
        };
      });
      setItems(rows);
    });
    return () => unsub();
  }, []);

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
    // Preserve existing business logic: update the user doc as before
    await updateDoc(doc(db, 'users', v.applicantUid), {
      verified: true,
      verificationStatus: 'approved',
      updatedAt: serverTimestamp(),
    });
    // Also reflect status on the request document for UI consistency (non-breaking)
    try {
      await updateDoc(doc(db, 'verification_requests', v.id), {
        status: 'approved',
        reviewedAt: serverTimestamp(),
      });
    } catch {}
  }

  async function reject(v) {
    if (!v?.applicantUid) return;
    await updateDoc(doc(db, 'users', v.applicantUid), {
      verified: false,
      verificationStatus: 'rejected',
      updatedAt: serverTimestamp(),
    });
    try {
      await updateDoc(doc(db, 'verification_requests', v.id), {
        status: 'rejected',
        reviewedAt: serverTimestamp(),
      });
    } catch {}
  }

  return (
    <div className="p-6">
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
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Photo</th>
              <th className="px-4 py-3">Code Img</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => {
              const codeImg = v.codeImageUrl || v.photoUrl || '';
              return (
                <tr key={v.id} className="cursor-pointer hover:bg-gray-50" onClick={() => { setSelected(v); setZoomPhoto(false); setZoomCode(false); }}>
                  <td className="px-4 py-3 font-medium text-gray-900">{v.applicantName}</td>
                  <td className="px-4 py-3 text-gray-700">{v.applicantEmail || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{v.storeName || '—'}</td>
                  <td className="px-4 py-3 font-mono">{v.submittedCodeText || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{fmt(v.submittedAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      v.status === 'approved' ? 'bg-green-100 text-green-800' : v.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {v.status || 'pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {v.photoUrl ? (
                      <img src={v.photoUrl} alt={`Photo of ${v.applicantName}`} className="h-24 w-24 rounded object-cover" />
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
            {filtered.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-gray-500" colSpan={8}>No verification requests found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setZoomPhoto(false); setZoomCode(false); } }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Verification Detail</DialogTitle>
            <DialogDescription>Review submission and take action</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm font-medium mb-1">Photo</div>
                  {selected.photoUrl ? (
                    <img
                      src={selected.photoUrl}
                      alt={`Photo of ${selected.applicantName}`}
                      onClick={() => setZoomPhoto((z) => !z)}
                      className={`w-full rounded border object-contain ${zoomPhoto ? 'max-h-[80vh] cursor-zoom-out' : 'max-h-96 cursor-zoom-in'}`}
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
                      className={`w-full rounded border object-contain ${zoomCode ? 'max-h-[80vh] cursor-zoom-out' : 'max-h-96 cursor-zoom-in'}`}
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

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded border px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Close
                </button>
                {selected.status === 'pending' && (
                  <>
                    <button
                      type="button"
                      onClick={() => approve(selected)}
                      className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => reject(selected)}
                      className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value, mono }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-600">{label}</div>
      <div className={`mt-1 text-sm ${mono ? 'font-mono' : ''}`}>{value || '—'}</div>
    </div>
  );
}
