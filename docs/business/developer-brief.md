title: Developer Brief
version: 2.0
author: Liza Boone / Factory AI
last_updated: 2025-10-27

# Developer Brief: EngageNatural ("Real Connection")

This brief reflects the current web app (React + Vite + Firebase) with the live design system (fonts, colors, and structure) as implemented in this repository.

## Overview
Mobile-first web platform for retail staff in the natural products industry to learn, complete brand challenges, engage in a community feed, and earn recognition/rewards. Brands/admins manage content, campaigns, and analytics via dashboards.

## Platform Goals
- Verified space for retail staff to engage with wellness brands
- Short-form, brand-specific education and challenges
- Community and recognition (posts, badges, leaderboards)
- Actionable engagement data for brands (dashboards, exports)

## Primary User Types
- Retail Staff (frontline): training modules, quizzes/challenges, community posting, progress tracking
- Brand/Admin: upload lessons/campaigns, view analytics, moderate and verify staff

## Core Features – MVP (Phase 1)
Staff UI
- Home/Feed: brand content, challenge highlights, staff posts
- Challenges: daily/weekly tasks, quizzes; progress and badge unlocks
- Community: peer posts, upvotes, filters by brand/topic
- Profile/Progress: badges, completed trainings, saved/favorites

Brand/Admin UI
- Dashboard: campaign stats, user growth, engagement trends
- Content Uploader: lessons, videos, quizzes, assets
- Messaging/Announcements and moderation tooling

General
- Secure login (multi-path staff verification)
- Notifications (reminders, mentions)
- Reward tracker (badges/points; gift card integration candidate)

## Staff Verification Options
- Tier 1 – Seamless: Store Code entry; Manager Invite Link (time-limited)
- Tier 2 – Human-Verified: Photo-in-front-of-store (nametag/uniform) reviewed in admin; optional phone call store check; blue-check gate for sampling eligibility

## Technical Stack (Current App)
- Frontend: React 18 + Vite, Tailwind CSS v4
- Auth/Data/Storage: Firebase (Auth, Firestore, Storage, Functions)
- Hosting/Build: Netlify; Emulator suite for local dev
- Package manager: pnpm (preferred)

## Design System (Live)
Fonts (see `src/brand/typography.ts`, `src/styles/globals.css`, `src/tailwind.config.js`)
- UI Sans: Geist (via @fontsource-variable/geist)
- Headings Serif: Libre Baskerville (via @fontsource/libre-baskerville)
- Mono/Display: IBM Plex Mono (fallbacks provided)

Tailwind font families
```
font-sans: Geist, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif
font-serif: Libre Baskerville, Georgia, serif
font-display: Code, IBM Plex Mono, monospace
```

Brand Colors (petal-pink palette; see `src/theme/brand-colors.css`)
- Black: #0E0E0E
- White: #FFFFFF
- Petal Pink (primary): #F2D4CA
- Petal Pink Light (accent): #F3DAD1
- Petal Pink Dark: #CDB4AB
- Petal Tint (sections/cards): #F6E3DC
- Muted Text: #5C5754
- Soft Border: #E8C9C2

Functional color mappings (overrides via CSS vars)
```
--primary: var(--color-petal-pink)
--secondary: var(--color-petal-tint)
--muted: var(--color-petal-tint)
--accent: var(--color-petal-pink-light)
--border: var(--color-soft-border)
```

UI Tokens
- Border radius scale: base 0.625rem (10px) with sm/md/lg/xl variants
- Buttons: primary (black on white), secondary (outline), pink variant (petal)

Component/Class helpers
- Global import order: Tailwind -> brand-colors.css -> globals.css
- Helpers: `.bg-petal`, `.bg-petal-tint`, `.text-petal`, `.border-soft`, `.brand-title`, `.kicker`, `.font-display`

## App Structure (Current Web Repo)
```
src/
  brand/
    palette.ts           # color tokens
    typography.ts        # font stacks + loader
  components/
    ui/                  # shadcn-style primitives
    brand/               # brand-specific UI (logo, wordmark, etc.)
    community/, admin/, brand/, staff/ ...
  pages/                 # route-level pages (staff, brand, admin)
  styles/
    globals.css          # base font + utilities
    ibm-plex-mono.css    # mono fallback
  theme/
    brand-colors.css     # authoritative brand color overrides
  tailwind.config.js     # v4 config with brand tokens
```

## Environments & Dev
- Local: Firebase Emulator (Auth/Firestore/Storage/Functions); `.env.example` provided
- Scripts: pnpm dev/build; Netlify deploy with Vite adapter
- Accessibility: focus-visible states, high-contrast defaults, semantic landmarks

## Phase 2 Candidates
- Sampling fulfillment integration
- In-app messaging (P2P or brand-to-staff)
- Geo check-ins/store-level targeting
- Longer-form e-learning modules
- Tiered reward redemption

## Constraints
- Windows dev environment
- pnpm + Vite for builds; prefer relative imports to avoid resolution issues
- GDPR/DSHEA-aligned handling of user data

## Success Metrics
- Netlify build reliability; zero chunk-load regressions
- Verification throughput and review latency
- Community engagement and challenge completion rates

## Timeline (Illustrative)
- June 2025: Confirm developer team
- Jul–Aug 2025: MVP sprint
- Sept 2025: QA/testing/polish
- Oct–Dec 2025: Live pilot

## Contact
Liza Boone, Founder & CEO  
Email: lizaboonephd@gmail.com  
Phone: 404.434.1454  
Location: Orlando, FL

Please direct technical proposals, sprint estimates, or questions to Liza. Pitch deck, financial model, and wireframes available on request.
