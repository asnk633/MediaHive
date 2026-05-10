import { AppNotification, CreateNotificationParams } from '@/types/notification';
import { supabase } from '@/lib/supabaseClient';
import { eventBus } from '@/system/events/eventSystem';
import { tenantContext } from '@/lib/auth/tenantContext';
import { tenantQuery, fromTable } from '@/lib/db/tenantQuery';
import { NotificationSchema } from '@/domain/schemas/notification';
import { TABLES } from '@/lib/dbTables';


export class AlertService {
  static init() {
    console.log('[AlertService] Initializing event subscriptions');

    // 1. Task Completed -> Notify Assigner
    eventBus.subscribe('task.completed', (data) => {
      console.log('[AlertService] Task completed event received:', data);
      
      // Notify the person who assigned the task (if it's not the person who completed it)
      const recipientId = data.assignerId;
      if (recipientId && recipientId !== data.userId) {
          this.createNotification({
            user_id: recipientId,
            created_by: data.userId,
            type: 'task_completed',
            title: 'Task Completed',
            message: `Task "${data.title || data.taskId.slice(0, 8)}" has been marked as done.`,
            entity_type: 'task',
            entity_id: data.taskId,
            priority: 'low'
          }).catch(console.error);
      }
    });

    // 2. Task Created -> Notify Assignees
    eventBus.subscribe('task.created', (data) => {
        console.log('[AlertService] Task created event received:', data);
        if (data.assignedTo && data.assignedTo.length > 0) {
            this.createBatchNotifications(data.assignedTo, {
                type: 'task_assigned',
                title: 'New Task Assigned',
                message: `You have been assigned to: ${data.title}`,
                entity_type: 'task',
                entity_id: data.taskId,
                priority: 'medium'
            }).catch(console.error);
        }
    });

    // 3. Task Status Changed -> Notify Assigner
    eventBus.subscribe('task.updated', (data) => {
      if (data.changes.status && data.assignerId) {
        this.createNotification({
          user_id: data.assignerId,
          type: 'status_changed',
          title: 'Task Status Updated',
          message: `Task "${data.title || data.taskId.slice(0, 8)}" is now: ${data.changes.status.replace('_', ' ')}`,
          entity_type: 'task',
          entity_id: data.taskId,
          priority: 'low'
        }).catch(console.error);
      }
    });

    // 4. Inventory Issued -> Notify Recipient
    eventBus.subscribe('inventory.issued', (data) => {
      this.createNotification({
        user_id: data.userId,
        type: 'inventory_issued',
        title: 'Equipment Issued',
        message: `You have been issued equipment for request #${data.issueId.slice(0, 8)}.`,
        entity_type: 'device_request',
        entity_id: data.issueId,
        priority: 'medium'
      }).catch(console.error);
    });

    // 5. Event Created -> Notify Everyone
    eventBus.subscribe('event.created', async (data) => {
      try {
        const { UserService } = await import('@/services/userService');
        const users = await UserService.getAllUsers();
        const userIds = users.map(u => u.id);
        
        await this.createBatchNotifications(userIds, {
          type: 'event_created',
          title: 'New Event Scheduled',
          message: `New event: ${data.title}`,
          entity_type: 'event',
          entity_id: data.eventId,
          priority: 'medium'
        });
      } catch (error) {
        console.error('[AlertService] Error notifying for event.created:', error);
      }
    });

    // 6. File Uploaded -> Notify Task Assigner or Everyone
    eventBus.subscribe('file.uploaded', async (data) => {
      try {
        if (data.taskId) {
            const { TaskService } = await import('@/services/tasks');
            const task = await TaskService.getTaskById(data.taskId);
            const recipientId = task?.assigned_by?.uid || task?.created_by?.uid;
            
            if (recipientId) {
              await this.createNotification({
                user_id: recipientId,
                type: 'file_uploaded',
                title: 'New File Attached',
                message: `New file "${data.fileName}" uploaded to task: ${task?.title}`,
                entity_type: 'task',
                entity_id: data.taskId,
                priority: 'low'
              });
            }
        } else {
            // Global file upload (e.g. to Downloads page) -> Notify Everyone
            const { UserService } = await import('@/services/userService');
            const users = await UserService.getAllUsers();
            const userIds = users.map(u => u.id);
            
            await this.createBatchNotifications(userIds, {
              type: 'file_uploaded',
              title: 'New File Available',
              message: `A new file "${data.fileName}" has been uploaded to the platform.`,
              entity_type: 'file',
              entity_id: data.fileId,
              priority: 'low'
            });
        }
      } catch (error) {
        console.error('[AlertService] Error notifying for file.uploaded:', error);
      }
    });
  }

