// src/pages/staff/dashboard/NotificationsPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { track } from '@/lib/analytics';
import DesktopLinkedInShell from '@/layouts/DesktopLinkedInShell.jsx';
import TopMenuBarDesktop from '@/components/community/desktop/TopMenuBarDesktop.jsx';
import LeftSidebarSearch from '@/components/common/LeftSidebarSearch.jsx';

const TabButton = ({ id, active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 h-9 min-h-[36px] rounded-md text-sm border focus-visible:outline focus-visible:outline-2 focus-visible:outline-deep-moss focus-visible:outline-offset-2 ${
      active ? 'bg-oat-beige text-deep-moss border-deep-moss/30' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
    }`}
    aria-pressed={active ? 'true' : 'false'}
    aria-current={active ? 'page' : undefined}
    data-testid={`notifications-tab-${id}`}
  >
    {children}
  </button>
);

const EmptyState = ({ icon, headline, copy }) => (
  <div className="flex flex-col items-center justify-center text-center py-16">
    <div className="text-4xl mb-3" aria-hidden>{icon}</div>
    <h2 className="text-lg font-semibold text-gray-900 mb-1">{headline}</h2>
    <p className="text-sm text-gray-600">{copy}</p>
  </div>
);

export default function NotificationsPage() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [tab, setTab] = useState('all'); // 'all' | 'mentions' | 'system'

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // page_view when shell active
  useEffect(() => {
    if (import.meta.env.VITE_EN_DESKTOP_FEED_LAYOUT === 'linkedin' && isDesktop) {
      try { track('page_view', { page: 'notifications_desktop', surface: 'community_desktop' }); } catch (err) { console.debug?.('track page_view failed (notifications_desktop)', err); }
    }
  }, [isDesktop]);

  const rightRail = useMemo(() => (
    <>
      <div className="en-cd-right-title">Right Rail</div>
      <div className="en-cd-right-placeholder">(reserved)</div>
    </>
  ), []);

  const CenterContent = () => (
    <div className="space-y-6" data-testid="notifications-center">
      {/* Tabs */}
      <div className="flex items-center gap-2">
        <TabButton id="all" active={tab === 'all'} onClick={() => { setTab('all'); try { track('notifications_tab_click', { tab: 'all' }); } catch (err) { console.debug?.('track notifications_tab_click failed', { tab: 'all' }, err); } }}>All</TabButton>
        <TabButton id="mentions" active={tab === 'mentions'} onClick={() => { setTab('mentions'); try { track('notifications_tab_click', { tab: 'mentions' }); } catch (err) { console.debug?.('track notifications_tab_click failed', { tab: 'mentions' }, err); } }}>Mentions</TabButton>
        <TabButton id="system" active={tab === 'system'} onClick={() => { setTab('system'); try { track('notifications_tab_click', { tab: 'system' }); } catch (err) { console.debug?.('track notifications_tab_click failed', { tab: 'system' }, err); } }}>System</TabButton>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        {tab === 'all' && (
          <EmptyState icon="✅" headline="You're all caught up." copy="No new notifications right now." />
        )}
        {tab === 'mentions' && (
          <EmptyState icon="@" headline="No mentions yet." copy="When someone mentions you, you'll see it here." />
        )}
        {tab === 'system' && (
          <EmptyState icon="🔔" headline="No system notifications." copy="We’ll post important system updates here." />
        )}
      </div>
    </div>
  );

  const flag = import.meta.env.VITE_EN_DESKTOP_FEED_LAYOUT;
  if (flag === 'linkedin' && isDesktop) {
    return (
      <DesktopLinkedInShell
        topBar={<TopMenuBarDesktop />}
        pageTitle="Notifications"
        leftSidebar={<LeftSidebarSearch eventContext="notifications_desktop" />}
        center={<CenterContent />}
        rightRail={rightRail}
      />
    );
  }

  return <CenterContent />;
}
