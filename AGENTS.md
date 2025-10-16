# AGENTS – Next Steps and Operating Guide

This document captures the exact next steps to finish and validate the current workstream.

## Quickstart: Community Byline/Avatar Debugging (Store/Brand not showing)

Goal: Ensure posts display the author name with the correct Store/Brand byline and avatar across /community, /staff/community and post detail pages.

Primary files to inspect (byline + avatar mapping):
- src/components/community/WhatsGoodFeed.jsx
  - Maps Firestore docs to post objects; sets: userId, brand, company, authorName, authorPhotoURL, brandId
  - Enrichment: if company is generic or avatar missing, loads users/{userId} to fill company (storeName|retailerName|companyName) and avatar (profileImage|photoURL)
- src/components/community/ProFeed.jsx
  - Same mapping + enrichment as above for the Pro feed
- src/components/community/PostCardDesktopLinkedIn.jsx
  - Byline uses: brandName = post.company || post.brandName || post.brand
  - Avatar uses: post.authorPhotoURL fallbacks
- src/components/community/PostCard.jsx (non-desktop variant)
  - Pill prefers company when non-generic; shows company next to author
- src/pages/PostDetail.jsx
  - CONSTANT: GENERIC_COMPANY_REGEX used to determine whether a company value is “generic” (e.g., whats-good|all|public|pro feed)
  - Same enrichment from users/{userId} when company is generic or avatar missing

Checklist to diagnose when brand/store still does not appear:
1) Verify post doc fields in Firestore (community_posts/{postId}):
   - userId OR authorId OR author.uid exists and matches a users/{userId} document
   - brandName/companyName present if available
   - authorName and authorPhotoURL present or available via author.* fields
2) Verify user profile doc (users/{userId}):
   - storeName or retailerName or companyName set
   - profileImage or photoURL set
   - Security rules permit reads for these fields
3) Confirm mapping/enrichment runs:
   - WhatsGoodFeed/ProFeed map: userId, company, authorPhotoURL, brandId
   - Enrichment triggers when company is generic per GENERIC_COMPANY_REGEX or avatar missing
4) UI components:
   - PostCardDesktopLinkedIn: uses company first; falls back to brand
   - PostCard: pill prefers non-generic company; author row shows company dot-joined when non-generic
   - PostDetail: pill and author-row use GENERIC_COMPANY_REGEX to prefer non-generic company

Common root causes and fixes:
- Missing userId on post: Add userId/authorId on write; or expand mapping fallbacks
- users/{userId} lacks company/avatar fields: Populate storeName/retailerName/companyName and profileImage/photoURL
- Rules block user profile read: Update Firestore rules to allow safe read of non-sensitive profile fields
- Brand/company stored under unexpected keys: Extend feed mappers to include the new keys

Feature flag and routes:
- Desktop shell for community is behind VITE_EN_DESKTOP_FEED_LAYOUT=linkedin
- Routes involved:
  - /community → CommunityLinkedInRoute wrapper (desktop shell when flag+viewport match; redirects to /staff/community otherwise)
  - /staff/community → phone-first IA
  - /community/post/:postId → redirector to staff route
  - /staff/community/post/:postId → PostDetail (uses enrichment and shared generic detection)

Temporary debug tips:
- Add console.debug in WhatsGoodFeed/ProFeed mapping to log { id, userId, company, brand, authorName, authorPhotoURL }
- Check console for enrichment errors surfaced in PostDetail (catch logs)

Potential improvements (future work):
- Extract GENERIC_COMPANY_REGEX to a shared util and reuse in PostCard/feeds
- Add a shared resolveAuthorFields(postDoc) helper to unify mapping across feeds/detail
- Expand brandId resolution to improve getBrandLogo coverage

Landing behavior change (staff):
- Staff-family roles (staff, verified_staff, retail_staff) now land on /community after login (see src/utils/landing.js)

## Working Branch
- Use branch: `phase-8.8/web-linkedin-desktop-layout`
- Open PR: https://github.com/goodvibesliza/engagenatural-website/compare/main...phase-8.8/web-linkedin-desktop-layout

### Feature Flags / Mobile Skin
- Env flag: `EN_MOBILE_FEED_SKIN=linkedin`
- Active only on mobile (<768px). Desktop remains unchanged.
- CSS scoped with `data-mobile-skin="linkedin"` on page root/container.

### QA Hooks (Test IDs)
- Top bar (desktop): `topbar`, `topbar-notifications`, `topbar-mybrands`, `topbar-learning`, `topbar-avatar`
- Bottom nav (mobile): `bottomnav`, `bottomnav-mybrands`, `bottomnav-notifications`, `bottomnav-communities`, `bottomnav-learning`
- Desktop card (LinkedIn): `desktop-linkedin-postcard`, `desktop-linkedin-avatar`, `desktop-linkedin-author-name`, `desktop-linkedin-company-time`, `desktop-linkedin-hero`, `desktop-linkedin-action-like`, `desktop-linkedin-action-comment`, `desktop-linkedin-action-training`
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

## 2025-10 Community Feed Updates (must read)

Context: A series of fixes were made to stabilize community feeds and post detail routing. Future changes should follow these rules.

- Firestore imports and queries
  - Do NOT dynamically import Firestore modules in components.
  - Import from `firebase/firestore` at the top only and prefer aliasing to avoid name clashes, but always source the app instance from `@/lib/firebase`.
  - Never query `users` by email from the client. Enrich only by `users/{userId}`. If email matching is needed, move it to a callable Cloud Function.

- Enrichment policy (performance)
  - Avoid N-per-post lookups on the client. Preferred: enrich at write time when the post is created, or via a Cloud Function trigger. If client enrichment is unavoidable, batch/cached lookups by userId and gate behind a strict need check.

- Generic company detection
  - Treat the following as generic: `whats-good|whatsgood|what's good community|all|public|community` and the standalone word "community" (regex: `^\s*(the\s+)?community\s*$`).
  - Do NOT mark multi-word brand names containing "community" (e.g., "Community Coffee") as generic.

- UI behavior
  - Desktop LinkedIn card: only render hero image when images exist (no placeholders).
  - Left nav: "New Post" button is staff-only (roles: staff, verified_staff, brand_manager, super_admin).

- Routing and code-splitting
  - `PostDetail` is imported statically to avoid Netlify chunk fetch failures; do not lazy-load unless you also validate chunk loading in preview.
  - Remove unnecessary `Suspense` wrappers when the target component is eagerly imported.
  - My Brands → Community deep-link: From /staff/my-brands, brand entries now navigate to `/community?tab=whatsGood&brand=<BrandName>&via=my_brands_link&brandId=<brandId>`. The Community page reads `brand` to apply brand filter and includes `via`/`brandId` in `community_view` analytics payload.

- Files touched in this iteration
  - `src/components/community/WhatsGoodFeed.jsx`: enrichment by userId only; strict generic-company check; top-level Firestore imports; desktop LinkedIn card selection.
  - `src/components/community/PostCardDesktopLinkedIn.jsx`: hide generic company labels; no image placeholder.
  - `src/components/community/DesktopLeftNav.jsx`: show "New Post" only for staff roles.
  - `src/pages/PostDetail.jsx`: static import in routes; consistent byline logic.
  - `src/App.jsx`: static import for `PostDetail`; removed `Suspense` wrapper and unused imports.

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
