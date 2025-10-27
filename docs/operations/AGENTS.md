title: AGENTS – Operating Guide
version: 1.0
author: Manus AI / Factory AI / Liza Boone
last_updated: 2025-10-27

# AGENTS – Next Steps and Operating Guide

This document captures the exact next steps to finish and validate the current workstream.

## 2025-10 Verification: Store Location + Auto-Scoring + System Notifications

Context: Verification now relies on user-saved store location (no master store list). Admins can
request more info; that triggers a system notification visible on /staff/notifications.

Key files
- Staff: src/pages/staff/dashboard/VerificationPage.jsx
  - Shows a "Store Location" card at top with link to /staff/profile/store-location
  - Submits deviceLoc (if granted) with verification payload
- Store location page: src/pages/auth/ProfileStoreLocation.jsx
  - Saves users/{uid}.storeLoc { lat, lng, setAt, source:'device' } and storeAddressText
  - New (2025-10-24): Address geocode is stored under users/{uid}.storeAddressGeo { lat, lng,
    setAt, source:'address', provider } and NEVER written to storeLoc
- Admin review: src/pages/admin/VerifyStaff.jsx
  - Signals: shows the store address text and the address geocode (storeAddressGeo), the
    verification GPS, distance/score, reasons, and map links
  - Baseline: UI uses users/{uid}.storeAddressGeo (address from text entry) as the store baseline
    for display and any derived client-side distance/score when server fields are missing
  - Actions: Approve/Reject/Request Info
  - Request Info writes a system notification at notifications/{uid}/system/{autoId}
- Functions
  - functions/src/onPhotoEXIF.ts → exif: { hasGps, lat?, lng? }, photoRedactedUrl
  - functions/src/onVerificationScore.ts → currently compares verification GPS vs
    users/{uid}.storeLoc (device); UI now uses storeAddressGeo as the baseline for clarity. If
    server-side comparison should also use the address baseline, update the function accordingly.
- Notifications UI: src/pages/staff/dashboard/NotificationsPage.jsx
  - Adds a "System" tab section reading notifications/{uid}/system ordered by createdAt desc
  - Each notification shows title/body/time; "View" navigates to link or /staff/verification

Firestore shapes
- Verification request (verification_requests/{id}):
  {
    userId, userEmail, userName,
    photoURL?, metadata?, deviceLoc?, deviceLocDenied?,
    status: 'pending'|'approved'|'rejected'|'needs_info',
    autoScore?, distance_m?, reasons?: string[], locSource?: 'device'|'exif'|null,
    submittedAt, reviewedAt?, infoRequestedAt?, infoRequestMessage?
  }

- User profile (users/{uid}):
  {
    storeAddressText?: string,
    storeAddressGeo?: { lat, lng, setAt, source:'address', provider?: 'nominatim' },
    storeLoc?: { lat, lng, setAt, source:'device' }
  }

- System notifications (notifications/{uid}/system/{autoId}):
  { type: 'verification_info_request', title, body, link: '/staff/verification', unread: true,
    createdAt, meta?: { requestId } }

Admin → Request Info behavior
- Updates verification_requests/{id}: { status:'needs_info', infoRequestedAt, infoRequestMessage }
- Adds notifications/{uid}/system doc as above

Staff → Notifications behavior
- Subscribes to notifications/{uid}/system (realtime)
- "Mark system as read" zeroes unread flags on all docs in view
- Opening an item marks unread:false, readAt and navigates

Testing checklist
1) Save store location (ProfileStoreLocation) and verify card appears in Verification page
2) Submit verification with/without device location
3) Cloud Functions populate exif, distance_m, autoScore, reasons
4) Admin Request Info creates a system notification; check /staff/notifications → System
5) Click "View" to navigate to /staff/verification and unread clears

Notes
- Geo badge thresholds: Match ≤250m, Near ≤800m
- AutoScore: 100 at 0–50m → linearly to 0 by 1500m

