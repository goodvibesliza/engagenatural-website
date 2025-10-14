import React, { useState } from 'react';
import { track } from '@/lib/analytics';

export default function LeftSidebarSearch({ eventContext }) {
  const [value, setValue] = useState('');
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
          try {
            // Generic input interaction for existing dashboards
            track('leftsearch_input', {
              surface: 'community_desktop',
              context: eventContext || 'unknown',
              page: eventContext || undefined,
              length: v.length,
            });
            // Explicit left rail search analytics for desktop shell pages
            track('left_rail_search', {
              page: eventContext || 'unknown',
              action: 'left_rail_search',
              surface: 'community_desktop',
              length: v.length,
            });
          } catch {}
        }}
        placeholder="Search…"
        className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-deep-moss"
        data-testid="leftsearch-input"
      />
    </form>
  );
}
