import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Store, Bell, Users, BookOpen } from 'lucide-react'

function Item({ to, icon, label, testId, isActive }) {
  const IconComp = icon
  return (
    <NavLink
      to={to}
      aria-current={isActive ? 'page' : undefined}
      className={
        'flex-1 flex flex-col items-center justify-center min-h-[56px] py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary'
      }
      data-testid={testId}
    >
      <IconComp
        size={22}
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
    notifications: pathname.startsWith('/staff/notifications'),
    communities: pathname.startsWith('/staff/community') || pathname === '/community',
    learning: pathname.startsWith('/staff/learning') || pathname.startsWith('/staff/trainings')
  }

  return (
    <nav
      className="mobile-bottom-nav fixed bottom-0 inset-x-0 z-50 border-t border-gray-200 bg-white"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="navigation"
      aria-label="Primary"
      data-testid="bottomnav"
    >
      <div className="max-w-5xl mx-auto grid grid-cols-4">
        <Item
          to="/staff/my-brands"
          icon={Store}
          label="My Brands"
          testId="bottomnav-mybrands"
          isActive={active.brands}
        />
        <Item
          to="/staff/notifications"
          icon={Bell}
          label="Notifications"
          testId="bottomnav-notifications"
          isActive={active.notifications}
        />
        <Item
          to="/staff/community?tab=whats-good"
          icon={Users}
          label="Communities"
          testId="bottomnav-communities"
          isActive={active.communities}
        />
        <Item
          to="/staff/learning"
          icon={BookOpen}
          label="Learning"
          testId="bottomnav-learning"
          isActive={active.learning}
        />
      </div>
    </nav>
  )
}
