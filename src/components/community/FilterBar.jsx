// src/components/community/FilterBar.jsx
import { useEffect, useMemo, useRef } from 'react';

export default function FilterBar({
  query,
  selectedBrands = [],
  selectedTags = [],
  availableBrands = [],
  availableTags = [],
  onChange,
}) {
  const inputRef = useRef(null);

  const brands = useMemo(
    () => Array.from(new Set(availableBrands.filter(Boolean))),
    [availableBrands]
  );
  const tags = useMemo(
    () => Array.from(new Set(availableTags.filter(Boolean))),
    [availableTags]
  );

  const toggle = (list, value) => {
    const set = new Set(list);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    return Array.from(set);
  };

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => onChange?.({ query: e.target.value, selectedBrands, selectedTags })}
            placeholder="Search posts"
            aria-label="Search posts"
            className="flex-1 px-3 py-3 h-11 min-h-[44px] border border-gray-300 rounded-md text-sm"
          />
        </div>

        {brands.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {brands.map((b) => {
              const active = selectedBrands.includes(b);
              return (
                <button
                  key={b}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    onChange?.({ query, selectedBrands: toggle(selectedBrands, b), selectedTags })
                  }
                  className={`px-3 h-11 min-h-[44px] rounded-full text-sm border transition-colors ${
                    active ? 'bg-deep-moss text-white border-deep-moss' : 'bg-white text-deep-moss border-deep-moss/30 hover:border-deep-moss'
                  }`}
                >
                  {b}
                </button>
              );
            })}
          </div>
        )}

        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((t) => {
              const active = selectedTags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    onChange?.({ query, selectedBrands, selectedTags: toggle(selectedTags, t) })
                  }
                  className={`px-3 h-11 min-h-[44px] rounded-full text-sm border transition-colors ${
                    active ? 'bg-oat-beige text-deep-moss border-oat-beige' : 'bg-white text-deep-moss border-deep-moss/30 hover:border-deep-moss'
                  }`}
                >
                  #{t}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
