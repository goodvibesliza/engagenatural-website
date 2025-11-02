title: Brand Vibe Report
version: 1.0
author: Factory AI / Liza Boone
last_updated: 2025-11-02


# EngageNatural Brand Developer Handoff

## Brand Overview

COMMUNITY & TRAINING FOR NATURAL PRODUCTS
Tagline:  More than training.Together, we’re a movement.Genuine connection and micro-lessons that give you the confidence and support you need.
Mission: Equip natural-product retail staff and influencers with connection, recognition & bite-sized education in a modern way.  
Core Value Prop: EngageNatural = community + micro‑learning + ROI for brands. No data selling. No time suck. No sensitive info required. Just real connection on the floor.

Privacy-First Verification: Simple photo or store code verification vs. competitors requiring paystubs and sensitive documents.

## Target Audiences
- Primary: Retail Staff (25–55) — wellness‑focused, time‑crunched, craving realness, social-media averse, privacy important
- Secondary: Brand Buyers (sales/education leads) — ROI‑driven, tired of one‑way content and competitor, want measurable impact

## Brand Personality
- Warmly Disruptive — challenge old ways with empathy
- Plainspoken — clear, no fluff
- Grounded Visionary — solving honest, real-world problems
- Community‑Driven — impact > installs
- Credibility‑First — proven field expertise

---

## Overall Design Aesthetic

### Design Philosophy
Inspired by: authentic community + modern professional network patterns (LinkedIn)  
Core Approach: Clean, neutral UI with warm brand accents; community-first surfaces; fast, scannable content

### Layout Principles
- Minimal, modular, and centered
- Feed-first: people, activity, and learning content as the core
- Professional density (LinkedIn): compact list density, clear affordances, subtle separators
- Marketing pages (culturetest.com-inspired): full-bleed hero, centered readable column, proof blocks, clean section rhythms

### Visual Hierarchy
1) People and activity (avatars, names, interactions)  
2) Content cards (lessons/challenges/templates)  
3) Support rails (left nav, right insights)  
4) Warm brand accents used sparingly (petal-pink)

---

## Visual Identity

### CSS Source of Truth
- Brand variables: `src/theme/brand-colors.css` (overrides Tailwind defaults with `!important`)
- Import order: `src/index.css` imports `theme/brand-colors.css` after Tailwind

### Current CSS Color Tokens (exact)
Primary palette variables
```css
:root {
  --color-black: #0E0E0E;
  --color-white: #FFFFFF;

  /* Petal Pink brand */
  --color-petal-pink: #F2D4CA;
  --color-petal-pink-light: #F3DAD1;
  --color-petal-pink-dark: #CDB4AB;
  --color-petal-tint: #F6E3DC;

  /* Neutrals */
  --color-muted-text: #5C5754;
  --color-soft-border: #d49e91ff;

  /* Functional mappings (overrides) */
  --primary: var(--color-petal-pink) !important;
  --primary-foreground: var(--color-black) !important;
  --secondary: var(--color-petal-tint) !important;
  --secondary-foreground: var(--color-black) !important;
  --muted: var(--color-petal-tint) !important;
  --muted-foreground: var(--color-muted-text) !important;
  --accent: var(--color-petal-pink-light) !important;
  --accent-foreground: var(--color-black) !important;
  --border: var(--color-soft-border) !important;

  /* Charts */
  --chart-1: var(--color-petal-pink) !important;
  --chart-2: var(--color-petal-pink-dark) !important;
  --chart-3: var(--color-petal-pink-light) !important;
  --chart-4: var(--color-soft-border) !important;
  --chart-5: var(--color-muted-text) !important;
}
```

Helper utility classes (already defined)
- Background: `.bg-petal`, `.bg-petal-tint`, `.bg-petal-light`
- Text: `.text-petal`, `.text-muted`, `.text-primary`
- Border: `.border-petal`, `.border-soft`
- Forced aliases: `.bg-primary`, `.text-primary`, `.border-primary`, etc. map to petal palette

### Usage Guidelines
- Primary (petal-pink): Buttons, active states, badges, key progress indicators
- Petal-tint: Card fills, subtle highlights, hover backgrounds
- Muted text: Metadata, timestamps, secondary labels
- Soft border: Dividers, card borders, subtle separators
- Black/white: Primary text and page backgrounds for maximum readability

### Color Accessibility
- Text on petal: use black (`#0E0E0E`)
- Text on tint: use muted-text (`#5C5754`) or black depending on contrast need
- Dividers should use soft border (`#E8C9C2`) to keep warmth without heavy chrome

---

## Typography System

Current app fonts (per App.css):
- Display/Headings: 'Libre Baskerville', Georgia, serif
- Body/UI: 'Geist', system UI stack
- Mono (optional/code): IBM Plex Mono stylesheet included

Recommended tokens
```css
--font-display: 'Libre Baskerville', Georgia, serif;
--font-body: 'Geist', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
--font-mono: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
```

Scale (LinkedIn-style density)
- Desktop headings: H1 2.75–3.25rem (hero), H2 1.5–2rem (sections), H3 1.25–1.5rem (subsections)
- Body: 0.9375–1rem; Meta: 0.8125–0.875rem
- Line heights: 1.4–1.6 for body; headings tighter at 1.2–1.3

---

## LinkedIn-Inspired UI Patterns

Navigation
- Top app bar (sticky): brand, search, alerts, user menu
- Left rail (desktop): primary sections (Analytics, Users, Content, Communities, Settings)
- Right rail (desktop): insights, tips, secondary widgets
- Mobile: bottom nav bar; sticky filter bar for feeds

