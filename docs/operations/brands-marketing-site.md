---
title: Brands Marketing Site (brands.engagenatural.com)
owner: Liza Boone
status: In progress — initial build and branch deployed
last_updated: 2025-10-29
version: 1.0
---

# Brands Marketing Site — Technical Brief

Goal: Launch a lightweight, high-performance marketing site at **brands.engagenatural.com** for prospective brand clients. 
It should showcase **real ROI charts** we already have (PNG assets), a clear value narrative, and a contact/demo funnel.
No auth, no app dependencies, just fast and clean.

---

## 1) Stack & Hosting (industry standard)

- Framework: Next.js (App Router), React 18+ — DONE
- Styling: Tailwind CSS + CSS variables for brand tokens — DONE
- UI Kit: shadcn/ui (Radix under the hood)
- Icons: lucide-react — DONE
- Analytics: Plausible (preferred) or GA4 — base injection wired via env — DONE (events pending)
- Error/Perf Monitoring: Sentry (client + edge)
- Forms: Formspree (current) — DONE
- Deployment: Netlify brands.engagenatural.com — Netlify deploy working (TOML fix) — DONE
- CI/CD: GitHub → Netlify build previews per branch/PR — branch deploys working — DONE

> Rationale: Next.js + Netlify is a standard modern marketing stack: fast, SEO-friendly, trivial CI/CD.

---

## 2) Domain & Environments

- Primary: `brands.engagenatural.com` (production)
- Preview: Netlify Deploy Preview URLs per PR (auto) — DONE
- Staging (optional): `brands-staging.engagenatural.com`

DNS: Create a CNAME for `brands` → `<your-netlify-site>.netlify.app`.

---

## 3) Brand System (tokens)

Palette (no green/orange):
- `--brand-primary: #000000` (text)
- `--brand-secondary: #D9A6A1` (rose accent)
- `--brand-taupe: #B2A49A` (support)
- `--brand-mist: #F5F3F2` (surface)
- `--white: #FFFFFF`

Typography
- Primary: Geist (UI + headings) — DONE
- Optional accent for hero/campaign headlines only: Playfair Display
- Also added Libre Baskerville as an accent variable — DONE

Tailwind setup — DONE
```css
/* globals.css */
:root{
  --brand-primary:#000000;
  --brand-secondary:#D9A6A1;
  --brand-taupe:#B2A49A;
  --brand-mist:#F5F3F2;
  --white:#FFFFFF;
}
.text-brand-primary{color:var(--brand-primary)}
.text-brand-secondary{color:var(--brand-secondary)}
.bg-brand-secondary{background-color:var(--brand-secondary)}
.border-brand-secondary{border-color:var(--brand-secondary)}
.bg-mist{background-color:var(--brand-mist)}

## 4) Site Map & Routes

- `/` (Home / “For Brands”) — initial hero/value/charts present — DONE
  - Hero (editorial, rose accent) — DONE
  - “Why Now” bullets (concise) — DONE
  - Proven Results — 3 chart cards (PNG assets) — DONE
  - ROI Example card — DONE
  - Social proof (logos/testimonials) — optional placeholder
  - Contact / Request a demo (Formspree or API route) — link to `/contact` — DONE
- `/brands` (alt landing variant) — NEW — DONE
- `/contact` — Formspree endpoint via env — DONE
- `/privacy` — DONE
- `/thank-you` (post-form submission) — PENDING

Everything must be statically rendered (SSG) for speed — static export enabled — DONE


## 5) Content & Assets

- Use the PNG charts (in `/public/charts/`) — DONE
  - `sales_impact_graph.png`
  - `roi_growth_graph.png`
  - `user_engagement_graph.png`
- Provide alt text and lazy-load images — DONE (Next/Image; hero uses priority)
- Keep copy simple, direct, and on-brand (rose highlights, no hype) — DONE (baseline)

Optional page imagery for hero/sections — place under `public/images/`:
- `diverse-group.jpg`
- `hands-with-heart.jpg`
- `heart-hands.jpg`
- `liza-headshot.jpg`


## 6) Components (shadcn/ui)

- Navbar (Logo “EngageNatural”, links: Home, Contact) — DONE (inline)
- Hero (headline + subhead + CTA) — DONE
- ValueBullets (Why Now) — DONE
- ChartsGrid (3 cards with images) — DONE
- ROIExampleCard (list rows + Total ROI line) — DONE
- ContactForm (Formspree or API route) — DONE (separate `/contact` page)
- Footer (short boilerplate + LinkedIn/Mail icons) — DONE
- Event tracking data attributes + tiny utility — PENDING


## 7) SEO / Meta

- Unique `<title>` and `<meta name="description">` — DONE
- OG tags: title, description, image — DONE (basic)
- `sitemap.xml` — PENDING
- `robots.txt` — PENDING
- Canonical URL set to https://brands.engagenatural.com/ — PENDING

Example:
- Title: For Brands — EngageNatural
- Description: Verified staff training + community for natural products brands. Real ROI. See the charts.


## 8) Forms

- Option A: Formspree (keep current endpoint) — DONE (via `NEXT_PUBLIC_FORMSPREE_ENDPOINT`)
- Option B: Next.js API route `/api/contact` → Sendgrid/Resend or webhook — PENDING

Form fields: name*, email*, company, message* — DONE  
On success: redirect to `/thank-you` — PENDING (currently shows success message in-page)


## 9) Analytics & Monitoring

- Plausible — env-controlled injection supported — DONE
- GA4 — env-controlled injection supported — DONE
- Sentry — PENDING
- Event helpers (view/submit/error) — PENDING

Env:
```plaintext
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=brands.engagenatural.com
NEXT_PUBLIC_GA_ID=...

