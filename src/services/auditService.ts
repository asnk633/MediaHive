import { CanonicalDataService } from './canonicalDataService';
import { TABLES } from '@/lib/dbTables';

export const AuditService = {
    logAction: async (action: string, metadata: Record<string, any> = {}, classification: string = 'OPERATIONAL'): Promise<void> => {
        try {
            await CanonicalDataService.createRecord(
                TABLES.AUDIT_LOG,
                {
                    action,
                    metadata,
                    classification,
                    timestamp: new Date().toISOString(),
                    actor_attribution: true,
                    immutable_hash: true
                },
                'audit'
            );
        } catch (error) {
            const { MonitoringService } = require('./monitoringService');
            MonitoringService.error('[AuditService] Failed to log action', error, { action, classification });
        }
    },

    exportEntityHistory: async (entityId: string, entityType: string): Promise<any[]> => {
        const { supabase } = require('@/lib/supabaseClient');
        const { data, error } = await supabase
            .from(TABLES.AUDIT_LOG)
            .select('*')
            .eq('entity_id', entityId)
            .eq('entity_type', entityType)
            .order('timestamp', { ascending: false });

        if (error) {
            const { MonitoringService } = require('./monitoringService');
            MonitoringService.error('[AuditService] Failed to export history', error, { entityId, entityType });
            return [];
        }

        return data || [];
    }
};
