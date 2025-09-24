# Community UI – Phone‑First Usability Script

This script validates the core Community flows on a phone‑first layout. Capture:
- Time on task
- Mis‑taps
- Success / Fail

Use data‑testids for targeting elements (tabs, filters, cards, like button, comment composer, training CTA). Select the first card via queryAll/getAll on `[data-testid="postcard"]` instead of relying on a dedicated first‑card id.

## Tasks

1) Open Community → find and open a post in “What’s Good.”
   - Tap: `[data-testid="tab-whats-good"]`
   - Scroll if needed, open the first card by selecting the first element from queryAll/getAll(`[data-testid="postcard"]`)

2) Like it and add a short comment.
   - Tap like: `[data-testid="like-button"]`
   - Focus composer: `[data-testid="comment-input"]`, type a sentence
   - Submit: `[data-testid="comment-submit"]`

3) Switch to “Pro Feed” (unverified) and see the gate.
   - Navigate back to `/community`
   - Tap: `[data-testid="tab-pro"]`
   - Verify the verification gate appears

4) Filter to a brand and clear filters.
   - Use search: `[data-testid="filter-search"]`
   - Tap a brand chip: `[data-testid="brand-chip-<brand-slug>"]`
   - Clear: tap the same brand chip again

5) From a post, jump to its training.
   - On a card with training, tap: `[data-testid="view-training-cta"]`

Notes:
- Perform on mobile viewport first; resize to desktop to confirm two‑column grid and sticky filters preserve state.
- All analytics are no‑op by default; no external services are contacted.
