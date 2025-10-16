import React, { useEffect, useRef, useState } from 'react';
import { track } from '@/lib/analytics';

export default function LeftSidebarSearch({ eventContext }) {
  const [value, setValue] = useState('');
  const timeoutRef = useRef(null);

  // Debounced tracker to reduce event volume
  const debouncedTrack = useRef((payload) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      try {
        track('leftsearch_input', {
          ...payload,
          page: eventContext || undefined,
        });
        track('left_rail_search', {
          ...payload,
          page: eventContext || 'unknown',
          action: 'left_rail_search',
        });
      } catch (err) {
        // minimal, non-intrusive handling for dev visibility
        void err;
      }
    }, 300);
  });

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);
  const onSubmit = (e) => {
    e.preventDefault();
    // no-op for now
  };
  return (
    <form onSubmit={onSubmit} className="mb-3" role="search" aria-label="Left sidebar search">
      <input
        type="search"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          setValue(v);
          // Debounced analytics to limit volume
          debouncedTrack.current?.({
            surface: 'community_desktop',
            context: eventContext || 'unknown',
            length: v.length,
          });
        }}
        placeholder="Search…"
        className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-deep-moss"
        data-testid="leftsearch-input"
      />
    </form>
  );
}
