import { AppNotification } from '@/types/notification';
import { AlertService } from './alertService';
import { API_BASE, getApiBaseUrl } from '@/lib/api-utils';

interface UserSubscription {
  eventSource: EventSource | null;
  reconnectTimeout: NodeJS.Timeout | null;
  retryDelay: number;
  listeners: Set<(notifications: AppNotification[]) => void>;
  lastNotifications: AppNotification[] | null;
  isConnecting: boolean;
}

// Registry of shared subscriptions per userId
const activeSubscriptions = new Map<string, UserSubscription>();
const maxRetryDelay = 30000;

function connectUserSSE(userId: string, sub: UserSubscription) {
  if (typeof window === 'undefined') return;
  if (sub.listeners.size === 0) return;

  if (sub.eventSource) {
    sub.eventSource.close();
  }

  const apiBaseUrl = getApiBaseUrl();
  const sseUrl = `${apiBaseUrl}${API_BASE}/notification/subscribe`;

  sub.isConnecting = true;
  const eventSource = new EventSource(sseUrl, { withCredentials: true });
  sub.eventSource = eventSource;

  eventSource.onopen = () => {
    console.log(`[SSE][Notifications] Shared connection established for user ${userId}`);
    sub.retryDelay = 2000;
    sub.isConnecting = false;
  };

  eventSource.addEventListener('notification', async (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log(`[SSE][Notifications] Event received for user ${userId}:`, data.type);

      // Fetch new notifications once and distribute to all listeners
      const notifications = await AlertService.getUserNotifications();
      sub.lastNotifications = notifications;
      sub.listeners.forEach((cb) => {
        try {
          cb(notifications);
        } catch (e) {
          console.error('[SSE][Notifications] Error in listener callback:', e);
        }
      });
    } catch (error) {
      console.error('[SSE][Notifications] Failed to process notification event:', error);
    }
  });

  eventSource.onerror = (err) => {
    console.warn(`[SSE][Notifications] Connection closed/error for user ${userId}. Retrying...`, err);
    if (sub.eventSource) {
      sub.eventSource.close();
      sub.eventSource = null;
    }
    sub.isConnecting = false;

    if (sub.listeners.size > 0) {
      sub.reconnectTimeout = setTimeout(() => {
        sub.retryDelay = Math.min(sub.retryDelay * 2, maxRetryDelay);
        connectUserSSE(userId, sub);
      }, sub.retryDelay);
    }
  };
}

export function listenNotifications(userId: string, callback: (notifications: AppNotification[]) => void) {
  if (typeof window === 'undefined') return () => {};

  let sub = activeSubscriptions.get(userId);
  if (!sub) {
    sub = {
      eventSource: null,
      reconnectTimeout: null,
      retryDelay: 2000,
      listeners: new Set(),
      lastNotifications: null,
      isConnecting: false,
    };
    activeSubscriptions.set(userId, sub);
  }

  sub.listeners.add(callback);

  // Provide cached data instantly if available
  if (sub.lastNotifications) {
    callback(sub.lastNotifications);
  } else {
    // First fetch for the subscriber
    AlertService.getUserNotifications()
      .then((notifications) => {
        if (sub && sub.listeners.has(callback)) {
          sub.lastNotifications = notifications;
          callback(notifications);
        }
      })
      .catch((err) => console.error('[SSE][Notifications] Initial fetch failed:', err));
  }

  // Connect SSE if not already active
  if (!sub.eventSource && !sub.reconnectTimeout) {
    connectUserSSE(userId, sub);
  }

  // Return cleanup/unsubscribe callback
  return () => {
    const currentSub = activeSubscriptions.get(userId);
    if (!currentSub) return;

    currentSub.listeners.delete(callback);

    if (currentSub.listeners.size === 0) {
      console.log(`[SSE][Notifications] Closing connection for user ${userId} - no active listeners.`);
      if (currentSub.eventSource) {
        currentSub.eventSource.close();
      }
      if (currentSub.reconnectTimeout) {
        clearTimeout(currentSub.reconnectTimeout);
      }
      activeSubscriptions.delete(userId);
    }
  };
}
