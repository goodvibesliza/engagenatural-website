title: Brand Manager System
version: 1.0
author: Manus AI / Factory AI / Liza Boone
last_updated: 2025-10-27

# Brand Manager System

Brand managers create and manage brand communities, posts, and trainings; view analytics; and run
reports.

Related: ./admin-system.md

## Key Screens and Paths

- Dashboard shell: src/pages/brand/Dashboard.jsx (+ sections under src/pages/brand/dashboard/)
- Communities: src/pages/brand/Communities.jsx and components/brands/*
- Content tools: src/components/brand/content/* and pages/brand/ContentManager.jsx
- Training selector: src/components/brands/TrainingSelect.jsx (+ QuickPicker)
- Analytics: src/components/brand/analytics/Charts.jsx
- Sidebar: src/components/brands/BrandSidebar.jsx

## Desktop-Only Guard

Brand management is desktop-only. Below 1024px, a blocking banner appears and actions are disabled.

## Testing Guides

- Brand Communities Desktop UI → ../../BRAND_COMMUNITIES_TESTING.md (legacy)
- QA Checklist (consolidated) → ../operations/qa-checklist.md

## Permissions

Role required: brand_manager (and/or super_admin). Additional brand association checks may apply.
