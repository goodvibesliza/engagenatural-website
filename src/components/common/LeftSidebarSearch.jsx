import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { track } from '@/lib/analytics';

// Shared left-rail search input with per-page persistence and events
export default function LeftSidebarSearch({
  label = 'Search',
  placeholder = 'Search…',
}) {
  const location = useLocation();
  const path = location?.pathname || '';
  const page = useMemo(() => {
    if (path.includes('/staff/my-brands')) return 'my_brands';
    if (path.includes('/staff/learning')) return 'learning';
    if (path.includes('/community')) return 'community';
    return 'unknown';
  }, [path]);
  const storageKey = useMemo(() => {
    if (page === 'my_brands') return 'en.search.myBrands';
    if (page === 'learning') return 'en.search.learning';
    return 'en.search.generic';
  }, [page]);

  const [value, setValue] = useState('');
  const timeoutRef = useRef(null);

  // Hydrate from storage on mount and when page changes
  useEffect(() => {
    try {
      const stored = (localStorage.getItem(storageKey) || '').trim();
      setValue(stored);
      // Fire an initial change for pages to hydrate their filtered view
      window.dispatchEvent(new CustomEvent('en:leftsearch', { detail: { page, q: stored } }));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Debounced broadcast + analytics
  const debounced = useRef((qRaw) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      try {
        window.dispatchEvent(new CustomEvent('en:leftsearch', { detail: { page, q: qRaw } }));
        track('search_change', { page, q: qRaw });
      } catch (err) { void err; }
    }, 300);
  });

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const onSubmit = (e) => { e.preventDefault(); };

  return (
    <form onSubmit={onSubmit} className="mb-3" role="search" aria-label="Left sidebar search">
      <label htmlFor="left-rail-search" className="block text-xs uppercase text-gray-500">
        {page === 'my_brands' ? 'Search brands' : page === 'learning' ? 'Search learning modules' : label}
      </label>
      <div className="relative mt-1">
        <input
          id="left-rail-search"
          name="left_rail_search"
          type="search"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            setValue(v);
            try { localStorage.setItem(storageKey, v); } catch {}
            debounced.current?.(v);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              setValue('');
              try { localStorage.setItem(storageKey, ''); } catch {}
              try { window.dispatchEvent(new CustomEvent('en:leftsearch', { detail: { page, q: '' } })); track('search_clear', { page }); } catch {}
            }
            if (e.key === 'Enter') e.preventDefault();
          }}
          placeholder={page === 'my_brands' ? 'Search Available Brands' : page === 'learning' ? 'Search trainings...' : placeholder}
          className="w-full h-11 min-h-[44px] pl-8 pr-8 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-deep-moss"
          data-testid="leftsearch-input"
          aria-label={page === 'my_brands' ? 'Search brands' : page === 'learning' ? 'Search learning modules' : label}
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
          <span role="img" aria-label="search" className="text-gray-400">🔍</span>
        </div>
        {value && (
          <button
            type="button"
            onClick={() => {
              setValue('');
              try { localStorage.setItem(storageKey, ''); } catch {}
              try { window.dispatchEvent(new CustomEvent('en:leftsearch', { detail: { page, q: '' } })); track('search_clear', { page }); } catch {}
            }}
            className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
      {/* Loading helper handled by pages; show generic helper when unknown */}
    </form>
  );
}
