// @ts-nocheck

import { logAuditEvent } from '@/app/api/_lib/audit';

export type AuditAction =
    | 'ROLE_CHANGE'
    | 'TASK_ASSIGN'
    | 'TASK_DELETE'
    | 'CAMPAIGN_CREATE'
    | 'CAMPAIGN_UPDATE'
    | 'CAMPAIGN_DELETE'
    | 'NOTIFICATION_SEND'
    | 'FILE_DELETE'
    | 'SYSTEM_EVENT';

interface AuditLogEntry {
    action: AuditAction;
    actor: {
        uid: string;
        email?: string;
        role?: string;
        ip?: string;
    };
    target: {
        id: string;
        collection: string;
        name?: string; // Human readable name if avail
    };
    metadata?: Record<string, any>;
    timestamp: string;
}

export async function logAuditAction(
    action: AuditAction,
    actor: { uid: string; email?: string; role?: string; ip?: string | null },
    target: { id: string; collection: string; name?: string },
    metadata?: Record<string, any>
) {
    try {
        // Unified legacy audit log to the new SQL audit system
        await logAuditEvent(
            actor.uid,
            action,
            target.collection || 'system',
            1, // Default tenant
            target.id || null,
            {
                ...metadata,
                name: target.name,
                actorEmail: actor.email,
                actorRole: actor.role,
                ip: actor.ip || 'unknown'
            }
        );
    } catch (error) {
        // Fail safe - do not crash app if audit fails, but log stderr
        console.error('[AUDIT_LOG_FAILURE]', error);
    }
}
