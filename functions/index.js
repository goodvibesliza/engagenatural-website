import * as functions from 'firebase-functions';
import admin from 'firebase-admin';

try { admin.app(); } catch { admin.initializeApp(); }

// Callable to subscribe a token to multiple topics
export const subscribeToTopics = functions.https.onCall(async (data, context) => {
  const { token, topics } = data || {};
  if (!token || !Array.isArray(topics)) return { ok: false };
  for (const topic of topics) {
    try { await admin.messaging().subscribeToTopic(token, topic); } catch (e) { /* no-op */ }
  }
  return { ok: true };
});

// Callable to unsubscribe a token from multiple topics
export const unsubscribeFromTopics = functions.https.onCall(async (data, context) => {
  const { token, topics } = data || {};
  if (!token || !Array.isArray(topics)) return { ok: false };
  for (const topic of topics) {
    try { await admin.messaging().unsubscribeFromTopic(token, topic); } catch (e) { /* no-op */ }
  }
  return { ok: true };
});

// Manual push trigger for testing
export const sendCommunityPushManual = functions.https.onCall(async (data, context) => {
  const { communityId, message } = data || {};
  if (!communityId) return { ok: false };
  const topic = `community_${communityId}`;
  const payload = {
    notification: {
      title: 'New community update',
      body: message || 'Check out the latest update!',
      click_action: `/community?communityId=${communityId}`,
    },
    topic,
  };
  try {
    await admin.messaging().send(payload);
    return { ok: true };
  } catch (e) {
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
    const payload = {
      notification: {
        title: `New post in ${title}`,
        body: summary || 'Check out the latest update!',
        click_action: `/community?communityId=${communityId}`,
      },
      topic: `community_${communityId}`,
    };
    try {
      await admin.messaging().send(payload);
    } catch (e) {
      // swallow errors to avoid retry storms
    }
  });
