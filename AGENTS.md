# EngageNatural.com – Droid Orientation

This document keeps incoming agents aligned with the current structure and expectations of the EngageNatural web app. Update it whenever folder layout, tooling, or workflow conventions change.

## Core Commands

- **Start dev server:** `pnpm dev`
- **Lint & format check:** `pnpm lint`
- **Production build:** `pnpm build`
- **Preview built output:** `pnpm preview`
- **Firebase emulator suite (local fixtures):** `pnpm emu`

> _There are currently no repository-level unit test scripts. When you add tests, document the exact commands here._

## Project Layout (Monorepo Root)

The app is a single Vite + React SPA rooted at `src/`.

- `src/App.jsx` – top-level router, feature-flag handling, and role-based route protection via `RoleGuard` and `AuthProvider`.
- `src/components/` – shared UI, shadcn-derived primitives in `ui/`, domain widgets under folders such as `admin/`, `brand/`, `community/`.
- `src/pages/` – route-level views grouped by area (`admin/`, `brand/`, `staff/`, `community/`, etc.).
- `src/lib/` – Firebase bootstrap (`firebase.js`), utilities, analytics helpers.
- `src/services/` – API-style helpers (uploads, analytics, seeding).
- `src/hooks/` – reusable React hooks (auth, permissions, responsive state).
- `src/utils/` – role gating, landing-route helpers, emulator tooling.
- `src/theme/` – Tailwind v4 theme overrides and brand colour CSS.
- `src/brand/palette.ts` – TypeScript colour tokens aligned with the Tailwind palette for TS-aware consumers.

Static assets live under `src/assets/`. There is no `client/` or `server/` split; all backend integrations occur via Firebase services.

## Development Patterns & Constraints

- Framework: React 19 + Vite 6, Tailwind CSS v4, shadcn/ui component patterns.
- Auth & data: Firebase (Auth, Firestore, Storage, Functions). Local development can swap to emulators via `VITE_USE_EMULATOR`.
- TypeScript adoption is in progress – many files are `.jsx`, but shared modules should expose typings (`.d.ts` or `.ts`). Prefer adding types when touching a file.
- Maintain strict import casing (`Button.tsx`, not `button.tsx`) to stay Linux-friendly.
- Match existing ESLint/Tailwind conventions (no semicolons, `cn()` helper for class composition, avoid inline styles when utilities exist).
- Before introducing new runtime dependencies, confirm necessity and document the rationale in the PR.

## Git Workflow Essentials

1. Branch from `main` using `feature/<slug>` or `fix/<slug>` naming.
2. Run `pnpm lint` and `pnpm build` locally before committing or opening a PR.
3. Force-push only your feature branches with `--force-with-lease`; never force-push `main`.
4. Keep commits focused (one concern per commit) and write descriptive messages (`feat:`, `fix:`, `chore:` etc.).

## PR Readiness Checklist

- ✅ Linting passes (`pnpm lint`).
- ✅ Build succeeds (`pnpm build`).
- ✅ Changes scoped to documented directories (add new sections in this doc if structure evolves).
- ✅ Include proof of behaviour (screenshots, emulator steps, or data seed references) for UI-facing work.
- ✅ Summarise intent, approach, and testing in the PR description.
- ✅ Guard against casing pitfalls or Firebase config regressions when adding new modules.