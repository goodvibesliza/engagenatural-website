// src/components/community/mobile/ChooseCommunitySheet.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import useCommunitySwitcher from '@/hooks/useCommunitySwitcher';
import { track } from '@/lib/analytics';

/**
 * V3: Full-screen modal sheet for choosing a community
 * Features: search, pin toggles, unread badges, smart ordering
 */
export default function ChooseCommunitySheet({ 
  isOpen, 
  onClose, 
  onSelect,
  currentBrandId = null 
}) {
  const {
    allCommunities,
    isPinned,
    getUnreadCount,
    togglePin,
    maxPinned,
    loading
  } = useCommunitySwitcher();

  const [searchQuery, setSearchQuery] = useState('');
  const [animateIn, setAnimateIn] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const sheetRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filter communities by search query
  const filteredCommunities = allCommunities.filter(community => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return community.name.toLowerCase().includes(query);
  });

  // Define handleClose first so it can be used in useEffect dependency
  const handleClose = useCallback(() => {
    setAnimateIn(false);
    setTimeout(() => {
      onClose?.();
      setSearchQuery('');
    }, 200);

    try {
      track('community_sheet_close', {});
    } catch (err) {
      console.debug('ChooseCommunitySheet: track failed', err);
    }
  }, [onClose]);

  // Handle open/close animations and body scroll lock
  useEffect(() => {
    if (!isOpen) {
      setAnimateIn(false);
      return;
    }

    // Lock body scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    // Animate in
    requestAnimationFrame(() => setAnimateIn(true));
    
    // Focus search input
    setTimeout(() => searchInputRef.current?.focus(), 100);

    // Handle back button
    const onPop = () => {
      handleClose();
    };
    const state = { enChooseCommunitySheet: true };
    try {
      history.pushState(state, '');
      window.addEventListener('popstate', onPop, { once: true });
    } catch (err) {
      console.debug('ChooseCommunitySheet: history push failed', err);
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      setAnimateIn(false);
    };
  }, [isOpen, handleClose]);

  const handleSelect = useCallback((community) => {
    onSelect?.(community.id, community.name, community.communityId);
    handleClose();
  }, [onSelect, handleClose]);

  const handlePinToggle = useCallback(async (e, communityId) => {
    e.stopPropagation();
    
    const result = await togglePin(communityId);
    
    if (!result.success && result.reason === 'limit_reached') {
      setToastMessage(`You can pin up to ${maxPinned} communities`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  }, [togglePin, maxPinned]);

  // Focus trap
  const onKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      handleClose();
      return;
    }

    // Simple focus trap
    if (e.key === 'Tab') {
      const root = sheetRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
      const items = Array.from(focusables).filter(el => !el.hasAttribute('disabled'));
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [handleClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-200 ${animateIn ? 'opacity-40' : 'opacity-0'}`}
        style={{ zIndex: 9998 }}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-label="Choose community"
        aria-modal="true"
        onKeyDown={onKeyDown}
        className={`fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-xl transition-transform duration-300 ease-out ${
          animateIn ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          zIndex: 9999,
          maxHeight: '90vh',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Select Community</h2>
            <button
              onClick={handleClose}
              className="p-2 -mr-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search communities..."
              className="w-full h-11 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              aria-label="Search communities"
            />
            <svg 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto px-4 py-2" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredCommunities.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchQuery ? 'No communities found' : 'No communities yet'}
            </div>
          ) : (
            <ul className="space-y-1" role="list">
              {filteredCommunities.map(community => {
                const isActive = currentBrandId === community.id;
                const pinned = isPinned(community.id);
                const unreadCount = getUnreadCount(community.id);
                const hasUnread = unreadCount > 0;

                return (
                  <li key={community.id}>
                    <button
                      onClick={() => handleSelect(community)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                        isActive 
                          ? 'bg-brand-primary/10 border border-brand-primary' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Avatar placeholder */}
                      <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-deep-moss flex items-center justify-center text-white font-semibold">
                        {community.name[0]?.toUpperCase() || '?'}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium truncate ${isActive ? 'text-brand-primary' : 'text-gray-900'}`}>
                            {community.name}
                          </span>
                          {pinned && (
                            <span className="text-amber-400" aria-label="pinned" title="Pinned">
                              ⭐
                            </span>
                          )}
                          {hasUnread && (
                            <span className="flex-shrink-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Last active: Recently
                        </div>
                      </div>

                      {/* Pin toggle */}
                      <button
                        onClick={(e) => handlePinToggle(e, community.id)}
                        className={`shrink-0 p-2 rounded-full transition-colors ${
                          pinned 
                            ? 'text-amber-400 hover:bg-amber-50' 
                            : 'text-gray-400 hover:bg-gray-100 hover:text-amber-400'
                        }`}
                        aria-label={pinned ? 'Unpin community' : 'Pin community'}
                        title={pinned ? 'Unpin' : 'Pin'}
                      >
                        <svg className="w-5 h-5" fill={pinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Toast notification */}
      {showToast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg animate-fade-in"
          style={{ zIndex: 10000 }}
          role="alert"
        >
          {toastMessage}
        </div>
      )}
    </>
  );
}
