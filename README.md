<!--
  EngageNatural master README
  Style: <=100 char width, markdown-lint friendly (#, ##, ###)
-->

# EngageNatural

Modern community and training platform connecting natural health retail staff with brands and
administrators.

Badges: Node 20 • React + Vite • Firebase • Netlify • pnpm

Last updated: 2025-10-27 • Version: 1.0

## Overview

EngageNatural enables:
- Retail staff to verify role, join communities, post, and learn.
- Brand managers to run communities, publish content, and review engagement.
- Admins to manage users, verification, and system settings.

Primary audiences: retail staff, brand managers, and administrators.

## Tech Stack

| Area      | Technology |
|-----------|------------|
| Frontend  | React 18, Vite, React Router, Tailwind, shadcn-inspired UI |
| Backend   | Firebase (Auth, Firestore, Storage, Cloud Functions TS) |
| Hosting   | Netlify (static) + Firebase Hosting (functions, assets) |
| CI/CD     | GitHub Actions + Netlify deploy previews |
| Package   | pnpm (Corepack) |

## Roles and Access

- super_admin: full access across admin tools and settings
- brand_manager: brand dashboard, communities, content, analytics
- verified_staff: full staff features incl. posting; passes verification gate
- community_user: read-only community browsing

Role checks are centralized via RoleGuard and use Firebase Auth + Firestore profile fields.

## Folder Map (key paths)

```
src/
  components/            # shared UI and feature components
  components/admin/      # admin UI (users, analytics, verification)
  components/brand/      # brand manager UI modules
  components/brands/     # brand desktop layout and widgets
  components/community/  # feeds, post cards, composer, mobile/desktop shells
  pages/                 # route pages
    admin/               # admin pages
    brand/               # brand pages (dashboard, editor, analytics)
    brands/              # brand management (legacy desktop)
    community/           # community pages
    staff/               # staff dashboard and panels
  lib/                   # firebase, analytics, adapters, utils
  hooks/                 # custom hooks (roles, mobile, community switcher)
functions/src/           # Cloud Functions (TypeScript)
docs/                    # All documentation (see index below)
```

## Data Model (Firestore collections)

Common top-level collections used by the app and functions:

| Collection                 | Purpose |
|---------------------------|---------|
| users                      | Profiles, roles, store location, locale |
| brands                     | Brand profiles and related subcollections |
| community_posts           | Feed posts (author refs, brand, training) |
| community_comments        | Comments for posts |
| post_likes                | Post likes (derived counts in UI) |
| verification_requests     | Staff verification submissions and scores |
| notifications/{uid}/system| System notifications (e.g., info requests) |
| trainings                 | Training content referenced by posts |

Indexes: see firestore.indexes.json. Rules: see firestore.rules and storage.rules.

Cloud Functions:
- onPhotoEXIF: extracts EXIF/GPS and creates a redacted image.
- onVerificationScore: computes distance/score vs store location and sets reasons.

## API Surface (selected)

The app is primarily client/Firebase driven. Serverless logic runs in functions. Key surfaces:
- Firestore CRUD via SDK
- Storage uploads for profile/verification photos (CORS configured via cors.json)
- Callable/triggered functions (see functions/src)

## Deployment

- Netlify builds the Vite app and serves static assets (see netlify.toml).
- GitHub Actions configure pnpm and run builds for PRs and main merges.
- Firebase hosts Cloud Functions and Storage rules; SPA redirects in Netlify.

CI/CD files: .github/workflows/firebase-hosting-merge.yml and ...-pull-request.yml

## Local Setup

1) Prereqs
- Node 20 (see .node-version / .nvmrc)
- Corepack enabled (pnpm)

2) Install
```
corepack enable
pnpm install --no-frozen-lockfile
```

3) Environment
Create a .env.local from .env.example. For emulator testing on Windows:
```
VITE_USE_EMULATOR=true
```

4) Dev server
```
pnpm run dev
```
Open http://localhost:5173

5) Build preview
```
pnpm run build && pnpm run preview
```

6) Firebase Storage CORS (only for prod uploads)
See docs/operations/deployment-runbook.md → CORS section.

## Quick Links (docs)

- Docs Index: ./docs/README.md
- System
  - Community & Brand Manager Expansion (Phase 8.5 → 8.6): ./docs/community-brand-manager-expansion-phase-8.5-8.6.md
  - Admin System: ./docs/system/admin-system.md
  - Brand Manager System: ./docs/system/brand-manager-system.md
  - Staff UI Redesign: ./docs/system/staff-ui-redesign.md
  - Firebase Architecture: ./docs/system/firebase-architecture.md
  - Security Rules: ./docs/system/security-rules.md
- Design
  - Brand Vibe Report: ./docs/design/brand-vibe-report.md
  - UI Style Guide: ./docs/design/ui-style-guide.md
  - LinkedIn Layout (Phase 8.8): ./docs/design/linkedin-layout-phase8.8.md
- Business
  - Developer Brief: ./docs/business/developer-brief.md
  - Pitch Deck: ./docs/business/pitch-deck.md
  - Sampling Program: ./docs/business/sampling-program.md
  - Brand Handoff: ./docs/business/brand-handoff.md
- Operations
  - Deployment Runbook: ./docs/operations/deployment-runbook.md
  - QA Checklist: ./docs/operations/qa-checklist.md
  - Roadmap: ./docs/operations/roadmap.md
  - Brands Marketing Site (Technical Brief): ./docs/operations/brands-marketing-site.md

## Contributors

Manus AI • Factory AI • Liza Boone

## Notes for New Engineers

- Use the Firebase emulator first when changing data flows.
- Avoid PII in analytics. See AGENTS.md section: Analytics & PII Guidance.
- Prefer relative imports over aliases in React to avoid Vite/pnpm issues.
