---
title: Brands Marketing Site (brands.engagenatural.com)
owner: Liza Boone
status: Draft for dev review, started AI coding
last_updated: 2025-10-29
version: 1.0
---

# Brands Marketing Site — Technical Brief

Goal: Launch a lightweight, high-performance marketing site at **brands.engagenatural.com** for prospective brand clients. 
It should showcase **real ROI charts** we already have (PNG assets), a clear value narrative, and a contact/demo funnel.
No auth, no app dependencies, just fast and clean.

---

## 1) Stack & Hosting (industry standard)

- **Framework:** Next.js (App Router), React 18+
- **Styling:** Tailwind CSS + CSS variables for brand tokens
- **UI Kit:** shadcn/ui (Radix under the hood)
- **Icons:** lucide-react
- **Analytics:** Plausible (preferred) or GA4
- **Error/Perf Monitoring:** Sentry (client + edge)
- **Forms:** Formspree (current) or Next.js API route → email/webhook
- **Deployment:** Netlify brands.engagenatural.com
- **CI/CD:** GitHub → Netlify build previews per branch/PR

> Rationale: Next.js + Netlify is a standard modern marketing stack: fast, SEO-friendly, trivial CI/CD.

---

## 2) Domain & Environments

- **Primary:** `brands.engagenatural.com` (production)
- **Preview:** Netlify Deploy Preview URLs per PR (auto)
- **Staging (optional):** `brands-staging.engagenatural.com`

**DNS:** Create a CNAME for `brands` → `<your-netlify-site>.netlify.app`.  
(See “DNS setup” at the end of this doc.)

---

## 3) Brand System (tokens)

**Palette (no green/orange):**
- `--brand-primary: #000000` (text)
- `--brand-secondary: #D9A6A1` (rose accent)
- `--brand-taupe: #B2A49A` (support)
- `--brand-mist: #F5F3F2` (surface)
- `--white: #FFFFFF`

**Typography**
- Primary: **Geist** (UI + headings).  
- Optional accent for hero/campaign headlines only: Playfair Display.

**Tailwind setup**
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
```

## 4) Site Map & Routes

- `/` (Home / “For Brands”)
  - Hero (editorial, rose accent)
  - “Why Now” bullets (concise)
  - Proven Results — 3 chart cards (PNG assets)
    - sales_impact_graph.png
    - roi_growth_graph.png
    - user_engagement_graph.png
  - ROI Example card (static example, same math as app page)
  - Social proof (logos/testimonials) — optional placeholder
  - Contact / Request a demo (Formspree or API route)
- `/privacy` (basic policy)
- `/thank-you` (post-form submission)

Everything must be statically rendered (SSG) for speed.

## 5) Content & Assets

- Use the PNG charts already in your codebase (or copy to `/public/charts/`):
  - sales_impact_graph.png
  - roi_growth_graph.png
  - user_engagement_graph.png
- Provide alt text and lazy-load images.
- Keep copy simple, direct, and on-brand (rose highlights, no hype).

## 6) Components (shadcn/ui)

- Navbar (Logo “EngageNatural”, links: Home, Contact)
- Hero (headline + subhead + CTA)
- ValueBullets (Why Now)
- ChartsGrid (3 cards with images)
- ROIExampleCard (list rows + Total ROI line)
- ContactForm (Formspree or API route)
- Footer (short boilerplate + LinkedIn/Mail icons)

Event tracking (data attributes):
- `data-analytics="brands_view"`
- `data-analytics="brands_contact_submit"`
- `data-analytics="brands_contact_error"`

Implement a tiny utility to fire events for Plausible/GA4.

## 7) SEO / Meta

- Unique `<title>` and `<meta name="description">`
- OG tags: title, description, image (a cropped chart or brand lockup)
- sitemap.xml (Next.js route)
- robots.txt
- Canonical URL set to https://brands.engagenatural.com/

Example
- Title: For Brands — EngageNatural
- Description: Verified staff training + community for natural products brands. Real ROI. See the charts.

## 8) Forms

- Option A (fastest): Formspree (keep current endpoint).
- Option B: Next.js API route `/api/contact` → Sendgrid/Resend or webhook to your inbox.

Form fields: name*, email*, company, message*  
On success: redirect to `/thank-you`.

## 9) Analytics & Monitoring

- Plausible — lightweight, privacy-respecting.
- Sentry — error monitoring (browser).
- Add environment toggles via `.env`:

```
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=brands.engagenatural.com
NEXT_PUBLIC_SENTRY_DSN=...
```

## 10) Performance & A11y

- `loading="lazy"`, width/height attributes set
- CLS/LCP under web vitals thresholds
- WCAG 2.1 AA contrast; keyboard focus states
- No client JS for things that can be static

## 11) Directory Structure

```
/ (Next.js app router)
  app/
    layout.tsx
    page.tsx                   # home
    privacy/page.tsx
    thank-you/page.tsx
    sitemap.ts
    robots.ts
  components/
    navbar.tsx
    hero.tsx
    value-bullets.tsx
    charts-grid.tsx
    roi-example-card.tsx
    contact-form.tsx
    footer.tsx
  public/
    charts/
      sales_impact_graph.png
      roi_growth_graph.png
      user_engagement_graph.png
    og.jpg
  lib/
    analytics.ts               # tiny wrapper for Plausible/GA4
  styles/
    globals.css
  .env.local.example
  README.md
```

## 12) Acceptance Criteria (v1)

- Site deploys at brands.engagenatural.com
- Home page includes hero, Why Now, charts grid, ROI example, contact form
- Charts render from PNG assets with correct alt text
- Form submission works; user lands on `/thank-you`
- Rose palette & Geist applied; no green/orange
- SEO basics in place (title/description/OG/sitemap/robots)
- Analytics events fire for view and form submit/error
- Lighthouse ≥ 90 (Performance/SEO/Best Practices/Accessibility)

## 13) Future (not in v1)

- Case studies / testimonials
- Brand logo cloud
- Scheduler embed (e.g., Cal.com) for demo booking
- A/B copy tests (hero variants)

## 14) DNS setup - complete

In Netlify Site settings → Domain management, add `brands.engagenatural.com`.


## 15) Dev Notes / Hand-off

- Keep the whole site SSG; zero server data needed.
- Use our existing copy tone: clean, plainspoken, short sentences.
- Preserve image filenames for easier cross-team reference.
- Submit a PR with a preview URL and a 1-page summary of changes.

---

If you want, I can also generate a small **Factory Reliability Droid prompt** to scaffold this Next.js site (folders, tokens, pages, and placeholders) and drop this doc into `/docs/operations/brands-marketing-site.md`.
