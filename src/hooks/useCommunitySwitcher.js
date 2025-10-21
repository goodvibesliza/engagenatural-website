// src/hooks/useCommunitySwitcher.js
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { track } from '@/lib/analytics';

const MAX_PINNED = 3;
const PINNED_STORAGE_KEY = 'en.community.pinned';
const LAST_VISITED_STORAGE_KEY = 'en.community.lastVisited';

/**
 * Custom hook for managing mobile community switcher state
 * Handles pinned communities, unread counts, last visited tracking, and smart ordering
 * 
 * @returns {Object} Community switcher state and handlers
 */
export default function useCommunitySwitcher() {
  const { user } = useAuth() || {};
  const [allCommunities, setAllCommunities] = useState([]);
  const [pinnedIds, setPinnedIds] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [lastVisited, setLastVisited] = useState({});
  const [loading, setLoading] = useState(true);

  // Load pinned IDs from Firestore or localStorage
  useEffect(() => {
    if (!user?.uid) {
      setPinnedIds([]);
      return;
    }

    const loadPinned = async () => {
      try {
        if (db) {
          // Try Firestore first
          const docRef = doc(db, 'users', user.uid, 'preferences', 'community');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setPinnedIds(Array.isArray(data?.pinnedCommunities) ? data.pinnedCommunities : []);
            return;
          }
        }
      } catch (err) {
        console.debug('useCommunitySwitcher: Firestore pinned load failed, using localStorage', err);
      }

      // Fallback to localStorage
      try {
        const cached = localStorage.getItem(PINNED_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          setPinnedIds(Array.isArray(parsed) ? parsed : []);
        }
      } catch (err) {
        console.debug('useCommunitySwitcher: localStorage pinned load failed', err);
      }
    };

    loadPinned();
  }, [user?.uid]);

  // Load last visited from localStorage
  useEffect(() => {
    try {
      const cached = localStorage.getItem(LAST_VISITED_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setLastVisited(parsed || {});
      }
    } catch (err) {
      console.debug('useCommunitySwitcher: lastVisited load failed', err);
    }
  }, []);

  // Subscribe to followed brands/communities
  useEffect(() => {
    if (!user?.uid || !db) {
      setAllCommunities([]);
      setLoading(false);
      return;
    }

    // Hydrate from cache
    try {
      const cached = localStorage.getItem('en.followedBrandCommunities');
      if (cached) {
        const arr = JSON.parse(cached);
        if (Array.isArray(arr)) {
          const communities = arr.map(item => ({
            id: item.brandId,
            name: item.brandName || 'Brand',
            communityId: item.communityId || ''
          }));
          setAllCommunities(communities);
        }
      }
    } catch (err) {
      console.debug('useCommunitySwitcher: cache read failed', err);
    }

    const q = query(
      collection(db, 'brand_follows'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const communities = snapshot.docs.map(doc => ({
          id: doc.data().brandId,
          name: doc.data().brandName || 'Brand',
          communityId: doc.data().communityId || '',
          createdAt: doc.data().createdAt,
          updatedAt: doc.data().updatedAt
        }));
        setAllCommunities(communities);
        setLoading(false);

        // Update cache
        try {
          const cacheData = communities.map(c => ({
            brandId: c.id,
            brandName: c.name,
            communityId: c.communityId
          }));
          localStorage.setItem('en.followedBrandCommunities', JSON.stringify(cacheData));
        } catch (err) {
          console.debug('useCommunitySwitcher: cache write failed', err);
        }
      },
      (error) => {
        console.error('useCommunitySwitcher: fetch failed', error);
        setAllCommunities([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Subscribe to unread counts (from notifications or custom collection)
  useEffect(() => {
    if (!user?.uid || !db) {
      setUnreadCounts({});
      return;
    }

    // TODO: Implement unread counts subscription — track in future epic
    // For now, mock with empty object
    // This would be implemented based on your notification system
    //
    // Example implementation:
    // const q = query(
    //   collection(db, 'community_unread'),
    //   where('userId', '==', user.uid)
    // );
    // const unsubscribe = onSnapshot(q, (snapshot) => {
    //   const counts = {};
    //   snapshot.docs.forEach(doc => {
    //     const data = doc.data();
    //     counts[data.communityId] = data.unreadCount || 0;
    //   });
    //   setUnreadCounts(counts);
    // });
    // return () => unsubscribe();

    setUnreadCounts({});
  }, [user?.uid]);

  // Smart ordering: pinned → recently active → alphabetical
  const sortedCommunities = useMemo(() => {
    const sorted = [...allCommunities];
    
    sorted.sort((a, b) => {
      const aPin = pinnedIds.indexOf(a.id);
      const bPin = pinnedIds.indexOf(b.id);
      
      // Pinned comes first (maintain user order)
      if (aPin !== -1 && bPin !== -1) return aPin - bPin;
      if (aPin !== -1) return -1;
      if (bPin !== -1) return 1;
      
      // Then by last visited (most recent first)
      const aVisit = lastVisited[a.id] || 0;
      const bVisit = lastVisited[b.id] || 0;
      if (aVisit !== bVisit) return bVisit - aVisit;
      
      // Finally alphabetical
      return a.name.localeCompare(b.name);
    });

    return sorted;
  }, [allCommunities, pinnedIds, lastVisited]);

  // Toggle pin status
  const togglePin = useCallback(async (communityId) => {
    if (!communityId || !user?.uid) return;

    const isPinned = pinnedIds.includes(communityId);
    
    if (!isPinned && pinnedIds.length >= MAX_PINNED) {
      // Show toast and track limit reached
      try {
        track('community_pin_limit_reached', {});
      } catch (err) {
        console.debug('useCommunitySwitcher: track failed', err);
      }
      return { success: false, reason: 'limit_reached' };
    }

    const newPinnedIds = isPinned
      ? pinnedIds.filter(id => id !== communityId)
      : [...pinnedIds, communityId];

    setPinnedIds(newPinnedIds);

    // Track the toggle
    try {
      track('community_pin_toggle', {
        communityId,
        pinned: !isPinned
      });
    } catch (err) {
      console.debug('useCommunitySwitcher: track failed', err);
    }

    // Persist to Firestore
    try {
      if (db) {
        const docRef = doc(db, 'users', user.uid, 'preferences', 'community');
        await setDoc(docRef, {
          pinnedCommunities: newPinnedIds,
          updatedAt: new Date()
        }, { merge: true });
      }
    } catch (err) {
      console.debug('useCommunitySwitcher: Firestore pin save failed, using localStorage', err);
    }

    // Fallback to localStorage
    try {
      localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(newPinnedIds));
    } catch (err) {
      console.debug('useCommunitySwitcher: localStorage pin save failed', err);
    }

    return { success: true, pinned: !isPinned };
  }, [pinnedIds, user?.uid]);

  // Update last visited timestamp
  const markVisited = useCallback((communityId) => {
    if (!communityId) return;

    const newLastVisited = {
      ...lastVisited,
      [communityId]: Date.now()
    };
    setLastVisited(newLastVisited);

    // Persist to localStorage
    try {
      localStorage.setItem(LAST_VISITED_STORAGE_KEY, JSON.stringify(newLastVisited));
    } catch (err) {
      console.debug('useCommunitySwitcher: lastVisited save failed', err);
    }
  }, [lastVisited]);

  // Mark community as read (clear unread count)
  const markAsRead = useCallback((communityId) => {
    if (!communityId) return;

    setUnreadCounts(prev => ({
      ...prev,
      [communityId]: 0
    }));

    // Track unread seen
    try {
      track('community_unread_seen', { communityId });
    } catch (err) {
      console.debug('useCommunitySwitcher: track failed', err);
    }

    // TODO: Persist to Firestore if using custom unread collection
  }, []);

  // Check if community is pinned
  const isPinned = useCallback((communityId) => {
    return pinnedIds.includes(communityId);
  }, [pinnedIds]);

  // Get unread count for a community
  const getUnreadCount = useCallback((communityId) => {
    return unreadCounts[communityId] || 0;
  }, [unreadCounts]);

  // Check if any community has unread
  const hasAnyUnread = useMemo(() => {
    return Object.values(unreadCounts).some(count => count > 0);
  }, [unreadCounts]);

  return {
    allCommunities: sortedCommunities,
    pinnedIds,
    unreadCounts,
    lastVisited,
    loading,
    togglePin,
    markVisited,
    markAsRead,
    isPinned,
    getUnreadCount,
    hasAnyUnread,
    maxPinned: MAX_PINNED
  };
}
