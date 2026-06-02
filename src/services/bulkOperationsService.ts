import { Task } from '@/features/tasks/types/task';
import { isFeatureEnabled } from '@/app/featureFlags';
import { apiPost } from '@/lib/apiClient';
import { TaskSchema } from '@/domain/schemas/task';
import { MonitoringService } from '@/services/monitoringService';

export interface BulkOperationResult {
  success: boolean;
  message: string;
  results: { taskId: string; updated: boolean }[];
  errors: { taskId: string; error: string }[];
}

export const BulkOperationsService = {
  /**
   * Perform bulk operation on tasks using the backend API
   * @param taskIds - Array of task IDs to operate on
   * @param operation - Type of operation to perform
   * @param value - Value for the operation
   * @returns Promise with operation results
   */
  performBulkOperation: async (
    taskIds: string[],
    operation: 'assign' | 'changePriority' | 'changeStatus' | 'delete',
    value: any
  ): Promise<BulkOperationResult> => {
    try {
      console.log(`[BulkOperationsService] Performing ${operation} on ${taskIds.length} tasks`);
      
      const { CanonicalDataService } = await import('@/services/canonicalDataService');
      const { ActivityHistory, buildActivityLabel } = await import('@/lib/activityHistory');
      const { getCurrentUser } = await import('@/lib/auth/verifyUser');

      const results: { taskId: string; updated: boolean }[] = [];
      const errors: { taskId: string; error: string }[] = [];

      const user = await getCurrentUser();
      const actorName = user?.full_name || 'You';
      const actorUid = user?.id || 'unknown';

      // OPTIMIZATION: If simple column update or soft delete, use bulkUpdateFields
      if (operation === 'changeStatus' || operation === 'changePriority' || operation === 'delete') {
        const fields: Record<string, any> = {};
        if (operation === 'changeStatus') {
          fields.status = value;
          if (value === 'done') fields.completed_at = new Date().toISOString();
        } else if (operation === 'changePriority') {
          fields.priority = value;
        } else if (operation === 'delete') {
          fields.deleted = true;
        }

        const success = await CanonicalDataService.bulkUpdateFields(
          'tasks', 
          taskIds.map(id => ({ id, fields })),
          'task'
        );

        if (success) {
          const actionName = operation === 'changeStatus' ? 'status_changed' : 
                             operation === 'changePriority' ? 'priority_changed' : 'deleted';
          ActivityHistory.pushBulk(taskIds, {
            action: actionName,
            label: buildActivityLabel(actionName, operation !== 'delete' ? value : undefined, taskIds.length),
            actorUid,
            actorName,
          });

          return {
            success: true,
            message: `Successfully queued ${taskIds.length} ${operation === 'delete' ? 'deletions' : 'updates'}`,
            results: taskIds.map(id => ({ taskId: id, updated: true })),
            errors: []
          };
        }
      }

      // FALLBACK: Sequential for complex relational operations (assign)
      for (const id of taskIds) {
        try {
          const updates: any = {};
          if (operation === 'assign') {
            updates.assigned_to = typeof value === 'string' ? [{ uid: value }] : value;
          }

          const success = await CanonicalDataService.patchFields('tasks', id, updates, 'task');
          if (success) {
            results.push({ taskId: id, updated: true });
          } else {
            errors.push({ taskId: id, error: 'Failed to enqueue' });
          }
        } catch (e: any) {
          errors.push({ taskId: id, error: e.message });
        }
      }

      if (results.length > 0) {
        const { TaskSchema } = await import('@/domain/schemas');
        results.forEach(r => {
            const validation = TaskSchema.safeParse(r);
            if (!validation.success) {
                // We don't block but log it for health auditing
                console.warn(`[BulkOperationsService] Task ${r.taskId} result validation failed`);
            }
        });

        const actionMap: Record<string, any> = { 'assign': 'assigned', 'delete': 'deleted' };
        ActivityHistory.pushBulk(results.map(r => r.taskId), {
          action: actionMap[operation] || 'status_changed',
          label: buildActivityLabel(actionMap[operation] || 'status_changed', operation === 'assign' ? 'Member' : undefined, results.length),
          actorUid,
          actorName,
        });
      }

      return {
        success: errors.length === 0,
        message: errors.length === 0 
          ? `Successfully processed ${results.length} tasks` 
          : `Processed with ${errors.length} errors`,
        results,
        errors
      };
    } catch (error: any) {
      console.error('Error performing bulk operation:', error);
      MonitoringService.error(error, { taskIds, operation, value });

      // Provide more user-friendly error messages
      let errorMessage = error.message || 'Failed to perform bulk operation';
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Network error: Please check your connection and try again';
      } else if (errorMessage.includes('403')) {
        errorMessage = 'Access denied: You do not have permission to perform this operation';
      } else if (errorMessage.includes('401')) {
        errorMessage = 'Session expired: Please log in again';
      }

      return {
        success: false,
        message: errorMessage,
        results: [],
        errors: taskIds.map(id => ({ taskId: id, error: errorMessage }))
      };
    }
  },

  /**
   * Get summary of bulk operation for confirmation dialog
   */
  getOperationSummary: (
    taskIds: string[],
    operation: string,
    value: any,
    tasks: Task[]
  ): string => {
    const taskCount = taskIds.length;

    switch (operation) {
      case 'assign':
        return `Assign ${taskCount} task${taskCount !== 1 ? 's' : ''} to selected user`;

      case 'changePriority':
        return `Change priority of ${taskCount} task${taskCount !== 1 ? 's' : ''} to ${value}`;

      case 'changeStatus':
        return `Change status of ${taskCount} task${taskCount !== 1 ? 's' : ''} to ${value.replace('_', ' ')}`;

      case 'delete':
        return `DELETE ${taskCount} task${taskCount !== 1 ? 's' : ''}. This action cannot be undone.`;

      default:
        return `Perform ${operation} on ${taskCount} task${taskCount !== 1 ? 's' : ''}`;
    }
  },

  /**
   * Validate bulk operation for safety limits
   */
  validateBulkOperation: (
    taskIds: string[],
    operation: 'assign' | 'changePriority' | 'changeStatus' | 'delete'
  ): { isValid: boolean; message: string } => {
    // Limit bulk operations to 50 tasks at a time
    if (taskIds.length > 50) {
      return {
        isValid: false,
        message: `Bulk operation limited to 50 tasks at a time. Selected ${taskIds.length} tasks.`
      };
    }

    // For status changes, add warning for large operations
    if (operation === 'changeStatus' && taskIds.length > 20) {
      return {
        isValid: true,
        message: `Warning: Changing status of ${taskIds.length} tasks.`
      };
    }

    return { isValid: true, message: '' };
  }
};
