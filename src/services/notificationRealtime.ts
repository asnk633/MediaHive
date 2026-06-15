import { AppNotification } from '@/types/notification';
import { AlertService } from './alertService';
import { API_BASE, getApiBaseUrl } from '@/lib/api-utils';

export function listenNotifications(userId: string, callback: (notifications: AppNotification[]) => void) {
  if (typeof window === 'undefined') return () => {};

  let isCancelled = false;
  let eventSource: EventSource | null = null;
  let reconnectTimeout: NodeJS.Timeout | null = null;
  let retryDelay = 2000; // Start with 2s
  const maxRetryDelay = 30000; // Cap at 30s

  const apiBaseUrl = getApiBaseUrl();
  const sseUrl = `${apiBaseUrl}${API_BASE}/notification/subscribe`;

  const connect = () => {
    if (isCancelled) return;

    if (eventSource) {
      eventSource.close();
    }

    // Set withCredentials: true so cookies are sent correctly
    eventSource = new EventSource(sseUrl, { withCredentials: true });

    eventSource.onopen = () => {
      console.log('[SSE][Notifications] Connection established successfully');
      retryDelay = 2000; // Reset backoff on successful connection
    };

    eventSource.addEventListener('notification', async (event) => {
      if (isCancelled) return;
      try {
        const data = JSON.parse(event.data);
        console.log('[SSE][Notifications] Event received:', data.type);

        // Fetch fresh notifications from DB and update UI
        const notifications = await AlertService.getUserNotifications();
        callback(notifications);
      } catch (error) {
        console.error('[SSE][Notifications] Failed to parse event or fetch notifications:', error);
      }
    });

    eventSource.onerror = (err) => {
      console.warn('[SSE][Notifications] Connection closed or error encountered. Retrying...', err);
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }

      if (!isCancelled) {
        // Reconnect using exponential backoff
        reconnectTimeout = setTimeout(() => {
          retryDelay = Math.min(retryDelay * 2, maxRetryDelay);
          connect();
        }, retryDelay);
      }
    };
  };

  // Connect immediately
  connect();

  // Initial fetch to ensure data is displayed right away
  AlertService.getUserNotifications()
    .then(notifications => {
      if (!isCancelled) callback(notifications);
    })
    .catch(err => console.error('[SSE][Notifications] Initial fetch failed:', err));

  // Return cleanup function
  return () => {
    isCancelled = true;
    if (eventSource) {
      eventSource.close();
    }
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }
  };
}

