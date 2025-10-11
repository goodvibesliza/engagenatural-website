import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../contexts/auth-context'

const BAR_HEIGHT = 56

export default function TopBarCollapsible() {
  const { user } = useAuth()
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(typeof window !== 'undefined' ? window.scrollY : 0)
  const ticking = useRef(false)
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(() => {
        const y = window.scrollY || 0
        const dy = y - (lastY.current || 0)
        // Hide when scrolling down, show when scrolling up
        if (y < 4) {
          setHidden(false)
        } else if (Math.abs(dy) > 2) {
          setHidden(dy > 0)
        }
        lastY.current = y
        ticking.current = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const openUserMenu = () => {
    try {
      // Trigger existing global user dropdown via stable attributes only
      const trigger = document.querySelector('button[data-user-menu="trigger"], button[aria-haspopup="menu"]')
      trigger?.click()
    } catch (err) {
      console.error('TopBarCollapsible: failed to open user menu', err)
    }
  }

  const focusCommunitySearch = () => {
    try {
      const el = document.getElementById('community-mobile-search')
      if (el) {
        el.focus()
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    } catch (err) {
      console.error('TopBarCollapsible: failed to focus community search', err)
    }
  }

  return (
    <div
      className="fixed top-0 inset-x-0 z-50 border-b border-gray-200 bg-white"
      style={{
        height: BAR_HEIGHT,
        transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
        transition: reducedMotion ? 'none' : 'transform 200ms ease',
        willChange: 'transform',
      }}
      data-testid="topbar"
      role="banner"
      aria-label="Top Bar"
    >
      <div className="max-w-5xl mx-auto h-full flex items-center gap-3 px-3">
        <button
          type="button"
          onClick={openUserMenu}
          className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center"
          aria-label="Open user menu"
          data-testid="topbar-avatar"
        >
          {user?.profileImage && user.profileImage.startsWith('http') ? (
            <img src={user.profileImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-gray-700">{(user?.displayName || user?.name || 'U').slice(0,1).toUpperCase()}</span>
          )}
        </button>
        <div className="flex-1">
          <button
            type="button"
            onClick={focusCommunitySearch}
            className="w-full h-10 min-h-[40px] px-3 rounded-lg border border-gray-300 text-sm text-gray-600 text-left"
            aria-label="Search posts"
            data-testid="topbar-search"
          >
            Search posts
          </button>
        </div>
      </div>
    </div>
  )
}
