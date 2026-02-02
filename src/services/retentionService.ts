'use client';

export interface RetentionRule {
    entityType: string;
    retentionPeriodYears: number;
    legalBasis: string;
    archiveLocation: string;
    purgeWorkflow: 'automatic' | 'manual_review';
}

export const STATUTORY_RETENTION_POLICIES: Record<string, RetentionRule> = {
    task: {
        entityType: 'task',
        retentionPeriodYears: 7,
        legalBasis: 'Financial Regulations 2014 & Public Records Act',
        archiveLocation: 'Cold Storage / Archival Database',
        purgeWorkflow: 'manual_review'
    },
    audit_log: {
        entityType: 'audit_log',
        retentionPeriodYears: 10,
        legalBasis: 'Inspector General Oversight Requirements',
        archiveLocation: 'Immutable WORM Storage',
        purgeWorkflow: 'automatic'
    },
    notification: {
        entityType: 'notification',
        retentionPeriodYears: 1,
        legalBasis: 'Operational Transient Data Policy',
        archiveLocation: 'Standard Database',
        purgeWorkflow: 'automatic'
    }
};

/**
 * RecordsRetentionService: Manages data lifecycles for public sector compliance.
 */
export class RecordsRetentionService {
    /**
     * Check if an entity is under "Litigation Hold".
     * In a real system, this would query a central hold registry.
     */
    static async isUnderLitigationHold(entityId: string, entityType: string): Promise<boolean> {
        if (typeof window === 'undefined') return false;
        const holds = localStorage.getItem('active_legal_holds');
        if (!holds) return false;
        const holdList = JSON.parse(holds);
        return holdList.some((h: any) => h.id === entityId && h.type === entityType);
    }

    /**
     * Set a Litigation Hold.
     */
    static async setLitigationHold(entityId: string, entityType: string, reason: string) {
        if (typeof window === 'undefined') return;
        const raw = localStorage.getItem('active_legal_holds') || '[]';
        const holds = JSON.parse(raw);
        holds.push({ id: entityId, type: entityType, reason, timestamp: new Date().toISOString() });
        localStorage.setItem('active_legal_holds', JSON.stringify(holds));
        console.warn(`[LEGAL-HOLD] Entity ${entityType}:${entityId} is now under litigation hold.`);
    }
}
