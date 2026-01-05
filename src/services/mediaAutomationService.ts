import { apiClient } from '@/lib/apiClient';
import { ClientNotification } from '@/lib/client-notification';
import { isFeatureEnabled } from '@/app/featureFlags';
import { ExtendedDriveFile } from '@/types/mediaComment';
import { MediaVersioningService } from '@/services/mediaVersioningService';
import { MediaAutomationAuditService } from '@/services/mediaAutomationAuditService';

// In-memory cache to prevent duplicate notifications (in a real implementation, this would be persistent)
const notificationCache = new Map<string, number>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const MediaAutomationService = {
  /**
   * Notify relevant parties when a new media version is uploaded
   * @param newVersion - The newly uploaded version
   * @param originalFile - The original file that was versioned
   * @param uploaderId - The UID of the user who uploaded the new version
   */
  notifyNewVersionUploaded: async (
    newVersion: ExtendedDriveFile,
    originalFile: ExtendedDriveFile,
    uploaderId: string
  ): Promise<void> => {
    try {
      // Check if media aware automation is enabled
      if (!isFeatureEnabled('mediaAwareAutomation')) {
        return;
      }

      // Idempotency check to prevent duplicate notifications
      const cacheKey = `new_version_${newVersion.id}_${uploaderId}`;
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

      // Collect recipients
      const recipients = new Set<string>();

      // If linked to a task, notify the task owner
      if (originalFile.taskId) {
        try {
          const taskResponse = await apiClient(`/api/tasks/${originalFile.taskId}`, {
            method: 'GET'
          });
          
          if (taskResponse.task && taskResponse.task.assignedTo) {
            if (Array.isArray(taskResponse.task.assignedTo)) {
              taskResponse.task.assignedTo.forEach((id: string) => recipients.add(id));
            } else {
              recipients.add(taskResponse.task.assignedTo);
            }
          }
        } catch (error) {
          console.error('Error fetching task for notification:', error);
        }
      }

      // Notify all admins - simplified implementation
      // In a real app, admin IDs would be obtained differently
      // For now, we'll skip admin notifications in client-side implementation
      // const adminIds = await ClientNotification.getAdminIds();
      // adminIds.forEach(id => recipients.add(id));

      // Remove the uploader from recipients to avoid self-notification
      recipients.delete(uploaderId);

      // Send notifications
      if (recipients.size > 0) {
        await ClientNotification.broadcast(Array.from(recipients), {
          type: 'file_uploaded',
          title: 'New Media Version Uploaded',
          message: `New version uploaded for "${originalFile.name}" (Version ${newVersion.versionNumber})`,
          entityType: 'file',
          entityId: newVersion.id,
          actionUrl: `/media/view/${newVersion.id}`,
          sourceUserId: uploaderId,
          priority: 'medium'
        });
      }

      // Log automation action in audit logs
      await MediaAutomationAuditService.logAutomationAction(
        uploaderId,
        'new_version_notification_sent',
        {
          versionGroupId: newVersion.versionGroupId,
          versionNumber: newVersion.versionNumber,
          recipientCount: recipients.size,
          mediaId: newVersion.id
        },
        '1' // Default institution ID for now
      );
    } catch (error) {
      console.error('Error notifying new version upload:', error);
      // Fail-safe: automation errors must NOT block user actions
    }
  },

  /**
   * Notify relevant parties when media is approved
   * @param mediaFile - The approved media file
   * @param approverId - The UID of the user who approved the media
   */
  notifyMediaApproved: async (
    mediaFile: ExtendedDriveFile,
    approverId: string
  ): Promise<void> => {
    try {
      // Check if media aware automation is enabled
      if (!isFeatureEnabled('mediaAwareAutomation')) {
        return;
      }

      // Only trigger for active versions
      if (!mediaFile.isActiveVersion) {
        return;
      }

      // Idempotency check to prevent duplicate notifications
      const cacheKey = `media_approved_${mediaFile.id}_${approverId}`;
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

      // Collect recipients
      const recipients = new Set<string>();

      // Notify the media uploader
      if (mediaFile.uploadedBy) {
        recipients.add(mediaFile.uploadedBy);
      }

      // If linked to a task, notify the task owner
      if (mediaFile.taskId) {
        try {
          const taskResponse = await apiClient(`/api/tasks/${mediaFile.taskId}`, {
            method: 'GET'
          });
          
          if (taskResponse.task && taskResponse.task.assignedTo) {
            if (Array.isArray(taskResponse.task.assignedTo)) {
              taskResponse.task.assignedTo.forEach((id: string) => recipients.add(id));
            } else {
              recipients.add(taskResponse.task.assignedTo);
            }
          }
        } catch (error) {
          console.error('Error fetching task for notification:', error);
        }
      }

      // Remove the approver from recipients to avoid self-notification
      recipients.delete(approverId);

      // Send notifications
      if (recipients.size > 0) {
        await ClientNotification.broadcast(Array.from(recipients), {
          type: 'media_proofing',
          title: 'Media Approved',
          message: `"${mediaFile.name}" has been approved`,
          entityType: 'file',
          entityId: mediaFile.id,
          actionUrl: `/media/view/${mediaFile.id}`,
          sourceUserId: approverId,
          priority: 'medium'
        });
      }

      // Log automation action in audit logs
      await MediaAutomationAuditService.logAutomationAction(
        approverId,
        'media_approved_notification_sent',
        {
          versionGroupId: mediaFile.versionGroupId,
          versionNumber: mediaFile.versionNumber,
          recipientCount: recipients.size,
          mediaId: mediaFile.id
        },
        '1' // Default institution ID for now
      );
    } catch (error) {
      console.error('Error notifying media approval:', error);
      // Fail-safe: automation errors must NOT block user actions
    }
  },

  /**
   * Notify admins when final version is approved
   * @param mediaFile - The approved media file
   * @param approverId - The UID of the user who approved the media
   */
  notifyFinalApproval: async (
    mediaFile: ExtendedDriveFile,
    approverId: string
  ): Promise<void> => {
    try {
      // Check if media aware automation is enabled
      if (!isFeatureEnabled('mediaAwareAutomation')) {
        return;
      }

      // Check if this is the final version (latest active version with no newer inactive versions)
      const versions = await MediaVersioningService.getVersions(mediaFile.versionGroupId || mediaFile.id);
      const activeVersions = versions.filter(v => v.isActiveVersion);
      const inactiveVersions = versions.filter(v => !v.isActiveVersion);
      
      // If there are no inactive versions newer than this one, it's the final version
      const isNewestVersion = inactiveVersions.every(v => 
        (v.versionNumber || 0) <= (mediaFile.versionNumber || 0)
      );

      if (!isNewestVersion) {
        return;
      }

      // Idempotency check to prevent duplicate notifications
      const cacheKey = `final_approval_${mediaFile.id}_${approverId}`;
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

      // Notify all admins - simplified implementation
      // For now, we'll skip admin notifications in client-side implementation
      // const adminIds = await ClientNotification.getAdminIds();
      // 
      // Remove the approver from recipients to avoid self-notification
      // const recipients = adminIds.filter(id => id !== approverId);
      const recipients: string[] = [];  // Empty array - no admin notifications in client-side implementation

      // Send notifications
      if (recipients.length > 0) {
        await ClientNotification.broadcast(recipients, {
          type: 'media_proofing',
          title: 'Final Version Approved',
          message: `Final version approved for "${mediaFile.name}"`,
          entityType: 'file',
          entityId: mediaFile.id,
          actionUrl: `/media/view/${mediaFile.id}`,
          sourceUserId: approverId,
          priority: 'medium'
        });
      }

      // Log automation action in audit logs
      await MediaAutomationAuditService.logAutomationAction(
        approverId,
        'final_approval_notification_sent',
        {
          versionGroupId: mediaFile.versionGroupId,
          versionNumber: mediaFile.versionNumber,
          recipientCount: recipients.length,
          mediaId: mediaFile.id
        },
        '1' // Default institution ID for now
      );
    } catch (error) {
      console.error('Error notifying final approval:', error);
      // Fail-safe: automation errors must NOT block user actions
    }
  }
};