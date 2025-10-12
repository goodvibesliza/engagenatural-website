// src/components/community/desktop/TopMenuBarDesktop.jsx
import React, { useRef, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import UserDropdownMenu from '@/components/UserDropdownMenu';
import LogoWordmark from '@/components/brand/LogoWordmark';
import { track } from '@/lib/analytics';

function itemClasses({ isActive }) {
  const base = 'inline-flex items-center px-3 h-11 min-h-[44px] rounded-md text-sm no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-deep-moss';
  return isActive
    ? `${base} bg-oat-beige text-deep-moss`
    : `${base} text-gray-700 hover:bg-gray-50`;
}

export default function TopMenuBarDesktop() {
  const notifRef = useRef(null);
  const brandsRef = useRef(null);
  const learningRef = useRef(null);

  const onKeyDown = useCallback((e) => {
    const items = [notifRef, brandsRef, learningRef];
    const keys = ['ArrowLeft', 'ArrowRight'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const focusedIndex = items.findIndex((r) => r.current === document.activeElement);
    let nextIndex = focusedIndex;
    if (e.key === 'ArrowRight') nextIndex = (focusedIndex + 1 + items.length) % items.length;
    if (e.key === 'ArrowLeft') nextIndex = (focusedIndex - 1 + items.length) % items.length;
    const next = items[nextIndex]?.current;
    if (next) next.focus();
  }, []);
  return (
    <nav
      className="hidden lg:flex items-center justify-between w-full h-full"
      aria-label="Community top navigation"
      data-testid="topmenu-desktop"
      onKeyDown={onKeyDown}
    >
      {/* Left: wordmark */}
      <div className="flex items-center">
        <LogoWordmark size="md" />
        <span className="ml-2 text-neutral-700 text-[10px] font-medium leading-none tracking-[0.15rem] font-body">BETA</span>
      </div>

      {/* Right: nav items + avatar */}
      <div className="flex items-center gap-3">
        <NavLink
          to="/staff/notifications"
          className={itemClasses}
          data-testid="topmenu-notifications"
          aria-label="Notifications"
          ref={notifRef}
          onClick={() => {
            try { track('topmenu_click', { item: 'notifications', surface: 'community_desktop' }); } catch {}
            // Dev visibility in local envs
            // eslint-disable-next-line no-console
            console.debug?.('topmenu_click', { item: 'notifications', surface: 'community_desktop' });
          }}
          end
        >
          Notifications
        </NavLink>
        <NavLink
          to="/staff/my-brands"
          className={itemClasses}
          data-testid="topmenu-mybrands"
          aria-label="My Brands"
          ref={brandsRef}
          onClick={() => {
            try { track('topmenu_click', { item: 'my_brands', surface: 'community_desktop' }); } catch {}
            // eslint-disable-next-line no-console
            console.debug?.('topmenu_click', { item: 'my_brands', surface: 'community_desktop' });
          }}
          end
        >
          My Brands
        </NavLink>
        <NavLink
          to="/training"
          className={itemClasses}
          data-testid="topmenu-learning"
          aria-label="Learning"
          ref={learningRef}
          onClick={() => {
            try { track('topmenu_click', { item: 'learning', surface: 'community_desktop' }); } catch {}
            // eslint-disable-next-line no-console
            console.debug?.('topmenu_click', { item: 'learning', surface: 'community_desktop' });
          }}
          end
        >
          Learning
        </NavLink>
        <div className="flex items-center" data-testid="topmenu-user-avatar">
          <UserDropdownMenu />
        </div>
      </div>
    </nav>
  );
}
