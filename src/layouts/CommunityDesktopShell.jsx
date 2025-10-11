import React, { useEffect, useMemo, useState } from 'react';
import '../styles/communityDesktop.css';

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
  // track width for responsive right-rail visibility (>=1280)
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

  const showRight = w >= 1280;

  const defaultHeader = useMemo(() => (
    <div className="en-cd-header-inner">
      <div className="en-cd-header-title">Community</div>
      <div className="en-cd-header-tools" aria-hidden>
        <span data-testid="topbar-search" />
        <span data-testid="topbar-avatar" />
      </div>
    </div>
  ), []);

  const defaultLeft = useMemo(() => (
    <div className="en-cd-left-inner">
      {/* Placeholder left nav */}
      <div className="en-cd-left-title">Navigation</div>
      <ul className="en-cd-left-menu">
        <li>Home</li>
        <li>Whats Good</li>
        <li>Pro</li>
      </ul>
    </div>
  ), []);

  const defaultRight = useMemo(() => (
    <div className="en-cd-right-inner">
      <div className="en-cd-right-title">Right Rail</div>
      <div className="en-cd-right-placeholder">(reserved)</div>
    </div>
  ), []);

  return (
    <div className="en-cd-shell" data-testid={dataTestId}>
      {/* Fixed Header */}
      <header className="en-cd-header" role="banner" aria-label="Top bar" data-testid="topbar">
        {headerContent || defaultHeader}
      </header>

      {/* Fixed Left Nav */}
      <nav className="en-cd-left" role="navigation" aria-label="Primary navigation" data-testid="left-nav">
        {leftNav || defaultLeft}
      </nav>

      {/* Center scroller */}
      <main className="en-cd-center" role="main" aria-label="Main content">
        <div className="en-cd-center-inner" data-testid="center-scroller">
          {children}
        </div>
      </main>

      {/* Right rail placeholder (>=1280 only) */}
      {showRight && (
        <aside className="en-cd-right" role="complementary" aria-label="Right rail" data-testid="right-rail">
          {rightRail || defaultRight}
        </aside>
      )}
    </div>
  );
}
