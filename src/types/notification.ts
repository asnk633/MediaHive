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
    | 'task_reopened'       // Phase 13 Smart Notifications
    | 'approval_request'    // Member Approval Workflow
    | 'media_proofing'      // Media Proofing Automation
    | 'task_status_suggestion'  // Task State Automation
    | 'task_ready_signal'      // Task State Automation
    | 'task_comment'           // Correction workflow
    | 'inventory_issued'       // Phase 6.3
    | 'inventory_returned'     // Phase 6.3
    | 'inventory_due_soon'     // Phase 6.3
    | 'inventory_overdue'      // Phase 6.3
    | 'inventory_escalated'    // Phase 6.3
    | 'system_update'          // System Updates Feature
    | 'info';                  // Generic info

export type NotificationEntityType = 'task' | 'event' | 'announcement' | 'file' | 'device_request' | 'system_update';
export type NotificationPriority = 'high' | 'medium' | 'low';

export interface AppNotification {
    id: string;
    user_id: string;           // Target user to notify
    created_by?: string;       // User who triggered the action
    institution_id?: string;   // Contextual institution
    type: NotificationType;
    title: string;
    message: string;
    entity_type: NotificationEntityType;
    entity_id: string;
    action_url?: string;       // Navigation intent
    priority: NotificationPriority;
    read: boolean;             // isRead -> read
    tenant_id: string;         // 🔒 Multi-tenant isolation
    created_at: TimestampLike; // Configurable for client/server
    metadata?: Record<string, any>; // Flexible payload for extra data
}

export interface CreateNotificationParams {
    user_id: string;
    created_by?: string;
    institution_id?: string;
    type: NotificationType;
    title: string;
    message: string;
    entity_type: NotificationEntityType;
    entity_id: string;
    action_url?: string;
    priority?: NotificationPriority;
    tenant_id?: string;
    metadata?: Record<string, any>;
}
