// src/pages/staff/dashboard/NotificationsPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { track } from '@/lib/analytics';
import DesktopLinkedInShell from '@/layouts/DesktopLinkedInShell.jsx';
import TopMenuBarDesktop from '@/components/community/desktop/TopMenuBarDesktop.jsx';
import LeftSidebarSearch from '@/components/common/LeftSidebarSearch.jsx';
import useNotificationsStore from '@/hooks/useNotificationsStore';
import useCommunitySwitcher from '@/hooks/useCommunitySwitcher';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const { unreadCounts, markAsRead, markAllAsRead } = useNotificationsStore();
  const { allCommunities } = useCommunitySwitcher();
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

  const communityActivity = useMemo(() => {
    const arr = [];
    for (const c of allCommunities || []) {
      const communityId = c.communityId || '';
      const count = Number(unreadCounts?.[communityId] || 0);
      if (!communityId || count <= 0) continue;
      arr.push({ key: `${c.id}|${communityId}`, brandId: c.id, communityId, name: c.name, count });
    }
    return arr.sort((a,b) => b.count - a.count);
  }, [allCommunities, unreadCounts]);

  const CenterContent = () => (
    <div className="space-y-6" data-testid="notifications-center">
      {/* Tabs + Mark all */}
      <div className="flex items-center gap-2">
        <TabButton id="all" active={tab === 'all'} onClick={() => { setTab('all'); try { track('notifications_tab_click', { tab: 'all' }); } catch (err) { console.debug?.('track notifications_tab_click failed', { tab: 'all' }, err); } }}>All</TabButton>
        <TabButton id="mentions" active={tab === 'mentions'} onClick={() => { setTab('mentions'); try { track('notifications_tab_click', { tab: 'mentions' }); } catch (err) { console.debug?.('track notifications_tab_click failed', { tab: 'mentions' }, err); } }}>Mentions</TabButton>
        <TabButton id="system" active={tab === 'system'} onClick={() => { setTab('system'); try { track('notifications_tab_click', { tab: 'system' }); } catch (err) { console.debug?.('track notifications_tab_click failed', { tab: 'system' }, err); } }}>System</TabButton>
        <div className="ml-auto" />
        <button
          type="button"
          onClick={() => { try { markAllAsRead(); } catch {} }}
          className="h-9 px-3 rounded-md border text-sm bg-white hover:bg-gray-50"
          data-testid="notifications-markall"
        >
          Mark all as read
        </button>
      </div>

      {/* Group: Community activity */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-100 text-sm font-medium text-gray-700">Community activity</div>
        {communityActivity.length === 0 ? (
          <EmptyState icon="✅" headline="You're all caught up." copy="No new community updates." />
        ) : (
          <ul role="list" className="divide-y divide-gray-100">
            {communityActivity.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => {
                    try { track('notification_open', { communityId: item.communityId, brandId: item.brandId }); } catch (err) { console.debug?.('NotificationsPage: track open failed', err); }
                    try { markAsRead(item.communityId); } catch (err) { console.debug?.('NotificationsPage: markAsRead failed', err); }
                    navigate(`/community?tab=brand&brandId=${encodeURIComponent(item.brandId)}&communityId=${encodeURIComponent(item.communityId)}&via=notifications`, { state: { brandId: item.brandId, communityId: item.communityId, brand: item.name, brandName: item.name } });
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-deep-moss"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">New posts in {item.name}</div>
                      <div className="text-xs text-gray-500">Tap to open the feed</div>
                    </div>
                    <span className="ml-3 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-brand-primary text-white text-xs">{item.count}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Mentions / replies */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-100 text-sm font-medium text-gray-700">Mentions & replies</div>
        <EmptyState icon="@" headline="No mentions yet." copy="When someone mentions you, you'll see it here." />
      </div>

      {/* System updates */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-100 text-sm font-medium text-gray-700">System updates</div>
        <EmptyState icon="🔔" headline="No system notifications." copy="We’ll post important system updates here." />
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
