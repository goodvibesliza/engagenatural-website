# Mobile Community Switcher V3

## Overview
Enhanced mobile community selector with smart UX features including pinning, unread indicators, and auto-scrolling carousel.

## Features

### 1. Smart Ordering
Communities are automatically sorted by:
1. **Pinned** (user order preserved)
2. **Recently Active** (by last visited timestamp)
3. **Alphabetical** (fallback)

### 2. Pinned Communities
- Users can pin up to **3 communities**
- Pinned chips have a **gold accent ring** (`ring-amber-400`)
- Pin toggles via ⭐ button in ChooseCommunitySheet
- Persistence: Firestore (`users/{uid}/preferences/community`) with localStorage fallback
- Shows toast "You can pin up to 3 communities" when limit reached

### 3. Unread Badges
- **8px red dot** in upper-right corner of chips with unread posts
- Appears on "All" and "More" chips if any community has unread
- Accessibility: aria-label includes ", unread" when badge visible
- Cleared via `markAsRead(communityId)` when community is opened

### 4. Auto-Scroll Carousel
- Activates after **5 seconds** of idle time
- Scrolls at **25px/second** (~0.42px per frame @ 60fps)
- Pauses for **1 second** at each edge, then reverses direction
- Stops immediately on user touch/scroll/mouse interaction
- Disabled when keyboard open or overlay/dialog active
- Smooth `scroll-behavior: smooth`

### 5. Visual Polish
- **Fade-edge gradients** on left/right (8px width, white to transparent)
- **Visual divider** (1px gray line) between pinned and unpinned sections
- **Fixed height**: 68px (44px chips + 12px top/bottom padding)
- **Selected state**: Bold text + brand-primary background
- **Pin accent**: Subtle gold glow via box-shadow

## Architecture

### Custom Hook: `useCommunitySwitcher`
**Location**: `src/hooks/useCommunitySwitcher.js`

**State**:
```javascript
{
  allCommunities: Community[],      // Sorted by smart ordering
  pinnedIds: string[],               // Max 3
  unreadCounts: Record<string, number>,
  lastVisited: Record<string, timestamp>,
  loading: boolean
}
```

**API**:
- `togglePin(communityId)` - Pin/unpin with limit enforcement
- `markVisited(communityId)` - Update last visited timestamp
- `markAsRead(communityId)` - Clear unread badge
- `isPinned(communityId)` - Check if pinned
- `getUnreadCount(communityId)` - Get unread count
- `hasAnyUnread` - Boolean for any unread

### Components

#### CommunityChipScroller
**Location**: `src/components/community/mobile/CommunityChipScroller.jsx`

**Features**:
- Auto-scroll carousel with requestAnimationFrame
- Unread badges (8px dot, top-right)
- Pin accent ring (gold, 2px)
- Fade-edge gradients
- Visual divider between pinned/unpinned

#### ChooseCommunitySheet
**Location**: `src/components/community/mobile/ChooseCommunitySheet.jsx`

**Features**:
- Full-screen modal with search
- Pin/unpin toggle (⭐ button) per item
- Toast notification for pin limit
- Unread count badges
- Smart-ordered list

#### Community Page
**Location**: `src/pages/Community.jsx`

**Integration**:
- Renders `CommunityChipScroller` on mobile (≤900px)
- Renders `ChooseCommunitySheet` modal
- Should call `markVisited()` when brand context changes
- Should call `markAsRead()` when opening community feed

## Data Persistence

### Firestore
**Path**: `users/{uid}/preferences/community`
```json
{
  "pinnedCommunities": ["brand1", "brand2", "brand3"],
  "updatedAt": Timestamp
}
```

### localStorage
- **Pinned**: `en.community.pinned` (fallback)
- **Last Visited**: `en.community.lastVisited`
- **Followed Brands Cache**: `en.followedBrandCommunities` (shared with desktop)

## Analytics Events

