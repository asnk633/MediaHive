import { adminDb } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';

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
    timestamp: FieldValue;
}

export async function logAuditAction(
    action: AuditAction,
    actor: { uid: string; email?: string; role?: string; ip?: string | null },
    target: { id: string; collection: string; name?: string },
    metadata?: Record<string, any>
) {
    try {
        const db = adminDb;

        const entry: AuditLogEntry = {
            action,
            actor: {
                uid: actor.uid,
                email: actor.email,
                role: actor.role,
                ip: actor.ip || 'unknown'
            },
            target,
            metadata,
            timestamp: FieldValue.serverTimestamp()
        };

        await db.collection('audit_logs').add(entry);
    } catch (error) {
        // Fail safe - do not crash app if audit fails, but log stderr
        console.error('[AUDIT_LOG_FAILURE]', error);
    }
}