### Store location policy update (2025-10-24)
- Device-only policy for storeLoc:
  - storeLoc is strictly for device GPS: { lat, lng, setAt: serverTimestamp(), source: 'device' }
  - Address coordinates are never persisted into storeLoc
- Address handling:
  - Human-entered address is kept as storeAddressText
  - Geocoded address coordinates are stored in storeAddressGeo with serverTimestamp and
    source:'address'
- UI alignment (both places):
  - src/pages/auth/ProfileStoreLocation.jsx → writes storeAddressGeo and, when available, device
    GPS to storeLoc
  - src/pages/staff/dashboard/VerificationPage.jsx → inline widget mirrors the same behavior
  - Local React state uses a pending placeholder for setAt (no local Date()) until Firestore
    serverTimestamp resolves

### Language selector & i18n (2025-10-24)
- Language control (profile):
  - File: src/pages/staff/dashboard/ProfilePage.jsx
  - Section "Language / Idioma" with a select for English (en) and Español (es)
  - On change: updates users/{uid}.locale and shows a toast ("Language updated to English" /
    "Idioma actualizado a Español")
  - Preselects from user.locale; defaults to "en"
- Locale wiring:
  - Verification page strings: getVerifyStrings(user?.locale || navigator.language || 'en')
  - Admin rejection modal strings: getVerifyStrings(admin?.locale || navigator.language || 'en')
- Verification page copy updates:
  - Subhead under "Verification Center" replaced with comma-separated copy (see component for
    exact text)
  - Restored the pink notice box using strings.NOTICE_TITLE and strings.NOTICE_SUBTEXT
  - Locale keys present in src/locales/en/verification.json and src/locales/es/verification.json

## Quickstart: Community Byline/Avatar Debugging (Store/Brand not showing)

Goal: Ensure posts display the author name with the correct Store/Brand byline and avatar across
/community, /staff/community and post detail pages.

Primary files to inspect (byline + avatar mapping):
- src/components/community/WhatsGoodFeed.jsx
  - Maps Firestore docs to post objects; sets: userId, brand, company, authorName, authorPhotoURL,
    brandId
  - Enrichment: if company is generic or avatar missing, loads users/{userId} to fill company
    (storeName|retailerName|companyName) and avatar (profileImage|photoURL)
- src/components/community/ProFeed.jsx
  - Same mapping + enrichment as above for the Pro feed
- src/components/community/PostCardDesktopLinkedIn.jsx
  - Byline uses: brandName = post.company || post.brandName || post.brand
  - Avatar uses: post.authorPhotoURL fallbacks
- src/components/community/PostCard.jsx (non-desktop variant)
  - Pill prefers company when non-generic; shows company next to author
- src/pages/PostDetail.jsx
  - CONSTANT: GENERIC_COMPANY_REGEX used to determine whether a company value is “generic” (e.g.,
    whats-good|all|public|pro feed)
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
   - PostCard: pill prefers non-generic company; author row shows company dot-joined when
     non-generic
   - PostDetail: pill and author-row use GENERIC_COMPANY_REGEX to prefer non-generic company

Common root causes and fixes:
- Missing userId on post: Add userId/authorId on write; or expand mapping fallbacks
- users/{userId} lacks company/avatar fields: Populate storeName/retailerName/companyName and
  profileImage/photoURL
- Rules block user profile read: Update Firestore rules to allow safe read of non-sensitive
  profile fields
- Brand/company stored under unexpected keys: Extend feed mappers to include the new keys

Feature flag and routes:
- Desktop shell for community is behind VITE_EN_DESKTOP_FEED_LAYOUT=linkedin
- Routes involved:
  - /community → CommunityLinkedInRoute wrapper (desktop shell when flag+viewport match; redirects
    to /staff/community otherwise)
  - /staff/community → phone-first IA
  - /community/post/:postId → redirector to staff route
  - /staff/community/post/:postId → PostDetail (uses enrichment and shared generic detection)

