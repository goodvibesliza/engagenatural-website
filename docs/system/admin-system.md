title: Admin System
version: 1.0
author: Manus AI / Factory AI / Liza Boone
last_updated: 2025-10-27

# Admin System

The admin experience provides user and brand oversight, verification review, content tools, and
system configuration.

Related: ./brand-manager-system.md

## Key Screens and Paths

- Users: src/pages/admin/Users.jsx and components under src/components/admin/users/
- Verification: src/pages/admin/VerifyStaff.jsx and src/components/admin/verification/
- Analytics: src/pages/admin/Analytics.jsx and src/components/admin/analytics/*
- Activity: src/components/admin/activity/activity-feed.jsx
- Settings: src/components/admin/settings/system-settings.jsx
- Layout: src/components/admin/layout/*

## Verification Review Flow

Data sources:
- verification_requests/{id}: submittedAt, deviceLoc, metadata.exif, distance_m, autoScore, reasons
- users/{uid}: storeAddressText, storeAddressGeo, storeLoc

Actions:
- Approve / Reject / Request Info (creates notifications/{uid}/system doc with link to staff page)

See also: Firebase Architecture for scoring function and data shapes.

## Permissions

Only super_admin can access admin pages. Role checks are enforced via RoleGuard and UI guards.

## Embedded Visuals

![Admin Panel](../assets/admin_panel_full_functionality_screenshot.png)

Add additional screenshots (1–4) to docs/assets/ and reference them here under relevant headers.

## Operational Notes

- Use emulator for safe verification testing (VITE_USE_EMULATOR=true).
- When Request Info is used, ensure system notifications appear under staff notifications page.
