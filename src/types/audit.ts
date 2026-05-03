export type AuditAction =
    | 'create'
    | 'update'
    | 'delete'
    | 'complete'
    | 'reopen'
    | 'assign'
    | 'structure_change';

export interface AuditChange {
    field: string;
    from: any;
    to: any;
}

export interface AuditLog {
    id: string; // Document ID
    taskId: string;
    action: AuditAction;
    performed_by: {
        uid: string;
        name: string;
        role: string;
        on_behalf_of?: string; // Optional: If verified admin acted as another user (rare)
    };
    timestamp: string; // ISO String
    changes?: AuditChange[];
    metadata?: Record<string, any>; // Flexible for extra context (e.g. "Auto-approved by System")
    source: 'web' | 'mobile' | 'api' | 'system';
}

export interface AuditHistoryRequest {
    taskId: string;
    userRole: string;
    limit?: number;
    cursor?: string;
}

export interface AuditHistoryResponse {
    logs: AuditLog[];
    nextCursor?: string;
}
