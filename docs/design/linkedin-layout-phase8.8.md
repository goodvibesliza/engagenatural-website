title: LinkedIn Layout – Phases 8.5–8.8
version: 1.1
author: Factory AI / Liza Boone
last_updated: 2025-10-29

# Phase 8.5 – Redesign Staff UI (Community)

This document specifies the Staff Community redesign: split feeds (What’s Good vs Pro Feed), faster actions, and clear gating for unverified users. It reflects current implementation status and what remains to be done.

## 1) Problem & Opportunity

Problem (blunt): Staff Community is hard to skim, hard to act on, and mixes audiences.

Opportunity: Split What’s Good (open to all logged-in users) from Pro Feed (verified staff only), make actions one-tap, and tie posts to trainings/samples.

## 2) Goals (what success looks like)

- Clear mental model: two feeds, two audiences.
- Phone-first, one-thumb browsing.
- Faster path from post → action (like, comment, start training, request sample).

Success Metrics (targets, 30 days post-ship)

- ≥ 60% of verified staff open Pro Feed weekly.
- ≥ 25% of Community sessions include at least one action (like/comment/start training).
- ≥ 20% CTR from posts with “related training” to training starts.
- < 1% of Community API calls erroring (permission/unauthorized).

## 3) Scope (this project includes)

- IA + UX for Community on mobile and web.
- Feeds: What’s Good (public) and Pro Feed (verified staff).
- Post detail (actions + comments) and unverified gating states.
- Filters: search, brand chips, tags.
- Copy kit (labels, empty states, verify CTA).
- Analytics events & usability test plan.

Out of scope (for now)

- New verification flow (use existing).
- Server-side search or ML recommendations.
- Brand manager tools (addressed in prior phase).

## 4) Users & Access

- Any logged-in user: sees What’s Good.
- Verified staff: sees Pro Feed and can interact fully.
- Unverified staff: sees a friendly verify gate on Pro Feed.
- Brand managers: read-only here, full creation lives in Brand area.

## 5) Information Architecture

Community

Tabs / Segments:

- What’s Good (default)
- Pro Feed (shows gate if not verified)

Search + Filters:

- Search (title/body substring on page)
- Brand chips (Pro Feed only)
- Tag chips (both)

Routes:

- /community → feed (tab remembered)
- /community/:postId → post detail

## 6) Key Screens (wireframe notes)

### A) Mobile — Community list

Header: “Community”

Segmented control: What’s Good | Pro Feed

