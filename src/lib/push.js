// src/lib/push.js
import { app, functions } from '@/lib/firebase';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { httpsCallable } from 'firebase/functions';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

let messagingInstance = null;

async function getMessagingInstance() {
  if (!app) return null;
  if (!(await isSupported())) return null;
  if (!messagingInstance) messagingInstance = getMessaging(app);
  return messagingInstance;
}

export async function requestPermissionAndToken(user) {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    const err = new Error('permission-denied');
    err.code = 'permission-denied';
    return { token: null, permission };
  }
  const messaging = await getMessagingInstance();
  if (!messaging) return { token: null, permission };
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  const token = await getToken(messaging, vapidKey ? { vapidKey } : undefined);
  if (token && user?.uid) {
    try {
      await setDoc(doc(db, 'users', user.uid, 'fcmTokens', token), {
        createdAt: serverTimestamp(),
        userAgent: navigator.userAgent || 'unknown',
      }, { merge: true });
    } catch {}
  }
  return { token, permission };
}

export async function subscribeTopics(token, topics = []) {
  if (!functions || !token || !topics?.length) return;
  try {
    const call = httpsCallable(functions, 'subscribeToTopics');
    await call({ token, topics });
  } catch {}
}

export async function unsubscribeTopics(token, topics = []) {
  if (!functions || !token || !topics?.length) return;
  try {
    const call = httpsCallable(functions, 'unsubscribeFromTopics');
    await call({ token, topics });
  } catch {}
}

export async function onForegroundMessage(handler) {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};
  return onMessage(messaging, handler);
}
