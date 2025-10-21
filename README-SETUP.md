# EngageNatural Website - Local Setup Instructions

## Quick Start Guide

### 1. Extract and Setup
1. Extract this folder to `C:\projects\engagenatural-website`
2. Open Command Prompt or PowerShell
3. Navigate to the project: `cd C:\projects\engagenatural-website`

### 2. Install Dependencies
Run the setup script:
```bash
setup.bat
```

Or manually:
```bash
pnpm install
```

### 3. Configure Firebase Storage CORS (CRITICAL!)
This step fixes your photo upload issues:

**Option A: Use the script (Recommended)**
```bash
configure-cors.bat
```

**Option B: Manual configuration**
1. Install Google Cloud SDK from: https://cloud.google.com/sdk/docs/install
2. Authenticate: `gcloud auth login`
3. Set project: `gcloud config set project engagenatural-app`
4. Apply CORS: `gsutil cors set cors.json gs://engagenatural-app.appspot.com`

### 4. Start Development Server
```bash
pnpm run dev
```

Visit: http://localhost:5173

## Push Notifications (FCM) Setup

This project includes optional web push notifications using Firebase Cloud Messaging (FCM).

1) Env variable (required for web push)
   - Add to your `.env.local`:
     ```bash
     VITE_FIREBASE_VAPID_KEY=YOUR_PUBLIC_VAPID_KEY
     ```
   - In Firebase Console → Project Settings → Cloud Messaging, create a Web Push certificate (VAPID) and copy the public key.

2) Service worker
   - Already registered by `src/main.jsx` and implemented at `public/firebase-messaging-sw.js`.

3) Cloud Functions (topics + manual test sender)
   - Deployed from `functions/` (Node 20 runtime):
     ```bash
     # one-time
     firebase login
     firebase use <your-project-id>

     # deploy
     firebase deploy --only functions
     ```
   - Security: callable endpoints require auth. `sendCommunityPushManual` additionally requires a `staff` or `admin` custom claim.

4) Staff/Admin claims (for manual push tests)
   - Grant a user a custom claim (example snippet; run via Admin SDK or a secure script):
     ```js
     // admin.auth().setCustomUserClaims(uid, { staff: true })
     ```

5) Topics and subscriptions
   - Allowed topic format: `community_<alphanumeric-or-_-or->` (validated in Functions).
   - The app auto-subscribes/unsubscribes to topics for the user’s communities via `usePushTopics` when the Profile → "Enable Push Notifications" toggle is on.

6) Troubleshooting
   - Make sure notifications are permitted in the browser.
   - Verify `users/{uid}/settings/push` has `pushEnabled: true` when the toggle is enabled.
   - Check DevTools → Application → Service Workers to confirm `firebase-messaging-sw.js` is active.

## What This Fixes

- ✅ CORS errors when uploading photos
- ✅ "Submitting..." stuck uploads
- ✅ Profile image upload issues
- ✅ Verification photo upload issues

## Files Included

- `cors.json` - CORS configuration for Firebase Storage
- `setup.bat` - Automated setup script
- `configure-cors.bat` - CORS configuration script
- Complete source code with latest updates

## Need Help?

1. Check that Google Cloud SDK is installed
2. Verify you're authenticated with the correct Google account
3. Ensure your Firebase project ID is "engagenatural-app"
4. Test uploads after CORS configuration

## Git Workflow (Coming Next)

After setup, you'll learn how to:
- Make changes locally
- Commit and push to GitHub
- Deploy updates to Netlify

Your photo uploads will work perfectly once CORS is configured! 🎉
