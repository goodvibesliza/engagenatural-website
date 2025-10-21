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
  // Fast-fail on unsupported environments
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[push] Notifications or ServiceWorker not supported in this browser');
    return { token: null, permission: 'denied' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { token: null, permission };
  }

  const messaging = await getMessagingInstance();
  if (!messaging) return { token: null, permission };

  // Ensure the FCM service worker is registered and ready
  let swReg = null;
  try {
    swReg = (await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js'))
      || (await navigator.serviceWorker.register('/firebase-messaging-sw.js'));
  } catch (e) {
    console.error('[push] service worker registration failed', e);
    return { token: null, permission };
  }

  const vapidKey = (import.meta?.env && import.meta.env.VITE_FIREBASE_VAPID_KEY) || '';
  if (!vapidKey) {
    console.error('[push] Missing VITE_FIREBASE_VAPID_KEY env var. Cannot get FCM token.');
    return { token: null, permission };
  }

  try {
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swReg });
    if (token && user?.uid) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'fcmTokens', token), {
          createdAt: serverTimestamp(),
          userAgent: navigator.userAgent || 'unknown',
        }, { merge: true });
      } catch (e) {
        console.debug('[push] failed to persist token (ignored)', e);
      }
    }
    return { token, permission };
  } catch (e) {
    console.error('[push] getToken failed', e);
    return { token: null, permission };
  }
}

export async function subscribeTopics(token, topics = []) {
  if (!functions || !token || !topics?.length) return;
  try {
    const call = httpsCallable(functions, 'subscribeToTopics');
    await call({ token, topics });
  } catch (e) {
    console.debug('[push] subscribeTopics failed (ignored)', e);
  }
}

export async function unsubscribeTopics(token, topics = []) {
  if (!functions || !token || !topics?.length) return;
  try {
    const call = httpsCallable(functions, 'unsubscribeFromTopics');
    await call({ token, topics });
  } catch (e) {
    console.debug('[push] unsubscribeTopics failed (ignored)', e);
  }
}

export async function onForegroundMessage(handler) {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};
  return onMessage(messaging, handler);
}
