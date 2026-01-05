import { getFirebaseAuth } from '@/firebase/client';
import { apiClient } from '@/lib/apiClient';
import {
    Conflict,
    ConflictResult,
    LeaveConflict,
    TaskConflict,
    OffDayConflict
} from '@/types/conflict';
import { SystemEventService } from './systemEventService';

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
            const response = await apiClient(`/api/leave/conflicts?userId=${userId}&date=${date.toISOString()}`, {
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
            const response = await apiClient(`/api/system-events/off-day?date=${date.toISOString()}`, {
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
            const response = await apiClient(`/api/tasks/conflicts?userId=${userId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
                method: 'GET'
            });
            
            return response.conflicts || [];
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
        dueDate: Date
    ): Promise<ConflictResult> => {
        const conflicts: Conflict[] = [];

        // Check 1: User on leave
        const leaveConflicts = await ConflictDetectionService.checkUserLeaveConflict(
            assigneeId,
            dueDate
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
        const offDayConflict = await ConflictDetectionService.checkMediaOffDayConflict(dueDate);

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
                        dueDate: task.dueDate,
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
