# Brand Image Upload Fix - PR Notes

## Summary
Fixed brand image upload issues with resumable uploads, validation, and security improvements.

## Problem Statement
- **Symptom**: Image preview appears, then post never populates with "Please wait for all images to finish uploading" message stuck
- **Root Cause**: Preview rendered before `getDownloadURL()` resolved, and posts saved without finalized URLs or stuck in uploading state

## Solution

### 1. MediaUploader Component (`src/pages/brand/components/MediaUploader.jsx`)
**New Component** with comprehensive image upload handling:

- ✅ **Resumable uploads** using Firebase Storage `uploadBytesResumable`
- ✅ **Progress tracking**: Real-time 0-100% progress for each image
- ✅ **File validation**:
  - Images only (checks `image/*` MIME type)
  - Max size validation (default 5MB, configurable via `VITE_MAX_IMAGE_MB`)
  - Clear inline error messages
- ✅ **Upload state management**:
  - Tracks `uploadingCount` to disable Publish button
  - Visual progress bars and status indicators
  - Success/error states with auto-remove (5 seconds)
- ✅ **Download URLs**: Only stores finalized `downloadURL` after complete
- ✅ **Storage path**: `brands/{brandId}/community/{postId}/{timestamp}_{filename}`
- ✅ **Error handling**: Retry/remove options for failed uploads

### 2. Firebase Storage Rules (`storage.rules`)
Updated with brand-specific RBAC and validation:

- ✅ **Brand manager authentication**: Checks Firestore `/users/{uid}` for `role=="brand_manager"` and matching `brandId`
- ✅ **Image-only uploads**: Enforces `image/*` content type
- ✅ **5MB limit**: Server-side file size validation
- ✅ **No overwrites**: Prevents replacing existing files
- ✅ **Delete permissions**: Only same brand manager can delete

### 3. BrandPosting Component (`src/pages/brand/BrandPosting.jsx`)
Updated to integrate MediaUploader:

- ✅ **Integrated MediaUploader** with proper props
- ✅ **Disabled Publish button** while `uploadingCount > 0`
- ✅ **Validation**: Blocks submission if images still uploading
- ✅ **Upload status display**: Shows "Uploading X images..." in button
- ✅ **Stores finalized data**: Only downloadURLs saved to Firestore
- ✅ **Removed legacy popup**: No more stuck "waiting" state
- ✅ **Recent posts display**: Shows uploaded images in grid

### 4. PostList Security Hardening (`src/components/community/components/PostList.jsx`)
Addressed CodeRabbit security/UX concerns:

- ✅ **URL sanitization**: Only allow http/https protocols
- ✅ **Descriptive alt text**: Includes author and post context
- ✅ **Error handling**: Graceful fallback (hide broken images)
- ✅ **Lazy loading**: `loading="lazy"` attribute
- ✅ **Layout stability**: CSS aspect-ratio placeholder
- ✅ **Format support**: Handles both `post.images` and `post.imageUrls`
- ✅ **Object support**: Works with string URLs or objects with `downloadURL`

### 5. Environment Configuration (`.env.example`)
- ✅ Added `VITE_MAX_IMAGE_MB=5` with default fallback

## Testing Checklist

- [ ] Navigate to brand posting page
- [ ] Select multiple images (mix of under/over 5MB)
- [ ] Verify error shows for oversized images
- [ ] Verify progress bars appear during upload
- [ ] Verify Publish button disabled during upload
- [ ] Verify button text shows "Uploading X images..."
- [ ] Submit post after uploads complete
- [ ] Verify images appear in Firestore with `downloadURL`s
- [ ] Check images render in recent posts
- [ ] Test image error handling (invalid URL)
- [ ] Verify lazy loading behavior
- [ ] Check layout stability (no shift)

## Files Changed

### New Files
- `src/pages/brand/components/MediaUploader.jsx`

### Modified Files
- `src/pages/brand/BrandPosting.jsx`
- `src/components/community/components/PostList.jsx`
- `storage.rules`
- `.env.example`

## CodeRabbit Issues Addressed

### ✅ Fixed: PostList Image Rendering (Round 1, Issue #5)
**Commit**: `6f49a1ab`
- URL sanitization with protocol validation
- Descriptive alt text with context
- Error handling with graceful fallback
- Lazy loading and layout stability
- Support for multiple image formats

### ✅ Fixed: File Input Reset (Round 2, Issue #2)
**Commit**: `ccb34423`
- File input reset in `createPost` to allow re-selecting same file
- Clear `uploadProgress` on form reset
- File input already reset in `handleFileSelect` after processing

### ✅ Already Fixed: Blob URL Memory Leaks (Round 2, Issue #4)
**Status**: Already implemented in current code
- `revokePreviewUrls()` helper function centralizes cleanup
- URLs revoked in `removeAttachment()`
- URLs revoked on successful upload
- URLs revoked on upload failure
- URLs revoked in cleanup `useEffect` on unmount
- All removal points properly clean up blob URLs

### ℹ️ Not Found: Other Issues
The following issues mentioned by CodeRabbit were not found in files modified by this PR:

**Round 1**:
- Firestore batch processing (`postsReceivedRef`, `communityBatches`)
- `TrainingQuickPicker.jsx` useEffect dependencies
- `TrainingSelect.jsx` training preservation
- `TrainingSelect.jsx` race condition

**Round 2**:
- `TrainingSelectFixed.jsx` aria-describedby missing id
- `LiveAnnouncer.jsx` announcement type storage
- `communityMetrics.js` post.likes vs post.likeIds handling

These files either:
- Don't exist in the current branch
- Weren't modified by this PR
- May be in other branches or already resolved

## Breaking Changes
None - fully backward compatible.

## Security Improvements
1. Storage rules enforce brand manager RBAC
2. Server-side file size validation
3. Image-only content type enforcement
4. URL protocol sanitization in rendering
5. No overwrite protection

## Performance Improvements
1. Resumable uploads (can recover from network issues)
2. Lazy loading for images
3. Race condition prevention with request IDs (future enhancement)
4. Aspect-ratio placeholder prevents layout shift

## Next Steps
1. Deploy storage rules to Firebase
2. Set `VITE_MAX_IMAGE_MB` environment variable in production
3. Monitor upload success rates
4. Consider adding image compression/resizing before upload (future enhancement)
