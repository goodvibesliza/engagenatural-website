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
import BrandTile from '@/components/brands/BrandTile.jsx';
// Custom left-rail search for brands on this page
import { track } from '@/lib/analytics';

export default function MyBrandsPage() {
  const { user } = useAuth();
  const [isDesktop, setIsDesktop] = useState(false);
  const hasSentPageViewRef = useRef(false);
  const lastSectionRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => {
      const nextIsDesktop = window.innerWidth >= 1024;
      setIsDesktop(nextIsDesktop);
      // Also guard against duplicate page_view in resize path
      if (
        import.meta.env.VITE_EN_DESKTOP_FEED_LAYOUT === 'linkedin' &&
        nextIsDesktop &&
        !hasSentPageViewRef.current
      ) {
        try {
          track('page_view', { page: 'my_brands_desktop', surface: 'community_desktop' });
          hasSentPageViewRef.current = true;
        } catch (err) { console.debug?.('track page_view failed (resize path, my_brands_desktop)', err); }
      }
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // page_view analytics when desktop shell is active
  useEffect(() => {
    if (
      import.meta.env.VITE_EN_DESKTOP_FEED_LAYOUT === 'linkedin' &&
      isDesktop &&
      !hasSentPageViewRef.current
    ) {
      try {
        track('page_view', { page: 'my_brands_desktop', surface: 'community_desktop' });
        hasSentPageViewRef.current = true;
      } catch (err) { console.debug?.('track page_view failed (effect path, my_brands_desktop)', err); }
    }
  }, [isDesktop]);
  
  // Search state
  const STORAGE_KEY = 'en.search.myBrands';
  const [searchQuery, setSearchQuery] = useState('');
  const [allBrands, setAllBrands] = useState([]);
  const [displayBrands, setDisplayBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  
  
  // Section view analytics when search toggles between empty/non-empty
  useEffect(() => {
    const section = (searchQuery || '').trim() ? 'search_results' : 'following';
    if (lastSectionRef.current !== section) {
      try { track('section_view', { page: 'my_brands', section }); } catch (err) { void err; }
      lastSectionRef.current = section;
    }
  }, [searchQuery]);
  
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
        // If we have a stored query, apply filtered view after load
        try {
          const stored = (localStorage.getItem(STORAGE_KEY) || '').trim();
          if (stored) {
            setSearchQuery(stored);
            // display will be set by the debounced filter below
          } else {
            setDisplayBrands(base);
          }
        } catch (err) { void err; setDisplayBrands(base); }
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
        try {
          const stored = (localStorage.getItem(STORAGE_KEY) || '').trim();
          if (stored) {
            setSearchQuery(stored);
          } else {
            setDisplayBrands(fallback);
          }
        } catch (err) { void err; setDisplayBrands(fallback); }
      } finally {
        setLoading(false);
      }
    };
    
    loadBrands();
  }, []);

  // Listen to left-rail search events (desktop shell)
  useEffect(() => {
    const handler = (e) => {
      const detail = e?.detail || {};
      if (detail.page === 'my_brands') {
        setSearchQuery(detail.q || '');
      }
    };
    window.addEventListener('en:leftsearch', handler);
    return () => window.removeEventListener('en:leftsearch', handler);
  }, []);

  // Debounced client-side filter by name/category/keywords (case-insensitive)
  useEffect(() => {
    const qRaw = (searchQuery || '').trim();
    const q = qRaw.toLowerCase();
    // persist per-page
    try { localStorage.setItem(STORAGE_KEY, qRaw); } catch (err) { void err; }
    const timer = setTimeout(() => {
      if (!q) {
        setDisplayBrands(allBrands);
        try { track('search_change', { page: 'my_brands', q: '', resultsCount: (allBrands || []).length }); } catch (err) { void err; }
        return;
      }
      const filtered = allBrands.filter((brand) => {
        const name = (brand.name || '').toLowerCase();
        const category = (brand.category || '').toLowerCase();
        const keywords = Array.isArray(brand.keywords)
          ? brand.keywords.join(' ').toLowerCase()
          : (brand.keywords || '').toLowerCase();
        const haystack = [name];
        if (category) haystack.push(category);
        if (keywords) haystack.push(keywords);
        // Multi-word queries should still match substrings in concatenated string
        const combined = haystack.join(' ');
        return combined.includes(q);
      })
      // Relevance score: title match > category/keywords; then name ASC
      .map((b) => {
        const name = (b.name || '').toLowerCase();
        const category = (b.category || '').toLowerCase();
        const keywords = Array.isArray(b.keywords) ? b.keywords.join(' ').toLowerCase() : (b.keywords || '').toLowerCase();
        const score = (name.includes(q) ? 2 : 0) + ((category.includes(q) || keywords.includes(q)) ? 1 : 0);
        return { b, score };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const an = (a.b.name || '').toLowerCase();
        const bn = (b.b.name || '').toLowerCase();
        return an.localeCompare(bn);
      })
      .map(x => x.b);

      setDisplayBrands(filtered);
      try { track('search_change', { page: 'my_brands', q: qRaw, resultsCount: (filtered || []).length }); } catch (err) { void err; }
    }, 300);
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

        setFollowingDetails((prev) => {
          const prevBrand = prev?.[brandId] ?? {};
          return {
            ...prev,
            [brandId]: {
              ...prevBrand,
              communities: merged,
            },
          };
        });
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
          
          setFollowingDetails(prev => {
            const prevBrand = prev?.[brandId] ?? {};
            return {
              ...prev,
              [brandId]: {
                ...prevBrand,
                trainings: trainingsData
              }
            };
          });
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
          
          setFollowingDetails(prev => {
            const prevBrand = prev?.[brandId] ?? {};
            return {
              ...prev,
              [brandId]: {
                ...prevBrand,
                challenges: challengesData,
                loading: false
              }
            };
          });
        },
        (err) => {
          console.error(`Error loading challenges for ${brandId}:`, err);
          // Still mark as loaded even if there was an error
          setFollowingDetails(prev => {
            const prevBrand = prev?.[brandId] ?? {};
            return {
              ...prev,
              [brandId]: {
                ...prevBrand,
                loading: false
              }
            };
          });
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

  // Mobile search overlay
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const mobileInputRef = useRef(null);
  const panelRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (e?.detail?.page && e.detail.page !== 'my_brands') return;
      setMobileSearchOpen(true);
      try { track('search_open', { page: 'my_brands' }); } catch (err) { void err; }
      setTimeout(() => mobileInputRef.current?.focus(), 0);
    };
    window.addEventListener('en:openMobileSearch', handler);
    return () => window.removeEventListener('en:openMobileSearch', handler);
  }, []);

  // Animate panel slide-up and lock body scroll while open; handle back button
  useEffect(() => {
    if (mobileSearchOpen) {
      // Lock body scroll
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      // Animate in on next frame
      requestAnimationFrame(() => setAnimateIn(true));
      // Push history state to close on back
      const onPop = () => {
        setMobileSearchOpen(false);
        try { track('search_close', { page: 'my_brands' }); } catch (err) { void err; }
        // Return focus to bottom nav Search button
        try { setTimeout(() => document.querySelector('[data-testid="bottomnav-search"]')?.focus(), 0); } catch (err) { void err; }
      };
      const state = { enMobileSearch: true };
      try { history.pushState(state, ''); window.addEventListener('popstate', onPop, { once: true }); } catch (err) { void err; }
      return () => {
        // Cleanup
        document.body.style.overflow = prev;
        setAnimateIn(false);
        try { window.removeEventListener('popstate', onPop); } catch (err) { void err; }
      };
    }
  }, [mobileSearchOpen]);

  // Focus trap inside panel
  const onKeyDownTrap = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      setMobileSearchOpen(false);
      try { track('search_close', { page: 'my_brands' }); } catch (err) { void err; }
      try { setTimeout(() => document.querySelector('[data-testid="bottomnav-search"]')?.focus(), 0); } catch (err) { void err; }
      return;
    }
    if (e.key !== 'Tab') return;
    const root = panelRef.current;
    if (!root) return;
    const focusables = root.querySelectorAll('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
    const items = Array.from(focusables).filter(el => !el.hasAttribute('disabled'));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };

  const CenterContent = () => (
    <div className="space-y-6" data-testid="mybrands-center">
      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => { setMobileSearchOpen(false); try { track('search_close', { page: 'my_brands' }); } catch (err) { void err; } try { setTimeout(() => document.querySelector('[data-testid="bottomnav-search"]')?.focus(), 0); } catch (err) { void err; } }}>
          <div
            role="dialog"
            aria-label="Search"
            ref={panelRef}
            onKeyDown={onKeyDownTrap}
            className={`fixed left-0 right-0 bg-white rounded-t-2xl p-4 shadow-lg transition-transform duration-200 ease-out ${animateIn ? 'translate-y-0' : 'translate-y-full'}`}
            style={{
              bottom: 'calc(env(safe-area-inset-bottom) + 60px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">Search</h2>
              <button
                type="button"
                onClick={() => { setMobileSearchOpen(false); try { track('search_close', { page: 'my_brands' }); } catch (err) { void err; } try { setTimeout(() => document.querySelector('[data-testid="bottomnav-search"]')?.focus(), 0); } catch (err) { void err; } }}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close search"
              >
                ✕
              </button>
            </div>
            <div className="relative">
              <input
                ref={mobileInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setMobileSearchOpen(false); try { track('search_close', { page: 'my_brands' }); } catch (err) { void err; } try { setTimeout(() => document.querySelector('[data-testid="bottomnav-search"]')?.focus(), 0); } catch (err) { void err; } } }}
                placeholder="Search Available Brands"
                className="w-full h-11 min-h-[44px] pl-8 pr-8 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                aria-label="Search brands"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                <span role="img" aria-label="search" className="text-gray-400">🔍</span>
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); try { track('search_clear', { page: 'my_brands' }); } catch (err) { void err; } }}
                  className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Sections: Search Results (when q) then Following */}
      {(() => {
        const q = (searchQuery || '').trim();

        // Helper: format last update
        const toDate = (ts) => (ts?.toDate ? ts.toDate() : (ts?.seconds ? new Date(ts.seconds * 1000) : (ts ? new Date(ts) : null)));
        const formatLastUpdate = (brand) => {
          const d = toDate(brand.lastUpdated) || toDate(brand.updatedAt) || toDate(brand.createdAt);
          if (!d) return 'No recent updates';
          const now = new Date();
          const diff = now - d;
          const oneDay = 24 * 60 * 60 * 1000;
          if (diff < oneDay) return 'Updated today';
          return `Updated ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        };

        // Use debounced, relevance-sorted results from displayBrands
        const searchResults = q ? (displayBrands || []) : [];

        // Following brands grid (dedupe if searching)
        const followedIds = new Set((follows || []).map(f => f.brandId));
        const searchIds = new Set((searchResults || []).map(b => b.id));
        const followingGridBrands = (allBrands || [])
          .filter(b => followedIds.has(b.id))
          .filter(b => !q || !searchIds.has(b.id))
          .sort((a, b) => {
            const ad = toDate(a.lastUpdated) || toDate(a.updatedAt) || toDate(a.createdAt) || new Date(0);
            const bd = toDate(b.lastUpdated) || toDate(b.updatedAt) || toDate(b.createdAt) || new Date(0);
            if (bd - ad !== 0) return bd - ad; // recent first
            return (a.name || '').localeCompare(b.name || '');
          });

        return (
          <>
            {q && (
              <section className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Search Results</h2>
                  <div className="text-sm text-gray-500">{searchResults.length} result{searchResults.length === 1 ? '' : 's'}</div>
                </div>
                {searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 gap-y-4 min-[900px]:grid-cols-2 min-[900px]:gap-x-6 min-[900px]:gap-y-6 xl:grid-cols-3">
                    {searchResults.map((brand) => (
                      <BrandTile
                        key={brand.id}
                        brand={brand}
                        isFollowing={isFollowing(brand.id)}
                        lastUpdateLabel={formatLastUpdate(brand)}
                        onToggleFollow={(b) => isFollowing(b.id) ? unfollowBrand(b.id) : followBrand(b)}
                        onOpen={(b) => {
                          // navigate to brand feed
                          const label = b.name || 'Brand';
                          const p = new URLSearchParams();
                          p.set('tab', 'brand');
                          p.set('brandId', b.id);
                          p.set('brand', label);
                          p.set('via', 'my_brands_tile');
                          window.location.assign(`/community?${p.toString()}`);
                        }}
                      />
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
              </section>
            )}

            {/* Following section */}
            <section className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Following</h2>
                <div className="text-sm text-gray-500">{followingGridBrands.length} brand{followingGridBrands.length === 1 ? '' : 's'}</div>
              </div>
              {followingGridBrands.length > 0 ? (
                <div className="grid grid-cols-1 gap-y-4 min-[900px]:grid-cols-2 min-[900px]:gap-x-6 min-[900px]:gap-y-6 xl:grid-cols-3">
                  {followingGridBrands.map((brand) => (
                    <BrandTile
                      key={brand.id}
                      brand={brand}
                      isFollowing={true}
                      lastUpdateLabel={formatLastUpdate(brand)}
                      onToggleFollow={() => unfollowBrand(brand.id)}
                      onOpen={(b) => {
                        const label = b.name || 'Brand';
                        const p = new URLSearchParams();
                        p.set('tab', 'brand');
                        p.set('brandId', b.id);
                        p.set('brand', label);
                        p.set('via', 'my_brands_tile');
                        window.location.assign(`/community?${p.toString()}`);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center space-y-3">
                  <p className="text-gray-600">You're not following any brands yet.</p>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); setSearchQuery(''); }}
                    className="text-brand-primary hover:underline"
                  >
                    Explore brands
                  </a>
                </div>
              )}
            </section>

            {/* Optional: Challenges section only when no follows and no search */}
            {!q && follows.length === 0 && (
              <div className="space-y-4 mt-4">
                <h2 className="text-xl font-semibold text-gray-800">Brand Challenges</h2>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <p className="text-gray-500">Complete challenges to earn points and advance your career</p>
                  <p className="text-sm text-gray-400 mt-2">Follow brands to see their challenges here</p>
                </div>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );

  const flag = import.meta.env.VITE_EN_DESKTOP_FEED_LAYOUT;
  if (flag === 'linkedin' && isDesktop) {
    const LeftBrandsSearch = (
      <div className="space-y-3" data-testid="mybrands-left-search">
        <label htmlFor="mybrands-left-rail-search" className="block text-xs uppercase text-gray-500">Search brands</label>
        <form
          className="relative"
          onSubmit={(e) => {
            e.preventDefault();
            try {
              const q = (searchQuery || '');
              const results = (displayBrands || []).length;
              // Prevent route reload; analytics handled on change
              track('search_change', { page: 'my_brands', q, resultsCount: results });
            } catch (err) { console.debug?.('track my_brands_search submit failed', err); }
          }}
        >
          <input
            id="mybrands-left-rail-search"
            type="search"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation();
                setSearchQuery('');
                try { track('search_clear', { page: 'my_brands' }); } catch (err) { void err; }
              }
              if (e.key === 'Enter') {
                // prevent accidental form submit/route reload
                e.preventDefault();
              }
            }}
            placeholder="Search Available Brands"
            className="w-full h-11 min-h-[44px] pl-8 pr-8 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            aria-label="Search brands"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
            <span role="img" aria-label="search" className="text-gray-400">🔍</span>
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); try { track('search_clear', { page: 'my_brands' }); } catch (err) { void err; } }}
              className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
              data-testid="mybrands-clear-x"
            >
              ×
            </button>
          )}
        </form>
        {loading && (
          <p className="text-[11px] text-gray-500">Loading…</p>
        )}
        {topFollowButtons.length > 0 && (
          <div className="pt-2">
            <h2 className="text-sm font-semibold text-gray-900 mb-3" data-testid="mybrands-left-topbrands-header">
              New Content Available From These Top Brands:
            </h2>
            <div className="flex flex-wrap gap-2">
            {topFollowButtons.map((f) => (
              <button
                key={f.brandId}
                onClick={() => {
                  setSearchQuery(f.brandName || '');
                  try { track('search_quickpick', { page: 'my_brands', brandId: f.brandId }); } catch (err) { void err; }
                }}
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
