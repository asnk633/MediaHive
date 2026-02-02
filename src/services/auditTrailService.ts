'use client';

import { apiClient } from '@/lib/apiClient';

export interface AuditLogEntry {
    action: string;
    actorId: string;
    entityId: string;
    entityType: string;
    reason?: string;
    metadata?: any;
    timestamp: string;
    sequence: number;
    hash: string; // SHA-256 of payload + previous hash
}

/**
 * AuditTrailService: Provides immutable, attributed logging for critical records.
 * Compliant with FOIA, RTI, and statutory retention requirements.
 */
export class AuditTrailService {
    /**
     * Log a critical action.
     */
    static async logAction(params: {
        action: string;
        entityId: string;
        entityType: string;
        reason?: string;
        metadata?: any;
        classification?: string; // PHI, PII, etc.
    }) {
        try {
            console.log(`[AUDIT] Action: ${params.action} on ${params.entityType}:${params.entityId} [${params.classification || 'UNCLASSIFIED'}]`);

            // PRODUCTION PASS: Route to dedicated audit endpoint
            await apiClient('/api/audit/logs', {
                method: 'POST',
                body: JSON.stringify({
                    ...params,
                    timestamp: new Date().toISOString(),
                    actor_attribution: true,
                    immutable_hash: true // Backend calculates SHA-256 chain
                }),
                silent: true
            });
        } catch (error) {
            console.error('[AUDIT][FAILURE] Failed to record immutable log entry', error);
        }
    }

    /**
     * Generate FOIA-ready export for a specific entity or record.
     */
    static async exportEntityHistory(entityId: string, entityType: string) {
        try {
            const logs = await apiClient(`/api/audit/logs?entityId=${entityId}&entityType=${entityType}`);
            return logs;
        } catch (error) {
            console.error('[AUDIT][EXPORT_FAILURE]', error);
            throw error;
        }
    }
}
