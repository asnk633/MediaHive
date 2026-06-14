import { apiClient } from '@/lib/apiClient';
import {
    Conflict,
    ConflictResult,
    LeaveConflict,
    TaskConflict,
    OffDayConflict
} from '@/types/conflict';
import { SystemEventService } from '@/features/events/services/systemEventService';
import { TaskService } from '@/services/tasks';
import { TaskSchema } from '@/domain/schemas/task';

/**
 * Conflict Detection Service
 * 
 * Detects scheduling conflicts between tasks, leave requests, and media off-days.
 */
export const ConflictDetectionService = {
    /**
     * Check if user has approved leave on the given date
     */
    checkUserLeaveConflict: async (
        userId: string,
        date: Date
    ): Promise<LeaveConflict[]> => {
        try {
            const response = await apiClient('/ap' + `i/leave/conflicts?date=${date.toISOString()}`, {
                method: 'GET'
            });

            return response.conflicts || [];
        } catch (error) {
            console.error('Error checking leave conflicts:', error);
            return [];
        }
    },

    /**
     * Check if date is a media off-day (Sunday or holiday)
     */
    checkMediaOffDayConflict: async (date: Date): Promise<OffDayConflict | null> => {
        try {
            const response = await apiClient('/ap' + `i/system-events/off-day?date=${date.toISOString()}`, {
                method: 'GET'
            });

            return response.conflict || null;
        } catch (error) {
            console.error('Error checking media off-day:', error);
            return null;
        }
    },

    /**
     * Check if user has pending tasks during leave period
     */
    checkTaskConflictDuringLeave: async (
        userId: string,
        startDate: Date,
        endDate: Date
    ): Promise<TaskConflict[]> => {
        try {
            const allTasks = await TaskService.getTasks();

            const conflictingTasks = allTasks.filter(task => {
                // DTO Validation
                const parsed = TaskSchema.safeParse(task);
                if (!parsed.success) {
                    console.warn("[ConflictDetectionService] DTO validation failed for task:", parsed.error);
                }

                if (task.status === 'done' || !task.due_date) return false;

                const due = new Date(task.due_date);
                const isAssigned = task.assigned_to?.some(assignee => assignee.uid === userId);
                const fallsInRange = due >= startDate && due <= endDate;

                return isAssigned && fallsInRange;
            });

            return conflictingTasks.map(task => ({
                taskId: task.id,
                taskTitle: task.title,
                due_date: new Date(task.due_date),
                status: task.status
            }));
        } catch (error) {
            console.error('Error checking task conflicts:', error);
            return [];
        }
    },

    /**
     * Comprehensive check for task assignment conflicts
     */
    checkTaskAssignmentConflicts: async (
        assigneeId: string,
        due_date: Date
    ): Promise<ConflictResult> => {
        const conflicts: Conflict[] = [];

        // Check 1: User on leave
        const leaveConflicts = await ConflictDetectionService.checkUserLeaveConflict(
            assigneeId,
            due_date
        );

        leaveConflicts.forEach(leave => {
            conflicts.push({
                type: 'user_on_leave',
                severity: 'warning',
                message: `Assignee is on approved ${leave.leaveType} leave during this period`,
                details: {
                    leaveRequest: {
                        id: leave.leaveRequestId,
                        type: leave.leaveType,
                        startDate: leave.startDate,
                        endDate: leave.endDate,
                        status: 'approved'
                    }
                }
            });
        });

        // Check 2: Media off-day
        const offDayConflict = await ConflictDetectionService.checkMediaOffDayConflict(due_date);

        if (offDayConflict) {
            const message = offDayConflict.reason === 'sunday'
                ? 'Task is due on a Sunday (Media Department off-day)'
                : `Task is due on a holiday: ${offDayConflict.eventName}`;

            conflicts.push({
                type: 'media_off_day',
                severity: 'warning',
                message,
                details: {
                    offDayInfo: offDayConflict
                }
            });
        }

        return {
            hasConflicts: conflicts.length > 0,
            conflicts
        };
    },

    /**
     * Comprehensive check for leave approval conflicts
     */
    checkLeaveApprovalConflicts: async (
        userId: string,
        startDate: Date,
        endDate: Date
    ): Promise<ConflictResult> => {
        const conflicts: Conflict[] = [];

        // Check for pending tasks during leave period
        const taskConflicts = await ConflictDetectionService.checkTaskConflictDuringLeave(
            userId,
            startDate,
            endDate
        );

        taskConflicts.forEach(task => {
            conflicts.push({
                type: 'pending_tasks',
                severity: 'warning',
                message: `User has pending task "${task.taskTitle}" due during leave period`,
                details: {
                    tasks: [{
                        id: task.taskId,
                        title: task.taskTitle,
                        due_date: task.due_date,
                        status: task.status
                    }]
                }
            });
        });

        return {
            hasConflicts: conflicts.length > 0,
            conflicts
        };
    }
};
