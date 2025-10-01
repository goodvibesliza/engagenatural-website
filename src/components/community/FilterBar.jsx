// src/components/community/FilterBar.jsx
import { useEffect, useMemo, useRef } from 'react';
import COPY from '../../i18n/community.copy';

/**
 * Render a sticky filter bar with a search input, selectable brand chips, and selectable tag chips.
 *
 * Renders a search input (value controlled by `query`) and chip lists for `availableBrands` and `availableTags` (deduplicated and filtered). User input and chip toggles invoke `onChange` with the updated `{ query, selectedBrands, selectedTags }` state.
 *
 * @param {Object} props - Component props.
 * @param {string} props.query - Current search string shown in the input.
 * @param {string[]} [props.selectedBrands=[]] - Currently selected brand values.
 * @param {string[]} [props.selectedTags=[]] - Currently selected tag values.
 * @param {string[]} [props.availableBrands=[]] - List of available brands to display as chips (falsy values removed, duplicates deduplicated).
 * @param {string[]} [props.availableTags=[]] - List of available tags to display as chips (falsy values removed, duplicates deduplicated).
 * @param {(state: {query: string, selectedBrands: string[], selectedTags: string[]}) => void} props.onChange - Callback invoked when the query or selection changes.
 * @returns {JSX.Element} The FilterBar element.
 */
export default function FilterBar({
  query,
  selectedBrands = [],
  selectedTags = [],
  availableBrands = [],
  availableTags = [],
  onChange,
}) {
  const inputRef = useRef(null);
  const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');

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
            placeholder={COPY.searchPlaceholder}
            aria-label={COPY.searchPlaceholder}
            data-testid="filter-search"
            className="flex-1 px-3 py-3 h-11 min-h-[44px] border border-gray-300 rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          />
        </div>

        {brands.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <div className="w-full text-xs font-medium text-gray-700 mb-1">{COPY.brandsLabel}</div>
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
                  data-testid={`brand-chip-${slug(b)}`}
                  className={`px-3 h-11 min-h-[44px] rounded-full text-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
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
            <div className="w-full text-xs font-medium text-gray-700 mb-1">Trending</div>
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
                  data-testid={`tag-chip-${slug(t)}`}
                  className={`px-3 h-11 min-h-[44px] rounded-full text-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
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