Feed and Cards
- Card density: compact; 12–16px inner padding; 12–16px gaps
- Anatomy: avatar 40px, author row (name bold, meta muted), content body, actions row (Like/Comment/Share analogs), counters
- Hover: subtle background tint (petal-tint @ ~8–10% opacity), border-darken by 1 step
- Dividers: soft border; avoid heavy rules

States and Interactions
- Clear affordances; focus rings; hover + pressed states
- Inline toasts/snacks near action origin (top-right of card or global top)

Buttons
- Primary: petal-pink background, black text
- Secondary: outline with black text and soft-border; hover → petal-tint fill
- Tertiary/Ghost: text-only with underline on hover

Example (matches tokens)
```css
.btn-primary {
  background: var(--primary);
  color: var(--primary-foreground);
  padding: var(--button-padding-y, 0.75rem) var(--button-padding-x, 1.5rem);
  border-radius: 8px;
  border: none;
  font-weight: 600;
  transition: background .15s ease, transform .1s ease;
}
.btn-primary:hover { background: var(--color-petal-pink-light); transform: translateY(-1px); }

.btn-secondary {
  background: transparent;
  color: var(--color-black);
  border: 2px solid var(--border);
  padding: var(--button-padding-y, 0.75rem) var(--button-padding-x, 1.5rem);
  border-radius: 8px;
  font-weight: 600;
}
.btn-secondary:hover { background: var(--secondary); }

.btn-ghost {
  background: transparent;
  color: var(--color-muted-text);
  border: none;
  padding: var(--button-padding-y, 0.75rem) var(--button-padding-x, 1.5rem);
  text-decoration: underline;
  text-underline-offset: 4px;
}
```

Iconography
- Library: Lucide (outlined), stroke ~1.5px, sizes 16–24px most of the time
- Colors: icon-muted by default; brighten on hover or active

---

## culturetest.com-Inspired Page Layouts

Desktop container and grid
- Page container (content): 1080–1200px centered max-width
- 3-column dashboard: 240px left rail / 680–720px content / 300–336px right rail
- Marketing pages: one-column centered content with strong rhythm (80–120px vertical spacing)

Section rhythms (marketing/landing)
- Hero: full-bleed, 72–96px top/bottom, big headline with supporting kicker
- Proof blocks: 2–3 columns of stats/testimonials; cards with soft borders on tint background
- Feature bands: alternating image/text split 60/40; keep neutral backgrounds
- CTA bands: petal-tint background, strong heading, single primary action

Cards and surfaces
- Background: white
- Border: soft-border
- Radius: 8px
- Shadow: minimal (or none) — rely on border + elevation via tint backgrounds

---

## Imagery & Photography

- Candid over staged; staff interactions in real environments
- Natural lighting; warm, slight green/earth bias is acceptable
- Backgrounds: soft neutrals, wood, plants
- Avoid: sterile whites, corporate stock

---

## Voice & Tone (Plainspoken, Credible, Warm)

Examples
- “Start My Challenge” (not “Begin Training Module”)
- “Let’s Go” (not “Proceed”)
- “From the Aisles, Not the Algorithm”
- “You don't have 20 minutes for a training video. That's why ours are under two.”

Key Messages
1) Verified, Trusted, Real — “No bots. No spam. Just real people who know what's on the shelves.”  
2) Privacy-First Verification — “Just a photo or store code. No sensitive documents. No hassle.”  
3) Designed for the Floor — “Under two minutes. Because you’re mid-shift, not mid-semester.”  
4) Every Staffer Is a Multiplier — “Train one, sell more — per shift, per aisle.”  
5) Built From the Aisles — “From real store experience, not a content factory.”

---

## Privacy & Verification

Advantage
- Photo or store code — never sensitive personal docs

Process
- Photo in store or store code from manager
- No sensitive documents
- Access in minutes

Messaging
- “We don’t need your personal details to know you’re real.”
- “Show us you’re on the floor — that’s all we need.”

---

## Site Structure & Flow
- Home → Demo → Case Studies → Waitlist
- Launch
  - Phase 1: Rescue Remedy pilot
  - Phase 2: Case studies
  - Phase 3: Social proof
  - Marketing: Email + YouTube + LinkedIn founder credibility

---

## Component Specs (Developer Quick-Ref)

Feed Card (LinkedIn density)
- Padding: 12–16px
- Avatar: 40px, circle
- Author row: Name bold (body font, 600), meta small muted
- Body: 14–16px; links underlined
- Actions: left-aligned icons + labels; counters to the right

Left Rail
- Width: 240px
- Active item: bold + petal indicator (border-left 3px or background tint)

Right Rail
- Width: 300–336px
- Cards: small stats, “what’s new”, quick links

Form Inputs
- Background: white or tint
- Border: soft-border
- Focus ring: subtle petal glow or 2px outline

---

## Technical Notes
- Tailwind v4 with `brand-colors.css` after Tailwind to override tokens
- Use `.bg-primary`, `.text-primary`, `.border-primary`, etc. — already mapped to petal palette via `!important`
- Mobile LinkedIn skin: `data-mobile-skin="linkedin"` has sticky helpers and safe-area padding

---

This document is the definitive handoff for EngageNatural design and implementation:
- Colors: petal-pink palette (as currently in CSS)
- UI: LinkedIn-inspired structure, density, interactions
- Layout: culturetest.com-inspired modular, centered, marketing-ready sections
