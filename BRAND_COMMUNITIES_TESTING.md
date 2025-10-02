# Brand Communities Desktop UI Testing Guide

## Overview
Comprehensive testing guide for the brand communities desktop interface with training attachments and filtering capabilities.

## Setup Requirements
- User must have `brand_manager` role
- User must have associated `brandId` 
- Desktop viewport (≥1024px required)
- Brand must have published trainings for training selector tests

## Access Control Testing

### Brand Manager Access
1. **Navigate to Communities**: 
   - Login as `brand_manager` user
   - Access `/brands/communities` 
   - Verify `sidebar-communities` is clickable and highlighted
   - Should see Communities List table (`communities-table`)

2. **Non-Brand Access Control**:
   - Login as user without `brand_manager` role
   - Attempt to access `/brands/communities`
   - Should be redirected with access denied message

3. **Mobile Blocking**:
   - Resize browser to <1024px width
   - Should see `brand-desktop-only-banner` with "Desktop Required" message
   - Should block all brand management features

## Community List Page Testing

### Communities Table
- **Table Display**: Verify `communities-table` shows community data
- **Community Rows**: Each row has `community-row-{communityId}` test ID
- **Sort Functions**: Click column headers to sort by name, status, activity
- **Search**: Use search input to filter communities by name/description

### Community Actions
- **Create Community**: Click `community-create` button 
  - If no community exists: Opens editor for new community creation
  - If community exists: Opens existing community editor
- **Open Community**: Click dropdown `community-open-{communityId}` to open editor
- **View as Staff**: Click `view-as-staff-{communityId}` opens community in staff view (new tab)

## Community Editor Testing

### Core Editor Functions
1. **Title Input**: `editor-title-input`
   - Type post title, verify character limit and validation
   - Title is required for saving/publishing

2. **Body Input**: `editor-body-input`  
   - Rich text editing with toolbar functionality
   - Verify formatting buttons (bold, italic, lists)
   - Minimum height maintained for usability

3. **Tags Input**: `editor-tags-input`
   - Add tags with Enter key or plus button
   - Remove tags by clicking X on tag badges
   - Tag validation and duplicate prevention

### Editor Actions
- **Save Draft**: `editor-save-draft`
  - Saves post as draft status
  - Shows success toast notification
  - Updates post list immediately
  
- **Publish**: `editor-publish`
  - Publishes post (changes status to published) 
  - Makes post visible in staff feeds
  - Enables "Preview as Staff" button
  
- **Delete**: `editor-delete`
  - Shows accessible confirmation dialog with keyboard trap
  - Permanently removes post from community
  - Announces deletion via aria-live
  
- **Preview as Staff**: `editor-preview-as-staff`
  - Only available for published posts
  - Opens post in staff view (new tab) for verification

### Training Selector Testing

#### Training Attachment
1. **Training Search**: `training-select-input`
   - Focus input to open training dropdown
   - Type search query with 250ms debounce
   - Results filter by title and description

2. **Training Selection**: `training-select-option-{trainingId}`
   - Click training option to attach
   - Shows selected training card with title/status/date
   - Enables "View Training" and "Clear" buttons

3. **Training Actions**:
   - **View Training**: `training-select-view` opens `/staff/trainings/{trainingId}` in new tab
   - **Clear Training**: `training-select-clear` removes attachment

#### Training Filter
1. **Filter Checkbox**: `training-filter-checkbox` 
   - Only appears when training is selected
   - Label: "Show posts linked to this training"
   - Checkbox is disabled when no training selected

2. **Filter Behavior**:
   - Enable filter → `post-list` shows only posts with matching `trainingId`
   - Empty state → `post-list-empty-training` with custom message
   - CTA button → `create-post-from-empty-training` opens editor with training prefilled
   - Disable filter → restores full post list with other active filters

3. **Filter Announcements**:
   - Enabling: "Filtered to posts linked to: {trainingTitle}. {N} results."
   - Disabling: "Training filter disabled - showing all posts"
   - Screen reader announces changes via aria-live="polite"

### Post List Testing

#### Post List Display
- **Post List Container**: `post-list` contains all post rows
- **Post Rows**: Each has `post-list-row-{postId}` test ID
- **Selection**: Click row highlights it and loads in right-pane editor
- **Status Indicators**: Published/draft badges visible
- **Metrics Display**: Shows likes, comments, training indicators

#### Inline Training Actions
1. **Link Training**: `post-row-link-{postId}`
   - Available on posts without attached training
   - Opens `TrainingQuickPicker` popover with search
   - Select training → optimistic update + success toast

2. **Unlink Training**: `post-row-unlink-{postId}`
   - Available on posts with attached training
   - Immediately removes training with confirmation toast
   - Updates post list and right-pane editor

3. **View Training**: `post-row-view-training-{postId}`
   - Available on posts with attached training
   - Opens training in new tab for verification

#### Quick Picker Testing
- **Search Input**: `quickpicker-input` with placeholder "Search trainings…"
- **Training Options**: `quickpicker-option-{trainingId}` with keyboard navigation
- **Keyboard Navigation**: ↑/↓ arrows, Enter to select, Esc to close
- **Click Outside**: Closes picker and returns focus
- **Error States**: Shows "No trainings found" with helpful message

