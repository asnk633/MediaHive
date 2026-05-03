// src/hooks/useNotificationsRealtime.ts
// Hook for notification realtime updates

import { useServerSync } from './useServerSync';

interface NotificationUpdate {
  type: 'new';
  notification: any;
}

export function useNotificationsRealtime(callback: (notification: any) => void) {
  useServerSync('notification', (data) => {
    if (data.type === 'new') {
      callback(data.notification);
    }
  });
}
