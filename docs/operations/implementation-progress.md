---
title: Implementation Progress — EngageNatural
owner: Liza Boone
status: Living Document
last_updated: 2025-10-29
version: 1.1
---

# Implementation Progress — EngageNatural

## Snapshot
- **Purpose:** Single source of truth for what’s done, what’s next, and how to deploy.
- **Scope:** Web app (staff/brand/admin), sampling, and the brands marketing site.
- **Docs Index:** See `/docs/README.md` for architecture, brand system, and runbooks.

**Quick Links**
- Security & Data Hygiene (Phase 9) → below
- QA & Observability (Phases 10–11) → below
- Production Launch Runbook (Phase 12) → below
- Brands Marketing Site (brands.engagenatural.com) → `/docs/operations/brands-marketing-site.md`

---

## Status At A Glance
| Area | Status | Notes |
|------|--------|-------|
| Baseline features | ✅ Done | Role guards, staff trainings, community, demo data |
| Phase 6 (Preview & Prod Prep) | ✅ Done | Netlify previews to prod Firebase; rules/indexes deployed |
| Phase 7 (Demo polish) | 🟡 Mostly done | “Recommended from your store” is open |
| Phase 8 (Seed content) | 🟡 In progress | Sample programs + a few posts still open |
| Phase 8.5–8.8 (UI redesign) | ✅ Done | Staff/brand UI + unified desktop shell |
| Phase 9 (Security & hygiene) | ⏳ Planned | Rules tightening + UID migration tool |
| Phases 10–11 (QA & observability) | ⏳ Planned | Playwright/Cypress + Sentry + analytics |
| Phase 12 (Launch runbook) | ⏳ Planned | Checklists below |
| Phase 13 (Post-launch) | ⏳ Planned | Templates, roadmap, feedback loop |
| Brands marketing site | 🔵 Starting | Spec ready in `/docs/operations/brands-marketing-site.md` |

---

## Next Steps Plan (Phase 6 → Launch)

## 0) Baseline (done)

- ✅ Role guards + pending gate
- ✅ Staff-led trainings + progress
- ✅ Community posts/comments/likes
- ✅ Demo seed/reset
- ✅ Emulator + EnvBadge
- ✅ Clean rules/indexes

---

## Phase 6 — Deploy Preview & Prod Prep

**Goal:** Preview on Netlify hitting prod Firebase, then production-ready deploy.

**Config**

- [x]  Netlify (Deploy Preview): set Firebase vars + flags
    
    `VITE_USE_EMULATOR=false`, `VITE_SHOW_DEMO_TOOLS=true`, `VITE_SHOW_DEBUG=false`
    
- [x]  Firebase (prod): add Netlify preview domain to **Auth → Authorized domains**
- [x]  Firebase (prod): deploy rules + indexes
    
    ```bash
    pnpm dlx firebase-tools use engagenatural-app
    pnpm dlx firebase-tools deploy --only firestore:rules,firestore:indexes
    
    ```
    
- [x]  Firebase (prod): create Auth users: `superadmin@…`, `bm.demo@…`, `staff.demo@…`

**Seed (via Deploy Preview)**

- [x]  Log in as **superadmin** (promote via DevTools if needed)
- [x]  **Admin → Demo Data → Seed**
- [x]  Sanity: brand(approved)→/brand, brand(false)→/pending, staff→/staff

---

## Phase 7 — Demo Polish (sales-ready)

**Brand Dashboard**

- [x]  KPI tiles: Enroll/Complete (7d/30d), Sample Requests (7d)
- [x]  “Top Trainings” list (by completions in 30d)

**Staff Dashboard**

- [x]  Discover: search + tag filters
- [x]  Start/Complete flow (optimistic)
- [ ]  Show “Recommended from your store” (latest 3)

**Community**

- [x]  Brand: composer + edit/delete
- [x]  Staff: like/comment + post detail thread

**Factory prompt pattern (for any file)**

> “Full file replace: <path>… Requirements: … No console logs. Use onSnapshot. Tailwind. Output complete file.”
> 

---

## Phase 8 — Seed Content (brand-authentic)

- [x]  Update `demoSeed.ts` with **Rescue**, **Bach**, **Spatone** titles/modules
- [ ]  Two sample programs with realistic copy
- [ ]  3–4 community posts with useful tips
- [x]  Re-seed (emulator), screenshot KPIs for sales deck

