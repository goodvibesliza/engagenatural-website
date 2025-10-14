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
  const communityRef = useRef(null);
  const notifRef = useRef(null);
  const brandsRef = useRef(null);
  const learningRef = useRef(null);

  const onKeyDown = useCallback((e) => {
    const items = [communityRef, notifRef, brandsRef, learningRef];
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
      data-testid="topbar"
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
          to="/staff/community"
          className={itemClasses}
          data-testid="topbar-community"
          aria-label="Community"
          ref={communityRef}
          onClick={() => {
            try { track('topmenu_click', { item: 'community', surface: 'community_desktop' }); } catch {}
            // eslint-disable-next-line no-console
            console.debug?.('topmenu_click', { item: 'community', surface: 'community_desktop' });
          }}
          end
        >
          Community
        </NavLink>
        <NavLink
          to="/staff/notifications"
          className={itemClasses}
          data-testid="topbar-notifications"
          aria-label="Notifications"
          ref={notifRef}
          onClick={() => {
            try { track('topmenu_click', { item: 'notifications', surface: 'community_desktop' }); } catch { /* Intentionally ignoring analytics errors to avoid impacting user experience */ }
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
          data-testid="topbar-mybrands"
          aria-label="My Brands"
          ref={brandsRef}
          onClick={() => {
            try { track('topmenu_click', { item: 'my_brands', surface: 'community_desktop' }); } catch { /* Intentionally ignoring analytics errors to avoid impacting user experience */ }
            // eslint-disable-next-line no-console
            console.debug?.('topmenu_click', { item: 'my_brands', surface: 'community_desktop' });
          }}
          end
        >
          My Brands
        </NavLink>
        <NavLink
          to="/staff/learning"
          className={itemClasses}
          data-testid="topbar-learning"
          aria-label="Learning"
          ref={learningRef}
          onClick={() => {
            try { track('topmenu_click', { item: 'learning', surface: 'community_desktop' }); } catch { /* Intentionally ignoring analytics errors to avoid impacting user experience */ }
            // eslint-disable-next-line no-console
            console.debug?.('topmenu_click', { item: 'learning', surface: 'community_desktop' });
          }}
          end
        >
          Learning
        </NavLink>
        <div className="flex items-center" data-testid="topbar-avatar">
          <UserDropdownMenu />
        </div>
      </div>
    </nav>
  );
}
