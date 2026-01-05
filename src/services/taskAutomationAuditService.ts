import { apiClient } from '@/lib/apiClient';

export const TaskAutomationAuditService = {
  /**
   * Log a task automation action in the audit trail
   * @param userId - The UID of the user triggering the action
   * @param actionType - The type of automation action
   * @param details - Additional details about the action
   * @param institutionId - The institution ID for tenant isolation
   */
  logAutomationAction: async (
    userId: string,
    actionType: 'task_in_progress_suggestion_sent' | 'task_ready_notification_sent' | 'task_completed_explicitly',
    details: any,
    institutionId: string
  ): Promise<void> => {
    try {
      await apiClient('/api/audit/task-automation', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          action: actionType,
          resourceType: 'task_automation',
          details: JSON.stringify(details),
          institutionId,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error logging task automation action:', error);
    }
  }
};