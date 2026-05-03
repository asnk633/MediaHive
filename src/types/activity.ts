export interface SystemActivity {
    id: string;
    type: 'task_created' | 'task_status_change' | 'task_priority_change' | 'task_assigned' | 'task_completed' | 'task_deleted' | 'file_uploaded' | 'file_published' | 'file_deleted' | 'inventory_create' | 'inventory_update' | 'inventory_request' | 'inventory_status_change' | 'user_login' | 'system_action' | 'drive_file_detected' | 'drive_file_approved' | 'drive_file_rejected' | 'other';
    entityType: 'task' | 'file' | 'inventory' | 'user' | 'system' | 'drive_queue_item';
    entityId: string;
    title: string;          // Human readable summary
    performed_by: string;    // User Name
    performedByRole: string;
    timestamp: any;         // Firestore Timestamp or ISO string
    metadata?: any;         // Optional extra data (before/after, filename, etc.)
}
