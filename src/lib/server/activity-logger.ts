import { adminDb } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';

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
 * Logs a system activity to Firestore collection 'system_activity'
 * server-only
 * safe: never throws
 * 
 * // SYSTEM ACTIVITY IS APPEND-ONLY. DO NOT MODIFY OR DELETE LOGS.
 */
export async function logSystemActivity(event: SystemActivityLog) {
    try {
        const collectionRef = adminDb.collection('system_activity');

        await collectionRef.add({
            ...event,
            source: event.source || 'system',
            severity: event.severity || 'info',
            visibility: event.visibility || { mode: 'admin' },
            createdAt: new Date().toISOString(), // Primary sort key (ISO string for easy reading/ordering)
            timestamp: FieldValue.serverTimestamp() // Server timestamp for backup/ordering
        });

    } catch (error) {
        // We do NOT want to crash the main request if logging fails
        console.error('[SystemActivity] Failed to log activity:', error);
    }
}

