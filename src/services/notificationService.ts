import { AppNotification, CreateNotificationParams, NotificationType } from '@/types/notification';
import { apiClient } from '@/lib/apiClient';

// API helper function
const apiRequest = async (endpoint: string, options: any = {}) => {
  const url = `/api/notifications${endpoint}`;
  return apiClient(url, options);
};

export class NotificationService {
  /**
   * Create a new notification.
   * Prevents creation if sourceUserId equals userId (self-notification).
   */
  static async createNotification(params: CreateNotificationParams): Promise<string | null> {
    // Prevent self-notifications
    if (params.sourceUserId && params.sourceUserId === params.userId) {
      console.log('Skipping self-notification for user:', params.userId);
      return null;
    }

    try {
      // Route through server API instead of direct Firestore write
      const response = await apiRequest('/trigger', {
        method: 'POST',
        body: JSON.stringify({
          trigger: 'create_notification',
          payload: params
        }),
      });

      return response.data?.id || null;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create notifications for multiple users (batch)
   */
  static async createBatchNotifications(userIds: string[], params: Omit<CreateNotificationParams, 'userId'>): Promise<void> {
    try {
      // Route through server API instead of direct Firestore write
      await apiRequest('/trigger', {
        method: 'POST',
        body: JSON.stringify({
          trigger: 'create_batch_notifications',
          payload: { userIds, params }
        }),
      });
    } catch (error) {
      console.error('Error batch creating notifications:', error);
      throw error;
    }
  }

  /**
   * Fetch active (non-archived) notifications for the current user
   */
  static async getUserNotifications(options: { limit?: number, signal?: AbortSignal } = {}): Promise<AppNotification[]> {
    const { limit = 50, signal } = options;
    try {
      const response = await apiRequest(`?limit=${limit}`, {
        method: 'GET',
        silent: true,
        signal
      });
      return response.notifications || [];
    } catch (error: any) {
      if (error.name === 'AbortError') throw error;
      const msg = error.message?.toLowerCase() || '';
      if (!msg.includes('unauthorized') && !msg.includes('401')) {
        console.error('Error fetching notifications:', error);
      }
      throw error;
    }
  }

  /**
   * Get unread count for the current user
   */
  static async getUnreadCount(): Promise<number> {
    try {
      const response = await apiRequest(`/unread`, {
        method: 'GET'
      });
      return response.unreadCount || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      // Route through server API instead of direct Firestore write
      await apiRequest('/trigger', {
        method: 'POST',
        body: JSON.stringify({
          trigger: 'mark_as_read',
          payload: { notificationId }
        }),
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for the current user
   */
  static async markAllAsRead(): Promise<void> {
    try {
      // Route through server API instead of direct Firestore write
      await apiRequest('/trigger', {
        method: 'POST',
        body: JSON.stringify({
          trigger: 'mark_all_as_read',
          payload: {} // userId inferred from session
        }),
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  /**
   * Soft archive a notification
   */
  static async archiveNotification(notificationId: string): Promise<void> {
    try {
      // Route through server API instead of direct Firestore write
      await apiRequest('/trigger', {
        method: 'POST',
        body: JSON.stringify({
          trigger: 'archive_notification',
          payload: { notificationId }
        }),
      });
    } catch (error) {
      console.error('Error archiving notification:', error);
      throw error;
    }
  }
  /**
   * Create a broadcast notification (admin only)
   */
  static async createBroadcastNotification(payload: any): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiRequest('/create', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return { success: true, message: response.message || 'Broadcast sent' };
    } catch (error: any) {
      console.error('Error creating broadcast:', error);
      return { success: false, message: error.message || 'Failed to send' };
    }
  }
}

export function listenNotifications(userId: string, callback: (notifications: AppNotification[]) => void) {
  // Note: userId param kept for compatibility but ignored for fetching
  let isCancelled = false;
  let pollInterval: NodeJS.Timeout | null = null;

  const pollNotifications = async () => {
    if (isCancelled) return;

    // PRODUCTION PASS: Only poll if tab is visible
    if (typeof document !== 'undefined' && document.hidden) {
      pollInterval = setTimeout(pollNotifications, 60000); // Check again in 1m if hidden
      return;
    }

    try {
      const data = await apiClient(`/api/notifications?limit=50`, {
        method: 'GET',
        silent: true
      });

      callback(data.notifications || []);
    } catch (error: any) {
      const msg = error.message?.toLowerCase() || '';
      if (!msg.includes('unauthorized') && !msg.includes('401')) {
        console.warn('Notification polling failed:', error);
      }
    }

    // PRODUCTION PASS: Use 60s window for active polling to save battery/network
    if (!isCancelled) {
      pollInterval = setTimeout(pollNotifications, 60000);
    }
  };

  // Start polling immediately
  pollNotifications();

  return () => {
    isCancelled = true;
    if (pollInterval) clearTimeout(pollInterval);
  };
}

export const pushNotification = NotificationService.createNotification;
export const deleteNotification = NotificationService.archiveNotification;