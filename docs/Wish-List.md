# MVP Wish List (EngageNatural Web App)

Status: October 2025

This list is distilled from current docs and AGENTS notes. It focuses on the smallest set of work to reach a solid, demo‑ready MVP.

## 1) Verification System
- Align server scoring baseline to address geocode — Completed (2025-10-31)
  - `users/{uid}.storeAddressGeo` (address) now serves as the baseline in the UI and flows.
  - `storeLoc` remains device‑only; address coords are never written into it.
  - Acceptance: UI distance/autoScore aligns when only address is present.

- Fix auto-scoring in Cloud Function (new)
  - Update `functions/src/onVerificationScore.ts` to prefer `users/{uid}.storeAddressGeo` as the baseline when device `storeLoc` is missing, and to always populate `autoScore`, `distance_m`, and `reasons`.
  - Keep thresholds: MATCH ≤250m, NEAR ≤800m; 100pts at 0–50m → linearly to 0 by 1500m.
  - Acceptance: Submitting a verification without device GPS still yields a non-null `distance_m`, `autoScore`, and reasons, matching the UI baseline.

- System notifications – “Request Info”
  - Ensure `notifications/{uid}/system` docs create on admin Request Info and render under staff Notifications “System” tab.
  - Acceptance: opening an item marks `unread:false` and navigates to `/staff/verification`.

- Verification UI copy + i18n
  - Verify strings for en/es loaded via `getVerifyStrings(...)`; pink notice restored.
  - Acceptance: language selector on Profile updates `users/{uid}.locale` and UI reflects it.

## 2) Sampling Program (MVP — Brand Direct Shipping)

Goal: Enable brand‑funded, direct‑ship samples to verified staff before coupon V2.

Scope
- Staff request flow (create `sample_requests`)
  - New UI: simple form under Staff (or My Brands → Program card):
    - Choose active program (filter `sample_programs` by brandId, date window, unitsAvailable > 0)
    - Quantity (default 1, min 1, max per program cap)
    - Shipping name, address, city, state, zip, phone, optional notes
  - Write document with status `pending`; serverTimestamp fields: `createdAt`, `updatedAt`.
- Brand workflow (manage requests)
  - Extend `SampleRequestsSection.jsx` with row actions:
    - Approve → set status `approved`, set `approvedAt`, optional `internalNotes`; decrement `sample_programs.unitsAvailable` atomically (transaction) or reserve units via a `reserved` counter.
    - Deny → set status `denied`, set `deniedAt`, `denyReason`.
    - Mark Shipped → set status `shipped`, `shippedAt`, `trackingNumber`, `carrier`.
    - Mark Completed → set status `completed`, `completedAt`.
  - Filter/sort by status/date.
- Data model additions
  - `sample_programs` (existing): ensure fields: `brandId`, `name`, `productName`, `unitsAvailable`, `startDate`, `endDate`, `createdBy`, `createdAt`, `active?: boolean`, `perUserCap?: number`.
  - `sample_requests` (extend):
    {
      programId, brandId, userId, retailerId?,
      quantity,
      status: 'pending'|'approved'|'shipped'|'denied'|'completed',
      shipping: { name, address1, address2?, city, state, postalCode, phone },
      trackingNumber?, carrier?,
      notes?, internalNotes?, denyReason?,
      createdAt, updatedAt, approvedAt?, deniedAt?, shippedAt?, completedAt?,
      demoSeed?: boolean
    }
- Notifications
  - On create: notify brand managers for that brand.
  - On approve/deny/ship: notify requesting staff user.
- Security rules
  - Staff can create `pending` requests for themselves.
  - Only brand managers (brandId match) or admins can update to approve/ship/deny/complete.
  - Validate quantity caps; forbid status jumps (enforce state machine).
- Indexes
  - `sample_requests` composite indexes for: `(brandId, status, createdAt desc)`, `(userId, createdAt desc)`.
  - `sample_programs` index for `(brandId, startDate desc)`.
- Seed data (optional)
  - Ensure at least one active program with non‑zero `unitsAvailable` and a few `pending/approved` requests for demo.

Acceptance Criteria
- Staff can submit a request; it appears in Brand dashboard immediately.
- Approve decrements available units (or reserves) in a transaction; deny does not.
- Shipped and Completed transitions are persisted with timestamps and optional tracking.
- Notifications fire for create and each status change.
- Rules prevent unauthorized updates and invalid transitions.

## 3) Notifications (MVP — Email + Push)
- Email (provider: SendGrid or SES)
  - Add provider config to functions (env): SENDGRID_API_KEY or AWS creds.
  - Create function helper `sendEmail({ to, templateId|subject+html, data })`.
  - Triggers: verification Request Info, sampling request create/approve/deny/ship, admin messages.
  - Store delivery logs in `notifications_meta/{uid}/emails` with status and error if any.
- Push (Firebase Cloud Messaging)
  - Service worker: `public/firebase-messaging-sw.js` with messaging handler; ensure Vite copies it.
  - Client: request permission from Profile toggle; register token and save to `users/{uid}.fcmTokens[token]={ createdAt, platform }`.
  - Functions: topic or direct sends via `sendPush({ tokens|topic, title, body, data })`.
  - Handle token refresh and invalidation (clean up on 404/410 from FCM).
