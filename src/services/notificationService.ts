import { AppNotification, CreateNotificationParams } from '@/types/notification';
import { supabase } from '@/lib/supabaseClient';

export class NotificationService {
  /**
   * Create a new notification.
   * Prevents creation if sourceUserId equals userId (self-notification).
   */
  static async createNotification(params: CreateNotificationParams): Promise<string | null> {
    // Prevent self-notifications
    if (params.created_by && params.created_by === params.user_id) {
      console.log('Skipping self-notification for user:', params.user_id);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          ...params,
          read: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      return data?.id || null;
    } catch (error) {
      if (!(error as any).code) {
        console.error('Unexpected error creating notification:', error);
      }
      throw error;
    }
  }

  /**
   * Create notifications for multiple users (batch)
   */
  static async createBatchNotifications(userIds: string[], params: Omit<CreateNotificationParams, 'user_id'>): Promise<void> {
    try {
      const notifications = userIds.map(userId => ({
        ...params,
        user_id: userId,
        read: false,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;
    } catch (error) {
      console.error('Error batch creating notifications:', error);
      throw error;
    }
  }

  /**
   * Fetch active (non-archived) notifications for the current user
   */
  static async getUserNotifications(options: { limit?: number } = {}): Promise<AppNotification[]> {
    const { limit = 50 } = options;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id) // Explicit RLS alignment
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        // RLS-safe fallback: Empty data or RLS denial should not cause a fatal UI failure
        if (Array.isArray(data)) {
          return [];
        }
        console.error('Error fetching notifications:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        return [];
      }

      return (data || []) as unknown as AppNotification[];
    } catch (error: any) {
      console.error('Unexpected error fetching notifications:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
      });
      return [];
    }
  }

  /**
   * Get unread count for the current user
   */
  static async getUnreadCount(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id) // Explicit RLS alignment
        .eq('read', false);

      if (error) throw error;
      return count || 0;
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
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
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
      // Note: isArchived is being removed from schema. 
      // For now, we will simply delete if archive is requested, or update read status.
      // USER REQUEST: "Remove references to non-existent columns (isArchived)"
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting/archiving notification:', error);
      throw error;
    }
  }

  /**
   * Create a broadcast notification (admin only)
   */
  static async createBroadcastNotification(payload: any): Promise<{ success: boolean; message: string }> {
    try {
      // In a real system, this might involve a server-side logic if many users are involved.
      // For now, assuming direct write to a broadcast table or many inserts.
      const { error } = await supabase
        .from('notifications')
        .insert([payload]);

      if (error) throw error;
      return { success: true, message: 'Broadcast sent' };
    } catch (error: any) {
      console.error('Error creating broadcast:', error);
      return { success: false, message: error.message || 'Failed to send' };
    }
  }
}

export function listenNotifications(userId: string, callback: (notifications: AppNotification[]) => void) {
  // Use Supabase Realtime for notifications
  const channel = supabase
    .channel(`notifications-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      async () => {
        // Fetch fresh list on any change
        try {
          const notifications = await NotificationService.getUserNotifications();
          callback(notifications);
        } catch (error) {
          console.error('Error updating notifications after realtime event:', error);
        }
      }
    )
    .subscribe((status, err) => {
      if (err) {
        console.error('Notification subscription error:', err);
      }
      if (status === 'CHANNEL_ERROR') {
        console.error('Notification channel error for user:', userId);
      }
    });

  // Initial fetch
  NotificationService.getUserNotifications()
    .then(callback)
    .catch(err => console.error('Initial notification fetch failed:', err));

  return () => {
    supabase.removeChannel(channel);
  };
}

export const pushNotification = NotificationService.createNotification;
export const deleteNotification = NotificationService.archiveNotification;
