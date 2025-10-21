import * as functions from 'firebase-functions';
import admin from 'firebase-admin';

try { admin.app(); } catch { admin.initializeApp(); }

// Helpers
const isAllowedTopic = (t) => /^community_[A-Za-z0-9_-]+$/.test(String(t || ''));
const requireAuth = (context) => {
  if (!context?.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }
  return context.auth;
};

// Callable to subscribe a token to multiple topics
export const subscribeToTopics = functions.https.onCall(async (data, context) => {
  requireAuth(context);
  const { token, topics } = data || {};
  if (!token || !Array.isArray(topics) || topics.length === 0 || topics.some((t) => !isAllowedTopic(t))) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid token/topics.');
  }
  // Verify token belongs to caller
  const uid = context.auth.uid;
  const docRef = admin.firestore().doc(`users/${uid}/pushTokens/${token}`);
  const doc = await docRef.get();
  if (!doc.exists) {
    throw new functions.https.HttpsError('permission-denied', 'Token not registered to this user.');
  }
  // Dedupe and parallelize
  const unique = Array.from(new Set(topics));
  const results = await Promise.all(
    unique.map(async (topic) => {
      try {
        await admin.messaging().subscribeToTopic(token, topic);
        return { topic, ok: true };
      } catch (err) {
        functions.logger?.warn?.('subscribeToTopic failed', { topic, err: String(err) });
        return { topic, ok: false, error: String(err) };
      }
    })
  );
  return { ok: results.every((r) => r.ok), results };
});

// Callable to unsubscribe a token from multiple topics
export const unsubscribeFromTopics = functions.https.onCall(async (data, context) => {
  requireAuth(context);
  const { token, topics } = data || {};
  if (!token || !Array.isArray(topics) || topics.length === 0 || topics.some((t) => !isAllowedTopic(t))) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid token/topics.');
  }
  // Verify token belongs to caller
  const uid = context.auth.uid;
  const docRef = admin.firestore().doc(`users/${uid}/pushTokens/${token}`);
  const doc = await docRef.get();
  if (!doc.exists) {
    throw new functions.https.HttpsError('permission-denied', 'Token not registered to this user.');
  }
  // Dedupe and parallelize
  const unique = Array.from(new Set(topics));
  const results = await Promise.all(
    unique.map(async (topic) => {
      try {
        await admin.messaging().unsubscribeFromTopic(token, topic);
        return { topic, ok: true };
      } catch (err) {
        functions.logger?.warn?.('unsubscribeFromTopic failed', { topic, err: String(err) });
        return { topic, ok: false, error: String(err) };
      }
    })
  );
  return { ok: results.every((r) => r.ok), results };
});

// Manual push trigger for testing
export const sendCommunityPushManual = functions.https.onCall(async (data, context) => {
  const { communityId, message } = data || {};
  const auth = context?.auth;
  const isStaff = !!(auth && (auth.token?.staff || auth.token?.admin));
  if (!auth || !isStaff) {
    return { ok: false, error: 'unauthorized' };
  }
  if (!communityId) return { ok: false, error: 'invalid-argument' };
  const topic = `community_${communityId}`;
  if (!isAllowedTopic(topic)) return { ok: false, error: 'invalid-topic' };
  const msg = {
    topic,
    notification: {
      title: 'New community update',
      body: message || 'Check out the latest update!',
    },
    webpush: {
      fcmOptions: {
        link: `/community?communityId=${communityId}`,
      },
    },
  };
  try {
    await admin.messaging().send(msg);
    return { ok: true };
  } catch (e) {
    functions.logger?.warn?.('sendCommunityPushManual failed', { topic, err: String(e) });
    return { ok: false };
  }
});

// Firestore trigger for new posts → push to topic
export const sendCommunityPush = functions.firestore
  .document('communities/{id}/posts/{postId}')
  .onCreate(async (snap, context) => {
    const data = snap.data() || {};
    const title = data.title || 'Community';
    const summary = data.summary || '';
    const communityId = context.params.id;
    // Sanitize topic and build a web-friendly payload
    const safeCommunityId = String(communityId || '').replace(/[^A-Za-z0-9_-]/g, '-');
    const topic = `community_${safeCommunityId}`;
    if (!isAllowedTopic(topic)) return;
    const payload = {
      topic,
      notification: {
        title: `New post in ${title}`,
        body: summary || 'Check out the latest update!',
      },
      webpush: {
        fcmOptions: {
          link: `/community?communityId=${safeCommunityId}&postId=${context.params.postId}`,
        },
      },
      data: {
        communityId: safeCommunityId,
        postId: String(context.params.postId || ''),
      },
    };
    try {
      await admin.messaging().send(payload);
    } catch {
      // swallow errors to avoid retry storms
    }
  });