  /**
   * Create a new notification.
   * Prevents creation if sourceUserId equals userId (self-notification).
   */
  static async createNotification(params: CreateNotificationParams): Promise<string | null> {
    try {
      const { tenantId, userId } = await tenantContext();

      // Prevent self-notifications
      if (params.created_by && params.created_by === userId) {
        console.log('Skipping self-notification for user:', userId);
        return null;
      }

      const { data, error } = await fromTable(TABLES.NOTIFICATIONS)
        .insert([{
          ...params,
          tenant_id: tenantId,
          read: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('[AlertService] ❌ Notification creation error:', JSON.stringify(error, null, 2));
        throw error;
      }

      return data?.id || null;
    } catch (error) {
      console.error('[AlertService] ❌ Error in createNotification:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  /**
   * Create notifications for multiple users (batch)
   */
  static async createBatchNotifications(userIds: string[], params: Omit<CreateNotificationParams, 'user_id'>): Promise<void> {
    try {
      const { tenantId } = await tenantContext();

      const notifications = userIds.map(userId => ({
        ...params,
        user_id: userId,
        tenant_id: tenantId,
        read: false,
        created_at: new Date().toISOString()
      }));

      const { error } = await fromTable(TABLES.NOTIFICATIONS)
        .insert(notifications);

      if (error) throw error;
    } catch (error) {
      console.error('[AlertService] ❌ Error batch creating notifications:', error);
      throw error;
    }
  }

  /**
   * Fetch active (non-archived) notifications for the current user
   */
  static async getUserNotifications(options: { limit?: number; signal?: AbortSignal } = {}): Promise<AppNotification[]> {
    const { limit = 50, signal } = options;
    try {
      const { tenantId, userId } = await tenantContext();

      const { data, error } = await tenantQuery(TABLES.NOTIFICATIONS, tenantId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
        .abortSignal(signal as any);

      if (error) {
        // ... (error handling already present)
      }

      // DTO Sanitization Layer
      return ((data as any[]) || []).reduce((acc: AppNotification[], item: any) => {
        // Skip empty or clearly invalid items before parsing to prevent noise
        if (!item || Object.keys(item).length === 0 || !item.id) {
          return acc;
        }

        const parsed = NotificationSchema.safeParse(item);
        
        if (!parsed.success) {
          console.warn("[AlertService] 🚨 DROPPING INVALID NOTIFICATION:", {
            id: item.id || 'unknown',
            errors: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
            rawData: item
          });
          return acc; // Skip this item
        }

        const notificationData = parsed.data as any;
        
        // Map database 'body' to 'message' for UI compatibility
        if (notificationData.body && !notificationData.message) {
          notificationData.message = notificationData.body;
        }

        acc.push(notificationData as AppNotification);
        return acc;
      }, []);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return [];
      }
      console.error('[AlertService] ❌ Error in getUserNotifications:', error);
      return [];
    }
  }

  /**
   * Get unread count for the current user
   */
  static async getUnreadCount(): Promise<number> {
    try {
      const { tenantId, userId } = await tenantContext();

      const { count, error } = await fromTable(TABLES.NOTIFICATIONS)
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('[AlertService] ❌ Error getting unread count:', JSON.stringify(error, null, 2));
      return 0;
    }
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const { tenantId } = await tenantContext();

      const { error } = await fromTable(TABLES.NOTIFICATIONS)
        .update({ read: true })
        .eq('tenant_id', tenantId)
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('[AlertService] ❌ Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for the current user
   */
  static async markAllAsRead(): Promise<void> {
    try {
      const { tenantId, userId } = await tenantContext();

      const { error } = await fromTable(TABLES.NOTIFICATIONS)
        .update({ read: true })
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
    } catch (error) {
      console.error('[AlertService] ❌ Error marking all as read:', error);
      throw error;
    }
  }

  /**
   * Soft archive a notification
   */
  static async archiveNotification(notificationId: string): Promise<void> {
    try {
      const { tenantId } = await tenantContext();

      const { error } = await fromTable(TABLES.NOTIFICATIONS)
        .delete()
        .eq('tenant_id', tenantId)
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('[AlertService] ❌ Error deleting notification:', error);
      throw error;
    }
  }
}




export const pushNotification = AlertService.createNotification;
export const deleteNotification = AlertService.archiveNotification;

if (typeof window !== 'undefined') {
  AlertService.init();
}
