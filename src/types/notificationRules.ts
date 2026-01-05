
import { TimestampLike } from '@/types/timestamp';

export type NotificationTriggerType = 'before_event_date' | 'after_event_created';
export type NotificationAudience = 'all' | 'admin' | 'media_team' | 'specific_users';

export interface NotificationRule {
    id: string; // "system_event_15_days", etc.
    name: string;
    entityType: 'system_event' | 'event';
    trigger: NotificationTriggerType;
    offsetDays: number; // e.g. 15, 7, 1
    audience: NotificationAudience;
    enabled: boolean;
    templateKey: string; // "event_reminder_15_days", etc.
    description?: string;
}

export interface NotificationLog {
    id: string;
    ruleId: string;
    entityId: string; // Event ID
    targetDate: TimestampLike; // When the notification was meant to be sent (calculated)
    sentAt: TimestampLike;
    recipientCount: number;
    status: 'success' | 'partial' | 'failed';
}
