import React, { useState } from 'react';

export default function LeftSidebarSearch() {
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
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search…"
        className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-deep-moss"
        data-testid="leftsearch-input"
      />
    </form>
  );
}
