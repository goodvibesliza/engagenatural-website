---
title: Implementation Progress — EngageNatural
owner: Liza Boone
status: Living Document
last_updated: 2025-10-29
version: 1.2
---

# Implementation Progress — EngageNatural

## Snapshot

This document tracks the current build status and next steps for all EngageNatural components:

- Web App (staff, brand, admin)
- Sampling Program / Coupon System
- Brands Marketing Site (brands.engagenatural.com)
- Deployment, QA, and Observability phases

**Quick Links**

- [Brands Marketing Site Spec](./brands-marketing-site.md)
- [Sampling Program Plan](../business/sampling-program.md)
- [Next Steps Plan (Phase 6 → Launch)](#next-steps-plan-phase-6--launch)

---

## 1. Status at a Glance

| Area | Status | Notes |
|------|--------|-------|
| Baseline app build | ✅ Done | Role guards, training, community |
| Phase 6 – Deploy Preview | ✅ Done | Netlify previews → prod Firebase |
| Phase 7 – Demo polish | ✅ Done | Completed tasks listed below |
| Phase 8 – Seed content | 🟡 In progress | Sample programs + brand posts pending |
| Phase 8.5–8.8 – UI redesign | ✅ Done | Unified LinkedIn-style layout |
| Phase 9 — Sampling Program / Coupon System | 🟢 In progress | Core logic drafted, API setup pending |
| Phase 10 — Brands Landing & Marketing Site | 🔵 Starting | Basic internal page live; Netlify site migration pending |
| Phase 11 — Security & Data Hygiene | ⏳ Planned | Firestore rules tightening |
| Phase 12 — Tests & QA | ⏳ Planned | Playwright smoke + manual checklist |
| Phase 13 — Observability & Legal | ⏳ Planned | Sentry + analytics + legal pages |
| Phase 14 — Launch Runbook | ⏳ Planned | Checklist ready |
| Phase 15 — Post-launch | ⏳ Planned | GitHub templates + feedback tools |

---

## 4. Next Steps Plan (Phase 6 → Launch)

*(Full checklist preserved for continuity — see previous plan for detailed commands and flags)*

## 0) Baseline (done)

- ✅ Role guards + pending gate  
- ✅ Staff-led trainings + progress  
- ✅ Community posts/comments/likes  
- ✅ Demo seed/reset  
- ✅ Emulator + EnvBadge  
- ✅ Clean rules/indexes  

---

## Phase 6 — Deploy Preview & Prod Prep

✅ Complete (Netlify + Firebase auth + deploy rules/indexes)

---

## Phase 7 — Demo Polish (sales-ready)

Brand Dashboard

- [x] KPI tiles: Enroll/Complete (7d/30d), Sample Requests (7d)
- [x] “Top Trainings” list (by completions in 30d)

Staff Dashboard

- [x] Discover: search + tag filters
- [x] Start/Complete flow (optimistic)

Community

- [x] Brand: composer + edit/delete
- [x] Staff: like/comment + post detail thread

---

## Phase 8 — Seed Content (brand-authentic)

- [x] Update `demoSeed.ts` with Rescue, Bach, Spatone titles/modules
- [ ] Two sample programs with realistic copy
- [ ] 3–4 community posts with useful tips
- [x] Re-seed (emulator), screenshot KPIs for sales deck

---

## Phase 9 — Sampling Program / Coupon System

**Objective:**  
Enable brands to issue digital manufacturer coupons tied to staff training completions.  
Each redemption corresponds to a verified, in-store product trial — measurable ROI for brands.

**Current State:**  
- Verified employee redemption logic designed  
- Basic ROI math live in app (ROI example cards)  
- Awaiting backend coupon processor connection (TLC/Inmar)  
- Firestore data model stub: coupon_redemptions, training_linked_skus

**Next Steps:**  
- [ ]  Integrate clearinghouse API for live redemptions  
- [ ]  Connect brand dashboard to coupon redemption metrics  
- [ ]  Add fraud prevention (photo + GPS validation)  
- [ ]  Implement ROI dashboard for brands (aggregated by SKU/store)  
- [ ]  QA with mock coupons before production connection  

**Reference:** /docs/business/sampling-program.md

---

## Phase 10 — Brands Landing & Marketing Site

**Current internal page:**  
- Basic version of BrandsLanding.jsx exists under the main web app src/components/BrandsLanding.jsx).  
- Shows ROI, engagement, and sales impact charts using static PNGs.  
- Formspree contact form functioning.  

**Next Step:**  
Migrate this content into a standalone **Next.js marketing site** at **brands.engagenatural.com**.

**Marketing site tasks:**

- [ ]  Create new repo: engagenatural-brands-site
- [ ]  Implement pages from /docs/operations/brands-marketing-site.md
- [ ]  Set up Netlify site + DNS (CNAME/ALIAS) → brands.engagenatural.com
- [ ]  Copy charts from app /public/charts/
- [ ]  Connect Formspree or /api/contact route  
- [ ]  Apply rose palette + Geist typography

---

## Phase 11 — Security & Data Hygiene

⏳ Not started – tighten Firestore rules and auth-context guards  

---

## Phase 12 — Tests & QA

⏳ Plan to add Playwright smoke + manual PR checklist  

---

## Phase 13 — Observability & Legal

⏳ Add Sentry DSN, Plausible/GA4, Privacy Policy & Terms  

---

## Phase 14 — Production Launch Runbook

⏳ Ready for production checklist execution on final QA pass  

---

## Phase 15 — Post-launch

⏳ GitHub templates + feedback/roadmap form  

---

## 5. Dependencies & Infrastructure

| Service | Status | Notes |
|----------|--------|-------|
| **Firebase Project** | Active | engagenatural-app (rules clean, emulator working) |
| **Netlify** | Live | Preview + production builds |
| **Netlify (Marketing Site)** | Planned | For brands marketing site |
| **Coupon Processor API** | TBD | TLC vs Inmar decision pending |
| **Analytics** | Partial | GA4 or Plausible selection pending |
| **Sentry** | Planned | For web error tracking |
| **GitHub Repo** | Active | engagenatural-web main branch current |

---

## 6. Developer Notes

- Always update this file after major merges or deployment phases.
- Factory should regenerate progress tables automatically from commits.
- Marketing site dev should sync with this document and /docs/operations/brands-marketing-site.md.
- When coupon integration begins, update this doc with processor name, endpoints, and API schema.

---

## 7. Recent Changes Log

| Date | Change | Author |
|------|---------|--------|
| Oct 2025 | Added Sampling Program section | L. Boone |
| Oct 2025 | Added Brands Marketing Site task list | L. Boone |
| Oct 2025 | Phase 6–8 progress checklists updated | Factory |
