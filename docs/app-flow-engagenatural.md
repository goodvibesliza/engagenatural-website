# EngageNatural Platform — Business Logic and Full App Flow

Version: 2025-11-03

## 1) Purpose and Principles

EngageNatural connects brands with retail staff through communities, training, and challenges that drive authentic engagement and measurable outcomes.

- Trust and safety first: strong moderation, anti-abuse, and data minimization.
- Measurable impact: every action can emit analytics with clear attribution.
- Progressive disclosure: features unlock with verification and activity.
- Offline-tolerant UX wherever feasible; fail-open reads, retry writes.

## 2) Roles and Permissions

Roles: Admin, Brand, Staff (end-user). Each role may have capability flags. Verification elevates Staff access.

### 2.1 Capability Matrix (high-level)

- Staff
  - Read: public communities, What’s Good feed, brand public posts, published trainings/challenges
  - Write: comments, likes, basic profile edits, enroll/complete trainings and challenges
  - Manage: own content (delete own comments), own profile image, notification prefs
  - Requires verification for: premium communities, brand challenges with rewards, sample requests

- Brand
  - Read: brand dashboard metrics, brand audience insights (aggregated/anonymous)
  - Write: create templates (lessons/challenges), publish brand copies, announcements
  - Manage: brand library, schedules, tiers, approvals (brand‑scoped)
  - Moderate: comments on brand content (brand‑scoped)

- Admin
  - Global manage: users, roles, verification workflows
  - Content: approve/reject pending items, system-wide content operations
  - Settings: platform configuration, feature flags, pricing, rewards catalogs
  - Access: all analytics with privacy controls

### 2.2 Fine-grained Permissions (suggested claims)

- manage_content, manage_brand_content, approve_verifications, view_analytics, manage_rewards, manage_flags
- Staff verification statuses: pending | approved | rejected (drives feature gating)

## 3) Identity and Authentication

- Auth provider: Firebase Auth (email/social) with user document in `users/{uid}`.
- User doc includes: displayName, email, profileImage, locale, verificationStatus, roles (['staff'] default), notificationPreferences, store metadata.
- Brand accounts: `brands/{brandId}` with users assigned via membership or domain-based invites.
- Session: client stores minimal state; privileged reads guarded by security rules and role checks.

## 4) Onboarding Flows

### 4.1 Staff
1. Sign up → create `users/{uid}` with baseline prefs and status `pending`.
2. Optional: submit verification (upload/store location, employment proof).
3. Access What’s Good community immediately; premium communities unlock when verified.
4. Guided tour: comment/like, enroll in a training, set notification prefs.

### 4.2 Brand
1. Admin invites brand manager email → claim creates role `brand` and membership in `brands/{brandId}`.
2. Brand manager completes org profile (name, logo, tiers).
3. Access Brand Content Manager: create templates, duplicate to brand copies, schedule/publish.

### 4.3 Admin
1. Admin created out-of-band; first‑run sets global flags.
2. Reviews verification queue, content approvals, and monitors system health.

## 5) Core Modules and Flows

### 5.1 Communities and Feeds

- What’s Good (public/common) and Pro (curated/professional) feeds.
- Posts: `community_posts` with fields: title, content/body, brand/community metadata, author, images, createdAt.
- Interactions:
  - Like: `post_likes` keyed by `postId_userId` for idempotence.
  - Comments: `community_comments` referencing `postId`; optimistic UI, serverTimestamp, retry on error.
- Draft previews: allowed via navigation state (no write until publish).
- Custom events: `en:comment-added` for UI refresh hooks.

User actions → analytics:
- postOpen, postLike, postComment, postOpenTraining.

### 5.2 Brand Content Manager

- Sections: Templates, Library, Lessons, Challenges, Announcements.
- Shared templates (global) → duplicated into brand copies for customization.
- Key event: `brand:templates-switch` (legacy/compat) — shell listens to switch sections.
- TemplatesSection sub-tabs: `shared` and `copies` with search/filter.
- Library contains brand‑scoped published content and schedules.

Main operations:
- Duplicate shared → brand copy
- Edit copy (title/body/tier)
- Publish/unpublish copy
- Delete copy
- Metrics: completions (KPI cards), top templates.

### 5.3 Trainings

- Unit types: lesson, track (multi‑lesson), challenge (time‑bound).
- Enrollment: implicit when user opens a training or explicit on enroll.
- Completion: tracked with check-ins or quiz pass; emits points to rewards engine.
- Prerequisites: tier gates (e.g., Pro requires verification).

### 5.4 Challenges

- Brand challenges run over N days with daily tasks.
- Proof of completion: check-ins, uploads, quiz, or geo‑fences (optional).
- Rewards: points with optional bonus multipliers; anti-cheat checks.

### 5.5 Admin Content Management

