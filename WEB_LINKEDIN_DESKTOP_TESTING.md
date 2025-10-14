# Web LinkedIn Desktop Layout — Manual QA Checklist

Pre-reqs
- Feature flag enabled: set `VITE_EN_DESKTOP_FEED_LAYOUT=linkedin` (e.g., in `.env.local`).
- Log in as a staff user.

Scenarios
1) 1440px wide (desktop)
   - Header and left nav are fixed; they never move when scrolling.
   - Center column is the only scroll container; mouse wheel/trackpad should not scroll the body.
   - Right rail is visible.

2) Resize to 1100px
   - Right rail hides automatically.
   - Header and left nav remain fixed; center continues to scroll only.

3) Resize to 900px
   - Route falls back to legacy mobile experience.

4) Open both feeds
   - Open What’s Good and Pro feeds via left nav or tabs.
   - Pro gate (if applicable) renders in the center column (not header or left rail).

5) Card visuals
   - Brand logo shows; when no logo, fallback initial renders.
   - Date/time is visible.
   - Image area height is consistent across 5+ posts (16:9), center-cropped.

6) Actions
   - Like / Comment / View training buttons function.
   - Counts (likes/comments) are derived and update appropriately.

7) Keyboard
   - Tabbing moves through: header → left nav → first card actions.
   - Focus is visible (focus rings), and does not jump the page.

8) Scroll behavior
   - No body scroll; only the center scroll container moves.

QA hooks (data-testid)
- Shell: `desktop-shell-header`, `desktop-shell-leftnav`, `desktop-shell-center`, `desktop-shell-rightrail`.
- Card (desktop LinkedIn): `desktop-linkedin-postcard`, `desktop-linkedin-avatar`, `desktop-linkedin-author-name`, `desktop-linkedin-company-time`, `desktop-linkedin-hero`.
- Actions (desktop LinkedIn): `desktop-linkedin-action-like`, `desktop-linkedin-action-comment`, `desktop-linkedin-action-training`.

Appendix — Additional routes (My Brands, Learning, Post Create/Detail)

- At width 1440 with flag on, open `/staff/my-brands` and `/staff/learning`: header/left fixed; only center scrolls; right rail visible at ≥1280, hidden below.
- Open `/staff/community/post/new` and a real `/staff/community/post/{id}`: same shell; deep link renders; center scroll only.
- Left search visible and focusable; typing doesn’t break layout (no-op ok). Test ID: `leftsearch-input`.
- Resize <1024: pages fall back to legacy responsive layout (shell not applied).

QA hooks (pages)
- My Brands center container: `mybrands-center`
- Learning center container: `learning-center`
- Post Create center: `postcreate-center`
- Post Detail center: `postdetail-center`

---

Top Menu Bar (Desktop)

Setup
- Width 1440, feature flag on: navigate to `/community`.

Expectations
- `topbar` is visible; header and left nav remain fixed; only the center column scrolls.
- Clicking each item routes correctly and updates active state (aria-current="page"):
  - Notifications → `/staff/notifications`
  - My Brands → `/staff/my-brands`
  - Learning → `/staff/learning`
- Analytics: Dev console logs `topmenu_click` with `{ item, surface: 'community_desktop' }` on each click.
- User menu: Click avatar (or focus then Enter) to open existing dropdown; keyboard accessible.
- Resize below 1024px: Top menu hides and mobile/tablet layouts take over.
- No overlap: First card in feed is fully visible; center scroller height accounts for the top bar.

QA hooks (top menu)
- `topbar`
- `topbar-notifications`
- `topbar-mybrands`
- `topbar-learning`
- `topbar-avatar`
