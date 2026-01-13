export interface SystemActivity {
    id: string;
    type: 'task_created' | 'task_status_change' | 'task_completed' | 'task_deleted' | 'file_published' | 'file_deleted' | 'inventory_create' | 'inventory_update' | 'event_create' | 'system_action' | 'other';
    entityType: 'task' | 'file' | 'inventory' | 'event' | 'system';
    entityId: string;
    title: string;          // Human readable summary
    performedBy: string;    // User Name
    performedByRole: string;
    timestamp: any;         // Firestore Timestamp or ISO string
    metadata?: any;         // Optional extra data
}
