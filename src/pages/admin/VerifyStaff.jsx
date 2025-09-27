// src/pages/admin/VerifyStaff.jsx
import { useEffect, useState } from "react";
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

export default function VerifyStaff() {
  const [pending, setPending] = useState([]);

  useEffect(() => {
    // show both pending + unverified false
    const q = query(
      collection(db, "users"),
      where("verified", "in", [false, null])
    );

    const unsub = onSnapshot(q, (snap) => {
      const rows = [];
      snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
      // prioritize explicit "pending" status first
      rows.sort((a, b) => (a.verificationStatus === "pending" ? -1 : 1));
      setPending(rows);
    });

    return () => unsub();
  }, []);

  async function approveUser(uid) {
    const ref = doc(db, "users", uid);
    await updateDoc(ref, {
      verified: true,
      verificationStatus: "verified",
      updatedAt: serverTimestamp(),
    });
    // No manual refresh required; the user's own session gets the change via onSnapshot in auth-context.
  }

  async function rejectUser(uid) {
    const ref = doc(db, "users", uid);
    await updateDoc(ref, {
      verified: false,
      verificationStatus: "rejected",
      updatedAt: serverTimestamp(),
    });
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Verify Staff</h1>
      {pending.length === 0 ? (
        <div className="text-gray-600">No pending users.</div>
      ) : (
        <div className="space-y-3">
          {pending.map((u) => (
            <div key={u.id} className="flex items-center justify-between border rounded p-3">
              <div className="text-sm">
                <div className="font-semibold">{u.firstName} {u.lastName}</div>
                <div className="text-gray-600">{u.email}</div>
                <div className="text-gray-600">
                  Role: {u.role || "staff"} | Status: {u.verificationStatus || "pending"}
                </div>
                {u.brandId && <div className="text-gray-600">Brand: {u.brandId}</div>}
                {u.storeName && <div className="text-gray-600">Store: {u.storeName}</div>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => approveUser(u.uid || u.id)}
                  className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => rejectUser(u.uid || u.id)}
                  className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