[Phase 8.5 - Redesign Staff UI](https://www.notion.so/Phase-8-5-Redesign-Staff-UI-2780caaa67e980f885a6d8f3e4af4b08?pvs=21)

[Community & Brand Manager Expansion (Phase 8.5 → 8.6)](https://www.notion.so/Community-Brand-Manager-Expansion-Phase-8-5-8-6-2800caaa67e98023a2f4f0d3edbbdd5b?pvs=21)

---

[**EngageNatural Sampling Program Plan**](https://www.notion.so/EngageNatural-Sampling-Program-Plan-2950caaa67e980dea348fe3d1d49a42b?pvs=21)

## Phase 9 — Security & Data Hygiene

- [ ]  Rule lock: only **super_admin** can flip `approved`
- [ ]  Brand-scoped writes (brandId match) verified
- [ ]  Staff can only read/write own `training_progress`
- [ ]  Add “field type guards” in `auth-context.jsx` (boolean coercion)
- [ ]  One-click **“Migrate user docs to UID keys”** tool (dev only) verified in both envs

---

## Phase 10 — Tests & QA

**Manual acceptance (copy into PRs)**

- [ ]  Role landing works for all roles
- [ ]  Pending gate blocks until `approved:true`
- [ ]  Community live updates (likes/comments)
- [ ]  Trainings start→complete updates metrics
- [ ]  Demo tools hidden when `VITE_SHOW_DEMO_TOOLS=false`

**Automated (nice-to-have)**

- [ ]  Add Playwright/Cypress smoke: login + route + guard
- [ ]  Emulator test: rules deny/allow key cases

---

## Phase 11 — Observability & Legal

- [ ]  Add Sentry DSN (env var): client error tracking
- [ ]  Add analytics (GA4/Plausible) w/ consent banner
- [ ]  Privacy Policy & Terms pages

---

## Phase 12 — Production Launch Runbook

**Netlify Prod env**

- [ ]  Firebase vars set
- [ ]  `VITE_USE_EMULATOR=false`
- [ ]  `VITE_SHOW_DEMO_TOOLS=false`
- [ ]  `VITE_SHOW_DEBUG=false`
- [ ]  Trigger production deploy

**Firebase Prod**

- [ ]  Authorized domains: prod domain(s) added
- [ ]  (Optional) Seed prod (temporarily set demo tools = true → seed → set false)

**Smoke (live site)**

- [ ]  super_admin: /admin
- [ ]  brand_manager: /brand (pending gate works)
- [ ]  staff: /staff
- [ ]  Community + Trainings basic flows

**Rollback plan**

- [ ]  Netlify → **Publish previous deploy**
- [ ]  GitHub → **Revert PR** if needed

---

## Phase 13 — Post-launch

- [ ]  Issue templates (bug/feature) in GitHub
- [ ]  Roadmap doc (next 4–6 weeks)
- [ ]  Feedback loop: simple Intercom/Typeform link in app (optional)

---

## Handy snippets

**Open a hotfix PR**
```bash
git checkout main && git pull
git switch -c hotfix/<name>
# edit
git add -A && git commit -m "Hotfix: <what>"
git push -u origin hotfix/<name>
```

**Deploy indexes only**

```bash
pnpm dlx firebase-tools deploy --only firestore:indexes
```

**Start emulators (dev)**

```bash
pnpm dlx firebase-tools emulators:start --only firestore,auth,storage --ui
```

**Env flags**

```bash
# Local dev
VITE_USE_EMULATOR=true
VITE_SHOW_DEMO_TOOLS=true
VITE_SHOW_DEBUG=true

# Deploy Preview
VITE_USE_EMULATOR=false
VITE_SHOW_DEMO_TOOLS=true
VITE_SHOW_DEBUG=false

# Production
VITE_USE_EMULATOR=false
VITE_SHOW_DEMO_TOOLS=false
VITE_SHOW_DEBUG=false
```

**“Ask Factory” templates (drop-in)**

**Full-file replace**

Replace `<path>` entirely. Requirements: … Use React Router v6, Tailwind. Real-time via onSnapshot. Strict TypeScript types if file is .ts(x). No console logs. Output complete file.

**Patch rules**

Update `firestore.rules` to enforce: only super_admin can change approved; brand-scoped writes; public reads require published==true. Use helper functions; compile cleanly with firebase-tools. Output whole file.

**Add page + route + sidebar**

Create `<path>`; add route `</route>` guarded by `<RoleGuard …>`; add sidebar link only when `user.role==='...'` and `VITE_SHOW_DEMO_TOOLS==='true'`. Output new file + exact diffs where routes/nav are registered.

---

# 2) Factory Reliability Droid prompt (auto-create/update + link)

Paste this into Factory to generate or update the doc and wire it into your docs index.

---

Task: Add and link Implementation Progress doc with Next Steps Plan

Files to create/update

Create or full-file replace `/docs/operations/implementation-progress.md` with the content provided by user (verbatim for the “Next Steps Plan (Phase 6 → Launch)” block), plus:

- Snapshot table
- Status-at-a-glance section
- Quick links
- Frontmatter (owner, last_updated)

Open `/docs/README.md` (docs index) and add a link under Operations:

- Implementation Progress

Rules

- Preserve user checkbox states and code blocks exactly.
- Use the rose brand palette/Geist in any embedded examples (if present).
- Validate relative links after writing.

Commit message: `chore(docs): add implementation-progress with Phase 6→Launch plan and link from docs index`

---

If you also want me to fold this plan into the **root README** (so it’s impossible to miss), I can give you a tiny patch that adds a “Project Status” link there too.
