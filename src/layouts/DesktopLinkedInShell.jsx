import React, { useEffect } from 'react';
import '../styles/communityDesktop.css';

/**
 * DesktopLinkedInShell – fixed header + fixed left sidebar; center-only scroll.
 *
 * Slots:
 * - topBar: header content (e.g., <TopMenuBarDesktop />)
 * - leftSidebar: left rail content (wrap with .en-cd-left-inner where appropriate)
 * - center: main route content (only this area scrolls)
 * - rightRail: optional right rail content
 */
export default function DesktopLinkedInShell({ topBar = null, leftSidebar = null, center = null, rightRail = null, dataTestId }) {
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

  const showRight = true;

  return (
    <div className="en-cd-shell" data-testid={dataTestId}>
      {/* Fixed Header */}
      <header className="en-cd-header" role="banner" aria-label="Top bar" data-testid="desktop-shell-header">
        <div className="en-cd-header-inner">
          {topBar}
        </div>
      </header>

      {/* Fixed Left Sidebar */}
      <nav className="en-cd-left" role="navigation" aria-label="Primary navigation" data-testid="desktop-shell-leftnav">
        {leftSidebar}
      </nav>

      {/* Center scroller */}
      <main className="en-cd-center" role="main" aria-label="Main content" data-testid="desktop-shell-center">
        <div className="en-cd-center-inner">
          {center}
        </div>
      </main>

      {/* Right rail (>=1280px via CSS) */}
      {showRight && (
        <aside className="en-cd-right" role="complementary" aria-label="Right rail" data-testid="desktop-shell-rightrail">
          <div className="en-cd-right-inner">
            {rightRail}
          </div>
        </aside>
      )}
    </div>
  );
}
