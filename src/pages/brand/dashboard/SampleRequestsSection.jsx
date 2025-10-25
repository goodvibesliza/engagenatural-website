import React, { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const renderStatusBadge = (status) => {
  let color = '';
  switch (status) {
    case 'pending':
      color = 'bg-yellow-100 text-yellow-800';
      break;
    case 'approved':
      color = 'bg-blue-100 text-blue-800';
      break;
    case 'shipped':
      color = 'bg-green-100 text-green-800';
      break;
    case 'denied':
      color = 'bg-red-100 text-red-800';
      break;
    case 'completed':
      color = 'bg-green-100 text-green-800';
      break;
    case 'in_progress':
      color = 'bg-blue-100 text-blue-800';
      break;
    default:
      color = 'bg-gray-100 text-gray-800';
  }
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>{status?.replace('_', ' ') ?? 'unknown'}</span>;
};

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
};

export default function SampleRequestsSection({ brandId }) {
  const [sampleRequests, setSampleRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!brandId) return;
    const q = query(
      collection(db, 'sample_requests'),
      where('brandId', '==', brandId),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        try {
          setSampleRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          setLoading(false);
        } catch (e) {
          console.error(e);
          setError(e.message);
          setLoading(false);
        }
      },
      (err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [brandId]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Sample Requests</h1>
        <p className="text-gray-500 dark:text-gray-400">Review and manage all sample requests for your brand</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-6 rounded-md">
          <p>Error loading sample requests: {error}</p>
        </div>
      ) : sampleRequests.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-6 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-gray-900 dark:text-gray-100 font-medium mb-1">No Sample Requests</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">You don't have any sample requests yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sampleRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{req.quantity}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(req.createdAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">{renderStatusBadge(req.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
