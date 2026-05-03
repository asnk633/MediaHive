import { TimestampLike } from '@/types/timestamp';

/**
 * Conflict Detection Type Definitions
 */

export type ConflictType =
    | 'user_on_leave'
    | 'media_off_day'
    | 'pending_tasks'
    | 'event_collision';

export type ConflictSeverity = 'warning' | 'error';

export interface Conflict {
    type: ConflictType;
    severity: ConflictSeverity;
    message: string;
    details: ConflictDetails;
}

export interface ConflictDetails {
    // For user_on_leave
    leaveRequest?: {
        id: string;
        type: string;
        startDate: Date;
        endDate: Date;
        status: string;
    };

    // For media_off_day
    offDayInfo?: {
        reason: 'sunday' | 'holiday';
        eventName?: string;
        event_id?: string;
    };

    // For pending_tasks
    tasks?: Array<{
        id: string;
        title: string;
        due_date: Date;
        status: string;
    }>;

    // For event_collision
    existingEvent?: {
        id: string;
        title: string;
        date: Date;
    };
}

export interface ConflictResult {
    hasConflicts: boolean;
    conflicts: Conflict[];
}

export interface LeaveConflict {
    leaveRequestId: string;
    leaveType: string;
    startDate: Date;
    endDate: Date;
}

export interface TaskConflict {
    taskId: string;
    taskTitle: string;
    due_date: Date;
    status: string;
}

export interface OffDayConflict {
    reason: 'sunday' | 'holiday';
    eventName?: string;
    event_id?: string;
}
