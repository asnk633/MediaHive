import { TimestampLike } from '@/types/timestamp';

export type NotificationType =
    | 'task_assigned'
    | 'priority_updated'
    | 'status_changed'
    | 'task_completed'
    | 'due_reminder'
    | 'file_uploaded'
    | 'event_created'
    | 'event_reminder'
    | 'event_completed'
    | 'announcement'
    | 'task_status_changed' // Phase 2A
    | 'comment_added'       // Phase 2A
    | 'mention'             // Phase 2A
    | 'task_overdue'        // Phase 2A
    | 'task_stuck'          // Phase 2A
    | 'stale_task_warning'  // Phase 2A - Task staleness detection
    | 'stale_task_escalation' // Phase 2A - Escalated stale task notification
    | 'event_updated'       // Phase 2A
    | 'task_created'        // Phase 3 Fix
    | 'approval_request'    // Guest Approval Workflow
    | 'media_proofing'      // Media Proofing Automation
    | 'task_status_suggestion'  // Task State Automation
    | 'task_ready_signal'      // Task State Automation
    | 'task_comment'           // Correction workflow
    | 'info';                  // Generic info

export type NotificationEntityType = 'task' | 'event' | 'announcement' | 'file' | 'device_request';
export type NotificationPriority = 'high' | 'medium' | 'low';

export interface AppNotification {
    id: string;
    userId: string;           // Target user to notify
    sourceUserId?: string;    // User who triggered the action
    type: NotificationType;
    title: string;
    message: string;
    entityType: NotificationEntityType;
    entityId: string;
    actionUrl?: string;       // Navigation intent
    priority: NotificationPriority;
    isRead: boolean;
    isArchived: boolean;      // Soft-delete status
    createdAt: TimestampLike; // Configurable for client/server
    metadata?: Record<string, any>; // Flexible payload for extra data
}

export interface CreateNotificationParams {
    userId: string;
    sourceUserId?: string;
    type: NotificationType;
    title: string;
    message: string;
    entityType: NotificationEntityType;
    entityId: string;
    actionUrl?: string;
    priority?: NotificationPriority;
    metadata?: Record<string, any>;
}
