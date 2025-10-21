import React, { useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Store, BookOpen, Home, Search as SearchIcon } from 'lucide-react'

function Item({ to, icon, label, testId, isActive }) {
  const IconComp = icon
  return (
    <NavLink
      to={to}
      aria-current={isActive ? 'page' : undefined}
      className={
        'flex-1 flex flex-col items-center justify-center min-h-[60px] py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary'
      }
      data-testid={testId}
    >
      <IconComp
        size={24}
        aria-hidden
        className={isActive ? 'text-deep-moss' : 'text-warm-gray'}
      />
      <span className={`text-[11px] mt-0.5 ${isActive ? 'text-deep-moss' : 'text-warm-gray'}`}>{label}</span>
    </NavLink>
  )
}

export default function NavBarBottom() {
  const { pathname } = useLocation()

  const active = {
    brands: pathname.startsWith('/staff/my-brands'),
    home: pathname.startsWith('/community'),
    learning: pathname.startsWith('/staff/learning') || pathname.startsWith('/staff/trainings')
  }

  // Single source of truth for search page mapping (align with LeftSidebarSearch)
  const searchPage = useMemo(() => {
    if (pathname.startsWith('/staff/my-brands')) return 'my_brands'
    if (pathname.startsWith('/staff/learning') || pathname.startsWith('/staff/trainings')) return 'learning'
    if (pathname.startsWith('/community')) return 'community'
    return 'unknown'
  }, [pathname])

  const searchAriaLabel =
    searchPage === 'my_brands' ? 'Search My Brands' :
    searchPage === 'learning'  ? 'Search Learning'  :
                                 'Search Community'

  return (
    <nav
      className="mobile-bottom-nav fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="navigation"
      aria-label="Primary"
      data-testid="bottomnav"
    >
      <div className="max-w-5xl mx-auto grid grid-cols-4">
        <Item
          to="/community"
          icon={Home}
          label="Home"
          testId="bottomnav-home"
          isActive={active.home}
        />
        <Item
          to="/staff/my-brands"
          icon={Store}
          label="My Brands"
          testId="bottomnav-mybrands"
          isActive={active.brands}
        />
        <Item
          to="/staff/learning"
          icon={BookOpen}
          label="Learning"
          testId="bottomnav-learning"
          isActive={active.learning}
        />
        {/* Search button opens page-local search overlay via custom event */}
        <button
          type="button"
          onClick={() => {
            try {
              window.dispatchEvent(new CustomEvent('en:openMobileSearch', { detail: { page: searchPage } }))
            } catch { /* no-op */ }
          }}
          className="flex-1 flex flex-col items-center justify-center min-h-[60px] py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary"
          aria-label={searchAriaLabel}
          data-testid="bottomnav-search"
        >
          <SearchIcon size={24} aria-hidden className={'text-warm-gray'} />
          <span className="text-[11px] mt-0.5 text-warm-gray">Search</span>
        </button>
      </div>
    </nav>
  )
}
