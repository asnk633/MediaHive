// @ts-nocheck
import { logAuditEvent } from '@/app/api/_lib/audit';

export interface SystemActivityLog {
    actorId: string;
    actorRole: string;
    action: string;             // machine-readable e.g. "task_created"
    entityType: string;         // "task" | "file" | "drive_scan" | "permission"
    entityId: string;
    summary: string;            // human readable
    metadata?: Record<string, any>;
    source?: string;            // "system" (default), "user", "automation"
    severity?: 'info' | 'warning' | 'critical';
    visibility?: {              // Structure for future extensibility
        mode: 'admin' | 'internal' | 'public';
    };
}

/**
 * Logs a system activity to Supabase via the unified audit system
 * server-only
 * safe: never throws
 */
export async function logSystemActivity(event: SystemActivityLog) {
    try {
        // Map legacy SystemActivityLog to new logAuditEvent
        await logAuditEvent(
            event.actorId,
            event.action || 'system_activity',
            event.entityType || 'system',
            event.metadata?.tenantId || 1, // Fallback to 1 if not provided
            event.entityId || null,
            {
                summary: event.summary,
                role: event.actorRole,
                severity: event.severity || 'info',
                metadata: event.metadata,
                source: event.source || 'system',
                visibility: event.visibility?.mode || 'admin'
            }
        );
    } catch (error) {
        // We do NOT want to crash the main request if logging fails
        console.error('[SystemActivity] Failed to log activity:', error);
    }
}

