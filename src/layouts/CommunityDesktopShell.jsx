import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/communityDesktop.css';
import TopMenuBarDesktop from '@/components/community/desktop/TopMenuBarDesktop.jsx';

/**
 * CommunityDesktopShell – fixed header + left nav with a center-only scroller.
 *
 * Layout rules:
 * - Header is fixed at the top
 * - Left nav is fixed below the header, 280px wide
 * - Only center column scrolls (height: calc(100vh - header))
 * - ≥1280px shows optional right rail placeholder (300px). Below that, it collapses.
 * - When mounted, prevents body scroll (html, body { overflow: hidden }) and restores on unmount.
 */
export default function CommunityDesktopShell({ children, headerContent = null, leftNav = null, rightRail = null, dataTestId }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prevHtml || '';
      document.body.style.overflow = prevBody || '';
    };
  }, []);

  // Show right rail within the desktop shell context
  const showRight = true;

  const defaultHeader = useMemo(() => (
    <div className="en-cd-header-inner">
      <TopMenuBarDesktop />
    </div>
  ), []);

  const defaultLeft = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab') || 'whatsGood';
    const go = (nextTab) => {
      const p = new URLSearchParams(location.search);
      p.set('tab', nextTab);
      navigate({ pathname: location.pathname, search: p.toString() });
    };
    return (
      <div className="en-cd-left-inner">
        <div className="en-cd-left-title">Feed</div>
        <ul className="en-cd-left-menu" role="list">
          <li>
            <a
              href={"/community?tab=whatsGood"}
              onClick={(e) => { e.preventDefault(); go('whatsGood'); }}
              className={`en-cd-left-link ${tab === 'whatsGood' ? 'is-active' : ''}`}
              aria-current={tab === 'whatsGood' ? 'page' : undefined}
              data-testid="left-nav-whatsgood"
            >
              What's Good
            </a>
          </li>
          <li>
            <a
              href={"/community?tab=pro"}
              onClick={(e) => { e.preventDefault(); go('pro'); }}
              className={`en-cd-left-link ${tab === 'pro' ? 'is-active' : ''}`}
              aria-current={tab === 'pro' ? 'page' : undefined}
              data-testid="left-nav-pro"
            >
              Pro
            </a>
          </li>
        </ul>
      </div>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  const defaultRight = useMemo(() => (
    <div className="en-cd-right-inner">
      <div className="en-cd-right-title">Right Rail</div>
      <div className="en-cd-right-placeholder">(reserved)</div>
    </div>
  ), []);

  return (
    <div className="en-cd-shell" data-testid={dataTestId}>
      {/* Fixed Header */}
      <header className="en-cd-header" role="banner" aria-label="Top bar" data-testid="desktop-shell-header">
        {headerContent || defaultHeader}
      </header>

      {/* Fixed Left Nav */}
      <nav className="en-cd-left" role="navigation" aria-label="Primary navigation" data-testid="desktop-shell-leftnav">
        {leftNav || defaultLeft}
      </nav>

      {/* Center scroller */}
      <main className="en-cd-center" role="main" aria-label="Main content" data-testid="desktop-shell-center">
        <div className="en-cd-center-inner">
          {children}
        </div>
      </main>

      {/* Right rail placeholder (>=1280 only) */}
      {showRight && (
        <aside className="en-cd-right" role="complementary" aria-label="Right rail" data-testid="desktop-shell-rightrail">
          {rightRail || defaultRight}
        </aside>
      )}
    </div>
  );
}
