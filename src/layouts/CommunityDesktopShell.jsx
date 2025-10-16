import React, { useMemo, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/communityDesktop.css';
import TopMenuBarDesktop from '@/components/community/desktop/TopMenuBarDesktop.jsx';
import DesktopLinkedInShell from '@/layouts/DesktopLinkedInShell.jsx';
import LeftSidebarSearch from '@/components/common/LeftSidebarSearch.jsx';
import { useAuth } from '@/contexts/auth-context.jsx';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { track } from '@/lib/analytics';

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
  const { user } = useAuth();
  const [followedBrands, setFollowedBrands] = useState([]);

  // Persist followed brand communities in left rail
  useEffect(() => {
    let unsub = () => {};
    try {
      // Read cached to reduce flicker
      try {
        const cached = localStorage.getItem('en.followedBrandCommunities');
        if (cached) {
          const arr = JSON.parse(cached);
          if (Array.isArray(arr)) setFollowedBrands(arr);
        }
      } catch (err) { console.debug?.('CommunityDesktopShell cache read failed', err); }
      if (!db || !user?.uid) return;
      const qf = query(collection(db, 'brand_follows'), where('userId', '==', user.uid));
      unsub = onSnapshot(qf, (snap) => {
        const items = snap.docs.map(d => ({ brandId: d.data()?.brandId, brandName: d.data()?.brandName || 'Brand' }))
          .filter(x => !!x.brandId);
        setFollowedBrands(items);
        try { localStorage.setItem('en.followedBrandCommunities', JSON.stringify(items)); } catch (err) { console.debug?.('CommunityDesktopShell cache write failed', err); }
      }, (err) => { console.error?.('CommunityDesktopShell onSnapshot error', err); setFollowedBrands([]); });
    } catch (err) {
      console.error?.('CommunityDesktopShell subscription error', err);
      setFollowedBrands([]);
    }
    return () => { try { if (typeof unsub === 'function') unsub(); } catch (err) { console.debug?.('CommunityDesktopShell unsubscribe failed', err); } };
  }, [db, user?.uid]);

  const defaultHeader = useMemo(() => (
    <TopMenuBarDesktop />
  ), []);

  const defaultLeft = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab') || 'whatsGood';
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
          {followedBrands.length > 0 && (
            <li className="mt-3">
              <div className="en-cd-left-title">Brands</div>
              <ul role="list" className="en-cd-left-menu">
                {followedBrands.map((b) => {
                  const active = tab === 'brand' && brandId === b.brandId;
                  const label = b.brandName || 'Brand';
                  return (
                    <li key={b.brandId}>
                      <a
                        href={`/community?tab=brand&brandId=${encodeURIComponent(b.brandId)}&brand=${encodeURIComponent(label)}&via=left_rail`}
                        onClick={(e) => {
                          e.preventDefault();
                          try { track('community_leftrail_click', { brandId: b.brandId }); } catch {}
                          const p = new URLSearchParams(location.search);
                          p.set('tab', 'brand');
                          p.set('brandId', b.brandId);
                          p.set('brand', label);
                          navigate({ pathname: location.pathname, search: p.toString() });
                        }}
                        className={`en-cd-left-link ${active ? 'is-active' : ''}`}
                        aria-current={active ? 'page' : undefined}
                        title={`Brand: ${label}`}
                        style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44 }}
                        data-testid={`left-nav-brand-${b.brandId}`}
                      >
                        <span className="truncate" style={{ maxWidth: 200 }}>{`Brand: ${label}`}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </li>
          )}
        </ul>
      </div>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, followedBrands]);

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
