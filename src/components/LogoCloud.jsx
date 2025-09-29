import React from 'react'

// Type: LogoItem = { src: string; alt: string; href?: string }

const FALLBACK_LOGOS = [
  { src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="80" viewBox="0 0 160 80"><rect width="160" height="80" fill="%23efefef"/><rect x="8" y="20" width="144" height="40" rx="8" fill="%23d9d9d9"/></svg>', alt: 'Placeholder logo A' },
  { src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="80" viewBox="0 0 160 80"><rect width="160" height="80" fill="%23f3f3f3"/><rect x="20" y="18" width="120" height="44" rx="10" fill="%23dbdbdb"/></svg>', alt: 'Placeholder logo B' },
  { src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="80" viewBox="0 0 160 80"><rect width="160" height="80" fill="%23ededed"/><rect x="16" y="24" width="128" height="32" rx="6" fill="%23d6d6d6"/></svg>', alt: 'Placeholder logo C' },
  { src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="80" viewBox="0 0 160 80"><rect width="160" height="80" fill="%23f0f0f0"/><circle cx="80" cy="40" r="28" fill="%23dadada"/></svg>', alt: 'Placeholder logo D' },
  { src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="80" viewBox="0 0 160 80"><rect width="160" height="80" fill="%23f5f5f5"/><rect x="40" y="16" width="80" height="48" rx="8" fill="%23e0e0e0"/></svg>', alt: 'Placeholder logo E' },
  { src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="80" viewBox="0 0 160 80"><rect width="160" height="80" fill="%23f2f2f2"/><rect x="30" y="22" width="100" height="36" rx="6" fill="%23dbdbdb"/></svg>', alt: 'Placeholder logo F' },
]

function LogoImage({ item }) {
  const img = (
    <img
      src={item.src}
      alt={item.alt}
      loading="lazy"
      className="max-h-20 w-auto object-contain filter grayscale opacity-80 transition duration-200 motion-reduce:transition-none group-hover:grayscale-0 group-hover:opacity-100 group-focus-visible:grayscale-0 group-focus-visible:opacity-100"
    />
  )

  if (item.href) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener"
        className="group inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded"
      >
        {img}
      </a>
    )
  }

  return (
    <div className="group inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded">
      {img}
    </div>
  )
}

export default function LogoCloud({ logos }) {
  const hasProvided = Array.isArray(logos)
  const items = hasProvided && logos.length > 0 ? logos : FALLBACK_LOGOS

  // Loading/empty state when an empty array is provided explicitly
  const showSkeletons = hasProvided && logos.length === 0

  return (
    <section className="bg-[#f5f3f3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {showSkeletons ? (
          <div>
            {/* Mobile skeletons */}
            <div className="sm:hidden -mx-4 px-4">
              <div className="flex space-x-6 overflow-x-auto snap-x snap-mandatory">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="snap-start flex-shrink-0">
                    <div className="h-20 w-40 rounded-md bg-gray-200 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
            {/* Desktop skeletons */}
            <div className="hidden sm:grid grid-cols-5 gap-8 place-items-center">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-20 w-40 rounded-md bg-gray-200 animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <div>
            {/* Mobile: horizontal scroll with snap */}
            <div className="sm:hidden -mx-4 px-4">
              <div className="flex space-x-6 overflow-x-auto snap-x snap-mandatory">
                {items.map((item, idx) => (
                  <div key={idx} className="snap-start flex-shrink-0">
                    <LogoImage item={item} />
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop: 2 rows x 5 logos, auto-wrap grid */}
            <div className="hidden sm:grid grid-cols-5 gap-8 place-items-center">
              {items.slice(0, 10).map((item, idx) => (
                <LogoImage key={idx} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
