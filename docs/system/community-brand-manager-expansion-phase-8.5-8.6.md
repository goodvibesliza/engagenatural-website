title: Community & Brand Manager Expansion (Phase 8.5 → 8.6)
version: 1.0
author: EngageNatural / Factory AI
last_updated: 2025-10-29

# Community & Brand Manager Expansion (Phase 8.5 → 8.6)

This document captures the shipped and in-progress work for Community (Staff) and Brand Manager tools. Updated to reflect the current codebase.

## Staff-Side (Phase 8.5 — shipped/underway)

Shipped surfaces and features:

- Two-feed Community UI:
  - What’s Good (all logged-in users)
  - Pro Feed (verified staff only, gated for others)
  - Code: `src/pages/Community.jsx`, `src/pages/community/WhatsGoodFeed.jsx`, `src/pages/community/ProFeed.jsx`, `src/pages/community/CommunityFeed.jsx`
- Post detail view with comments/likes and training linkouts
  - Code: `src/pages/PostDetail.jsx` (primary), `src/pages/community/PostThread.jsx`
- Client-side filters: search, brand chips, tag chips
  - Code: `src/pages/Community.jsx` (filters sync with URL), `components/community/*`
- Copy kit polish: concise tabs, verify CTAs, empty/loading states
  - Code: `components/community/FeedTabs`, `components/community/EmptyStates`, `components/community/LoadingStates`
- Analytics events for community interactions
  - Examples: `communityView`, `filterApplied`, `track` in `src/lib/analytics.js`
- Accessibility & performance guardrails
  - Touch targets, focus states, skeleton loaders used across community components
- QA/usability
  - “Phone-first” flow is implemented in mobile components under `components/community/mobile/*`

Status notes:
- Pro Feed content currently uses gated access with stub posts for preview; creation flow surfaced as “coming soon”. See `src/pages/community/ProFeed.jsx`.

## Brand-Side (Phase 8.6 — implemented on /brands)

Scope and current implementation:

- Desktop-only brand manager Communities tools under `/brands` → Communities
  - Menu/entry: Communities in the brand sidebar/menu
  - Pages: `src/pages/brands/CommunitiesList.jsx`, `src/pages/brands/CommunityEditor.jsx`
- Communities List (one community per brand)
  - Stats: posts, unique staff, likes/comments (7/30-day)
  - Code: list + metrics compute via `computeCommunityMetrics` and adapters in `src/lib/communityAdapter`
- Community Editor (two-pane desktop) for create/edit/publish/delete
  - Rich-text basics, tagging, attach training (searchable selector), preview-as-staff
  - Training selector and toggles: `TrainingSelectFixed`, filter toggle state `trainingFilterEnabled`
  - Code: `src/pages/brands/CommunityEditor.jsx`
- Reporting panel: topline metrics, CTR, simple charts
  - Code: `src/components/brands/CommunityReport` (used by list/editor)
- Integration with staff “My Brands”: follow a brand to see its community in feed
  - Code: `src/pages/staff/dashboard/MyBrandsPage.jsx` and community feed brand-context logic in `src/pages/Community.jsx`
- Enforced one community per brand and role-based guards
  - Checks in `CommunityEditor.jsx` (redirect if community exists; role=brand_manager; brandId required)
- Training enhancements
  - Attach/clear/view from editor; “show posts linked to this training” toggle; inline link/unlink on rows
  - Code: `CommunityEditor.jsx` with `brandPostAttachTraining`, `brandTrainingFilterToggle` analytics
- Analytics for brand actions
  - `brandPostCreate`, `brandPostPublish`, `brandPostUpdate`, `brandPostDelete`, `brandPostAttachTraining`, `brandTrainingPreview` imported in editor
- Accessibility
  - Desktop-only enforcement via window width check; keyboard navigation helpers; aria-live via `LiveAnnouncer`
- QA/test plan hooks
  - Data-testids are present in multiple brand/staff components to aid automated checks

Status notes (implementation reality):
- Desktop-only enforcement is implemented via breakpoint checks; soft gate (URL can still be accessed on small screens but UI warns/redirects as needed).
- One-community-per-brand is enforced in `CommunityEditor.jsx` when creating “new”.
- Analytics events are wired to exported functions from `src/lib/analytics`.

## Flow of Work

1) Staff community UI shipped first (Phase 8.5).
2) Brand manager desktop tools layered next (Phase 8.6).
3) Code Droid builds minimal, production-ready features on a feature branch → CodeRabbit reviews before merge to main.
4) Next phases afterward: Phase 9 security, Phase 10 QA/tests, Phase 11 observability/legal.

## Known Gaps / Next Steps

- Visual tokens: some community/brand pages still use legacy sage/moss Tailwind colors; app brand tokens are petal-pink. See `docs/design/ui-style-guide.md` for alignment plan.
- Pro Feed post creation is not yet enabled (UI surfaces “coming soon”).
- Ensure consistent analytics naming across staff vs brand actions; audit `src/lib/analytics` for drift.
- Confirm all brand/staff community components include `data-testid` coverage per QA plan.

## References (selected)

- Staff Community
  - `src/pages/Community.jsx`
  - `src/pages/community/WhatsGoodFeed.jsx`
  - `src/pages/community/ProFeed.jsx`
  - `src/pages/PostDetail.jsx`
  - `src/pages/community/PostThread.jsx`

- Brand Manager
  - `src/pages/brands/CommunitiesList.jsx`
  - `src/pages/brands/CommunityEditor.jsx`
  - `src/components/brands/CommunityReport`
  - `src/lib/communityAdapter`

- Integration
  - `src/pages/staff/dashboard/MyBrandsPage.jsx`
  - `src/lib/analytics`
