title: QA Checklist (Consolidated)
version: 1.0
author: Manus AI / Factory AI / Liza Boone
last_updated: 2025-10-27

# QA Checklist (Consolidated)

This checklist consolidates mobile/desktop community tests and brand communities tests.

## Pre-reqs

- Staff user (verified for Pro where needed). Brand manager user for brand tests.
- Feature flags as needed:
  - Desktop: `VITE_EN_DESKTOP_FEED_LAYOUT=linkedin`
  - Mobile: `EN_MOBILE_FEED_SKIN=linkedin`
- For CI, disable analytics network calls: `VITE_ANALYTICS_ENABLED=false`.

## Staff – Phone-First Community (from TESTING.md)

1) Open What's Good; open first post (`[data-testid="postcard"]`).
2) Like and comment (`like-button`, `comment-input`, `comment-submit`).
3) Pro Feed gate renders for unverified users.
4) Filter by brand and clear (`brand-chip-<slug>`).
5) Open training from a post (`view-training-cta`).

Notes: test on mobile viewport first; then desktop to confirm grid and sticky filters persist.

## Desktop – LinkedIn Shell (from WEB_LINKEDIN_DESKTOP_TESTING.md)

1) 1440px: header/left fixed; center scroll; right rail visible.
2) 1100px: right rail hides; fixed header/left remain.
3) 900px: route falls back to legacy mobile.
4) Tabs/Brand deep-link behavior and URL canonicalization rules verified.
5) Cards show logo, time, consistent image area; actions function.
6) Keyboard order and focus visible; center-only scroll.
7) Compose from Brand tab honors brandId and server validation.

## Mobile – LinkedIn Skin (from MOBILE_LINKEDIN_TESTING.md)

1) Composer + compact filters render (`mobile-linkedin-*` test IDs).
2) Post actions unchanged; Pro gate unchanged.
3) Resize ≥768px or disable flag → legacy UI.
4) Analytics payload includes `ui_variant = 'mobile_linkedin'` in dev.
5) Post-auth redirect lands on `/community?tab=whats-good`.
6) Collapsing top bar and bottom nav behaviors.

## Brand Communities – Desktop (from BRAND_COMMUNITIES_TESTING.md)

Access control:
- brand_manager can open `/brands/communities`; others blocked.
- Mobile block <1024px shows banner.

Editor and post list:
- Title/body/tags validation; save draft/publish/delete flows.
- Training attach/link/unlink via TrainingSelect and inline actions.
- Filter by training; announcements via aria-live.
- Accessibility checks (focus, labels, table semantics).

Reporting:
- Range toggles update metrics; analytics events logged in dev console.

Integration:
- Staff My Brands shows published posts with training indicators; links open detail.

## Smoke Tests (Playwright/Cypress – Phase 10)

Automate the following minimal flow:
- Staff: login → open community → like → comment → open training → logout.
- Brand: login → create draft → publish → link training → unlink → delete.
- Admin: login → open verification → Request Info → confirm staff notification.