Temporary debug tips:
- Add console.debug in WhatsGoodFeed/ProFeed mapping to log { id, userId, company, brand,
  authorName, authorPhotoURL }
- Check console for enrichment errors surfaced in PostDetail (catch logs)

Potential improvements (future work):
- Extract GENERIC_COMPANY_REGEX to a shared util and reuse in PostCard/feeds
- Add a shared resolveAuthorFields(postDoc) helper to unify mapping across feeds/detail
- Expand brandId resolution to improve getBrandLogo coverage

Landing behavior change (staff):
- Staff-family roles (staff, verified_staff, retail_staff) now land on /community after login (see
  src/utils/landing.js)

## Working Branch
- Use branch: `phase-8.8/web-linkedin-desktop-layout`
- Open PR: https://github.com/goodvibesliza/engagenatural-website/compare/main...phase-8.8/web-linkedin-desktop-layout

### Feature Flags / Mobile Skin
- Env flag: `EN_MOBILE_FEED_SKIN=linkedin`
- Active only on mobile (<768px). Desktop remains unchanged.
- CSS scoped with `data-mobile-skin="linkedin"` on page root/container.

### QA Hooks (Test IDs)
- Top bar (desktop): `topbar`, `topbar-notifications`, `topbar-mybrands`, `topbar-learning`,
  `topbar-avatar`
- Bottom nav (mobile): `bottomnav`, `bottomnav-mybrands`, `bottomnav-notifications`,
  `bottomnav-communities`, `bottomnav-learning`
- Desktop card (LinkedIn): `desktop-linkedin-postcard`, `desktop-linkedin-avatar`,
  `desktop-linkedin-author-name`, `desktop-linkedin-company-time`, `desktop-linkedin-hero`,
  `desktop-linkedin-action-like`, `desktop-linkedin-action-comment`,
  `desktop-linkedin-action-training`
- Mobile components: `mobile-linkedin-composer`, `mobile-linkedin-filterbar`,
  `mobile-linkedin-postcard`, `mobile-linkedin-action-*`

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

Context: A series of fixes were made to stabilize community feeds and post detail routing. Future
changes should follow these rules.

- Firestore imports and queries
  - Do NOT dynamically import Firestore modules in components.
  - Import from `firebase/firestore` at the top only and prefer aliasing to avoid name clashes, but
    always source the app instance from `@/lib/firebase`.
  - Never query `users` by email from the client. Enrich only by `users/{userId}`. If email
    matching is needed, move it to a callable Cloud Function.

- Enrichment policy (performance)
  - Avoid N-per-post lookups on the client. Preferred: enrich at write time when the post is
    created, or via a Cloud Function trigger. If client enrichment is unavoidable, batch/cached
    lookups by userId and gate behind a strict need check.

- Generic company detection
  - Treat the following as generic: `whats-good|whatsgood|what's good community|all|public|community`
    and the standalone word "community" (regex: `^\s*(the\s+)?community\s*$`).
  - Do NOT mark multi-word brand names containing "community" (e.g., "Community Coffee") as
    generic.

- UI behavior
  - Desktop LinkedIn card: only render hero image when images exist (no placeholders).
  - Left nav: "New Post" button is staff-only (roles: staff, verified_staff, brand_manager,
    super_admin).

- Routing and code-splitting
  - `PostDetail` is imported statically to avoid Netlify chunk fetch failures; do not lazy-load
    unless you also validate chunk loading in preview.
  - Remove unnecessary `Suspense` wrappers when the target component is eagerly imported.
  - My Brands → Community deep-link: From /staff/my-brands, brand entries now navigate to
    `/community?tab=whats-good&brand=<BrandName>&via=my_brands_link&brandId=<brandId>`. The
    Community page reads `brand` to apply brand filter and includes `via`/`brandId` in
    `community_view` analytics payload.

