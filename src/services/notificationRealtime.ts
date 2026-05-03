import { AppNotification } from '@/types/notification';
import { tenantContext } from '@/lib/auth/tenantContext';
import { synergySyncManager } from '@/system/realtimeSync';
import { AlertService } from './alertService';

export function listenNotifications(userId: string, callback: (notifications: AppNotification[]) => void) {
  let isCancelled = false;
  const subscriptionId = `notifications-${userId}`;

  const setupRealtime = async () => {
    try {
      const { tenantId } = await tenantContext();

      await synergySyncManager.subscribe(
        subscriptionId,
        {
          table: 'notifications',
          filter: `tenant_id=eq.${tenantId}`,
        },
        async () => {
          if (isCancelled) return;
          const notifications = await AlertService.getUserNotifications();
          callback(notifications);
        }
      );
    } catch (err) {
      console.error('[Realtime][Notifications] Setup error:', err);
    }
  };

  setupRealtime();

  // Initial fetch
  AlertService.getUserNotifications()
    .then(notifications => {
      if (!isCancelled) callback(notifications);
    })
    .catch(err => console.error('Initial notification fetch failed:', err));

  return () => {
    isCancelled = true;
    synergySyncManager.unsubscribe(subscriptionId);
  };
}