- App integration
  - Wire events to a `notify()` facade that picks push when available else email.
  - UI: system notifications tab continues to show in-app items; emails/push complement it.
- Open PR follow-up
  - Fix build on branch `feature/push-notifications-only` and merge into MVP.

Acceptance Criteria
- Profile toggle controls push permission; token saved/removed accordingly.
- Receiving devices show push notifications in foreground and background.
- Emails are sent for verification request info and sampling status changes.
- All notifications log success/failure.

## 4) Analytics PII Gate (pre‑vendor)
- Implement helpers in `src/lib/analytics.js`: `getAnonymousId`, `getHashedId`, `shouldSendIdentity` (salt via `VITE_ANALYTICS_SALT`).
- Repo sweep: remove `uid/email/phone/user_id` from payloads; use anon/hashed IDs only when consented.
- Add basic tests/dev checks to prevent PII in analytics.
- Acceptance: grep for `user\.uid|user_id\s*:` returns none in analytics payload code paths.

## 5) Community Feed Polish (MVP)
- Extract `GENERIC_COMPANY_REGEX` to a shared util; reuse in feeds, cards, and detail.
- Add `resolveAuthorFields(postDoc)` helper to unify mapping across WhatsGood/Pro/PostDetail.
- Improve brandId/logo resolution fallbacks.
- Acceptance: Byline shows non‑generic store/brand consistently; no duplicate per‑post lookups beyond helper policy.

## 6) Desktop/Mobile Feed Finalization
- Desktop LinkedIn: confirm static `PostDetail` import and center‑only scroll; verify brand‑tab URL canonicalization rules.
- Mobile LinkedIn skin: confirm composer + actions + QA hooks; ensure analytics includes `ui_variant` when enabled.
- Acceptance: Manual checklists in `WEB_LINKEDIN_DESKTOP_TESTING.md` and `MOBILE_LINKEDIN_TESTING.md` pass.

## 7) Firestore Rules Hardening (post‑debug)
- Tighten permissive areas added for seeding/debugging; document emulator overrides.
- Acceptance: production rules block unsafe reads/writes; emulator flows remain unblocked with `VITE_USE_EMULATOR=true`.

## 8) Docs & DevX
- Finish `docs/firebase-environment-guide.md` with explicit `.env.local` and production variable examples and emulator toggles.
- Ensure `README-SETUP.md` points to CORS setup and Netlify Node 20; add quick “local verify” block.
- Acceptance: a new dev can choose emulator vs prod without guesswork.

## 9) QA Gates (pre‑merge)
- `pnpm install --no-frozen-lockfile` succeeds
- `pnpm run build` succeeds (Vite)
- `pnpm run lint` passes (or only acknowledged warnings)
- Netlify preview green

## 10) Rewards System — Signup Spin + Learn & Earn (Telegram)

### Overview
Add a **Rewards** module on the staff homepage highlighting two paths:
1. **Signup + Daily Spin** — users get one welcome spin after linking Telegram, then one spin per day.
2. **Learn & Earn** — verified staff earn TON for passing quizzes or completing brand challenges.

Both reward types deliver TON payouts via @EngageNaturalBot and reinforce daily engagement through Telegram notifications.

### Goals
- Increase daily active users by rewarding logins and completions.
- Drive Telegram adoption for future push + wallet features.
- Make rewards visible and aspirational directly on the staff homepage.

### Implementation Notes
- New pages/components: `/rewards/spin`, `/components/home/HomeRewards.tsx`, `/components/home/RewardCard.tsx`.
- Server logic in Functions:
  - `spin/canSpin.ts` + `spin/doSpin.ts` (daily spin RNG + payout)
  - `ton/transfer.ts` (existing TON reward utility)
- Firestore fields under `users/{uid}/spin` and `rewards/logs`.
- Use shared TON treasury with per-day and per-month caps.

### Homepage Layout
- Hero section: “Earn as you learn.” CTA changes based on state (Connect Telegram / Verify / Spin Now).
- Two cards side-by-side:
  - **Daily Spin:** “Get a welcome spin when you link Telegram, then one spin every day.”
  - **Learn & Earn:** “Pass the quiz to get paid. Bonus ‘easter eggs’ in brand challenges.”
- Right rail: lifetime rewards, today’s spin timer, active challenges.

### Dependencies
- Telegram Notification System (Phase 10)
- TON Treasury + transfer utility
- Verified staff profile (required for payouts)

### References
- `/docs/Notification-System.md`
- `/docs/spin-and-win.md` *(to be created after spin MVP launch)*
- `/docs/Implementation-Progress.md` (Phase 10 + 11 entries)

### Acceptance Criteria
- First-time Telegram link triggers a one-time signup spin.
- Users can spin once per day (UTC reset).
- Quiz/challenge completions trigger TON payouts automatically.
- Rewards and messages delivered via Telegram; all logged under `rewards/logs`.
- Homepage module dynamically reflects user state (not linked / linked / verified / rewarded).


---

Nice‑to‑Have (after MVP)
- Centralize all analytics event builders in `src/lib/analytics.js`; consider ESLint rule to flag `user.uid` inside analytics calls.
- Drag‑and‑drop pin reordering for mobile community switcher (see V3 doc).
- Unit tests around analytics payload shape and byline resolver.
