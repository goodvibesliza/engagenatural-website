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
import LeftSidebarSearch from '@/components/common/LeftSidebarSearch.jsx';

export default function MyBrandsPage() {
  const { user } = useAuth();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  
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
  const followsUnsubRef = useRef(null);
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
        
        // Always ensure we have at least the example brand
        const hasExampleBrand = filteredBrands.some(b => b.id === 'calm-well-co');
        if (!hasExampleBrand) {
          filteredBrands.push({
            id: 'calm-well-co',
            name: 'Calm Well Co',
            description: 'Natural wellness and CBD products',
            category: 'Wellness',
            logo: 'https://placehold.co/100x100/e5e5e5/666666?text=CWC',
            isExample: true
          });
        }
        
        setBrands(filteredBrands);
      } catch (err) {
        console.error('Error loading brands:', err);
        // Fallback to example brand if error
        setBrands([{
          id: 'calm-well-co',
          name: 'Calm Well Co',
          description: 'Natural wellness and CBD products',
          category: 'Wellness',
          logo: 'https://placehold.co/100x100/e5e5e5/666666?text=CWC',
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
                  <div>
                    {/* Community Pills */}
                    {details?.communities?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Link
                        to={`/staff/community?brand=${encodeURIComponent(follow.brandName)}`}
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

  const flag = import.meta.env.VITE_EN_DESKTOP_FEED_LAYOUT;
  if (flag === 'linkedin' && isDesktop) {
    return (
      <DesktopLinkedInShell
        topBar={<TopMenuBarDesktop />}
        leftSidebar={<LeftSidebarSearch />}
        center={<CenterContent />}
        rightRail={rightRail}
      />
    );
  }

  return <CenterContent />;
}