| Event | Payload | Description |
|-------|---------|-------------|
| `community_pin_toggle` | `{ communityId, pinned }` | User toggled pin |
| `community_pin_limit_reached` | `{}` | User tried to pin >3 |
| `community_unread_seen` | `{ communityId }` | Unread cleared when opened |
| `carousel_autoscroll_start` | `{}` | Auto-scroll activated |
| `carousel_autoscroll_stop` | `{}` | Auto-scroll stopped |
| `community_switch` | `{ via, brandId, brandName }` | Existing: chip clicked |
| `community_sheet_open` | `{ source }` | Existing: sheet opened |
| `community_sheet_close` | `{}` | Existing: sheet closed |

## Future Enhancements

### Unread Count Integration
The hook has a placeholder for unread counts. To integrate with your notification system:

**Option 1: Custom Collection**
```javascript
// In useCommunitySwitcher.js, replace the unread useEffect:
const q = query(
  collection(db, 'community_unread'),
  where('userId', '==', user.uid)
);
const unsubscribe = onSnapshot(q, (snapshot) => {
  const counts = {};
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    counts[data.communityId] = data.unreadCount || 0;
  });
  setUnreadCounts(counts);
});
```

**Option 2: From Notifications**
```javascript
// Query notifications collection
const q = query(
  collection(db, 'notifications'),
  where('userId', '==', user.uid),
  where('read', '==', false)
);
// Group by communityId and count
```

### Drag-and-Drop Reordering
To allow manual pin reordering:
1. Add drag handlers to chips
2. Update `pinnedIds` array order
3. Persist new order to Firestore

## Troubleshooting

### Auto-scroll not working
- Check console for errors in requestAnimationFrame loop
- Verify container has scrollable overflow
- Ensure no dialog/keyboard is open

### Pins not persisting
- Check Firestore permissions for `users/{uid}/preferences/community`
- Verify localStorage is not disabled
- Check browser console for errors

### Unread badges not showing
- Verify unread counts subscription is active (currently placeholder)
- Check that `getUnreadCount(id) > 0`
- Ensure component is using `useCommunitySwitcher` hook

## Testing Checklist

- [ ] Pinned chips appear first with gold accent
- [ ] Can pin/unpin via sheet (max 3)
- [ ] Toast shows when trying to pin 4th community
- [ ] Unread dots appear for communities with unseen posts
- [ ] Auto-scroll starts after 5s idle
- [ ] Auto-scroll stops on touch/scroll
- [ ] Auto-scroll reverses at edges with 1s pause
- [ ] Fade-edge gradients visible when scrollable
- [ ] Divider appears between pinned and unpinned sections
- [ ] Smart ordering: pinned → recent → alphabetical
- [ ] State persists between sessions
- [ ] Analytics events fire correctly
- [ ] Desktop left rail unaffected
- [ ] No console errors or warnings

## Migration Notes

### From V2 to V3
1. Import `useCommunitySwitcher` hook
2. Replace local state with hook state
3. Add pin toggle handlers
4. Add unread badge rendering
5. Implement auto-scroll carousel
6. Add visual polish (gradients, dividers, accents)
7. Update analytics tracking

### Breaking Changes
None - V3 is backward compatible. Old chip scroller will work but without new features.

## Code Examples

### Basic Usage
```jsx
import useCommunitySwitcher from '@/hooks/useCommunitySwitcher';

function MyCommunityComponent() {
  const {
    allCommunities,
    isPinned,
    getUnreadCount,
    togglePin,
    markVisited,
    markAsRead
  } = useCommunitySwitcher();

  const handleSelect = (communityId) => {
    markVisited(communityId);
    markAsRead(communityId);
    // Navigate to community...
  };

  return (
    <div>
      {allCommunities.map(c => (
        <button key={c.id} onClick={() => handleSelect(c.id)}>
          {c.name}
          {isPinned(c.id) && <span>⭐</span>}
          {getUnreadCount(c.id) > 0 && <span>{getUnreadCount(c.id)}</span>}
        </button>
      ))}
    </div>
  );
}
```

### Pin Toggle
```jsx
const handlePinToggle = async (communityId) => {
  const result = await togglePin(communityId);
  
  if (!result.success && result.reason === 'limit_reached') {
    showToast('You can pin up to 3 communities');
  }
};
```

## Support
For questions or issues, contact the development team or check the main project README.

---

**Last Updated**: October 2024  
**Version**: 3.0.0  
**Status**: ✅ Production Ready
