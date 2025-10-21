// src/hooks/useNotificationsStore.js
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, setDoc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { toast } from 'sonner';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { track } from '@/lib/analytics';

/**
 * Shared notifications store (per-user)
 *
 * Firestore structure (per spec):
 * notifications/{uid}/community/{communityId} => { unreadCount: number, lastUpdated: TS }
 *
 * Additionally updates user preferences for lastVisited when requested:
 * users/{uid}/preferences/community => { lastVisited: { [communityId]: TS } }
 */
export default function useNotificationsStore() {
  const { user } = useAuth();
  const [unreadCounts, setUnreadCounts] = useState({});
  const [pushEnabled, setPushEnabledState] = useState(false);
  const unsubRef = useRef(null);
  const settingsUnsubRef = useRef(null);

  const subscribeToUpdates = useCallback(() => {
    if (!db || !user?.uid) return () => {};
    try {
      if (typeof unsubRef.current === 'function') unsubRef.current();
    } catch (err) { console.debug('notifications: previous unsub failed (ignored)', err); }

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
      try { unsub(); } catch (err) { console.debug('notifications: unsub failed (ignored)', err); }
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
    return () => { try { off?.(); } catch (err) { console.debug('notifications: cleanup off failed (ignored)', err); } };
  }, [user?.uid, subscribeToUpdates]);

  // Listen to pushEnabled in users/{uid}/settings (mirror to local state)
  useEffect(() => {
    if (!db || !user?.uid) return;
    try { if (typeof settingsUnsubRef.current === 'function') settingsUnsubRef.current(); } catch (err) { console.debug('push settings: previous unsub failed (ignored)', err); }
    const ref = doc(db, 'users', user.uid, 'settings', 'push');
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data() || {};
      const enabled = !!(data.pushEnabled ?? false);
      setPushEnabledState(enabled);
    }, () => setPushEnabledState(false));
    settingsUnsubRef.current = unsub;
    return () => { try { unsub(); } catch (err) { console.debug('push settings: unsub failed (ignored)', err); } if (settingsUnsubRef.current === unsub) settingsUnsubRef.current = null; };
  }, [db, user?.uid]);

  const setPushEnabled = useCallback(async (enabled) => {
    if (!db || !user?.uid) return;
    try {
      setPushEnabledState(() => !!enabled);
      await setDoc(doc(db, 'users', user.uid, 'settings', 'push'), { pushEnabled: !!enabled, updatedAt: serverTimestamp() }, { merge: true });
      try { track('push_toggle', { enabled: !!enabled }); } catch (err) { console.debug('analytics: push_toggle track failed (ignored)', err); }
    } catch (err) {
      console.error('Failed to update pushEnabled', err);
      // revert optimistic update and notify user
      setPushEnabledState(() => !enabled);
      try { toast?.error?.('Could not update push notification setting. Please try again.'); } catch (e) { console.debug('toast failed (ignored)', e); }
    }
  }, [db, user?.uid]);

  const sendPushNotification = useCallback(async (communityId, message) => {
    if (!functions || !user?.uid || !communityId) return false;
    try {
      const call = httpsCallable(functions, 'sendCommunityPushManual');
      await call({ communityId, message });
      return true;
    } catch (err) {
      console.error('sendPushNotification failed', err);
      return false;
    }
  }, [functions, user?.uid]);

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
    } catch {}
  }, [db, user?.uid]);

  const markVisited = useCallback(async (communityId) => {
    if (!db || !user?.uid || !communityId) return;
    try {
      const prefRef = doc(db, 'users', user.uid, 'preferences', 'community');
      try {
        await updateDoc(prefRef, { [`lastVisited.${communityId}`]: serverTimestamp(), updatedAt: serverTimestamp() });
      } catch (innerErr) {
        await setDoc(
          prefRef,
          { [`lastVisited.${communityId}`]: serverTimestamp(), updatedAt: serverTimestamp() },
          { merge: true }
        );
      }
      try { track('community_mark_visited', { communityId }); } catch {}
    } catch {}
  }, [db, user?.uid]);

  const markAllAsRead = useCallback(async () => {
    if (!db || !user?.uid) return;
    const ids = Object.keys(unreadCounts || {});
    try {
      // Optimistically zero all locally once
      setUnreadCounts((prev) => {
        const next = { ...prev };
        for (const id of ids) next[id] = 0;
        return next;
      });
      // Batch write for atomic, faster updates
      const batch = writeBatch(db);
      for (const id of ids) {
        batch.set(
          doc(db, 'notifications', user.uid, 'community', id),
          { unreadCount: 0, lastUpdated: serverTimestamp() },
          { merge: true }
        );
      }
      await batch.commit();
      try { track('notification_mark_all_read', {}); } catch {}
    } catch (err) {
      console.error('markAllAsRead failed', err);
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
    // push
    pushEnabled,
    setPushEnabled,
    sendPushNotification,
  };
}