- Global content visibility, status transitions: draft → pending_approval → published | rejected.
- Approvals generate audit logs and notify creators.
- Bulk operations: retire content, tag normalization, taxonomy.

## 6) Earning and Rewards

### 6.1 Points Sources (examples)

- Daily login streak: +5 base, +bonus on streak thresholds.
- Like a post: +1 capped at 20/day.
- Comment (approved): +3 capped at 30/day; requires moderation pass.
- Complete lesson: +25; track max per lesson per user.
- Complete challenge day: +10 per day; full challenge completion bonus +100.
- Verified staff multiplier: x1.2 on eligible brand content.
- Brand spotlight period: x1.1 for content from spotlighted brand.

All awards produce a `rewards_events` record: { userId, type, refId, points, multiplier, createdAt }.

### 6.2 Levels and Badges

- Levels: totalPoints map to tiers (Bronze/Silver/Gold/Platinum) unlocking cosmetic perks and community access.
- Badges: first like, 100 comments, 10 lessons, 3 challenges, brand champion (brand‑scoped).

### 6.3 Redemption

- Catalog managed by Admin: gift cards, swag, experiences.
- Redemption requests → `rewards_redemptions` with status: requested → approved → fulfilled | rejected.
- Fraud checks: velocity limits, duplicate device heuristics, manual review for high‑value items.

### 6.4 Anti‑Abuse

- Rate limits (per minute/day) on writes (likes, comments, enrollments).
- Content moderation before awarding comment points.
- Device/browser fingerprint signals where available.
- Anomaly detection: sudden surges, correlated accounts.

## 7) Notifications

- Channels: in‑app toasts, feed banners, email (optional), push (future).
- Preferences at `users/{uid}.notificationPreferences` — toggles for email, push, community updates, training reminders, sample requests, weekly digest.
- Event triggers:
  - Training assigned/published
  - Challenge progress reminder
  - Verification status update
  - Redemption status update

## 8) Moderation and Safety

- Pre‑publish checks for brand/admin content.
- Community comment moderation: automated filter + admin/brand review.
- Escalation queue for flagged content.
- Audit logs: who changed what, when; immutable append-only.

## 9) Analytics and Measurement

- Client events (example):
  - postOpen({ postId, feedType })
  - postLike({ postId, liked })
  - postComment({ postId, length })
  - postOpenTraining({ postId, trainingId })
- Funnel KPIs: activation (comment within 7 days), training completion rates, challenge adherence, brand content CTR, revenue attribution (brand‑reported where available).

## 10) Data Model (outline)

- users/{uid}
  - profile fields, verificationStatus, roles[], locale, notificationPreferences{}
- brands/{brandId}
  - name, tiers, members[], spotlight windows, settings
- community_posts/{postId}
  - brand/community metadata, author, images[], createdAt, trainingId?
- post_likes/{postId_userId}
- community_comments/{commentId}
  - postId, userId, text, createdAt, status
- templates_shared/{id} (or a central store in app state)
- templates_brand/{brandId}/{copyId}
  - sourceTemplateId, customTitle, customBody, status, tier, metrics{}
- rewards_events/{id}, rewards_redemptions/{id}

## 11) Routing and Access Control (examples)

- /community → public feed; write requires auth; premium posts require verification
- /staff/dashboard/profile → profile and verification status; editable by owner
- /staff/trainings/:id → view/enroll; gated by tier
- /brand/content → Brand Content Manager; role: brand
- /admin/content → global content; role: admin

## 12) Error Handling and Resilience

- Optimistic updates with rollback (likes/comments). Errors show toast and revert UI state.
- Network failures: retry with exponential backoff for idempotent operations.
- Read failures: show skeletons and clear empty states; avoid blocking navigation.

## 13) Feature Flags and Environment

- VITE_EN_DESKTOP_FEED_LAYOUT: 'linkedin' enables DesktopLinkedInShell.
- VITE_DEMO_BRAND_ID: default brand for demos/tests.
- Backward‑compat events: `brand:templates-switch`, forward events: `en:comment-added`.

## 14) Security and Privacy

- Minimum PII; optional company/store fields for verification.
- Access by least privilege; client validates but server rules enforce.
- Logs exclude secrets; uploads scanned by Storage security rules.

## 15) KPIs and Success Criteria

- D7 activation ≥ 35% (first comment or training started)
- Lesson completion rate ≥ 60%
- Challenge completion ≥ 35%
- Verified staff median time-to-verify ≤ 48h
- Brand template → published copy conversion ≥ 70%

---

Appendix: Event Reference

- Custom DOM events
  - brand:templates-switch — detail: string | { tab: 'Templates' | 'Library' | 'Lessons' | 'Challenges' | 'Announcements' | 'shared' | 'copies' }
  - en:comment-added — detail: { postId: string }
