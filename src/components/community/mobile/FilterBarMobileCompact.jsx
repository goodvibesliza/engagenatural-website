import React from 'react'

export default function FilterBarMobileCompact({
  query = '',
  availableBrands = [],
  selectedBrands = [],
  onChange = () => {},
}) {
  const toggleBrand = (brand) => {
    const exists = selectedBrands.includes(brand)
    const next = exists ? selectedBrands.filter((b) => b !== brand) : [...selectedBrands, brand]
    onChange({ query, selectedBrands: next })
  }

  return (
    <div className="li-sticky md:hidden border-b border-gray-200 bg-white">
      <div className="px-4 py-2">
        <label htmlFor="community-mobile-search" className="visually-hidden">Search posts</label>
        <input
          id="community-mobile-search"
          type="search"
          value={query}
          onChange={(e) => onChange({ query: e.target.value, selectedBrands })}
          placeholder="Search"
          className="w-full h-11 min-h-[44px] px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          aria-label="Search posts"
        />
      </div>
      {availableBrands?.length > 0 && (
        <div className="px-4 pb-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            {availableBrands.map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => toggleBrand(brand)}
                aria-pressed={selectedBrands.includes(brand)}
                aria-label={`Filter by ${brand}`}
                className={`h-9 min-h-[36px] px-3 rounded-full border text-xs whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary ${
                  selectedBrands.includes(brand)
                    ? 'bg-brand-primary text-white border-brand-primary'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
