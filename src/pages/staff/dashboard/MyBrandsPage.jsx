import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
import { db } from '@/lib/firebase';
import TopMenuBarDesktop from '@/components/community/desktop/TopMenuBarDesktop.jsx';
import DesktopLinkedInShell from '@/layouts/DesktopLinkedInShell.jsx';
// Custom left-rail search for brands on this page
import { track } from '@/lib/analytics';

export default function MyBrandsPage() {
  const { user } = useAuth();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // page_view analytics when desktop shell is active
  useEffect(() => {
    if (import.meta.env.VITE_EN_DESKTOP_FEED_LAYOUT === 'linkedin' && isDesktop) {
      try { track('page_view', { page: 'my_brands_desktop', surface: 'community_desktop' }); } catch (err) { console.debug?.('track page_view failed (my_brands_desktop)', err); }
    }
  }, [isDesktop]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [allBrands, setAllBrands] = useState([]);
  const [displayBrands, setDisplayBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [selectedBrandName, setSelectedBrandName] = useState('');
  
  // Following state
  const [follows, setFollows] = useState([]);
  const [followingDetails, setFollowingDetails] = useState({});
  
  // Track pending follow/unfollow operations
  const [pendingFollowIds, setPendingFollowIds] = useState(new Set());
  
  // Refs for cleanup
  const followsUnsubRef = useRef(null);
  const detailsUnsubRefs = useRef({});

  // Top 3 followed for quick-pick buttons (always run hooks at top level)
  const topFollowButtons = useMemo(() => (follows || []).slice(0, 3), [follows]);

  // Load initial brands and handle search
  // Load base brand list once; filtering happens client-side
  useEffect(() => {
    const loadBrands = async () => {
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
        // Always ensure we have at least the example brand in the base set
        const hasExampleBrand = brandsData.some(b => b.id === 'calm-well-co');
        const base = hasExampleBrand ? brandsData : [
          ...brandsData,
          {
            id: 'calm-well-co',
            name: 'Calm Well Co',
            description: 'Natural wellness and CBD products',
            category: 'Wellness',
            logo: 'https://placehold.co/100x100/e5e5e5/666666?text=CWC',
            isExample: true
          }
        ];

        setAllBrands(base);
        setDisplayBrands(base);
      } catch (err) {
        console.error('Error loading brands:', err);
        // Fallback to example brand if error
        const fallback = [{
          id: 'calm-well-co',
          name: 'Calm Well Co',
          description: 'Natural wellness and CBD products',
          category: 'Wellness',
          logo: 'https://placehold.co/100x100/e5e5e5/666666?text=CWC',
          isExample: true
        }];
        setAllBrands(fallback);
        setDisplayBrands(fallback);
      } finally {
        setLoading(false);
      }
    };
    
    loadBrands();
  }, []);

  // Debounced client-side filter by name/category/keywords (case-insensitive)
  useEffect(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    const timer = setTimeout(() => {
      if (!q) {
        setDisplayBrands(allBrands);
        return;
      }
      const filtered = allBrands.filter((brand) => {
        const name = (brand.name || '').toLowerCase();
        const category = (brand.category || '').toLowerCase();
        const keywords = Array.isArray(brand.keywords)
          ? brand.keywords.join(' ').toLowerCase()
          : (brand.keywords || '').toLowerCase();
        // If nothing but name exists, fallback to name-only
        const haystack = [name];
        if (category) haystack.push(category);
        if (keywords) haystack.push(keywords);
        return haystack.some((h) => h.includes(q));
      });
      setDisplayBrands(filtered);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery, allBrands]);
  
  // Subscribe to user's followed brands
  useEffect(() => {
    if (!user?.uid) return;
    
    const followsQuery = query(
      collection(db, 'brand_follows'),
      where('userId', '==', user.uid)
    );
    
    followsUnsubRef.current = onSnapshot(
      followsQuery,
      (snapshot) => {
        const followsData = snapshot.docs.map(doc => doc.data());
        setFollows(followsData);
      },
      (err) => {
        console.error('Error loading follows:', err);
        setFollows([]);
      }
    );
    
    return () => {
      if (followsUnsubRef.current) {
        followsUnsubRef.current();
      }
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
        where('isPublic', '==', true),
        limit(5)
      );

      /* -------------------------------------------
         Communities (top-level + brand-scoped merge)
      --------------------------------------------*/

      // Local caches for merge
      let topCommunities = [];
      let nestedCommunities = [];

      // Helper to merge, dedupe, sort and update state
      const mergeAndSet = () => {
        const map = new Map();
        [...topCommunities, ...nestedCommunities].forEach((c) => {
          map.set(c.id, c);
        });
        const merged = Array.from(map.values()).sort((a, b) => {
          const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt || new Date(0);
          const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt || new Date(0);
          return bDate - aDate;
        }).slice(0, 5);

        setFollowingDetails((prev) => ({
          ...prev,
          [brandId]: {
            ...prev[brandId],
            communities: merged,
          },
        }));
      };

      // Top-level communities listener
      detailsUnsubRefs.current[brandId].communities = onSnapshot(
        communitiesQuery,
        (snapshot) => {
          topCommunities = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          mergeAndSet();
        },
        (err) => {
          console.error(`Error loading communities for ${brandId}:`, err);
        }
      );

      // Brand-scoped communities listener
      const brandScopedCommunitiesQuery = query(
        collection(db, 'brands', brandId, 'communities'),
        where('isPublic', '==', true),
        limit(5)
      );

      /* -----------------------------------------------------------
         Use one-time fetch to avoid rapid subscribe/unsubscribe
         triggering Firestore internal assertions
      ----------------------------------------------------------- */
      detailsUnsubRefs.current[brandId].communitiesScoped = () => {};

      getDocs(brandScopedCommunitiesQuery)
        .then((snapshot) => {
          nestedCommunities = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          mergeAndSet();
        })
        .catch((err) => {
          console.error(`Error loading scoped communities for ${brandId}:`, err);
        });
      
      // Get trainings
      const trainingsQuery = query(
        collection(db, 'trainings'),
        where('brandId', '==', brandId),
        where('published', '==', true),
        limit(5)
      );
      
      detailsUnsubRefs.current[brandId].trainings = onSnapshot(
        trainingsQuery,
        (snapshot) => {
          const trainingsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
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
      
      // Get challenges
      const challengesQuery = query(
        collection(db, 'challenges'),
        where('brandId', '==', brandId),
        limit(5)
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
  }, [follows]);
  
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

  const rightRail = (
    <>
      <div className="en-cd-right-title">Right Rail</div>
      <div className="en-cd-right-placeholder">(reserved)</div>
    </>
  );

  const CenterContent = () => (
    <div className="space-y-6" data-testid="mybrands-center">
      {/* Following Section first */}
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
                  <div>
                    {/* Community Pills */}
                    {details?.communities?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Link
                        to={`/community?tab=whatsGood&brand=${encodeURIComponent(follow.brandName)}&via=my_brands_link${follow.brandId ? `&brandId=${encodeURIComponent(follow.brandId)}` : ''}`}
                        onClick={() => {
                          // Track community pill click
                          if (window.analytics?.track) {
                            window.analytics.track('Community Filter Applied', {
                              brand: follow.brandName,
                              source: 'my_brands_pill',
                              user_id: user?.uid
                            });
                          }
                        }}
                        className="inline-flex items-center px-3 py-1 bg-brand-primary text-white text-sm rounded-full hover:bg-brand-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
                        title={`View ${follow.brandName} community posts`}
                      >
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                        </svg>
                        Community
                      </Link>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Communities */}
                    <div className="border border-gray-100 rounded p-3">
                      <h4 className="font-medium mb-2">Communities</h4>
                      {details?.communities?.length > 0 ? (
                        <div className="space-y-2">
                          {details.communities.map(community => (
                            <Link
                              key={community.id}
                              to={`/community?tab=whatsGood&brand=${encodeURIComponent(follow.brandName)}&via=my_brands_link${follow.brandId ? `&brandId=${encodeURIComponent(follow.brandId)}` : ''}`}
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
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Selected brand or available list */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary"></div>
          </div>
        ) : (
          <>
            {selectedBrandId ? (
              (() => {
                const fallback = { id: selectedBrandId, name: selectedBrandName, description: '', category: '', logo: '' };
                const brand = allBrands.find(b => b.id === selectedBrandId) || fallback;
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <div 
                      key={brand.id} 
                      className={`border rounded-lg p-4 flex flex-col justify-between h-full ${brand.id === 'calm-well-co' ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-200'}`}
                    >
                      <div className="flex items-start">
                        {brand.logo ? (
                          <img 
                            src={brand.logo} 
                            alt={`${brand.name} logo`} 
                            className="w-12 h-12 object-contain rounded mr-3"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://placehold.co/48x48/e5e5e5/666666?text=Logo';
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
                      <div className="mt-3 flex items-center justify-end gap-2">
                        {isFollowing(brand.id) ? (
                          <button
                            onClick={() => unfollowBrand(brand.id)}
                            disabled={pendingFollowIds.has(brand.id)}
                            className={`text-sm px-3 py-1.5 min-w-[96px] text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary focus-visible:outline-offset-2 ${
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
                            className={`text-sm px-3 py-1.5 min-w-[96px] text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary focus-visible:outline-offset-2 ${
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
                  </div>
                );
              })()
            ) : displayBrands.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {displayBrands.map(brand => (
                  <div 
                    key={brand.id} 
                    className={`border rounded-lg p-4 flex flex-col justify-between h-full ${brand.id === 'calm-well-co' ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-200'}`}
                  >
                    <div className="flex items-start">
                      {brand.logo ? (
                        <img 
                          src={brand.logo} 
                          alt={`${brand.name} logo`} 
                          className="w-12 h-12 object-contain rounded mr-3"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/48x48/e5e5e5/666666?text=Logo';
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
                    <div className="mt-3 flex items-center justify-end gap-2">
                      {isFollowing(brand.id) ? (
                        <button
                          onClick={() => unfollowBrand(brand.id)}
                          disabled={pendingFollowIds.has(brand.id)}
                          className={`text-sm px-3 py-1.5 min-w-[96px] text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary focus-visible:outline-offset-2 ${
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
                          className={`text-sm px-3 py-1.5 min-w-[96px] text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary focus-visible:outline-offset-2 ${
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
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center space-y-3">
                <p className="text-gray-600">No brands match your search.</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="inline-flex items-center px-3 h-9 rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50"
                  data-testid="mybrands-clear-empty"
                >
                  Clear
                </button>
              </div>
            )}
          </>
        )}
      </div>

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

  const flag = import.meta.env.VITE_EN_DESKTOP_FEED_LAYOUT;
  if (flag === 'linkedin' && isDesktop) {
    const LeftBrandsSearch = (
      <div className="space-y-3" data-testid="mybrands-left-search">
        <div className="text-xs uppercase text-gray-500">Search Available Brands</div>
        <form
          className="relative"
          onSubmit={(e) => {
            e.preventDefault();
            try {
              const q = (searchQuery || '');
              const results = (displayBrands || []).length;
              track('my_brands_search', { q, results });
            } catch (err) { console.debug?.('track my_brands_search submit failed', err); }
          }}
        >
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSelectedBrandId(null); setSelectedBrandName(''); }}
            placeholder="Search Available Brands"
            className="w-full h-10 pl-8 pr-8 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            aria-label="Search available brands"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
            <span role="img" aria-label="search" className="text-gray-400">🔍</span>
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); try { track('my_brands_search', { q: '', results: (allBrands || []).length }); } catch (err) { console.debug?.('track my_brands_search clear failed', err); } }}
              className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
              data-testid="mybrands-clear-x"
            >
              ×
            </button>
          )}
        </form>
        {topFollowButtons.length > 0 && (
          <div className="pt-2">
            <h2 className="text-sm font-semibold text-gray-900 mb-3" data-testid="mybrands-left-topbrands-header">
              New Content Available From These Top Brands:
            </h2>
            <div className="flex flex-wrap gap-2">
            {topFollowButtons.map((f) => (
              <button
                key={f.brandId}
                onClick={() => { setSelectedBrandId(f.brandId); setSelectedBrandName(f.brandName || 'Brand'); }}
                className="px-2.5 py-1 text-[11px] rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary focus-visible:outline-offset-2"
                title={`Show ${f.brandName}`}
              >
                {f.brandName}
              </button>
            ))}
            </div>
          </div>
        )}
      </div>
    );
    return (
      <DesktopLinkedInShell
        topBar={<TopMenuBarDesktop />}
        pageTitle={"My Brands"}
        leftSidebar={LeftBrandsSearch}
        center={<CenterContent />}
        rightRail={rightRail}
      />
    );
  }

  return <CenterContent />;
}