- Community routing, tabs, and analytics (policy)
  - Tab sync honors `tab=brand` immediately; do not demote to `whatsGood` while permissions load.
    Permission CTA handles gating.
  - Router-state fallback only restores brand params when `tab=brand` is explicitly requested. No
    state reinjection on other tabs.
  - Canonicalization on non‑brand tabs: strip only `brand` and `communityId`; preserve `via` and
    `brandId` so analytics sees deep‑link source.
  - Left rail/nav: when switching away from Brand to What’s Good/Pro, ensure brand‑scoped URL
    params are cleared per above policy.
  - Role checks: never pass arrays to `hasRole`. Use
    `['verified_staff','staff','brand_manager','super_admin'].some(r => hasRole?.(r))`.
  - PostCompose: use `user?.uid` in effect deps; remove synthetic brand dropdown items; if URL has
    `brandId`, auto‑select an existing community with that `brandId` (verified staff only). Brand
    association is always validated server‑side at submit.
  - BrandFeed: when no specific `communityId` is selected, include all brand posts (don’t exclude
    What’s Good).

- Files touched in this iteration
  - `src/components/community/WhatsGoodFeed.jsx`: enrichment by userId only; strict generic-company
    check; top-level Firestore imports; desktop LinkedIn card selection.
  - `src/components/community/PostCardDesktopLinkedIn.jsx`: hide generic company labels; no image
    placeholder.
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
- Brand variables and utility overrides live in `src/theme/brand-colors.css` and are imported after
  Tailwind in `src/index.css`.
- Tailwind content paths are set in `src/tailwind.config.js` and should cover all JSX/TSX.

## PR Checklist (before merge)
- [ ] `pnpm install --no-frozen-lockfile` succeeds
- [ ] `pnpm run build` succeeds (Vite)
- [ ] `pnpm run lint` passes or only contains acknowledged warnings
- [ ] No remaining relative imports to `lib/firebase`
- [ ] Netlify deploy preview passes

## Analytics & PII Guidance (critical)

Current state
- `src/lib/analytics.js` is a thin wrapper that logs in development; no external analytics SDK is
  wired yet. This is good for now but risky once a vendor is added.
- Several places include raw, stable identifiers (e.g., `user.uid`, `user_id`) in analytics
  payloads. Examples (non‑exhaustive; grep confirms multiple occurrences):
  - `src/pages/brands/CommunityEditor.jsx`
  - `src/pages/brands/CommunitiesList.jsx`
  - `src/pages/staff/dashboard/MyBrandsPage.jsx`

Risks
- When a real analytics vendor is connected (GA4, Segment, etc.), sending raw PII (UID/email/phone)
  without consent/anonymization can create compliance issues.

Policy (do this before enabling any vendor)
- Do NOT send PII to analytics. Specifically, never include: `user_id`, `uid`, `email`, `phone` in
  event payloads.
- Use one of the following instead:
  1) Anonymous ID: Generate a stable, app‑scoped anonymous ID per device/session (e.g., UUID stored
     in localStorage), and send that instead of UID.
  2) Hashed ID: If a stable user correlation is required, send a salted hash: `sha256(SALT + uid)`.
     Keep `SALT` in env (e.g., `VITE_ANALYTICS_SALT`) and rotate if needed. Never send the
     plaintext UID.
- Consent gate: Track only non‑PII by default. Add an explicit consent flag
  (cookie/localStorage/state). Only after consent: allow anonymized or hashed identifiers.
- Minimum viable payloads: Prefer event context (page, surface, action, label) over identity.

Implementation plan
1) Create helpers in `src/lib/analytics.js`:
   - `getAnonymousId()` → returns a stable UUIDv4 stored in localStorage (`en_anon_id`).
   - `getHashedId(uid)` → returns `sha256(SALT + uid)` if `VITE_ANALYTICS_SALT` is present;
     otherwise returns `undefined`.
   - `shouldSendIdentity()` → returns `true` only when consent is recorded.
2) Update all event builders to strip `user.uid`/`user_id`. If identity is needed and
   `shouldSendIdentity()` is true, add `anonymousId` or `hashedId` only.