Tools row: 🔎 Search, [Brand ▾] (Pro only), [#Tags ▾]

Post Card

- Eyebrow: “WHAT’S GOOD” or Brand badge
- Title (2 lines), body snippet (3 lines), optional thumb
- Meta: ❤️ likes • 💬 comments • time • → View
- Optional chip: “Related training: <title>”
- Pagination: “Load more” (infinite style)

Unverified on Pro Feed:

- Locked panel: “Unlock the Pro Feed” → [Start verification]

### B) Mobile — Post detail

- Brand/What’s Good badge + timestamp
- Title, hero image (optional), readable body
- Actions row: ❤️ Like · 💬 Comment · ↗ Share
- Comments: live list, composer at bottom
- If unverified & Pro post: teaser lines + lock overlay + Verify CTA

### C) Web variants

- Same content; image floats right on cards; sidebar nav persistent.

## 7) Content Model (minimal additions)

community_posts

- visibility: "public" | "verified_staff"
- category (optional): "whats_good" for editorial public posts
- title, body, imageUrl?, brandId?, authorUid, createdAt, updatedAt
- relatedTrainingId? (optional)
- post_likes & community_comments (unchanged; counts are derived)

## 8) Interactions & States

- Like/Unlike: one tap; optimistic; reconcile count.
- Comment: composer expands on focus; submit disables until write completes.
- Filters: client-side on loaded page; reset chip shows when filters active.

Empty states:

- Filters: “No posts match these filters.” → [Clear filters]
- New account: “Welcome in! Try What’s Good while you verify.”
- Loading: skeleton cards (3–5), lazy-load images.

## 9) Copy Kit (microcopy)

- Tabs: “What’s Good” · “Pro Feed”
- Verify gate title: “Unlock the Pro Feed”
- Verify gate body: “Quick verification connects you to brand-only tips, promos, and samples.”
- Buttons: “Start verification” · “Learn more” · “View” · “Load more”
- Empty (filters): “No posts match those filters.”
- Post meta: “Updated · 2h ago”
- Comment placeholder: “Add a helpful tip…”

## 10) Accessibility & Quality

- Touch targets ≥ 44px; large tap areas on cards.
- aria-pressed on Like; labels on icons.
- Keyboard: Tab through actions; Enter to submit comment.
- Reduce motion option; avoid parallax.
- Performance: first 10 via live subscription; paginate with startAfter; defer counts until idle.

## 11) Analytics (events to instrument)

- community_view { tab, verified, brandFilterCount, tagFilterCount }
- community_post_impression { postId, tab, position }
- community_post_open { postId, tab }
- community_like_toggle { postId, liked }
- community_comment_create { postId, length }
- community_open_training { postId, trainingId }
- verify_gate_view { surface: 'tab'|'post' }
- verify_gate_cta_click { surface }

## 12) Risks & Mitigations

- Overfetching counts → slow cards: fetch counts on-demand (on view) and cache.
- Confusion between feeds: strong labels + persistent segmented control.
- Gate frustration: teaser lines + clear benefit copy.
- Moderator load: keep edit/delete with brand authors; add report later if needed.

## 13) Milestones & Review

- Week 1: Finalize IA, wireframes, copy kit → Design Review
- Week 2: Prototype (no code commit; clickable mock) → Usability Test
- Week 3–4: Build (ticketized), QA, analytics hooks → Ship

## 14) Acceptance Criteria

- Two-tab Community with correct gating and states on mobile + web.
- Post cards: clean scan, actionable CTAs, perf acceptable.
- Post detail: like/comment/share; verify overlay on gated content.
- Filters & search work; helpful empty states.
- Analytics events firing as specced.

## 15) Usability Test (5 users · 15 min each)

Tasks

- Find the latest tip in What’s Good and like it.
- Switch to Pro Feed and explain what you see.
- Open a post and leave a comment.
- Use filters to find a Rescue post.
- From a post, jump to its related training and start it.

Success signals: task completion ≤ 2 mins each; zero “where is X?” moments; users can explain the two feeds back to us.

## 16) Open Questions

- Do we need a mute brand filter for staff?
- Should brands be able to mark posts store-specific later?
- Do we show author name/role or brand only?

## 17) Appendix

- Current screenshots (before)
- Competitive references (links)
- Copy variations A/B (if any)

---

## Implementation Status and Remaining Work

Current state (from codebase):
- Separate feeds exist: `src/pages/community/WhatsGoodFeed.jsx` and `src/pages/community/ProFeed.jsx`.
- Community route pages exist: `src/pages/Community.jsx`, `src/pages/CommunityFeed.jsx`, `src/pages/community/PostThread.jsx`, `src/pages/community/PostDetail.jsx`.
- Verification signals available in `auth-context.jsx` (e.g., `verified`, `verificationStatus`, roles), but gating UX may be inconsistent across pages.

Remaining work (high priority):
- IA alignment: ensure `/community` defaults to What’s Good with remembered tab; route to `/community/:postId` for detail.
- Gating: implement consistent Pro Feed gate using verified flag; add friendly lock panel with CTA.
- Cards: update list card layout (eyebrow, snippet, meta, optional related training chip).
- Filters: client-side search; brand chips (Pro only); tag chips; clear-filters chip.
- Actions: optimistic like/unlike; comment composer UX; share stub.
- Analytics: instrument all events listed above; add tiny wrapper module.
- Content model: add `visibility`, optional `category` and `relatedTrainingId`; update Firestore rules accordingly.
- Performance: adopt onSnapshot for first 10 items; paginate with startAfter; defer counts until idle.
- A11y: aria-pressed, labels, keyboard flows, reduced motion.

Remaining work (follow-ups):
- Empty states and copy kit across all surfaces (lists, filters, gate, detail).
- Web layout variant with sidebar and floated images.
- QA checklist + usability test protocol for the new IA.

## Change Log

- 1.1 (2025-10-29): Replaced placeholder with full Phase 8.5 spec; added implementation status and remaining work.
- 1.0 (2025-10-27): Initial placeholder.
