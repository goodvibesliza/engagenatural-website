// src/components/community/desktop/TopMenuBarDesktop.jsx
import React, { useRef, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import UserDropdownMenu from '@/components/UserDropdownMenu';
import LogoWordmark from '@/components/brand/LogoWordmark';
import { track } from '@/lib/analytics';
import useNotificationsStore from '@/hooks/useNotificationsStore';

/**
 * Compute the CSS class string for a topbar item based on whether it is active.
 * @param {{isActive: boolean}} params - Parameters object.
 * @param {boolean} params.isActive - Whether the item is currently active.
 * @returns {string} The combined CSS classes to apply to the item.
 */
function itemClasses({ isActive }) {
  const base = 'inline-flex items-center px-3 h-11 min-h-[44px] rounded-md text-sm no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-deep-moss';
  return isActive
    ? `${base} bg-oat-beige text-deep-moss`
    : `${base} text-gray-700 hover:bg-gray-50`;
}

/**
 * Top navigation bar for the community section containing navigation links, a notifications indicator, and the user avatar menu.
 *
 * The component renders links for Community, Notifications (with a dynamic unread count badge and aria-label when there are unread items), My Brands, and Learning, plus a user dropdown. It supports keyboard navigation with the left/right arrow keys cycling focus between the top-level items. Clicks on links perform analytics tracking attempts (errors are suppressed).
 *
 * @returns {JSX.Element} The rendered top navigation bar component.
 */
export default function TopMenuBarDesktop() {
  const { totalUnread } = useNotificationsStore();
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
          to="/community"
          className={itemClasses}
          data-testid="topbar-community"
          aria-label="Community"
          ref={communityRef}
          onClick={() => {
            try { track('topmenu_click', { label: 'Community', item: 'community', surface: 'community_desktop' }); } catch (err) { void err; }
            // eslint-disable-next-line no-console
            console.debug?.('topmenu_click', { label: 'Community', item: 'community', surface: 'community_desktop' });
          }}
          end
        >
          Community
        </NavLink>
        <NavLink
          to="/staff/notifications"
          className={itemClasses}
          data-testid="topbar-notifications"
          aria-label={`Notifications${totalUnread > 0 ? `, ${totalUnread} new` : ''}`}
          ref={notifRef}
          onClick={() => {
            try { track('topmenu_click', { item: 'notifications', surface: 'community_desktop' }); } catch (err) { void err; /* Intentionally ignoring analytics errors to avoid impacting user experience */ }
            // Dev visibility in local envs
            // eslint-disable-next-line no-console
            console.debug?.('topmenu_click', { item: 'notifications', surface: 'community_desktop' });
          }}
          end
        >
          <span className="relative inline-flex items-center gap-2">
            <span>Notifications</span>
            {totalUnread > 0 && (
              <span
                className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-brand-primary text-white text-xs"
                aria-hidden
                title={`You have ${totalUnread} new updates.`}
              >
                {totalUnread}
              </span>
            )}
          </span>
        </NavLink>
        <NavLink
          to="/staff/my-brands"
          className={itemClasses}
          data-testid="topbar-mybrands"
          aria-label="My Brands"
          ref={brandsRef}
          onClick={() => {
            try { track('topmenu_click', { item: 'my_brands', surface: 'community_desktop' }); } catch (err) { void err; /* Intentionally ignoring analytics errors to avoid impacting user experience */ }
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
            try { track('topmenu_click', { item: 'learning', surface: 'community_desktop' }); } catch (err) { void err; /* Intentionally ignoring analytics errors to avoid impacting user experience */ }
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