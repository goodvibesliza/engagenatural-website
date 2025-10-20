// src/components/community/mobile/ChooseCommunitySheet.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { track } from '@/lib/analytics';

/**
 * Full-screen modal sheet for choosing a community
 * Shows search + list of followed brand communities
 */
export default function ChooseCommunitySheet({ 
  isOpen, 
  onClose, 
  onSelect,
  currentBrandId = null 
}) {
  const { user } = useAuth();
  const [followedBrands, setFollowedBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [animateIn, setAnimateIn] = useState(false);
  const sheetRef = useRef(null);
  const searchInputRef = useRef(null);

  // Fetch followed brands
  useEffect(() => {
    if (!user?.uid || !db) {
      setFollowedBrands([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'brand_follows'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const brands = snapshot.docs.map(doc => ({
          id: doc.data().brandId,
          name: doc.data().brandName || 'Brand',
          communityId: doc.data().communityId || '',
          updatedAt: doc.data().updatedAt || doc.data().createdAt
        }));
        // Sort by most recently updated
        brands.sort((a, b) => {
          if (!a.updatedAt && !b.updatedAt) return 0;
          if (!a.updatedAt) return 1;
          if (!b.updatedAt) return -1;
          return b.updatedAt.toMillis() - a.updatedAt.toMillis();
        });
        setFollowedBrands(brands);
        setLoading(false);
      },
      (error) => {
        console.error('ChooseCommunitySheet: fetch failed', error);
        setFollowedBrands([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

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
      try {
        window.removeEventListener('popstate', onPop);
      } catch (err) {
        console.debug('ChooseCommunitySheet: cleanup failed', err);
      }
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    try {
      track('community_sheet_close');
    } catch (err) {
      console.debug('ChooseCommunitySheet: track failed', err);
    }
    setSearchQuery('');
    onClose?.();
  }, [onClose]);

  const handleSelect = useCallback((brandId, brandName, communityId) => {
    try {
      track('community_switch', { 
        via: 'sheet', 
        brandId: brandId || 'all',
        brandName: brandName || 'All'
      });
    } catch (err) {
      console.debug('ChooseCommunitySheet: track failed', err);
    }
    setSearchQuery('');
    onSelect?.(brandId, brandName, communityId);
    handleClose();
  }, [onSelect, handleClose]);

  // Focus trap
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      handleClose();
      return;
    }

    if (e.key !== 'Tab') return;
    
    const root = sheetRef.current;
    if (!root) return;

    const focusables = root.querySelectorAll(
      'button, input, textarea, select, a, [tabindex]:not([tabindex="-1"])'
    );
    const items = Array.from(focusables).filter(el => !el.hasAttribute('disabled'));
    if (items.length === 0) return;

    const first = items[0];
    const last = items[items.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [handleClose]);

  // Filter brands by search query
  const filteredBrands = searchQuery
    ? followedBrands.filter(brand => 
        brand.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : followedBrands;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/40"
      onClick={handleClose}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-label="Choose Community"
        aria-modal="true"
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        className={`
          fixed left-0 right-0 bottom-0 bg-white rounded-t-2xl shadow-lg
          transition-transform duration-300 ease-out
          ${animateIn ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{
          maxHeight: '80vh',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)'
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Choose Community</h2>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search field */}
          <div className="relative">
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search brands..."
              className="w-full h-11 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              aria-label="Search brands"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Community list */}
        <div className="overflow-y-auto px-4 py-2" style={{ maxHeight: 'calc(80vh - 140px)' }}>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchQuery ? 'No brands found' : 'You are not following any brands yet'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredBrands.map(brand => {
                const isSelected = currentBrandId === brand.id;
                return (
                  <button
                    key={brand.id}
                    onClick={() => handleSelect(brand.id, brand.name, brand.communityId)}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-lg
                      text-left transition-colors
                      ${isSelected 
                        ? 'bg-brand-primary/10 border-2 border-brand-primary' 
                        : 'hover:bg-gray-50 border-2 border-transparent'
                      }
                    `}
                  >
                    {/* Brand avatar placeholder */}
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold shrink-0
                      ${isSelected ? 'bg-brand-primary' : 'bg-gray-400'}
                    `}>
                      {brand.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Brand info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {brand.name}
                      </div>
                      {brand.updatedAt && (
                        <div className="text-xs text-gray-500">
                          Last active {getRelativeTime(brand.updatedAt)}
                        </div>
                      )}
                    </div>

                    {/* Selected indicator */}
                    {isSelected && (
                      <svg className="w-5 h-5 text-brand-primary shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper to format relative time
function getRelativeTime(timestamp) {
  if (!timestamp || !timestamp.toMillis) return '';
  const now = Date.now();
  const then = timestamp.toMillis();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}
