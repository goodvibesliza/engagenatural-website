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
