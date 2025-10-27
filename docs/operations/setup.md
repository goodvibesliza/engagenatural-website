title: Local Setup Instructions
version: 1.0
author: Manus AI / Factory AI / Liza Boone
last_updated: 2025-10-27

# EngageNatural Website - Local Setup Instructions

## Quick Start Guide

### 1. Extract and Setup
1. Extract this folder to `C:\\projects\\engagenatural-website`
2. Open Command Prompt or PowerShell
3. Navigate to the project: `cd C:\\projects\\engagenatural-website`

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