#### Inline Link/Unlink Flow Testing
1. **Linking Training to Post Without Training**:
   - Click `post-row-link-{postId}` on a row without attached training
   - Quick picker opens with `quickpicker-input` focused
   - Select training via `quickpicker-option-{trainingId}`
   - Success message announced via aria-live
   - Row now shows `post-row-unlink-{postId}` and `post-row-view-training-{postId}` buttons

2. **Unlinking Training from Post With Training**:
   - Click `post-row-unlink-{postId}` on a row with attached training
   - Success message announced via aria-live
   - Training attachment cleared immediately
   - Row now shows only `post-row-link-{postId}` button

3. **Training Filter Integration**:
   - With `training-filter-checkbox` enabled (ON):
     - Linking training to post: row remains visible in filtered view
     - Unlinking training from post: row disappears from view, new count announced
   - With training filter disabled (OFF):
     - All posts remain visible regardless of link/unlink actions

## Accessibility Testing

### Keyboard Navigation
1. **Tab Order**: Navigate sidebar → list → editor with consistent focus indicators
2. **Training Combobox**: 
   - Follows WAI-ARIA combobox pattern
   - `role="combobox"` with `aria-expanded`, `aria-haspopup="listbox"`
   - Active option indicated with `aria-activedescendant`
3. **Focus Management**: 
   - Visible focus rings on all interactive elements
   - Focus traps in confirmation dialogs
   - Focus returns appropriately after modal closes

### Screen Reader Support
1. **Live Announcements**: 
   - Training filter changes announced via aria-live="polite"
   - Success/error states for training actions
   - Post deletion announces removed item and focus location
2. **Labels and Descriptions**:
   - All buttons have meaningful `aria-label` attributes  
   - Form inputs have associated labels
   - Complex UI explained with `aria-describedby`
3. **Table Semantics**: 
   - Communities table uses `scope="col"` headers
   - Proper table structure for screen readers

### Touch Targets
- All interactive elements meet 44px minimum size requirement
- Adequate spacing between clickable areas
- Large enough targets for inline training actions

## Reporting Panel Testing

### Date Range Controls  
- **7 Day Range**: `report-range-7` button toggles to 7-day metrics
- **30 Day Range**: `report-range-30` button toggles to 30-day metrics  
- Active range highlighted, metrics update accordingly

### Metrics Display
- **Training CTR Card**: `report-ctr-card` shows click-through rate
- **Derived Metrics**: All counts calculated from arrays, no stored counters
- **Sparklines**: Visual representation of daily post views
- **Bar Charts**: Weekly likes and comments engagement

### Analytics Verification
Verify these events fire in browser console (no external SDK required):

#### Navigation & Access
- `brand_communities_view()` - When communities list loads
- `brand_community_open({ communityId })` - When opening community editor

#### Post Management  
- `brand_post_create({ communityId, postId })` - When creating new post
- `brand_post_publish({ postId })` - When publishing post
- `brand_post_update({ postId })` - When updating existing post  
- `brand_post_delete({ postId })` - When deleting post

#### Training Actions
- `brand_post_attach_training({ postId, trainingId })` - When training attached in editor
- `brand_post_link_training({ postId, trainingId })` - When training linked via inline action
- `brand_post_unlink_training({ postId, trainingId })` - When training unlinked via inline action
- `brand_training_preview({ trainingId })` - When "View Training" clicked
- `brand_training_filter_toggle({ trainingId, enabled, postCount })` - When filter toggled

#### Reporting
- `brand_report_view({ range })` - When report date range changed

## Integration Testing

### Staff-Side Verification
After publishing posts with training attachments:

1. **Staff "My Brands" Page**:
   - Navigate to staff dashboard 
   - Find brand communities section
   - Verify community posts appear with training indicators
   - "View Training" button opens training detail page

2. **Post Detail View**:
   - Published posts should show training attachment
   - Training link works correctly from staff perspective
   - Metrics display properly for staff users

### Data Persistence
1. **Draft Autosave**: 
   - Editor autosaves every 10 seconds to localStorage
   - Page refresh offers to restore unsaved changes
   - Autosave cleared when post successfully saved

2. **Optimistic Updates**:
   - Training link/unlink updates immediately in UI
   - Reverts on API failure with error toast
   - Consistent state between post list and editor

## Error Handling

### Network Failures
- Training selector shows error banner for failed requests
- Dismissible error messages with retry options
- Graceful degradation when services unavailable

### Permission Errors
- Clear messaging for insufficient permissions
- Appropriate redirects for unauthorized access
- Brand-specific data isolation enforced

### Validation Errors  
- Required field validation (post title)
- Meaningful error messages for form validation
- Prevents submission of invalid data

## Performance Considerations

### Client-Side Filtering
- Training search debounced to 250ms
- Post filtering computed client-side for responsiveness
- Reasonable limits on data fetching (trainings capped at 100)

### Loading States
- Skeleton screens during data loading
- Progressive loading for large post lists
- Spinners for async operations (save, publish, delete)

This comprehensive test plan ensures all brand communities features work correctly across desktop browsers with proper accessibility, analytics tracking, and integration with existing staff workflows.