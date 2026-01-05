import { apiClient } from '@/lib/apiClient';

export const MediaAutomationAuditService = {
  /**
   * Log a media automation action in the audit trail
   * @param userId - The UID of the user triggering the action
   * @param actionType - The type of automation action
   * @param details - Additional details about the action
   * @param institutionId - The institution ID for tenant isolation
   */
  logAutomationAction: async (
    userId: string,
    actionType: 'new_version_notification_sent' | 'media_approved_notification_sent' | 'final_approval_notification_sent',
    details: any,
    institutionId: string
  ): Promise<void> => {
    try {
      await apiClient('/api/audit/media-automation', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          action: actionType,
          resourceType: 'media_automation',
          details: JSON.stringify(details),
          institutionId,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error logging media automation action:', error);
    }
  }
};