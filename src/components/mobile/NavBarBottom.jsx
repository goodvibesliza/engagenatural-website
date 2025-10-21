import React, { useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Store, BookOpen, Home, Bell, Search as SearchIcon } from 'lucide-react'
import useNotificationsStore from '@/hooks/useNotificationsStore'

/**
 * Render a bottom navigation item linking to a route with an icon, label, and optional numeric badge.
 * @param {Object} props
 * @param {string} props.to - Destination route path for the navigation item.
 * @param {import('react').ComponentType|import('react').ElementType} props.icon - Icon component to render.
 * @param {string} props.label - Visible label text shown below the icon.
 * @param {string} props.testId - Value applied to `data-testid` for testing.
 * @param {boolean} props.isActive - When true, marks the item as active (affects `aria-current` and styling).
 * @param {number} props.badge - Numeric badge to display when greater than zero.
 * @returns {JSX.Element} The NavLink element representing the navigation item.
 */
function Item({ to, icon, label, testId, isActive, badge }) {
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
      <div className="relative">
        <IconComp
          size={24}
          aria-hidden
          className={isActive ? 'text-deep-moss' : 'text-warm-gray'}
        />
        {badge > 0 && (
          <span
            aria-hidden
            className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-brand-primary text-white text-[10px]"
          >
            {badge}
          </span>
        )}
      </div>
      <span className={`text-[11px] mt-0.5 ${isActive ? 'text-deep-moss' : 'text-warm-gray'}`}>{label}</span>
    </NavLink>
  )
}

/**
 * Render the mobile bottom navigation bar with Home, Updates (badge-supported), My Brands, Learning, and a Search action.
 *
 * Highlights the active section based on the current pathname, shows the total unread count on the Updates item, and dispatches a custom 'en:openMobileSearch' event with { page } when the Search button is pressed.
 *
 * @returns {JSX.Element} The bottom navigation React element.
 */
export default function NavBarBottom() {
  const { pathname } = useLocation()
  const { totalUnread } = useNotificationsStore()

  const active = {
    brands: pathname.startsWith('/staff/my-brands'),
    notifications: pathname.startsWith('/staff/notifications'),
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
          to="/staff/notifications"
          icon={Bell}
          label="Updates"
          testId="bottomnav-notifications"
          isActive={active.notifications}
          badge={totalUnread}
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