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

## 2) Analytics PII Gate (pre‑vendor)
- Implement helpers in `src/lib/analytics.js`: `getAnonymousId`, `getHashedId`, `shouldSendIdentity` (salt via `VITE_ANALYTICS_SALT`).
- Repo sweep: remove `uid/email/phone/user_id` from payloads; use anon/hashed IDs only when consented.
- Add basic tests/dev checks to prevent PII in analytics.
- Acceptance: grep for `user\.uid|user_id\s*:` returns none in analytics payload code paths.

## 3) Community Feed Polish (MVP)
- Extract `GENERIC_COMPANY_REGEX` to a shared util; reuse in feeds, cards, and detail.
- Add `resolveAuthorFields(postDoc)` helper to unify mapping across WhatsGood/Pro/PostDetail.
- Improve brandId/logo resolution fallbacks.
- Acceptance: Byline shows non‑generic store/brand consistently; no duplicate per‑post lookups beyond helper policy.

## 4) Desktop/Mobile Feed Finalization
- Desktop LinkedIn: confirm static `PostDetail` import and center‑only scroll; verify brand‑tab URL canonicalization rules.
- Mobile LinkedIn skin: confirm composer + actions + QA hooks; ensure analytics includes `ui_variant` when enabled.
- Acceptance: Manual checklists in `WEB_LINKEDIN_DESKTOP_TESTING.md` and `MOBILE_LINKEDIN_TESTING.md` pass.

## 5) Firestore Rules Hardening (post‑debug)
- Tighten permissive areas added for seeding/debugging; document emulator overrides.
- Acceptance: production rules block unsafe reads/writes; emulator flows remain unblocked with `VITE_USE_EMULATOR=true`.

## 6) Docs & DevX
- Finish `docs/firebase-environment-guide.md` with explicit `.env.local` and production variable examples and emulator toggles.
- Ensure `README-SETUP.md` points to CORS setup and Netlify Node 20; add quick “local verify” block.
- Acceptance: a new dev can choose emulator vs prod without guesswork.

## 7) QA Gates (pre‑merge)
- `pnpm install --no-frozen-lockfile` succeeds
- `pnpm run build` succeeds (Vite)
- `pnpm run lint` passes (or only acknowledged warnings)
- Netlify preview green

---

Nice‑to‑Have (after MVP)
- Centralize all analytics event builders in `src/lib/analytics.js`; consider ESLint rule to flag `user.uid` inside analytics calls.
- Drag‑and‑drop pin reordering for mobile community switcher (see V3 doc).
- Unit tests around analytics payload shape and byline resolver.
