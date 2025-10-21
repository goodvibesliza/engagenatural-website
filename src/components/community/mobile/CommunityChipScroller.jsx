// src/components/community/mobile/CommunityChipScroller.jsx
import React, { useEffect, useRef, useCallback, useState } from 'react';
import useCommunitySwitcher from '@/hooks/useCommunitySwitcher';
import { track } from '@/lib/analytics';

/**
 * V3: Enhanced horizontal chip scroller for mobile community switching
 * Features: smart ordering, unread badges, pinned indicators, auto-scroll carousel
 */
export default function CommunityChipScroller({
  selectedBrandId = null,
  onBrandSelect,
  onMoreClick,
  className = ''
}) {
  const {
    allCommunities,
    isPinned,
    getUnreadCount,
    hasAnyUnread,
    loading
  } = useCommunitySwitcher();

  const scrollRef = useRef(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const autoScrollTimer = useRef(null);
  const autoScrollFrame = useRef(null);
  const lastUserInteraction = useRef(Date.now());

  // Auto-scroll carousel logic
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || loading || allCommunities.length === 0) return;

    let scrollDirection = 1; // 1 = right, -1 = left
    let isPaused = false;

    const startAutoScroll = () => {
      if (isPaused) return;

      const scroll = () => {
        if (isPaused || !container) return;

        const maxScroll = container.scrollWidth - container.clientWidth;
        const currentScroll = container.scrollLeft;

        // Check if we've reached the end or beginning
        if (scrollDirection === 1 && currentScroll >= maxScroll) {
          // Reached right edge - pause then reverse
          isPaused = true;
          setTimeout(() => {
            scrollDirection = -1;
            isPaused = false;
            autoScrollFrame.current = requestAnimationFrame(scroll);
          }, 1000);
          return;
        } else if (scrollDirection === -1 && currentScroll <= 0) {
          // Reached left edge - pause then reverse
          isPaused = true;
          setTimeout(() => {
            scrollDirection = 1;
            isPaused = false;
            autoScrollFrame.current = requestAnimationFrame(scroll);
          }, 1000);
          return;
        }

        // Scroll at 25px/sec (~0.42px per frame at 60fps)
        container.scrollLeft += scrollDirection * 0.42;
        autoScrollFrame.current = requestAnimationFrame(scroll);
      };

      setIsAutoScrolling(true);
      try {
        track('carousel_autoscroll_start', {});
      } catch (err) {
        console.debug('CommunityChipScroller: track failed', err);
      }
      autoScrollFrame.current = requestAnimationFrame(scroll);
    };

    const stopAutoScroll = () => {
      if (autoScrollFrame.current) {
        cancelAnimationFrame(autoScrollFrame.current);
        autoScrollFrame.current = null;
      }
      if (isAutoScrolling) {
        setIsAutoScrolling(false);
        try {
          track('carousel_autoscroll_stop', {});
        } catch (err) {
          console.debug('CommunityChipScroller: track failed', err);
        }
      }
      isPaused = false;
    };

    const resetIdleTimer = () => {
      lastUserInteraction.current = Date.now();
      stopAutoScroll();

      // Clear existing timer
      if (autoScrollTimer.current) {
        clearTimeout(autoScrollTimer.current);
      }

      // Start new 5s timer
      autoScrollTimer.current = setTimeout(() => {
        // Check if keyboard is open or overlay active
        const keyboardOpen = window.visualViewport && window.visualViewport.height < window.innerHeight * 0.75;
        const hasOverlay = document.querySelector('[role="dialog"]');
        
        if (!keyboardOpen && !hasOverlay) {
          startAutoScroll();
        }
      }, 5000);
    };

    // Event listeners for user interaction
    const onUserInteraction = () => resetIdleTimer();

    container.addEventListener('touchstart', onUserInteraction, { passive: true });
    container.addEventListener('scroll', onUserInteraction, { passive: true });
    container.addEventListener('mousedown', onUserInteraction);

    // Start initial timer
    resetIdleTimer();

    return () => {
      stopAutoScroll();
      if (autoScrollTimer.current) {
        clearTimeout(autoScrollTimer.current);
      }
      container.removeEventListener('touchstart', onUserInteraction);
      container.removeEventListener('scroll', onUserInteraction);
      container.removeEventListener('mousedown', onUserInteraction);
    };
  }, [allCommunities.length, loading, isAutoScrolling]);

  const handleChipClick = useCallback((brandId, brandName, communityId) => {
    try {
      track('community_switch', { 
        via: 'chip', 
        brandId: brandId || 'all',
        brandName: brandName || 'All'
      });
    } catch (err) {
      console.debug('CommunityChipScroller: track failed', err);
    }
    onBrandSelect?.(brandId, brandName, communityId);
  }, [onBrandSelect]);

  const handleMoreClick = useCallback(() => {
    try {
      track('community_sheet_open', { source: 'chip_scroller' });
    } catch (err) {
      console.debug('CommunityChipScroller: track failed', err);
    }
    onMoreClick?.();
  }, [onMoreClick]);

  if (loading) {
    return (
      <div className={`flex gap-2 overflow-x-auto py-3 px-4 ${className}`} style={{ scrollbarWidth: 'none' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-11 w-24 bg-gray-200 animate-pulse rounded-full shrink-0" />
        ))}
      </div>
    );
  }

  // Separate pinned and unpinned for visual grouping
  const pinnedCommunities = allCommunities.filter(c => isPinned(c.id));
  const unpinnedCommunities = allCommunities.filter(c => !isPinned(c.id));

  return (
    <div className="relative">
      {/* Fade edge gradients */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
      
      <div 
        ref={scrollRef}
        role="tablist" 
        aria-label="Community switcher"
        className={`flex gap-3 overflow-x-auto py-3 px-4 ${className}`}
        style={{ 
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
          height: '68px' // Fixed height: 44px chip + 12px padding top + 12px padding bottom
        }}
      >
        {/* All chip */}
        <button
          role="tab"
          aria-pressed={!selectedBrandId}
          aria-label="View all communities"
          onClick={() => handleChipClick(null, 'All', '')}
          className={`
            shrink-0 px-4 h-11 min-h-[44px] rounded-full text-sm font-medium
            transition-all whitespace-nowrap relative
            ${!selectedBrandId 
              ? 'bg-brand-primary text-white font-bold' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          All
          {/* Unread dot on "All" if any community has unread */}
          {hasAnyUnread && !selectedBrandId && (
            <span 
              className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
              aria-label="unread"
            />
          )}
        </button>

        {/* Pinned communities */}
        {pinnedCommunities.map(community => {
          const isSelected = selectedBrandId === community.id;
          const truncated = community.name.length > 20 
            ? `${community.name.slice(0, 19)}…` 
            : community.name;
          const unreadCount = getUnreadCount(community.id);
          const hasUnread = unreadCount > 0;
          
          return (
            <button
              key={community.id}
              role="tab"
              aria-pressed={isSelected}
              aria-label={`View ${community.name} community${hasUnread ? ', unread' : ''}`}
              title={community.name}
              onClick={() => handleChipClick(community.id, community.name, community.communityId)}
              className={`
                shrink-0 px-4 h-11 min-h-[44px] rounded-full text-sm font-medium
                transition-all whitespace-nowrap relative
                ${isSelected
                  ? 'bg-brand-primary text-white font-bold' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
                ring-2 ring-amber-400 ring-offset-1
              `}
              style={{
                boxShadow: '0 0 0 2px rgba(251, 191, 36, 0.3)'
              }}
            >
              {truncated}
              {/* Unread badge dot */}
              {hasUnread && (
                <span 
                  className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}

        {/* Divider between pinned and unpinned */}
        {pinnedCommunities.length > 0 && unpinnedCommunities.length > 0 && (
          <div className="shrink-0 w-px h-11 bg-gray-300 self-center" aria-hidden="true" />
        )}

        {/* Unpinned communities */}
        {unpinnedCommunities.map(community => {
          const isSelected = selectedBrandId === community.id;
          const truncated = community.name.length > 20 
            ? `${community.name.slice(0, 19)}…` 
            : community.name;
          const unreadCount = getUnreadCount(community.id);
          const hasUnread = unreadCount > 0;
          
          return (
            <button
              key={community.id}
              role="tab"
              aria-pressed={isSelected}
              aria-label={`View ${community.name} community${hasUnread ? ', unread' : ''}`}
              title={community.name}
              onClick={() => handleChipClick(community.id, community.name, community.communityId)}
              className={`
                shrink-0 px-4 h-11 min-h-[44px] rounded-full text-sm font-medium
                transition-all whitespace-nowrap relative
                ${isSelected
                  ? 'bg-brand-primary text-white font-bold' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {truncated}
              {/* Unread badge dot */}
              {hasUnread && (
                <span 
                  className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}

        {/* More chip */}
        {allCommunities.length > 0 && (
          <button
            onClick={handleMoreClick}
            aria-label="View all communities"
            className="shrink-0 px-4 h-11 min-h-[44px] rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 whitespace-nowrap relative"
          >
            More
            {/* Unread dot on More if any community has unread */}
            {hasAnyUnread && (
              <span 
                className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
                aria-label="unread"
              />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