## 10) Performance & A11y

- `loading="lazy"`, width/height attributes set — DONE (Next/Image)
- CLS/LCP under web vitals thresholds — PENDING (to measure)
- WCAG 2.1 AA contrast; keyboard focus states — baseline in place — PARTIAL
- No client JS for things that can be static — DONE (mostly static)

---

## 11) Directory Structure

Current (key parts implemented):
```plaintext
app/
  layout.tsx                 # SEO/meta — DONE
  page.tsx                   # home — DONE
  brands/page.tsx            # new brands page — DONE
  contact/page.tsx           # Formspree — DONE
  privacy/page.tsx           # DONE
  terms/page.tsx             # DONE
public/
  charts/roi_growth_graph.png
  charts/sales_impact_graph.png
  charts/user_engagement_graph.png
components/
  Analytics.tsx              # Plausible/GA4 injection — DONE
  PENDING: thank-you, sitemap.ts, robots.ts, lib/analytics.ts helper, shadcn components split.

  12) Acceptance Criteria (v1)
Site deploys at brands.engagenatural.com — PENDING (domain attach)
Home page includes hero, Why Now, charts grid, ROI example, contact form — DONE
Charts render from PNG assets with correct alt text — DONE
Form submission works; user lands on /thank-you — PARTIAL (works; no redirect yet)
Rose palette & Geist applied; no green/orange — DONE
SEO basics in place (title/description/OG/sitemap/robots) — PARTIAL (sitemap/robots pending)
Analytics events fire for view and form submit/error — PENDING
Lighthouse ≥ 90 (Performance/SEO/Best Practices/Accessibility) — PENDING (to measure)

13) Future (not in v1)
Case studies / testimonials
Brand logo cloud
Scheduler embed (e.g., Cal.com) for demo booking — OPTIONAL next
A/B copy tests (hero variants)

14) DNS setup
In Netlify Site settings → Domain management, add brands.engagenatural.com.
Create CNAME: brands → <your-netlify-site>.netlify.app. — DONE

15) Dev Notes / Hand-off
Keep the whole site SSG; zero server data needed. — DONE
Use our existing copy tone: clean, plainspoken, short sentences. — DONE (baseline)
Preserve image filenames for easier cross-team reference. — DONE
Submit a PR with a preview URL and a 1-page summary of changes. — PENDING

Changelog (10/29/25)
Fixed Netlify TOML parse error; redeploy successful.
Implemented contact form with Formspree via env; production POST verified.
Added /brands page variant with hero, Why Now, charts, ROI example, footer.
Added lucide-react; used icons on /brands.
Wired analytics injection component (Plausible/GA4) behind envs.
Updated fonts to include Libre Baskerville accent.
Created .env.example; README env/deploy notes updated.
Pushed branches: feat/brands-marketing-site (base), feat/brands-page (new page).
