// src/components/community/mobile/CommunityChipScroller.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { track } from '@/lib/analytics';

/**
 * Horizontal chip scroller for mobile community switching
 * Shows "All" + followed brand communities + optional "More" chip
 */
export default function CommunityChipScroller({
  selectedBrandId = null,
  onBrandSelect,
  onMoreClick,
  className = ''
}) {
  const { user, isVerified } = useAuth();
  const [followedBrands, setFollowedBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch followed brands in real-time
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
        }));
        setFollowedBrands(brands);
        setLoading(false);
      },
      (error) => {
        console.error('CommunityChipScroller: fetch failed', error);
        setFollowedBrands([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

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

  return (
    <div 
      role="tablist" 
      aria-label="Community switcher"
      className={`flex gap-3 overflow-x-auto py-3 px-4 ${className}`}
      style={{ 
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch'
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
          transition-colors whitespace-nowrap
          ${!selectedBrandId 
            ? 'bg-brand-primary text-white' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }
        `}
      >
        All
      </button>

      {/* Followed brand chips */}
      {followedBrands.map(brand => {
        const isSelected = selectedBrandId === brand.id;
        const truncated = brand.name.length > 20 
          ? `${brand.name.slice(0, 19)}…` 
          : brand.name;
        
        return (
          <button
            key={brand.id}
            role="tab"
            aria-pressed={isSelected}
            aria-label={`View ${brand.name} community`}
            title={brand.name}
            onClick={() => handleChipClick(brand.id, brand.name, brand.communityId)}
            className={`
              shrink-0 px-4 h-11 min-h-[44px] rounded-full text-sm font-medium
              transition-colors whitespace-nowrap
              ${isSelected
                ? 'bg-brand-primary text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {truncated}
          </button>
        );
      })}

      {/* More chip - optional, shows if there are followed brands */}
      {followedBrands.length > 0 && (
        <button
          onClick={handleMoreClick}
          aria-label="View all communities"
          className="shrink-0 px-4 h-11 min-h-[44px] rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 whitespace-nowrap"
        >
          More
        </button>
      )}
    </div>
  );
}
