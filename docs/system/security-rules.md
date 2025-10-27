title: Security Rules
version: 1.0
author: Manus AI / Factory AI / Liza Boone
last_updated: 2025-10-27

# Security Rules

Files:
- Firestore rules: ./../../firestore.rules
- Storage rules: ./../../storage.rules

## Principles

- Least privilege: restrict writes to authorized roles and owners.
- Public reads limited to community content only; sensitive profile fields protected.
- Allow profile reads for non-sensitive fields needed to render byline/avatar.
- Verify staff-only actions at both client (RoleGuard) and rules layer.

## Tightening Checklist

- Users collection: expose only fields required by UI; block PII where possible.
- Community posts/comments: restrict writes to authenticated users; require ownership.
- Brand management: allow brand_manager and super_admin only; scope to brandId where needed.
- Verification requests: staff can write their own; admins read/write status.
- Storage: path-based rules (profile/*, verification/*) and size/type checks.

Run emulator and unit tests before deploying rules changes.
