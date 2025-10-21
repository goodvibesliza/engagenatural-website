import React from 'react';
import { track } from '@/lib/analytics';

export default function BrandTile({
  brand,
  isFollowing,
  onToggleFollow,
  onOpen,
  lastUpdateLabel,
}) {
  if (!brand) return null;
  const name = brand.name || brand.displayName || 'Brand';
  const handleOpen = () => {
    try { track('brand_tile_click', { brandId: brand.id }); } catch (err) { void err; }
    onOpen?.(brand);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpen(); } }}
      className="border rounded-lg p-4 flex flex-col justify-between min-h-[140px] min-[900px]:min-h-[160px] bg-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
      title={name}
      data-testid={`brand-tile-${brand.id}`}
    >
      {/* Top row: avatar left, button right */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {brand.logo ? (
            <img
              src={brand.logo}
              alt={`${name} logo`}
              className="w-12 h-12 object-contain rounded"
              onError={(e) => { e.currentTarget.src = 'https://placehold.co/48x48/e5e5e5/666666?text=Logo'; }}
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
              <span className="text-gray-500 text-xs">{name.substring(0,2).toUpperCase()}</span>
            </div>
          )}
        </div>
        <button
          type="button"
          aria-label={`${isFollowing ? 'Unfollow' : 'Follow'} ${name}`}
          onClick={(e) => {
            e.stopPropagation();
            try { track('brand_follow_toggle', { brandId: brand.id, action: isFollowing ? 'unfollow' : 'follow', via: 'brand_tile' }); } catch (err) { console.error('brand_follow_toggle tracking failed', err); }
            onToggleFollow?.(brand);
          }}
          className={`text-sm px-3 py-1.5 min-w-[96px] rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary focus-visible:outline-offset-2 ${
            isFollowing ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-brand-primary hover:bg-brand-primary/90 text-white'
          }`}
        >
          {isFollowing ? 'Unfollow' : 'Follow'}
        </button>
      </div>

      {/* Text block: name then updated line */}
      <div className="mt-2">
        <div className="font-semibold text-base text-gray-900 truncate" title={name}>{name}</div>
        <div className="text-sm text-gray-500 mt-1 whitespace-nowrap truncate">{lastUpdateLabel}</div>
      </div>
    </div>
  );
}
