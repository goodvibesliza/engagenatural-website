import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/auth-context';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default function CommunitiesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  /* ------------------------------------------------------------------
     Brand-scoped communities (managed by brand managers)
  ------------------------------------------------------------------ */
  const [brandCommunities, setBrandCommunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Listen for brand communities whenever user.brandId is available
  useEffect(() => {
    if (!user?.brandId) return;

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'communities'),
      where('brandId', '==', user.brandId),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setBrandCommunities(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        );
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => typeof unsub === 'function' && unsub();
  }, [user?.brandId]);

  // Community catalogue – “What’s Good” is open; others need verification
  const communities = [
    {
      id: 'whats-good',
      name: "What's Good",
      description: 'Open community for all users',
      requiresVerification: false
    },
    {
      id: 'supplement-scoop',
      name: 'Supplement Scoop',
      description: 'Insider intel from supplement pros',
      requiresVerification: true
    },
    {
      id: 'fresh-finds',
      name: 'Fresh Finds',
      description: 'Latest natural/organic product trends',
      requiresVerification: true
    },
    {
      id: 'good-vibes',
      name: 'Good Vibes',
      description: 'Connect with high-performing retailers',
      requiresVerification: true
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Communities</h1>
        <p className="text-gray-600 mt-1">
          Connect with fellow retail professionals and access exclusive content
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">
          <span className="font-medium">Verification Required:</span> Most communities require verification to join. 
          The "What's Good" community is available to all users.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Available Communities</h2>
        
        <div className="divide-y divide-gray-200 border border-gray-200 rounded-lg">
          {communities.map((community) => {
            const canAccess =
              !community.requiresVerification ||
              user?.verificationStatus === 'approved' ||
              user?.verified === true;

            return (
            <div key={community.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-900">{community.name}</h3>
                  <p className="text-sm text-gray-600">{community.description}</p>
                </div>
                {canAccess ? (
                  <button
                    onClick={() => navigate(`/community/${community.id}`)}
                    className="text-sm px-3 py-1.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-md"
                  >
                    View
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/staff/verification')}
                    className="text-sm px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-md"
                  >
                    Get Verified
                  </button>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* -------------------- Brand Communities -------------------- */}
      {loading && (
        <div className="text-center text-gray-500 py-4">Loading brand communities…</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded my-4">
          {error}
        </div>
      )}

      {!loading && !error && brandCommunities.length > 0 && (
        <div className="space-y-4 mt-8">
          <h2 className="text-xl font-semibold text-gray-800">Brand Communities</h2>

          <div className="divide-y divide-gray-200 border border-gray-200 rounded-lg">
            {brandCommunities.map((bc) => (
              <div key={bc.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {bc.name || 'Untitled'}
                    </h3>
                    {bc.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {bc.description}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => navigate(`/community/${bc.id}`)}
                    className="text-sm px-3 py-1.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-md"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
