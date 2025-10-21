// src/hooks/usePushTopics.js
import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import useCommunitySwitcher from '@/hooks/useCommunitySwitcher';
import useNotificationsStore from '@/hooks/useNotificationsStore';
import { requestPermissionAndToken, subscribeTopics, unsubscribeTopics } from '@/lib/push';
import { track } from '@/lib/analytics';

export default function usePushTopics() {
  const { user } = useAuth() || {};
  const { allCommunities } = useCommunitySwitcher();
  const { pushEnabled } = useNotificationsStore();
  const tokenRef = useRef(null);

  useEffect(() => {
    async function syncSubs() {
      if (!user?.uid) return;
      const communities = (allCommunities || []).map((c) => `community_${c.id}`);
      if (pushEnabled) {
        const { token, permission } = await requestPermissionAndToken(user);
        if (permission !== 'granted') {
          try { track('push_permission_denied', {}); } catch (e) { console.debug('analytics: push_permission_denied failed (ignored)', e); }
          return;
        }
        tokenRef.current = token;
        if (token && communities.length) {
          await subscribeTopics(token, communities);
        }
      } else {
        const token = tokenRef.current;
        if (token && communities.length) {
          await unsubscribeTopics(token, communities);
        }
      }
    }
    syncSubs();
    return () => {};
  }, [pushEnabled, user?.uid, allCommunities]);
}
