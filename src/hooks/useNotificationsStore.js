// src/hooks/useNotificationsStore.js
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { track } from '@/lib/analytics';

/**
 * Provides a per-user notifications store with real-time Firestore syncing and helpers to mark notifications read or visited.
 *
 * Subscribes to notifications/{uid}/community to keep a local map of per-community unread counts in sync, resets when no user
 * is present, and exposes operations that update both local state and Firestore (markAsRead, markVisited, markAllAsRead).
 *
 * @returns {{ unreadCounts: Object.<string, number>, totalUnread: number, markAsRead: function(string): Promise<void>, markVisited: function(string): Promise<void>, markAllAsRead: function(): Promise<void>, subscribeToUpdates: function(): function() }} An object containing:
 *  - `unreadCounts`: mapping of communityId to unread count.
 *  - `totalUnread`: sum of all unread counts.
 *  - `markAsRead(communityId)`: sets the given community's unread count to 0 locally and in Firestore.
 *  - `markVisited(communityId)`: records the current timestamp as the user's last visit for the community in preferences.
 *  - `markAllAsRead()`: sets all known communities' unread counts to 0 locally and in Firestore.
 *  - `subscribeToUpdates()`: starts a realtime subscription and returns a cleanup function that unsubscribes.
 */
export default function useNotificationsStore() {
  const { user } = useAuth();
  const [unreadCounts, setUnreadCounts] = useState({});
  const unsubRef = useRef(null);

  const subscribeToUpdates = useCallback(() => {
    if (!db || !user?.uid) return () => {};
    try {
      if (typeof unsubRef.current === 'function') unsubRef.current();
    } catch (err) {
      console.debug?.('useNotificationsStore: subscribe cleanup failed', err);
    }

    const col = collection(db, 'notifications', user.uid, 'community');
    const unsub = onSnapshot(
      col,
      (snap) => {
        const next = {};
        snap.forEach((d) => {
          const data = d.data() || {};
          next[d.id] = Number(data.unreadCount || 0);
        });
        setUnreadCounts(next);
      },
      () => {
        setUnreadCounts({});
      }
    );
    unsubRef.current = unsub;
    return () => {
      try { unsub(); } catch (err) { console.debug?.('useNotificationsStore: unsubscribe failed', err); }
      if (unsubRef.current === unsub) unsubRef.current = null;
    };
  }, [db, user?.uid]);

  // Auto-subscribe on mount when user changes
  useEffect(() => {
    if (!user?.uid) {
      setUnreadCounts({});
      return;
    }
    const off = subscribeToUpdates();
    return () => { try { off?.(); } catch (err) { console.debug?.('useNotificationsStore: off() failed', err); } };
  }, [user?.uid, subscribeToUpdates]);

  const markAsRead = useCallback(async (communityId) => {
    if (!db || !user?.uid || !communityId) return;
    try {
      setUnreadCounts((prev) => ({ ...prev, [communityId]: 0 }));
      await setDoc(
        doc(db, 'notifications', user.uid, 'community', communityId),
        { unreadCount: 0, lastUpdated: serverTimestamp() },
        { merge: true }
      );
      try { track('community_mark_read', { communityId }); } catch {}
    } catch (err) {
      console.debug?.('useNotificationsStore: markAsRead failed', err);
    }
  }, [db, user?.uid]);

  const markVisited = useCallback(async (communityId) => {
    if (!db || !user?.uid || !communityId) return;
    try {
      const prefRef = doc(db, 'users', user.uid, 'preferences', 'community');
      try {
        await updateDoc(prefRef, { [`lastVisited.${communityId}`]: serverTimestamp(), updatedAt: serverTimestamp() });
      } catch (innerErr) {
        // Fallback when doc doesn't exist yet
        await setDoc(
          prefRef,
          { lastVisited: { [communityId]: serverTimestamp() }, updatedAt: serverTimestamp() },
          { merge: true }
        );
      }
      try { track('community_mark_visited', { communityId }); } catch (err) { console.debug?.('useNotificationsStore: track visited failed', err); }
    } catch (err) {
      console.debug?.('useNotificationsStore: markVisited failed', err);
    }
  }, [db, user?.uid]);

  const markAllAsRead = useCallback(async () => {
    if (!db || !user?.uid) return;
    const ids = Object.keys(unreadCounts || {});
    try {
      // Optimistically zero out all counts in one state update
      setUnreadCounts((prev) => {
        const next = { ...prev };
        for (const id of ids) next[id] = 0;
        return next;
      });
      // Batch writes in parallel
      await Promise.all(
        ids.map((id) => setDoc(
          doc(db, 'notifications', user.uid, 'community', id),
          { unreadCount: 0, lastUpdated: serverTimestamp() },
          { merge: true }
        ))
      );
      try { track('notification_mark_all_read', {}); } catch (err) { console.debug?.('useNotificationsStore: track mark_all failed', err); }
    } catch (err) {
      console.debug?.('useNotificationsStore: markAllAsRead failed', err);
    }
  }, [db, user?.uid, unreadCounts]);

  const totalUnread = useMemo(() => Object.values(unreadCounts).reduce((a, b) => a + (Number(b) || 0), 0), [unreadCounts]);

  return {
    unreadCounts,
    totalUnread,
    markAsRead,
    markVisited,
    markAllAsRead,
    subscribeToUpdates,
  };
}