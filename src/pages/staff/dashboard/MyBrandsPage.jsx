import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/auth-context';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default function MyBrandsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const useEmulator = import.meta.env.VITE_USE_EMULATOR === 'true';
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Following state
  const [follows, setFollows] = useState([]);
  const [followingDetails, setFollowingDetails] = useState({});
  
  // Track pending follow/unfollow operations
  const [pendingFollowIds, setPendingFollowIds] = useState(new Set());
  
  // Refs for cleanup
  const detailsUnsubRefs = useRef({});

  // Load initial brands and handle search
  useEffect(() => {
    const loadBrands = async () => {
      setSearchLoading(true);
      try {
        const brandsQuery = query(
          collection(db, 'brands'),
          orderBy('name'),
          limit(20)
        );
        
        const snapshot = await getDocs(brandsQuery);
        const brandsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Filter by search query if provided
        const filteredBrands = searchQuery 
          ? brandsData.filter(brand => 
              brand.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              brand.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              brand.description?.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : brandsData;
        
        // De-duplicate brands by id or name (case-insensitive)
        const seenKeys = new Set();
        const dedupedBrands = filteredBrands.filter(brand => {
          const key = (brand.id || brand.name || '').toLowerCase();
          if (seenKeys.has(key)) return false;
          seenKeys.add(key);
          return true;
        });
        
        // Create inline SVG data URI for logos
        const inlineLogo = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100%' height='100%' fill='%23e5e7eb'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-size='12'>CWC</text></svg>";
        
        // Check if we need to add the example brand
        const hasExampleBrand = dedupedBrands.some(b => 
          b.id?.toLowerCase() === 'calm-well-co' || 
          b.name?.toLowerCase() === 'calm well co'
        );
        
        if (!hasExampleBrand) {
          dedupedBrands.push({
            id: 'calm-well-co',
            name: 'Calm Well Co',
            description: 'Natural wellness and CBD products',
            category: 'Wellness',
            logo: inlineLogo,
            isExample: true
          });
        }
        
        setBrands(dedupedBrands);
      } catch (err) {
        console.error('Error loading brands:', err);
        // Fallback to example brand if error
        const inlineLogo = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100%' height='100%' fill='%23e5e7eb'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-size='12'>CWC</text></svg>";
        
        setBrands([{
          id: 'calm-well-co',
          name: 'Calm Well Co',
          description: 'Natural wellness and CBD products',
          category: 'Wellness',
          logo: inlineLogo,
          isExample: true
        }]);
      } finally {
        setSearchLoading(false);
        setLoading(false);
      }
    };
    
    loadBrands();
  }, [searchQuery]);
  
  // Subscribe to user's followed brands
  useEffect(() => {
    if (!user?.uid) return;
    
    const followsQuery = query(
      collection(db, 'brand_follows'),
      where('userId', '==', user.uid)
    );
    
    const loadFollows = async () => {
      try {
        const snapshot = await getDocs(followsQuery);
        const followsData = snapshot.docs.map(d => d.data());
        setFollows(followsData);
      } catch (err) {
        console.error('Error loading follows:', err);
        setFollows([]);
      }
    };
    
    loadFollows();
    
    return () => {
      // No-op cleanup since we're not using a listener
    };
  }, [user]);
  
  // Load details for each followed brand
  useEffect(() => {
    // Clean up previous subscriptions
    Object.values(detailsUnsubRefs.current).forEach(unsubs => {
      Object.values(unsubs).forEach(unsub => {
        if (typeof unsub === 'function') {
          unsub();
        }
      });
    });
    detailsUnsubRefs.current = {};
    
    if (!follows.length) return;
    
    // Initialize details state for each brand
    const initialDetails = {};
    follows.forEach(follow => {
      initialDetails[follow.brandId] = {
        communities: [],
        trainings: [],
        challenges: [],
        loading: true
      };
    });
    setFollowingDetails(initialDetails);
    
    // Subscribe to details for each brand
    follows.forEach(follow => {
      const brandId = follow.brandId;
      detailsUnsubRefs.current[brandId] = {};
      
      // Get communities
      const communitiesQuery = query(
        collection(db, 'communities'),
        where('brandId', '==', brandId),
        // must satisfy security rules: only public & active communities
        where('isPublic', '==', true),
        where('isActive', '==', true),
        limit(5)
      );
      
      // Get trainings
      const trainingsQuery = query(
        collection(db, 'trainings'),
        where('brandId', '==', brandId),
        limit(5)
      );
      
      // Get challenges
      const challengesQuery = query(
        collection(db, 'challenges'),
        where('brandId', '==', brandId),
        limit(5)
      );
      
      if (useEmulator) {
        // Use Promise.all to fetch all data in parallel
        (async () => {
          try {
            const [comSnap, trSnap, chSnap] = await Promise.all([
              getDocs(communitiesQuery),
              getDocs(trainingsQuery),
              getDocs(challengesQuery)
            ]);
            
            const communitiesData = comSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            const trainingsData = trSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })).filter(t => t.published !== false); // keep if published missing or true
            
            const challengesData = chSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            // Update state once with all data
            setFollowingDetails(prev => ({
              ...prev,
              [brandId]: {
                ...prev[brandId],
                communities: communitiesData,
                trainings: trainingsData,
                challenges: challengesData,
                loading: false
              }
            }));
          } catch (err) {
            console.error(`Error loading data for brand ${brandId}:`, err);
            // Set loading to false even on error
            setFollowingDetails(prev => ({
              ...prev,
              [brandId]: {
                ...prev[brandId],
                loading: false
              }
            }));
          }
        })();
      } else {
        detailsUnsubRefs.current[brandId].communities = onSnapshot(
          communitiesQuery,
          (snapshot) => {
            const communitiesData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            setFollowingDetails(prev => ({
              ...prev,
              [brandId]: {
                ...prev[brandId],
                communities: communitiesData
              }
            }));
          },
          (err) => {
            console.error(`Error loading communities for ${brandId}:`, err);
          }
        );
        
        detailsUnsubRefs.current[brandId].trainings = onSnapshot(
          trainingsQuery,
          (snapshot) => {
            const trainingsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })).filter(t => t.published !== false); // keep if published missing or true
            
            setFollowingDetails(prev => ({
              ...prev,
              [brandId]: {
                ...prev[brandId],
                trainings: trainingsData
              }
            }));
          },
          (err) => {
            console.error(`Error loading trainings for ${brandId}:`, err);
          }
        );
        
        detailsUnsubRefs.current[brandId].challenges = onSnapshot(
          challengesQuery,
          (snapshot) => {
            const challengesData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            setFollowingDetails(prev => ({
              ...prev,
              [brandId]: {
                ...prev[brandId],
                challenges: challengesData,
                loading: false
              }
            }));
          },
          (err) => {
            console.error(`Error loading challenges for ${brandId}:`, err);
            // Still mark as loaded even if there was an error
            setFollowingDetails(prev => ({
              ...prev,
              [brandId]: {
                ...prev[brandId],
                loading: false
              }
            }));
          }
        );
      }
    });
    
    return () => {
      // Clean up all subscriptions on unmount
      Object.values(detailsUnsubRefs.current).forEach(unsubs => {
        Object.values(unsubs).forEach(unsub => {
          if (typeof unsub === 'function') {
            unsub();
          }
        });
      });
    };
  }, [follows, useEmulator]);
  
  // Follow brand with optimistic updates
  const followBrand = async (brand) => {
    if (!user?.uid) {
      alert('You need to be logged in to follow brands');
      return;
    }
    
    const brandId = brand.id;
    // Add to pending set
    setPendingFollowIds(prev => {
      const newSet = new Set(prev);
      newSet.add(brandId);
      return newSet;
    });
    
    // Get a safe brand name with fallback
    const brandName = brand.name || brand.displayName || 'Unknown Brand';
    
    // Create follow data
    const followData = {
      brandId: brandId,
      brandName: brandName,
      userId: user.uid,
      createdAt: serverTimestamp()
    };
    
    const followId = `${user.uid}_${brandId}`;
    
    // Optimistically add to follows
    const isAlreadyFollowing = follows.some(f => f.brandId === brandId);
    if (!isAlreadyFollowing) {
      setFollows(prev => [...prev, followData]);
    }
    
    try {
      await setDoc(doc(db, 'brand_follows', followId), followData);
      console.log(`Successfully followed brand: ${brandName}`);
    } catch (err) {
      console.error('Error following brand:', err);
      
      // Roll back optimistic update on error
      if (!isAlreadyFollowing) {
        setFollows(prev => prev.filter(f => f.brandId !== brandId));
      }
      
      alert('Failed to follow brand. Please try again.');
    } finally {
      // Remove from pending set
      setPendingFollowIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(brandId);
        return newSet;
      });
    }
  };
  
  // Unfollow brand with optimistic updates
  const unfollowBrand = async (brandId) => {
    if (!user?.uid) return;
    
    // Add to pending set
    setPendingFollowIds(prev => {
      const newSet = new Set(prev);
      newSet.add(brandId);
      return newSet;
    });
    
    // Store current follows for potential rollback
    const currentFollows = [...follows];
    
    // Optimistically remove from follows
    setFollows(prev => prev.filter(follow => follow.brandId !== brandId));
    
    const followId = `${user.uid}_${brandId}`;
    try {
      await deleteDoc(doc(db, 'brand_follows', followId));
      console.log(`Successfully unfollowed brand: ${brandId}`);
    } catch (err) {
      console.error('Error unfollowing brand:', err);
      
      // Roll back optimistic update on error
      setFollows(currentFollows);
      
      alert('Failed to unfollow brand. Please try again.');
    } finally {
      // Remove from pending set
      setPendingFollowIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(brandId);
        return newSet;
      });
    }
  };
  
  // Check if a brand is followed
  const isFollowing = (brandId) => {
    return follows.some(follow => follow.brandId === brandId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Brands</h1>
        <p className="text-gray-600 mt-1">
          Find and explore brands, access challenges and exclusive content
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search brands by name, category, or keyword..."
          className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <span role="img" aria-label="search">🔍</span>
        </div>
      </div>

      {/* Brands List Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Available Brands</h2>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary"></div>
          </div>
        ) : brands.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map(brand => (
              <div 
                key={brand.id} 
                className={`border rounded-lg p-4 ${brand.id === 'calm-well-co' ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-200'}`}
              >
                <div className="flex items-start">
                  {brand.logo ? (
                    <img 
                      src={brand.logo} 
                      alt={`${brand.name} logo`} 
                      className="w-12 h-12 object-contain rounded mr-3"
                      onError={(e) => {
                        e.target.onerror = null;
                        const inlineLogo = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100%' height='100%' fill='%23e5e7eb'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-size='12'>CWC</text></svg>";
                        e.target.src = inlineLogo;
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center mr-3">
                      <span className="text-gray-500 text-xs">{brand.name?.substring(0, 2) || 'BR'}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{brand.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{brand.description || 'No description available'}</p>
                    {brand.category && (
                      <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {brand.category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  {isFollowing(brand.id) ? (
                    <button
                      onClick={() => unfollowBrand(brand.id)}
                      disabled={pendingFollowIds.has(brand.id)}
                      className={`text-sm px-3 py-1.5 ${
                        pendingFollowIds.has(brand.id)
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      } rounded`}
                    >
                      {pendingFollowIds.has(brand.id) ? 'Processing...' : 'Unfollow'}
                    </button>
                  ) : (
                    <button
                      onClick={() => followBrand(brand)}
                      disabled={pendingFollowIds.has(brand.id)}
                      className={`text-sm px-3 py-1.5 ${
                        pendingFollowIds.has(brand.id)
                          ? 'bg-brand-primary/50 cursor-not-allowed'
                          : 'bg-brand-primary hover:bg-brand-primary/90'
                      } text-white rounded`}
                    >
                      {pendingFollowIds.has(brand.id) ? 'Processing...' : 'Follow'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-500">
              No brands found matching your search
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Try a different search term or browse all brands
            </p>
          </div>
        )}
      </div>

      {/* Following Section */}
      {follows.length > 0 && (
        <div className="space-y-4 mt-8">
          <h2 className="text-xl font-semibold text-gray-800">Following</h2>
          
          {follows.map(follow => {
            const details = followingDetails[follow.brandId];
            return (
              <div key={follow.brandId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">{follow.brandName}</h3>
                  <button
                    onClick={() => unfollowBrand(follow.brandId)}
                    disabled={pendingFollowIds.has(follow.brandId)}
                    className={`text-xs px-2 py-1 ${
                      pendingFollowIds.has(follow.brandId)
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {pendingFollowIds.has(follow.brandId) ? 'Processing...' : 'Unfollow'}
                  </button>
                </div>
                
                {details?.loading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-brand-primary"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Communities */}
                    <div className="border border-gray-100 rounded p-3">
                      <h4 className="font-medium mb-2">Communities</h4>
                      {details?.communities?.length > 0 ? (
                        <div className="space-y-2">
                          {details.communities.map(community => (
                            <Link
                              key={community.id}
                              to={`/community/${community.id}`}
                              className="block text-sm px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded text-brand-primary"
                            >
                              {community.name || 'Unnamed Community'}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No communities available</p>
                      )}
                    </div>
                    
                    {/* Learning */}
                    <div className="border border-gray-100 rounded p-3">
                      <h4 className="font-medium mb-2">Learning</h4>
                      {details?.trainings?.length > 0 ? (
                        <div className="space-y-2">
                          {details.trainings.map(training => (
                            <Link
                              key={training.id}
                              to={`/staff/trainings/${training.id}`}
                              className="block text-sm px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded text-brand-primary"
                            >
                              {training.title || 'Unnamed Training'}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No trainings available</p>
                      )}
                    </div>
                    
                    {/* Challenges */}
                    <div className="border border-gray-100 rounded p-3">
                      <h4 className="font-medium mb-2">Challenges</h4>
                      {details?.challenges?.length > 0 ? (
                        <div className="space-y-2">
                          {details.challenges.map(challenge => (
                            <div
                              key={challenge.id}
                              className="text-sm px-3 py-2 bg-gray-50 rounded"
                            >
                              {challenge.title || 'Unnamed Challenge'}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No challenges available</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Challenges Section - show only if no follows */}
      {follows.length === 0 && (
        <div className="space-y-4 mt-8">
          <h2 className="text-xl font-semibold text-gray-800">Brand Challenges</h2>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-500">
              Complete challenges to earn points and advance your career
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Follow brands to see their challenges here
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
