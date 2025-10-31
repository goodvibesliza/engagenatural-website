---
title: Implementation Progress — EngageNatural
owner: Liza Boone
status: Living Document
last_updated: 2025-10-31
version: 1.3
---

# Implementation Progress — EngageNatural

## Snapshot

This document tracks the current build status and next steps for all EngageNatural components:

- Web App (staff, brand, admin)
- Sampling Program / Coupon System
- Notifications System (Telegram)
- Brands Marketing Site (brands.engagenatural.com)
- Deployment, QA, and Observability phases

**Quick Links**

- [Brands Marketing Site Spec](./brands-marketing-site.md)
- [Sampling Program Plan](../business/sampling-program.md)
- [Notification System Spec](./Notification-System.md)
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
| Phase 8.9 - Learning & Challenges Templates |🟡 In progress| Adds templates system
| Phase 8.91 - Challenge Types + Educator Services |⏳ Planned |	Gamified challenges + upcharge
| Phase 9 — Sampling Program / Coupon System | 🟢 In progress | Brand-led CSV export + ROI tracking |
| Phase 10 — Notifications (Telegram MVP) | 🟢 In progress | Replacing email/push with @EngageNaturalBot |
| Phase 11 — Brands Landing & Marketing Site | ✅ Done | Subpage live, site works |
| Phase 12 — Security & Data Hygiene | ⏳ Planned | Firestore rules tightening |
| Phase 13 — Tests & QA | ⏳ Planned | Playwright smoke + manual checklist |
| Phase 14 — Observability & Legal | ⏳ Planned | Sentry + analytics + legal pages |
| Phase 15 — Launch Runbook | ⏳ Planned | Checklist ready |
| Phase 16 — Post-launch | ⏳ Planned | GitHub templates + feedback tools |

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

## Phase 8.9 - 8.91 - Learning & Challenges Templates and Challenge Types + Educator Services


Rollout Sequence
|Step|Description|Status|
|------|--------|-------|
|8.9 a|	Add Challenges tab in Admin|	🟢 Active|
|8.9 b|	Extend editor/viewer|	🟢 Active|
|8.9 c|	Connect to Brand dashboard|	🟡 Pending|
|8.91 a|	Add challenge type logic (quiz, mission, streak)|	⏳ Planned|
|8.91 b|	Enable educator-service requests|	⏳ Planned|
|8.91 c|	Wire analytics + notifications|	⏳ Planned|

---

## Phase 9 — Sampling Program / Coupon System

**Objective:**  
Enable brands to run staff sampling campaigns and coupon reimbursements using verified CSV exports from EngageNatural — no clearinghouse dependency for MVP.

**Current State:**  
- Verified employee + training linkage in Firestore  
- CSV export tool functional in Brand Dashboard  
- Basic ROI math and KPI cards live in-app  
- Awaiting automation of reward notifications via Telegram  
- Firestore data model includes: `coupon_redemptions`, `training_linked_skus`, `sampling_requests`

**Next Steps:**  
- [ ] Generate brand-facing CSV export for sampling/coupon redemption (fields: store, staff_id, sku, date, verified_photo_url)  
- [ ] Automate Telegram alerts to brands when new CSVs or campaign results are available  
- [ ] Add fraud prevention (photo + GPS validation)  
- [ ] Implement ROI dashboard for brands (aggregated by SKU/store)  
- [ ] QA CSV output and test import into partner clearinghouse later (TLC/Inmar optional integration)

**Notifications:**  
Sampling events (request create/approve/deny/ship) now route through the new Telegram system — replacing legacy email/push. See `/docs/Notification-System.md` for function paths and env setup.

---

## Phase 10 — Notifications (Telegram MVP)

**Objective:**  
Replace Email + Push notifications with Telegram-based communication through @EngageNaturalBot.  
Supports both transactional (quiz pass, reward sent) and broadcast (new brand, new challenge) messaging.

**Current State:**  
- Bot live and linked in Profile via deep link (`t.me/EngageNaturalBot?start=link_<uid>`)  
- Firestore integration for chat_id and message logs completed  
- Functions for outbound message queue in progress  

**Next Steps:**  
- [ ] Refactor existing notification helpers to route via Telegram (`sendTelegram()`)  
- [ ] Connect lesson pass and sampling reward triggers  
- [ ] Add channel-based broadcasts for new brands, lessons, and challenges  
- [ ] Verify rate limits, retry logic, and logging to `notifications_meta`  

**Reference:** `/docs/Notification-System.md`

---

## Phase 11 — Brands Landing & Marketing Site

**Current internal page:**  
- Basic version of BrandsLanding.jsx exists under the main web app (src/components/BrandsLanding.jsx).  
- Shows ROI, engagement, and sales impact charts using static PNGs.  
- Formspree contact form functioning.  

**Next Step:**  
Migrate this content into a standalone **Next.js marketing site** at **brands.engagenatural.com**.

**Marketing site tasks:**

- [x]  Create new repo: engagenatural-brands-site  
- [x]  Implement pages from /docs/operations/brands-marketing-site.md  
- [x]  Set up Netlify site + DNS (CNAME/ALIAS) → brands.engagenatural.com  
- [x]  Copy charts from app /public/charts/  
- [x]  Connect Formspree or /api/contact route  
- [x]  Apply rose palette + Geist typography  

---

## Phase 12 — Security & Data Hygiene

⏳ Not started – tighten Firestore rules and auth-context guards  

---

## Phase 13 — Tests & QA

⏳ Plan to add Playwright smoke + manual PR checklist  

---

## Phase 14 — Observability & Legal

⏳ Add Sentry DSN, Plausible/GA4, Privacy Policy & Terms  

---

## Phase 15 — Production Launch Runbook

⏳ Ready for production checklist execution on final QA pass  

---

## Phase 16 — Post-launch

⏳ GitHub templates + feedback/roadmap form  

---

## 5. Dependencies & Infrastructure

| Service | Status | Notes |
|----------|--------|-------|
| **Firebase Project** | Active | engagenatural-app (rules clean, emulator working) |
| **Netlify** | Live | Preview + production builds |
| **Netlify (Marketing Site)** | Planned | For brands marketing site |
| **Telegram Bot API** | Active | @EngageNaturalBot configured, webhook pending |
| **Coupon Processor API** | Deferred | Brand-led CSV approach for MVP |
| **Analytics** | Partial | GA4 or Plausible selection pending |
| **Sentry** | Planned | For web error tracking |
| **GitHub Repo** | Active | engagenatural-web main branch current |

---

## 6. Developer Notes

- Replace all legacy email/push functions with Telegram equivalents (`sendTelegram()`).
- Sampling CSV exports should mirror coupon clearinghouse fields for future integration.
- Update this file after each major deploy or Telegram system enhancement.
- Reference `/docs/Notification-System.md` for environment variables, webhook config, and queue logic.

---

## 7. Recent Changes Log

| Date | Change | Author |
|------|---------|--------|
| Oct 31 2025 | Added Telegram Notification System (Phase 10) | L. Boone |
| Oct 31 2025 | Updated Sampling Program to brand-led CSV MVP | L. Boone |
| Oct 31 2025 | Added Quick Link to Notification System doc | Factory |
| Oct 27 2025 | Phase 6–8 progress checklists updated | Factory |
