title: Admin System
version: 1.1
author: Manus AI / Factory AI / Liza Boone
last_updated: 2025-10-29

# Admin System

The admin experience provides user and brand oversight, verification review, content tools, and
system configuration. This document reflects the current implementation status in the codebase.

Related: ./brand-manager-system.md

## Key Screens and Paths

- Users: src/pages/admin/Users.jsx and components under src/components/admin/users/
- Verification: src/pages/admin/VerifyStaff.jsx and src/components/admin/verification/
- Analytics: src/pages/admin/Analytics.jsx and src/components/admin/analytics/*
- Activity: src/components/admin/activity/activity-feed.jsx
- Settings: src/components/admin/settings/system-settings.jsx
- Layout: src/components/admin/layout/*

## Access Control and Permissions (Current)

- Roles and claims are derived in src/contexts/auth-context.jsx.
- Super Admin has all permissions; Brand Manager has scoped brand permissions; Staff/Retail have limited access.
- Admin routes are effectively gated to super_admin via guards. The System Settings UI additionally checks permissions through useRoleAccess(). Note: the settings component currently checks for 'manage_system_settings', which is not a defined permission token in PERMISSIONS; result is access denied unless super_admin guards allow entry. Aligning the token to PERMISSIONS.SYSTEM_SETTINGS is a TODO.

## Verification Review Flow

Data sources:
- verification_requests/{id}: submittedAt, deviceLoc, metadata.exif, distance_m, autoScore, reasons
- users/{uid}: storeAddressText, storeAddressGeo, storeLoc

Actions:
- Approve / Reject / Request Info (creates notifications/{uid}/system doc with link to staff page)

See also: Firebase Architecture for scoring function and data shapes.

## Analytics Dashboard (Current)

- Basic metrics and simple visualizations. Recharts is integrated via src/components/ui/chart.jsx and used where applicable.
- Real-time updates use Firestore onSnapshot listeners. No WebSockets are used.
- Planned: richer interactive charts and comparative views.

## Activity and Audit Logging (Current)

- Basic activity feed exists (src/components/admin/activity/activity-feed.jsx).
- There is NOT a tamper-evident audit log at this time. Planned future work: append-only audit collection with verification checks.

## System Settings (Current)

- UI in src/components/admin/settings/system-settings.jsx covers General, Security, Notifications, Payments, Content, Integrations.
- The toggles/inputs are UI-only with simulated save; no persistence to Firestore/Functions yet.
- Security: a Two-Factor (2FA) toggle exists in UI, but MFA is NOT implemented.
- Payments: Stripe keys/fields are placeholders; no live billing integration.

## UI and Styling

- Tailwind CSS v4 with shadcn/ui primitives and lucide-react icons.
- Brand palette: Petal Pink family defined in src/brand/palette.ts.
- Typography: Geist (UI), Libre Baskerville (headings), IBM Plex Mono (display) defined in src/brand/typography.ts.

## Embedded Visuals

![Admin Panel](../assets/admin_panel_full_functionality_screenshot.png)

Add additional screenshots (1–4) to docs/assets/ and reference them here under relevant headers.

## Operational Notes

- Use emulator for safe verification testing (VITE_USE_EMULATOR=true).
- When Request Info is used, ensure system notifications appear under staff notifications page.

## Known Gaps and TODOs

- Replace 'manage_system_settings' check with PERMISSIONS.SYSTEM_SETTINGS.
- Persist System Settings to Firestore or callable Cloud Functions with validation.
- Implement MFA via Firebase Authentication multi-factor APIs; wire the 2FA toggle.
- Add proper audit logging (append-only, server-side timestamps, verification).
- Expand analytics to use interactive Recharts dashboards and saved views.

## Change Log

- 1.1 (2025-10-29): Updated to reflect current RBAC, Firestore real-time usage, non-implemented MFA/audit logging, UI-only settings, and brand styling.
- 1.0 (2025-10-27): Initial draft.
