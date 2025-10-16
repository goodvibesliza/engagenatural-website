import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/communityDesktop.css';
import TopMenuBarDesktop from '@/components/community/desktop/TopMenuBarDesktop.jsx';
import DesktopLinkedInShell from '@/layouts/DesktopLinkedInShell.jsx';
import LeftSidebarSearch from '@/components/common/LeftSidebarSearch.jsx';

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

  const defaultHeader = useMemo(() => (
    <TopMenuBarDesktop />
  ), []);

  const defaultLeft = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab') || 'whatsGood';
    const brand = params.get('brand') || '';
    const brandId = params.get('brandId') || '';
    const go = (nextTab) => {
      const p = new URLSearchParams(location.search);
      p.set('tab', nextTab);
      navigate({ pathname: location.pathname, search: p.toString() });
    };
    return (
      <div className="en-cd-left-inner">
        <LeftSidebarSearch />
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
          {(brandId || brand) && (
            <li>
              <a
                href={`/community?tab=brand${brandId ? `&brandId=${encodeURIComponent(brandId)}` : ''}${brand ? `&brand=${encodeURIComponent(brand)}` : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  const p = new URLSearchParams(location.search);
                  p.set('tab', 'brand');
                  if (brandId) p.set('brandId', brandId); else p.delete('brandId');
                  if (brand) p.set('brand', brand); else p.delete('brand');
                  navigate({ pathname: location.pathname, search: p.toString() });
                }}
                className={`en-cd-left-link ${tab === 'brand' ? 'is-active' : ''}`}
                aria-current={tab === 'brand' ? 'page' : undefined}
                data-testid="left-nav-brand"
                title={brand ? `Brand: ${brand}` : 'Brand'}
              >
                {brand ? `Brand: ${brand}` : 'Brand'}
              </a>
            </li>
          )}
        </ul>
      </div>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  const defaultRight = useMemo(() => (
    <>
      <div className="en-cd-right-title">Right Rail</div>
      <div className="en-cd-right-placeholder">(reserved)</div>
    </>
  ), []);

  return (
    <DesktopLinkedInShell
      dataTestId={dataTestId}
      topBar={headerContent || defaultHeader}
      leftSidebar={leftNav ? (
        <div className="en-cd-left-inner">
          <LeftSidebarSearch />
          {leftNav}
        </div>
      ) : defaultLeft}
      center={children}
      rightRail={rightRail || defaultRight}
    />
  );
}
