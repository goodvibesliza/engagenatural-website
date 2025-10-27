title: Staff UI Redesign (LinkedIn Shell)
version: 1.0
author: Manus AI / Factory AI / Liza Boone
last_updated: 2025-10-27

# Staff UI Redesign (LinkedIn Shell)

Desktop and mobile refinements for the staff community experience.

## Feature Flags

- Desktop feed layout: `VITE_EN_DESKTOP_FEED_LAYOUT=linkedin`
- Mobile skin: `EN_MOBILE_FEED_SKIN=linkedin`

## Key Files

- Desktop shell and cards: src/layouts/DesktopLinkedInShell.jsx, 
  src/components/community/PostCardDesktopLinkedIn.jsx
- Mobile components: src/components/community/mobile/*
- Community routes: src/pages/Community.jsx, src/pages/community/*

## Testing References

- Web LinkedIn Desktop Layout → ../../WEB_LINKEDIN_DESKTOP_TESTING.md (legacy)
- Mobile LinkedIn Skin → ../../MOBILE_LINKEDIN_TESTING.md (legacy)
- QA Checklist (consolidated) → ../operations/qa-checklist.md

## Notes

- Prefer static imports for PostDetail to avoid chunk fetch issues on Netlify.
- Keep analytics payloads PII-free (see AGENTS.md policy section).
