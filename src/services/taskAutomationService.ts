import { ClientNotification } from '@/lib/client-notification';
import { isFeatureEnabled } from '@/app/featureFlags';
import { Task } from '@/types/task';
import { ExtendedDriveFile } from '@/types/mediaComment';
import { MediaService } from '@/services/mediaService';
import { TaskAutomationAuditService } from '@/services/taskAutomationAuditService';
import { apiClient } from '@/lib/apiClient';

// In-memory cache to prevent duplicate notifications (in a real implementation, this would be persistent)
const notificationCache = new Map<string, number>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const TaskAutomationService = {
  /**
   * Check if a task has any media files associated with it
   * @param taskId - The ID of the task to check
   * @returns Boolean indicating if task has media files
   */
  taskHasMedia: async (taskId: string): Promise<boolean> => {
    try {
      const mediaFiles = await MediaService.getFilesForTask(taskId);
      return mediaFiles.length > 0;
    } catch (error) {
      console.error('Error checking task media:', error);
      return false;
    }
  },

  /**
   * Check if a task has any approved media files
   * @param taskId - The ID of the task to check
   * @returns Boolean indicating if task has approved media
   */
  taskHasApprovedMedia: async (taskId: string): Promise<boolean> => {
    try {
      const mediaFiles = await MediaService.getFilesForTask(taskId);
      return mediaFiles.some(file => file.proofingStatus === 'approved' && file.isActiveVersion);
    } catch (error) {
      console.error('Error checking approved media:', error);
      return false;
    }
  },

  /**
   * Suggest task status change to "in_progress" when first media is uploaded
   * PHASE 6.1 — Media Upload → Task Awareness
   * @param taskId - The ID of the task
   * @param uploaderId - The UID of the user who uploaded the media
   */
  suggestTaskInProgress: async (
    taskId: string,
    uploaderId: string
  ): Promise<void> => {
    try {
      // Check if task state automation is enabled
      if (!isFeatureEnabled('taskStateAutomation')) {
        return;
      }

      // Idempotency check to prevent duplicate notifications
      const cacheKey = `task_in_progress_${taskId}_${uploaderId}`;
      const now = Date.now();
      const cachedTime = notificationCache.get(cacheKey);
      
      // Clear expired cache entries
      for (const [key, timestamp] of notificationCache.entries()) {
        if (now - timestamp > CACHE_TTL) {
          notificationCache.delete(key);
        }
      }
      
      // If we've sent this notification recently, skip it
      if (cachedTime && now - cachedTime < CACHE_TTL) {
        return;
      }
      
      // Cache this notification
      notificationCache.set(cacheKey, now);

      // Get the task
      const taskData = await apiClient(`/api/tasks/${taskId}`);
      
      if (!taskData) {
        return;
      }
      
      // Only suggest if task status is "pending" or "todo"
      if (taskData.status !== 'pending' && taskData.status !== 'todo') {
        return;
      }

      // Add a system task comment suggesting status change
      await apiClient(`/api/tasks/${taskId}/activity`, {
        method: 'POST',
        body: JSON.stringify({
          id: Date.now().toString(),
          type: 'comment',
          userId: 'system',
          userName: 'System',
          content: 'Media uploaded — consider marking task as In Progress',
          timestamp: new Date().toISOString()
        })
      });

      // Notify task owner and admins
      const recipients = new Set<string>();
      
      // Add task creator/owner
      const creatorUid = typeof taskData.createdBy === 'string' ? taskData.createdBy : taskData.createdBy?.uid;
      if (creatorUid) {
        recipients.add(creatorUid);
      }
      
      // Add assigned users
      if (taskData.assignedTo && Array.isArray(taskData.assignedTo)) {
        taskData.assignedTo.forEach((assignee: any) => {
          const assigneeUid = typeof assignee === 'string' ? assignee : assignee.uid;
          if (assigneeUid) {
            recipients.add(assigneeUid);
          }
        });
      }

      // Notify all admins - simplified implementation
      // For now, we'll skip admin notifications in client-side implementation
      // const adminIds = await ClientNotification.getAdminIds();
      // adminIds.forEach(id => recipients.add(id));

      // Remove the uploader from recipients to avoid self-notification
      recipients.delete(uploaderId);

      // Send notifications
      if (recipients.size > 0) {
        await ClientNotification.broadcast(Array.from(recipients), {
          type: 'task_status_suggestion',
          title: 'Task Status Suggestion',
          message: 'Media uploaded — consider marking task as In Progress',
          entityType: 'task',
          entityId: taskId,
          actionUrl: `/tasks/view?id=${taskId}`,
          sourceUserId: uploaderId,
          priority: 'medium'
        });
      }

      // Log automation action in audit logs
      await TaskAutomationAuditService.logAutomationAction(
        uploaderId,
        'task_in_progress_suggestion_sent',
        {
          taskId,
          recipientCount: recipients.size
        },
        (taskData.institutionId && taskData.institutionId.toString()) || '1' // Default institution ID
      );
    } catch (error) {
      console.error('Error suggesting task in progress:', error);
      // Fail-safe: automation errors must NOT block user actions
    }
  },

  /**
   * Add system comment and notify when task has approved media
   * PHASE 6.2 — Media Approved → Task Ready Signal
   * @param taskId - The ID of the task
   * @param approverId - The UID of the user who approved the media
   */
  notifyTaskReady: async (
    taskId: string,
    approverId: string
  ): Promise<void> => {
    try {
      // Check if task state automation is enabled
      if (!isFeatureEnabled('taskStateAutomation')) {
        return;
      }

      // Idempotency check to prevent duplicate notifications
      const cacheKey = `task_ready_${taskId}_${approverId}`;
      const now = Date.now();
      const cachedTime = notificationCache.get(cacheKey);
      
      // Clear expired cache entries
      for (const [key, timestamp] of notificationCache.entries()) {
        if (now - timestamp > CACHE_TTL) {
          notificationCache.delete(key);
        }
      }
      
      // If we've sent this notification recently, skip it
      if (cachedTime && now - cachedTime < CACHE_TTL) {
        return;
      }
      
      // Cache this notification
      notificationCache.set(cacheKey, now);

      // Get the task
      const taskData = await apiClient(`/api/tasks/${taskId}`);
      
      if (!taskData) {
        return;
      }
      
      // Add a system task comment
      await apiClient(`/api/tasks/${taskId}/activity`, {
        method: 'POST',
        body: JSON.stringify({
          id: Date.now().toString(),
          type: 'comment',
          userId: 'system',
          userName: 'System',
          content: 'Media approved — task may be ready for completion',
          timestamp: new Date().toISOString()
        })
      });

      // Notify task owner and admins
      const recipients = new Set<string>();
      
      // Add task creator/owner
      const creatorUid = typeof taskData.createdBy === 'string' ? taskData.createdBy : taskData.createdBy?.uid;
      if (creatorUid) {
        recipients.add(creatorUid);
      }
      
      // Add assigned users
      if (taskData.assignedTo && Array.isArray(taskData.assignedTo)) {
        taskData.assignedTo.forEach((assignee: any) => {
          const assigneeUid = typeof assignee === 'string' ? assignee : assignee.uid;
          if (assigneeUid) {
            recipients.add(assigneeUid);
          }
        });
      }

      // Notify all admins - simplified implementation
      // For now, we'll skip admin notifications in client-side implementation
      // const adminIds = await ClientNotification.getAdminIds();
      // adminIds.forEach(id => recipients.add(id));

      // Remove the approver from recipients to avoid self-notification
      recipients.delete(approverId);

      // Send notifications
      if (recipients.size > 0) {
        await ClientNotification.broadcast(Array.from(recipients), {
          type: 'task_ready_signal',
          title: 'Task Ready Signal',
          message: 'Media approved — task may be ready for completion',
          entityType: 'task',
          entityId: taskId,
          actionUrl: `/tasks/view?id=${taskId}`,
          sourceUserId: approverId,
          priority: 'medium'
        });
      }

      // Log automation action in audit logs
      await TaskAutomationAuditService.logAutomationAction(
        approverId,
        'task_ready_notification_sent',
        {
          taskId,
          recipientCount: recipients.size
        },
        (taskData.institutionId && taskData.institutionId.toString()) || '1' // Default institution ID
      );
    } catch (error) {
      console.error('Error notifying task ready:', error);
      // Fail-safe: automation errors must NOT block user actions
    }
  },

  /**
   * Explicitly complete a task (admin-only)
   * PHASE 6.3 — Explicit Auto-Complete (Admin-Only, Optional)
   * @param taskId - The ID of the task to complete
   * @param completerId - The UID of the admin completing the task
   * @returns Boolean indicating success
   */
  completeTask: async (
    taskId: string,
    completerId: string
  ): Promise<boolean> => {
    try {
      // Check if task state automation is enabled
      if (!isFeatureEnabled('taskStateAutomation')) {
        return false;
      }

      // Get the task
      const taskData = await apiClient(`/api/tasks/${taskId}`);
      
      if (!taskData) {
        return false;
      }
      
      // Check if task has media and approved media
      const hasMedia = await TaskAutomationService.taskHasMedia(taskId);
      const hasApprovedMedia = await TaskAutomationService.taskHasApprovedMedia(taskId);
      
      if (!hasMedia || !hasApprovedMedia) {
        return false;
      }

      // Update task status to "done"
      await apiClient(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'done',
          completedAt: new Date().toISOString(),
          completedBy: {
            uid: completerId,
            name: 'System/Admin' // In a real implementation, we'd fetch the actual user name
          },
          updatedAt: new Date().toISOString()
        })
      });

      // Add a system task comment
      await apiClient(`/api/tasks/${taskId}/activity`, {
        method: 'POST',
        body: JSON.stringify({
          id: Date.now().toString(),
          type: 'comment',
          userId: 'system',
          userName: 'System',
          content: 'Task completed after approved media',
          timestamp: new Date().toISOString()
        })
      });

      // Notify relevant parties
      const recipients = new Set<string>();
      
      // Add task creator/owner
      const creatorUid = typeof taskData.createdBy === 'string' ? taskData.createdBy : taskData.createdBy?.uid;
      if (creatorUid) {
        recipients.add(creatorUid);
      }
      
      // Add assigned users
      if (taskData.assignedTo && Array.isArray(taskData.assignedTo)) {
        taskData.assignedTo.forEach((assignee: any) => {
          const assigneeUid = typeof assignee === 'string' ? assignee : assignee.uid;
          if (assigneeUid) {
            recipients.add(assigneeUid);
          }
        });
      }

      // Notify all admins - simplified implementation
      // For now, we'll skip admin notifications in client-side implementation
      // const adminIds = await ClientNotification.getAdminIds();
      // adminIds.forEach(id => recipients.add(id));

      // Remove the completer from recipients to avoid self-notification
      recipients.delete(completerId);

      // Send notifications
      if (recipients.size > 0) {
        await ClientNotification.broadcast(Array.from(recipients), {
          type: 'task_completed',
          title: 'Task Completed',
          message: 'Task completed after approved media',
          entityType: 'task',
          entityId: taskId,
          actionUrl: `/tasks/view?id=${taskId}`,
          sourceUserId: completerId,
          priority: 'medium'
        });
      }

      // Log automation action in audit logs
      await TaskAutomationAuditService.logAutomationAction(
        completerId,
        'task_completed_explicitly',
        {
          taskId,
          recipientCount: recipients.size
        },
        (taskData.institutionId && taskData.institutionId.toString()) || '1' // Default institution ID
      );

      return true;
    } catch (error) {
      console.error('Error completing task:', error);
      // Fail-safe: automation errors must NOT block user actions
      return false;
    }
  }
};