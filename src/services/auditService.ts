import { CanonicalDataService } from './canonicalDataService';
import { TABLES } from '@/lib/dbTables';

export const AuditService = {
    logAction: async (action: string, metadata: Record<string, any> = {}): Promise<void> => {
        try {
            await CanonicalDataService.createRecord(
                TABLES.AUDIT_LOG,
                {
                    action,
                    metadata,
                    timestamp: new Date().toISOString()
                },
                'audit'
            );
        } catch (error) {
            // We don't want audit logging failures to crash the app, but we should know about them
            console.error('[AuditService] Failed to log action:', error);
        }
    }
};
