title: UI Style Guide
version: 1.1
author: Manus AI / Factory AI / Liza Boone
last_updated: 2025-10-29

# UI Style Guide

Design conventions, brand tokens, and component usage across the application. This reflects the current implementation and notes open TODOs to align legacy theme settings.

## Brand Tokens (App)

Source of truth for in-app brand colors and font stacks:
- Colors: src/brand/palette.ts
- Typography: src/brand/typography.ts
- Tailwind theme: src/tailwind.config.js (currently contains legacy sage palette; see TODOs)

Primary tokens (from palette.ts):
- Text: `#0E0E0E` (TEXT_PRIMARY), Inverse `#FFFFFF`
- Petal Pink accents:
  - ACCENT_PINK `#F2D4CA`
  - ACCENT_PINK_LIGHT `#F3DAD1`
  - ACCENT_PINK_DARK `#CDB4AB`
- Backgrounds: `#FFFFFF` (page), `#F6E3DC` (section wash)
- Borders: `#E8C9C2`
- Buttons: primary black on white; secondary outline; pink variant available

Typography (from typography.ts):
- Body/UI: Geist (variable)
- Headings: Libre Baskerville
- Display/Code: IBM Plex Mono (as needed)

Usage classes:
- `font-sans` → Geist
- `font-serif` → Libre Baskerville
- `font-display` (if used) → IBM Plex Mono

## Tailwind Theme Status

- Fonts are correctly mapped in tailwind (sans/serif/display).
- Colors in tailwind.config.js still reference the legacy sage/moss palette. Components that import tokens from `src/brand/palette.ts` will reflect the petal-pink brand; tailwind color utilities may not. See TODOs to harmonize.
- Border radius default is 0.625rem (10px). Keep rounded corners consistent across buttons, inputs, and cards.

## Components (shadcn/ui baseline)

Location: `src/components/ui/*`
- Buttons: default, outline, ghost, destructive. Prefer black primary, outline secondary, and pink accent for emphasis (limit usage). Ensure focus states are visible.
- Inputs/Textareas: use tailwind forms plugin styles; consistent `:focus-visible` ring.
- Select/Tabs/Switch: shadcn primitives with Radix; maintain accessible labels.
- Cards: use subtle shadow, petal wash sections sparingly (`#F6E3DC`) to group content.
- Badges/Chips: outline or soft background using border token `#E8C9C2` and muted text.
- Tables: minimal borders; zebra only when density is high.

State and Interaction
- Hover: subtle elevation or background tint; avoid large color jumps.
- Focus: visible outline using high-contrast ring (e.g., black ring on light backgrounds).
- Disabled: reduce opacity and remove shadows; keep readable.
- Motion: respect prefers-reduced-motion; avoid parallax.

Dark Mode
- Components include `dark:` variants in several surfaces (e.g., brand dashboard). Maintain contrast ≥ WCAG AA.

## Layout Patterns

- Brand Dashboard: left sidebar + top bar; content sections (Analytics, Content, Communities, etc.). See `src/pages/brand/Dashboard.jsx` and `src/components/brands/BrandSidebar`.
- Community Feeds: mobile-first, segmented tabs (What’s Good, Pro Feed). See `src/pages/Community.jsx` and `src/pages/community/*`.

## Data Visualization

- Recharts wrapper exists at `src/components/ui/chart.jsx` and is used in admin areas.
- Brand analytics use Chart.js components (see `src/pages/brand/BrandAnalyticsPage.jsx`). Keep palette consistent: lines/bars use accessible contrast; annotate values on hover only.
- ROI visuals should use PNG assets or consistent chart themes; avoid mixing styles in the same page.

## Icons & Usage

- Icons: lucide-react. Use 16–20px inline with text; 24px in buttons; 32px in headers.
- Never rely on color alone for meaning; pair with labels or aria attributes.

## Accessibility

- Tap/click targets ≥ 44px.
- Use `aria-pressed` on toggles (Like), labels on icon-only buttons.
- Keyboard: Tab order logical; Enter to submit; Esc to close dialogs.
- Live regions for async success/error where appropriate.

## Marketing Site Note

The separate marketing site (brands.engagenatural.com) uses a rose palette + Geist, documented at `docs/operations/brands-marketing-site.md`. Do not apply those exact tokens globally in the app without design review.

## Known Gaps / TODOs

- Tailwind color mapping still uses legacy sage palette. Align tailwind theme to petal-pink tokens or provide CSS variables mapped to Tailwind colors.
- Create a shared CSS variable layer (e.g., `:root { --brand-* }`) and consume via utility classes where Tailwind tokens are insufficient.
- Add standardized focus ring utilities and apply across all interactive components.
- Unify chart color themes between Recharts and Chart.js.

## References

- Colors: `src/brand/palette.ts`
- Typography loader: `src/brand/typography.ts` (BrandFonts component)
- Tailwind theme: `src/tailwind.config.js`
- Brand dashboard: `src/pages/brand/Dashboard.jsx`
- Community: `src/pages/community/*`
