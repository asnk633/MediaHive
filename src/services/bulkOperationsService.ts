import { Task } from '@/types/task';
import { isFeatureEnabled } from '@/app/featureFlags';
import { apiPost } from '@/lib/apiClient';

export interface BulkOperationResult {
  success: boolean;
  message: string;
  results: { taskId: string; updated: boolean }[];
  errors: { taskId: string; error: string }[];
}

export const BulkOperationsService = {
  /**
   * Perform bulk operation on tasks
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
      const result = await apiPost<BulkOperationResult>('/api/tasks/bulk', {
        taskIds,
        operation,
        value
      });

      return result;
    } catch (error) {
      console.error('Error performing bulk operation:', error);

      // Provide more user-friendly error messages
      let errorMessage = 'Failed to perform bulk operation';
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Network error: Please check your connection and try again';
      } else if (error instanceof Error && error.message.includes('403')) {
        errorMessage = 'Access denied: You do not have permission to perform this operation';
      } else if (error instanceof Error && error.message.includes('401')) {
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
   * @param taskIds - Array of task IDs
   * @param operation - Type of operation
   * @param value - Value for the operation
   * @param tasks - Array of task objects for additional context
   * @returns Summary string
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
   * @param taskIds - Array of task IDs to operate on
   * @param operation - Type of operation to perform
   * @returns Validation result
   */
  validateBulkOperation: (
    taskIds: string[],
    operation: 'assign' | 'changePriority' | 'changeStatus' | 'delete'
  ): { isValid: boolean; message: string } => {
    // Check if safety limits feature is enabled
    if (!isFeatureEnabled('safetyLimits')) {
      return { isValid: true, message: '' };
    }

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
        message: `Warning: Changing status of ${taskIds.length} tasks. This action will trigger notifications for each task.`
      };
    }

    // For deletion, add strict warning
    if (operation === 'delete') {
      const message = taskIds.length > 5
        ? `WARNING: You are about to permanently DELETE ${taskIds.length} tasks. This action is irreversible.`
        : `Are you sure you want to permanently delete these tasks?`;

      return {
        isValid: true,
        message: message
      };
    }

    return { isValid: true, message: '' };
  }
};