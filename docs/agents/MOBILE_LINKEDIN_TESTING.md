# Mobile LinkedIn Skin – Manual Verification

1) Toggle flag on; set viewport <768px; open `/community`.

2) Verify composer + compact filters render (data-testids present):
   - `mobile-linkedin-composer`
   - `mobile-linkedin-filterbar`

3) Open a post; like/comment; confirm behavior unchanged (data-testids present):
   - `mobile-linkedin-postcard`
   - `mobile-linkedin-action-like`
   - `mobile-linkedin-action-comment`
   - `mobile-linkedin-action-training`

4) Pro Feed gate unchanged.

5) Resize to ≥768px or turn the flag off → legacy UI returns.

6) Verify analytics payload includes `ui_variant = 'mobile_linkedin'` in dev console when flag on + mobile.

\n## Mobile Add-ons (QA Hooks)

7) Post-auth redirect (staff): Log in as staff. Confirm landing at `/community?tab=whats-good`. Overrides still respected:
   - `?redirectTo=/staff/verification` goes there
   - `localStorage.en.lastRoute` (valid staff/community route) is honored

8) Collapsing top bar: Scroll down → top bar hides; scroll up → reappears.
   - Avatar tap opens user dropdown
   - Search tap focuses existing community search field
   - Test IDs: `topbar`, `topbar-avatar`, `topbar-search`

9) Bottom navigation: Fixed at bottom; tap each item → correct route and `aria-current="page"` updates.
   - Test IDs: `bottomnav`, `bottomnav-mybrands`, `bottomnav-notifications`, `bottomnav-communities`, `bottomnav-learning`

10) Layout safety: No overlap with composer or filters; content is padded above (56px when top bar visible) and below (≈60px for fixed nav) on small screens.

