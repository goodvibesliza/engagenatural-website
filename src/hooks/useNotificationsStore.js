// src/hooks/useNotificationsStore.js
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, setDoc, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
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
    } catch {}

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
      try { unsub(); } catch {}
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
    return () => { try { off?.(); } catch {} };
  }, [user?.uid, subscribeToUpdates]);

  // Listen to pushEnabled in users/{uid}/settings (mirror to local state)
  useEffect(() => {
    if (!db || !user?.uid) return;
    try { if (typeof settingsUnsubRef.current === 'function') settingsUnsubRef.current(); } catch {}
    const ref = doc(db, 'users', user.uid, 'settings', 'push');
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data() || {};
      const enabled = !!(data.pushEnabled ?? false);
      setPushEnabledState(enabled);
    }, () => setPushEnabledState(false));
    settingsUnsubRef.current = unsub;
    return () => { try { unsub(); } catch {}; if (settingsUnsubRef.current === unsub) settingsUnsubRef.current = null; };
  }, [db, user?.uid]);

  const setPushEnabled = useCallback(async (enabled) => {
    if (!db || !user?.uid) return;
    try {
      setPushEnabledState(!!enabled);
      await setDoc(doc(db, 'users', user.uid, 'settings', 'push'), { pushEnabled: !!enabled, updatedAt: serverTimestamp() }, { merge: true });
      try { track('push_toggle', { enabled: !!enabled }); } catch {}
    } catch {}
  }, [db, user?.uid]);

  const sendPushNotification = useCallback(async (communityId, message) => {
    if (!functions || !user?.uid || !communityId) return;
    try {
      const call = httpsCallable(functions, 'sendCommunityPushManual');
      await call({ communityId, message });
    } catch {}
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
      await setDoc(
        doc(db, 'users', user.uid, 'preferences', 'community'),
        { lastVisited: { [communityId]: serverTimestamp() } },
        { merge: true }
      );
      try { track('community_mark_visited', { communityId }); } catch {}
    } catch {}
  }, [db, user?.uid]);

  const markAllAsRead = useCallback(async () => {
    if (!db || !user?.uid) return;
    const ids = Object.keys(unreadCounts || {});
    try {
      for (const id of ids) {
        setUnreadCounts((prev) => ({ ...prev, [id]: 0 }));
        await setDoc(
          doc(db, 'notifications', user.uid, 'community', id),
          { unreadCount: 0, lastUpdated: serverTimestamp() },
          { merge: true }
        );
      }
      try { track('notification_mark_all_read', {}); } catch {}
    } catch {}
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
