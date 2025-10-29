title: Brand Manager System
version: 1.1
author: Manus AI / Factory AI / Liza Boone
last_updated: 2025-10-29

# Brand Manager System

Brand managers (paying customers) manage brand presence, content, communities, and review analytics.
In future, the term "Brand Admin" may replace "Brand Manager" to allow delegating manager roles to
employees or AI agents while keeping billing/ownership clear.

Related: ./admin-system.md

## Key Screens and Paths (Current)

- Dashboard shell: src/pages/brand/Dashboard.jsx (+ sections under src/pages/brand/dashboard/)
- Analytics: src/pages/brand/BrandAnalyticsPage.jsx
- ROI Calculator: src/pages/brand/BrandROICalculatorPage.jsx
- Communities: src/pages/brand/BrandCommunityPage.jsx and src/pages/brand/Communities.jsx
- Content tools: src/pages/brand/ContentManager.jsx and src/pages/brand/BrandContentManager.jsx
- Posting as Brand (UI): src/pages/brand/BrandPosting.jsx
- Configuration: src/pages/brand/BrandConfiguration.jsx
- Sidebar: src/components/brands/BrandSidebar.jsx

## Access Control and Role Model (Current)

- Roles and permissions are derived in src/contexts/auth-context.jsx. Brand managers resolve to
  role "brand_manager" with brandId association. Super Admin has full access.
- Convenience flags: isBrandManager (boolean), brandId on the user profile. PERMISSIONS include
  MANAGE_BRAND_CONTENT, MANAGE_BRAND_PRODUCTS, VIEW_ANALYTICS for brand managers.
- Route guarding exists via app-level checks; ensure brand pages validate either isBrandManager or
  isSuperAdmin and enforce brandId scoping where applicable.

Note: BrandPosting.jsx expects canPostAsBrand() from useAuth, which is not currently provided by
AuthContext. See Known Gaps.

## Data and Persistence (Current)

- Firestore is used for brand analytics and saved ROI scenarios.
  - ROI scenarios are persisted under collection "roi_scenarios" (see BrandROICalculatorPage.jsx)
    with brandId, inputs, results, createdAt fields.
  - Brand analytics uses Chart.js on top of fetched data; some datasets currently use mocked values
    or derived placeholders.
- Real-time: Most brand pages currently use request-time fetches (getDocs); some areas can adopt
  onSnapshot for live updates in future iterations.

## Dashboard and Analytics (Current)

- Dashboard (src/pages/brand/Dashboard.jsx) provides sections: Analytics, Users, Content,
  Sample Requests, Communities, Brand Performance, Activity, Settings, Help.
- Analytics UI (BrandAnalyticsPage.jsx) uses Chart.js (Line/Bar/Pie) with filters for date range and
  content type; includes engagement, views by content, training completion, user growth, sales
  attribution, and products sold visualizations.
- ROI Calculator (BrandROICalculatorPage.jsx) computes projections (additional products, revenue,
  profit, ROI, break-even, payback period) and saves named scenarios to Firestore per brand.

## Community Integration (Current)

- BrandCommunityPage.jsx and Communities.jsx provide community overview and management UIs.
- BrandPosting.jsx renders a “post as brand” workflow with mock API calls and a brand badge; it does
  not yet persist to Firestore.

## UI and Styling

- Tailwind CSS v4 with shadcn/ui primitives, lucide-react icons.
- Brand palette: Petal Pink family in src/brand/palette.ts.
- Typography: Geist (UI), Libre Baskerville (headings), IBM Plex Mono (display) in src/brand/typography.ts.

## Testing and QA

- Legacy Brand Communities UI test doc: ../../BRAND_COMMUNITIES_TESTING.md (legacy)
- Consolidated QA checklist: ../operations/qa-checklist.md

## Known Gaps and TODOs

- AuthContext: add canPostAsBrand() that returns true only when:
  - role is brand_manager or super_admin, and
  - PERMISSIONS.MANAGE_BRAND_CONTENT is granted, and
  - when brand_manager, user.brandId matches target brandId.
- Replace BrandPosting.jsx mock endpoints with Firestore/Functions-backed create flow:
  - Write to community_posts with authorType='brand', brandId, isBrandPost=true; add moderation flags.
  - Gate posting by membership/allowed communities; surface errors to UI.
- Strengthen route guards for all /brand/* routes to require brand_manager or super_admin.
- Adopt onSnapshot where live updates are desired (e.g., recent posts, community metrics).
- Unify analytics data sources; remove mock fallbacks; add server-side aggregation where needed.
- Document desktop-only constraints if enforced; add responsive read-only view if not.

## Operational Notes

- Use Firebase Emulator Suite during development to avoid mutating production.
- Ensure Firestore security rules restrict brand writes to the owning brand manager and admins.

## Change Log

- 1.1 (2025-10-29): Updated to reflect current pages (Dashboard, Analytics, ROI, Communities, Posting UI),
  Chart.js analytics, Firestore ROI scenarios, RBAC details, and added concrete TODOs for posting,
  guards, and AuthContext helper.
- 1.0 (2025-10-27): Initial draft.
