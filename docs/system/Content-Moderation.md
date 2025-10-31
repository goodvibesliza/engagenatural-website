# Content Moderation System

Last updated: 2025-10-31

## Overview
EngageNatural applies real‑time content moderation to community posts to prevent profanity, spam, and non‑compliant health claims. The moderation runs on the client before any write to Firestore and determines whether a post is approved, requires review, or is blocked.

Primary module: `src/ContentModeration.js`

Integrated in:
- `src/pages/PostCompose.jsx` (full post form)
- `src/pages/staff/dashboard/CommunitiesPage.jsx` (inline composer)

## Decision Logic
Moderation flows through three layers:
1) Base checks: `moderateContent(content)`
2) Health claims overlay: `moderateHealthContent(content)`
3) Post shaping: `filterPostContent({ content })`

Key decisions:
- Profanity hard‑block: If content matches explicit profanity (word‑boundary regex; case‑insensitive), the post is immediately blocked regardless of score.
- Heuristics score: The base function subtracts from a confidence score (starts at 1.0) for:
  - Inappropriate terms list (medium),
  - Spam patterns (URLs/emails/phones/pressure language) (high),
  - Excessive ALL‑CAPS (low),
  - High repetition ratio (medium).
- Thresholds:
  - `confidence < 0.3` → block
  - `confidence <= 0.7` → needs review
  - else → approve
- Health claims: Detects risky phrases for DSHEA compliance. If detected and content is not already blocked, it is marked `review` and annotated.

## What Gets Moderated
- Title + Body together: Callers pass `${title}\n${body}` so the title cannot bypass checks.

## Outputs and Storage
`filterPostContent` returns a shaped payload merged into the post prior to saving:
- `content`: potentially replaced with a placeholder for blocked/reviewed content
- `needsReview`: boolean
- `isBlocked`: boolean
- `moderationFlags`: array of flags gathered during checks
- `moderation`: structured moderation result (kept for audits/UI)

Posts written to `community_posts` include these fields so feeds can hide blocked/review items and show audit context if needed.

## Integration Points
- PostCompose: blocks submission if `isBlocked` or `needsReview`, sending the user to a draft preview with messaging.
- CommunitiesPage inline composer: same moderation gating (no publish on blocked/reviewed content; can save draft).

## DSHEA Compliance Notes
- Health‑related superlatives ("cures", "miracle", "guaranteed", etc.) force `review` unless already `block`.
- Messaging is appended for review cases: "[Health claims under review]".

## Extensibility Hooks (Future)
- Profanity/terms list can be expanded or localized.
- Add user reputation/contextual scoring (e.g., stricter rules for new accounts).
- Move moderation to a server function for tamper‑resistant enforcement.
- Optional ML service integration (toxicity/spam classifiers) with fallback to current heuristics.

## QA Checklist
- A single explicit profanity word is blocked.
- Title‑only profanity is blocked (title+body combined).
- A post with a URL and sales pressure (“buy now”) goes to review or block depending on pattern mix.
- Health claims (“cures”, "guaranteed results") trigger review when not already blocked.
- Feeds do not display `isBlocked` or `needsReview` posts.
