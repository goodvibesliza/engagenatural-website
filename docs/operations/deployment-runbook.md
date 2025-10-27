title: Deployment Runbook
version: 1.0
author: Manus AI / Factory AI / Liza Boone
last_updated: 2025-10-27

# Deployment Runbook

This runbook covers local verification, Netlify deploys, Firebase functions, and rollback.

## Prerequisites

- Node 20, pnpm via Corepack.
- Netlify site connected to this GitHub repo.
- Firebase project access for functions and Storage rules.

## Build Locally

```
corepack enable
pnpm install --no-frozen-lockfile
pnpm run build
pnpm run preview
```

## Environment Variables

Create .env.local from .env.example. Use `VITE_USE_EMULATOR=true` for local testing.

## Netlify

netlify.toml configures the build:

```
[build]
command = "npx pnpm install --no-frozen-lockfile && npx pnpm run build"
publish = "dist"

[build.environment]
NODE_VERSION = "20"
```

In Netlify UI:
1) Site settings → Build & deploy → Environment → ensure `NODE_VERSION=20`.
2) Trigger deploy → Clear cache and deploy site when needed.

## GitHub Actions (CI)

See .github/workflows:
- firebase-hosting-pull-request.yml (PR builds)
- firebase-hosting-merge.yml (main merges)

Both set up pnpm via Corepack and run Vite builds.

## Firebase Functions and Rules

- Functions (TS): deploy via Firebase CLI if changed (not via Netlify).
- Storage rules: storage.rules; Firestore rules: firestore.rules.

### Storage CORS (Production)

Configure Storage CORS to fix uploads. From README-SETUP.md:

Option A (script): `configure-cors.bat`

Option B (manual):
1) Install Google Cloud SDK
2) `gcloud auth login`
3) `gcloud config set project <projectId>`
4) `gsutil cors set cors.json gs://<bucket>`

## Rollback Plan

1) Netlify: redeploy previous successful build from Deploys tab.
2) GitHub: revert the offending commit or rollback the PR merge.
3) Firebase: if a function broke behavior, redeploy last known good functions bundle.
