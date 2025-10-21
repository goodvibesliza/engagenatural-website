# Push Notifications — Test Button Spec

Owner: Push Notifications Project (branch: `feature/push-notifications-only`)

Purpose: Add a QA/demo-only button to manually send a test FCM push to the signed-in user’s device. Visible only when push is enabled and user is authenticated.

---

## A) Placement

- File: `src/pages/staff/dashboard/ProfilePage.jsx` (Notifications section)
- UI placement: Under the existing toggle “Enable Push Notifications”.
- Component style: Use existing `<Button variant="secondary" />` from `@/components/ui/Button`.
- Visibility: Render only when `pushEnabled === true` and user is authenticated.

Example (pseudocode):

```jsx
import { Button } from '@/components/ui/Button';
import useNotificationsStore from '@/hooks/useNotificationsStore';
import { toast } from 'sonner';

function NotificationSettings() {
  const { pushEnabled, sendTestPush } = useNotificationsStore();

  const handleTestPush = async () => {
    try {
      await sendTestPush();
      toast.success('Test push sent! Check your device.');
    } catch (err) {
      toast.error('Unable to send push: ' + (err?.message || 'unknown error'));
    }
  };

  return (
    <div className="space-y-3">
      {/* Existing toggle lives above */}
      {pushEnabled ? (
        <Button variant="secondary" onClick={handleTestPush}>
          Send Test Push Notification
        </Button>
      ) : (
        <p className="text-xs text-gray-500">
          Enable push notifications to test your setup.
        </p>
      )}
    </div>
  );
}
```

Optional safeguard: hide on production builds — e.g., render only when `import.meta.env.VITE_SHOW_DEMO_TOOLS === 'true'`.

---

## B) Button Logic

- Call a helper from the notifications store: `const { sendTestPush } = useNotificationsStore();`
- `sendTestPush()` should send a mock FCM notification to the user’s own current device token using the same message format as real notifications.

Message payload:

```json
{
  "notification": {
    "title": "EngageNatural Push Test",
    "body": "✅ Your push notifications are working!",
    "click_action": "/notifications"
  }
}
```

Client example handler (in page):

```js
const handleTestPush = async () => {
  try {
    await sendTestPush();
    toast.success('Test push sent! Check your device.');
  } catch (err) {
    toast.error('Unable to send push: ' + err.message);
  }
};
```

Store addition example (`src/hooks/useNotificationsStore.js`):

```js
const sendTestPush = useCallback(async () => {
  if (!functions || !user?.uid) throw new Error('not-authenticated');
  const call = httpsCallable(functions, 'sendTestPush');
  await call({});
}, [functions, user?.uid]);
```

---

## C) Server (Cloud Function, optional)

If done server-side to avoid exposing token management, add a callable:

```js
// functions/index.js
exports.sendTestPush = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  // Resolve latest token(s) for this user. Option A: topic per user; Option B: tokens collection.
  const payload = {
    notification: {
      title: 'EngageNatural Push Test',
      body: '✅ Push notifications are working!',
      click_action: '/notifications',
    },
    topic: `user_${uid}`,
  };
  await admin.messaging().send(payload);
  return { success: true };
});
```

If using token docs (`users/{uid}/fcmTokens/{token}`), iterate tokens and send to each.

---

## D) Permissions & Visibility

- Show button only if: `user is authenticated && pushEnabled === true`.
- If disabled, show helper text: “Enable push notifications to test your setup.”
- Optional: hide behind `VITE_SHOW_DEMO_TOOLS` flag so it’s hidden in production.

---

## E) Feedback & Error Handling

- Success: toast → “✅ Test push sent! Check your device.”
- Error: toast → “⚠️ Unable to send test notification — check permissions or console.”
- If permission denied: prompt user to enable notifications in browser and re-try.

---

## F) Analytics

- `push_test_sent` { userId }
- `push_test_failed` { userId, error }
- `push_test_clicked` { userId } (fires when user opens notification)

---

## QA / Acceptance

- Button only visible for authenticated users with push enabled.
- Clicking sends a “Push Test” alert to the device/browser.
- Clicking the notification opens `/notifications`.
- Toggling push off hides the button.
- No console or permission errors; success toast confirmed.
- Works on desktop + mobile browsers that support push.

---

## Setup Notes

- Ensure HTTPS and a valid public VAPID key in `.env`:

```env
VITE_FIREBASE_VAPID_KEY=YOUR_PUBLIC_VAPID_KEY
```

- Service worker path is registered at `/firebase-messaging-sw.js` (already present).
- Local dev: browsers may restrict push on `http://localhost`; prefer `https://` or Chrome flags.
