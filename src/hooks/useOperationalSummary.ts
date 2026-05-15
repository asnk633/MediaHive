'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CanonicalDataService, OperationalSummary } from '@/services/canonicalDataService';
import { synergySyncManager } from '@/system/realtimeSync';
import { useAuth } from '@/contexts/AuthContextProvider';
import { useWorkspace } from '@/system/workspace/WorkspaceProvider';
import { toast } from 'sonner';
import { TABLES } from '@/lib/dbTables';

export function useOperationalSummary() {
    const { user } = useAuth();
    const { currentWorkspaceId } = useWorkspace();
    const [data, setData] = useState<OperationalSummary>({
        events: [],
        tasks: [],
        crew: [],
        equipment: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const syncRef = useRef(false);

    const fetchOperationalData = useCallback(async () => {
        try {
            syncRef.current = true;
            setIsSyncing(true);
            const summary = await CanonicalDataService.getTodayOperationalSummary();
            setData(summary);
        } catch (error) {
            console.error('[useOperationalSummary] Fetch error:', error);
            toast.error('Failed to sync operational data');
        } finally {
            syncRef.current = false;
            setIsSyncing(false);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOperationalData();

        if (!user?.tenant_id) return;

        const subscriptionId = `operational-summary-${user.tenant_id}-global`;
        
        const setupRealtime = async () => {
            const filter = `tenant_id=eq.${user.tenant_id}`;
            // Subscribe to specific tables that affect operational summary to reduce noise
            const tables = [TABLES.TASKS, TABLES.EVENTS, TABLES.EQUIPMENT_BOOKINGS];
            
            for (const table of tables) {
                await synergySyncManager.subscribe(
                    `${subscriptionId}-${table}`,
                    { table, filter },
                    () => {
                        if (syncRef.current) return; // Cooldown/Guard using Ref
                        console.log(`[useOperationalSummary] Real-time update detected on ${table}`);
                        fetchOperationalData();
                    }
                );
            }
        };

        setupRealtime();

        return () => {
            synergySyncManager.unsubscribe(subscriptionId);
        };
    }, [user?.tenant_id, currentWorkspaceId, fetchOperationalData]);

    return {
        data,
        isLoading,
        isSyncing,
        refresh: fetchOperationalData
    };
}
