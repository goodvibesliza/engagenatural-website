# AGENTS – Next Steps and Operating Guide

This document captures the exact next steps to finish and validate the current workstream.

## Working Branch
- Use branch: `fix/brand-community-access-rca`
- Open PR: https://github.com/goodvibesliza/engagenatural-website/compare/main...fix/brand-community-access-rca

## Environment Versions
- Node: 20.x
  - `.node-version` → `20`
  - `.nvmrc` → `20`
- Package manager: pnpm (via Corepack)

Commands:
```sh
node -v
corepack enable
pnpm -v
```

## Build & Deploy (Netlify)
netlify.toml is configured to use a clean pnpm install and Node 20.

- Build command (in repo):
  ```toml
  [build]
  command = "npx pnpm install --no-frozen-lockfile && npx pnpm run build"
  publish = "dist"
  
  [build.environment]
  NODE_VERSION = "20"
  ```
- Netlify UI steps after merging:
  1) Site settings → Build & deploy → Environment → ensure `NODE_VERSION=20`.
  2) Deploys → Trigger deploy → Clear cache and deploy site.

## Local Verification
```sh
corepack enable
pnpm install --no-frozen-lockfile
pnpm run build
pnpm run preview
```

Optional (emulator):
```sh
# .env.local → VITE_USE_EMULATOR=true
pnpm run dev
```

## Firebase Import Standard
- Always import Firebase from the alias path only:
  ```js
  import { db, auth, storage, functions } from '@/lib/firebase'
  ```
- If any file uses relative imports to `lib/firebase`, run:
  ```sh
  pnpm run normalize:firebase
  ```

## Linting and Quality
Run lint and address errors before merge:
```sh
pnpm run lint
```
Typical fixes:
- For Node config files (e.g., `vite.config.js`, `tools/*`), add at top:
  ```js
  /* eslint-env node */
  ```
- Remove unused imports/vars; fix React Hooks dependency warnings where feasible.

## Tailwind, Fonts, and Colors
- Fonts are loaded via `src/App.css` (`@fontsource/inter` and `@fontsource/playfair-display`).
- Brand variables and utility overrides live in `src/theme/brand-colors.css` and are imported after Tailwind in `src/index.css`.
- Tailwind content paths are set in `src/tailwind.config.js` and should cover all JSX/TSX.

## PR Checklist (before merge)
- [ ] `pnpm install --no-frozen-lockfile` succeeds
- [ ] `pnpm run build` succeeds (Vite)
- [ ] `pnpm run lint` passes or only contains acknowledged warnings
- [ ] No remaining relative imports to `lib/firebase`
- [ ] Netlify deploy preview passes

## Rollback
If needed, revert the following commits on this branch:
- <latest> – CommunitiesManager metrics and Refresh wiring
- <latest> – EnhancedCommunityPage: Firestore community doc load + unconditional useAuth

## Owner Handoff Notes
- App tree is wrapped with `AuthProvider` in `src/App.jsx`, so `useAuth()` is always defined. All pages using `useAuth` must call it unconditionally and null-check `user` where needed.
- Brand community route is available at `/brand/community/:communityId` under RoleGuard(brand_manager).
- CommunitiesManager now shows live metrics (24h interactions, trending hashtags) and has a functioning Refresh that restarts listeners.
- `reliability-droid-report.html` has been updated with latest RCA and fixes.