3) Repo‑wide sweep: replace any event payloads that include raw UID/email/phone.
   - Grep: `user\.uid|user_id\s*:`
4) Add unit/dev tests for analytics payload shape (no `uid`, `user_id`, `email`, `phone`).

Notes for reviewers
- Changes today updated `communityView` to accept `{ feedType, via, brandId }` and forward the full
  payload, and My Brands now de‑duplicates `page_view` on resize. Before enabling external
  analytics, complete the PII hardening above.

Future‑proofing
- Centralize all analytics event assembly in `src/lib/analytics.js`. Components should call small
  wrappers (e.g., `communityView`, `topMenuClick`) rather than constructing payloads inline.
- Consider adding an ESLint rule or code mod to flag any `user.uid` usage inside analytics calls.

## 2025-10 Brand Dashboard refactor + build hardening

Context: The monolithic `src/pages/brand/Dashboard.jsx` was split into modular sections to improve
maintainability. Netlify build was stabilized by removing checked-in env files and reducing
false-positive secret scans.

Changes
- Extracted sections (new files under `src/pages/brand/dashboard/`):
  - `AnalyticsSection.jsx`
  - `SampleRequestsSection.jsx` (added `brandId` guard to avoid stuck spinners)
  - `UsersSection.jsx`
  - `BrandPerformanceSection.jsx`
  - `ActivitySection.jsx`
  - `SettingsSection.jsx`
- Updated `src/pages/brand/Dashboard.jsx` to import/use sections
- `AnalyticsSection`: restored Top Trainings aggregation effect; removed dead code/listeners
- `vite.config.js`: added `/* eslint-env node */`; disabled sourcemaps in build
- `netlify.toml`: disabled smart secrets scan to avoid false positives
- Removed `.env.local` and `.env.production` from git history/index
- Deleted legacy backup `src/pages/brand/Dashboard.jsx.old`

Branch / PR
- Branch: `refactor/brand-dashboard-split`
- Latest commit: `d1f147df`

Deployment notes
- Ensure Netlify env includes required `VITE_*` vars
- Optionally set `SECRETS_SCAN_SMART_DETECTION_ENABLED=false` in Netlify environment if scans still
  block

Validation
- `pnpm install --frozen-lockfile` → OK
- `pnpm build` → OK (PR deploy green)

Known issue fixed (2025-10-27)
- Symptom: Left menu clicks didn’t switch sections; active highlight didn’t follow URL; deep links
  like `/brand?section=users` didn’t load the right section.
- Root cause: During the split, section state became local-only in `Dashboard.jsx` and was no longer
  synchronized with the URL. The "Help & Support" button in `BrandSidebar.jsx` also wasn’t wired to
  the parent section setter, so it never activated the Help section.
- Fix:
  - `src/pages/brand/Dashboard.jsx`: use `useSearchParams` to initialize `activeSection` from
    `?section=...`, update the query string on section changes, and listen for search param changes
    to support back/forward and reload.
  - `src/components/brands/BrandSidebar.jsx`: wire the Help button to `onSectionChange('help')` and
    apply active styling when `activeSection === 'help'`.
  - Result: Clicking left menu switches content and highlights correctly; URL stays in sync;
    deep-linking and browser navigation work.

## Rollback
If needed, revert the following commits on this branch:
- <latest> – CommunitiesManager metrics and Refresh wiring
- <latest> – EnhancedCommunityPage: Firestore community doc load + unconditional useAuth

## Owner Handoff Notes
- App tree is wrapped with `AuthProvider` in `src/App.jsx`, so `useAuth()` is always defined. All
  pages using `useAuth` must call it unconditionally and null-check `user` where needed.
- Brand community route is available at `/brand/community/:communityId` under RoleGuard(brand_manager).
- CommunitiesManager now shows live metrics (24h interactions, trending hashtags) and has a
  functioning Refresh that restarts listeners.
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
