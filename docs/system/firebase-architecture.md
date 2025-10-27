title: Firebase Architecture
version: 1.0
author: Manus AI / Factory AI / Liza Boone
last_updated: 2025-10-27

# Firebase Architecture

This document outlines Firestore schema, indexes, Cloud Functions, and RBAC.

## Firestore Schema (selected top-level)

| Collection | Key fields (examples) | Notes |
|------------|------------------------|-------|
| users | role, storeLoc {lat,lng,setAt,source}, storeAddressText, storeAddressGeo | RBAC source |
| brands | name, logoUrl, communities[] | Brand owner data |
| community_posts | userId, brandId, brandName, trainingId, createdAt | Enriched at write/UI |
| community_comments | postId, userId, body, createdAt | Subcollection per post optional |
| post_likes | postId, userId, createdAt | Counts derived in UI |
| verification_requests | userId, deviceLoc, metadata.exif, distance_m, autoScore, reasons | Workflow |
| notifications/{uid}/system | type, title, body, link, unread, createdAt | System notices |
| trainings | title, description, status, updatedAt | Referenced by posts |

### Notable shapes

- users/{uid}.storeLoc → strictly device GPS (source:'device').
- users/{uid}.storeAddressGeo → address geocode; never copied into storeLoc.
- verification_requests: server writes distance_m and autoScore; client may show baseline from
  storeAddressGeo when server fields are missing.

## Indexes

See firestore.indexes.json. Typical indexes include timestamp ordering for posts/comments and filters
by brandId/trainingId. Add composite indexes as prompted by Firestore errors in console.

## Security Rules (overview)

Files: firestore.rules, storage.rules

- Read access: community browsing is broadly readable; sensitive fields restricted.
- Write access: posts/comments allowed for verified staff; brand/admin elevated rights.
- User profile reads should permit non-sensitive fields required for byline/avatar enrichment.
- Storage: restrict uploads to authenticated users and scoped paths (profile/, verification/).

See ./security-rules.md for details and tightening checklist.

## Cloud Functions

Location: functions/src

- onPhotoEXIF.ts
  - Trigger: Storage upload under verification/ path.
  - Extracts EXIF (GPS), stores metadata on the request, and creates a redacted image URL.

- onVerificationScore.ts
  - Trigger: verification_requests writes/updates.
  - Compares verification GPS vs users/{uid}.storeLoc.
  - Sets distance_m, autoScore, reasons. Consider switching baseline to storeAddressGeo if policy
    requires address-based comparison.

## RBAC

Roles: super_admin, brand_manager, verified_staff, community_user.

- Source of truth: users/{uid}.role (and additional role markers as needed).
- UI gates: RoleGuard (src/utils/roleGuard.jsx) and per-page route guards.
- Emulator: use seed scripts under src/utils/* and tools/ to create test users and roles.
