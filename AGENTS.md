# AGENTS – Next Steps and Operating Guide

This document captures the exact next steps to finish and validate the current workstream.

## Working Branch
- Use branch: `phase-8.7/mobile-linkedin-skin-web`
- Open PR: https://github.com/goodvibesliza/engagenatural-website/compare/main...phase-8.7/mobile-linkedin-skin-web

### Feature Flags / Mobile Skin
- Env flag: `EN_MOBILE_FEED_SKIN=linkedin`
- Active only on mobile (<768px). Desktop remains unchanged.
- CSS scoped with `data-mobile-skin="linkedin"` on page root/container.

### QA Hooks (Test IDs)
- Top bar: `topbar`, `topbar-avatar`, `topbar-search`
- Bottom nav: `bottomnav`, `bottomnav-mybrands`, `bottomnav-notifications`, `bottomnav-communities`, `bottomnav-learning`
- Mobile components: `mobile-linkedin-composer`, `mobile-linkedin-filterbar`, `mobile-linkedin-postcard`, `mobile-linkedin-action-*`

### Post-Auth Redirect Rules
Order:
1) `redirectTo` (or `returnUrl`) query param
2) `localStorage.en.lastRoute` (valid staff/community path)
3) Defaults: staff → `/community?tab=whats-good`; brand/admin unchanged
Util: `src/lib/postAuthRedirect.js` (wired in `src/pages/auth/Login.jsx`)

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

## Dashboard Refactoring Recommendations

### Current State (as of feature/integrate-brand-sidebar)
- **Dashboard.jsx**: ~1,331 lines (down from ~1,600 after BrandSidebar integration)
- **Status**: Manageable but monolithic - contains all dashboard sections inline
- **Recent improvements**: 
  - Replaced 242 lines of duplicate sidebar code with BrandSidebar component
  - Removed old navItems array and duplicate user menu
  - Proper onSectionChange callback wiring

### Recommended Future Refactoring
Extract individual dashboard sections into separate components to improve:
- **Maintainability**: Smaller files are easier to understand and edit
- **Testability**: Individual sections can be tested in isolation
- **Performance**: Better code splitting and lazy loading opportunities
- **Developer Experience**: Reduced cognitive load when working on specific features

### Proposed Architecture

```
src/pages/brand/Dashboard.jsx (~200-300 lines)
├─ Layout shell with BrandSidebar
├─ Section routing logic
└─ Import section components

src/pages/brand/dashboard/
├─ AnalyticsSection.jsx (~150-250 lines)
├─ UsersSection.jsx (~100-200 lines)
├─ ContentSection.jsx (~150-250 lines)
├─ SampleRequestsSection.jsx (~200-300 lines)
├─ BrandPerformanceSection.jsx (~150-250 lines)
├─ ActivitySection.jsx (~100-200 lines)
└─ SettingsSection.jsx (~100-150 lines)
```

### Implementation Plan
1. **Create dashboard sections directory**: `src/pages/brand/dashboard/`
2. **Extract sections one at a time** (order by complexity):
   - Start with simpler sections (SettingsSection, ActivitySection)
   - Move to medium complexity (UsersSection, ContentSection)
   - Finish with complex sections (AnalyticsSection, SampleRequestsSection, BrandPerformanceSection)
3. **For each section**:
   - Extract JSX and related state/effects into new component
   - Move section-specific hooks and utilities
   - Keep shared utilities in parent or separate utility files
   - Import and wire up in Dashboard.jsx
4. **Test after each extraction** to ensure no regressions
5. **Final cleanup**: Remove unused imports and state from Dashboard.jsx

### Benefits
- Each section file will be ~100-300 lines (optimal for AI editing tools)
- Clear separation of concerns
- Easier to add new sections or modify existing ones
- Better code organization following single-responsibility principle
- Reduced context switching when working on specific features

### Notes
- Current Dashboard.jsx is functional and not blocking - this is a quality-of-life improvement
- Consider doing this refactoring on a separate feature branch
- Can be done incrementally without breaking changes
- BrandDesktopLayout.jsx is a bare-bones shell and doesn't have the section callback wiring needed
