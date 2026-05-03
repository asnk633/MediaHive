
import { TimestampLike } from '@/types/timestamp';

export interface SystemEvent {
    id: string;
    title: string;
    description?: string;
    type: 'holiday' | 'company' | 'deadline' | 'other';
    is_media_off_day?: boolean;

    // Recurrence logic
    isRecurring: boolean;
    recurrence?: {
        frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
        interval: number; // e.g. 1
        endDate?: string; // ISO string

        // Constraints
        month?: number; // 0-11 (Yearly)
        day?: number;   // 1-31 (Monthly, Yearly)
        weekday?: number; // 0-6 (Weekly)
    };

    // Single instance date (if not recurring)
    date?: TimestampLike;

    created_by: {
        uid: string;
        name: string;
    };
    notificationPreferences?: {
        [key: string]: boolean; // e.g. '15': true, '7': false. If undefined, defaults to Global Rule setting.
    };
    status?: 'active' | 'disabled';
    metadata?: {
        source?: 'leave_request';
        leaveRequestId?: string;
        userId?: string;
        endDate?: TimestampLike;
        [key: string]: any;
    };
    created_at: TimestampLike;
}
