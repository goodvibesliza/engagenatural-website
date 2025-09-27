# AGENTS – Next Steps and Operating Guide

This document captures the exact next steps to finish and validate the current workstream.

## Working Branch
- Use branch: `fix/add-typescript-config`
- Open PR: https://github.com/goodvibesliza/engagenatural-website/compare/main...fix/add-typescript-config

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
- `38ba7557` – Node 20 alignment, Netlify install flags, firebase import in entrypoint
- `213ae67d` – Update reliability-droid-report with mitigation details

## Owner Handoff Notes
- After merge, clear Netlify build cache and redeploy to ensure Node 20 takes effect.
- For any new modules, keep using `@/lib/firebase`; re-run the normalize script if needed.
