import { apiClient } from '@/lib/apiClient';
import { AppNotification, NotificationType, NotificationPriority } from '@/types/notification';

// Client-side notification service that works in browser
export const ClientNotification = {
  /**
   * Create a notification using API
   */
  create: async (userId: string, data: Partial<AppNotification> & { title: string; message: string; type: NotificationType }) => {
    const notification = {
      userId,
      isRead: false,
      isArchived: false,
      created_at: new Date().toISOString(),
      priority: 'medium', // default
      ...data
    };

    return apiClient('/api/notifications/trigger', {
      method: 'POST',
      body: JSON.stringify({
        trigger: 'create_notification',
        payload: notification
      })
    });
  },

  /**
   * Broadcast to multiple users using API
   */
  broadcast: async (userIds: string[], data: Partial<AppNotification> & { title: string; message: string; type: NotificationType }) => {
    // De-duplicate targets
    const uniqueTargets = Array.from(new Set(userIds));

    if (uniqueTargets.length === 0) return;

    return apiClient('/api/notifications/trigger', {
      method: 'POST',
      body: JSON.stringify({
        trigger: 'create_batch_notifications',
        payload: { userIds: uniqueTargets, params: data }
      })
    });
  },

  /**
   * Get admin user IDs using API
   */
  getAdminIds: async (): Promise<string[]> => {
    try {
      const response = await apiClient('/api/users/admins', {
        method: 'GET'
      });
      return (response.admins || []).map((admin: any) => admin.uid);
    } catch (error) {
      console.error('Error fetching admin IDs:', error);
      return [];
    }
  }
};
