'use client';

import { useState, useEffect, useCallback } from 'react';
import { CanonicalDataService, OperationalSummary } from '@/services/canonicalDataService';
import { synergySyncManager } from '@/system/realtimeSync';
import { useAuth } from '@/contexts/AuthContextProvider';
import { useWorkspace } from '@/system/workspace/WorkspaceProvider';
import { toast } from 'sonner';

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

    const fetchOperationalData = useCallback(async () => {
        setIsSyncing(true);
        try {
            const summary = await CanonicalDataService.getTodayOperationalSummary();
            setData(summary);
        } catch (error) {
            console.error('[useOperationalSummary] Fetch error:', error);
            toast.error('Failed to sync operational data');
        } finally {
            setIsLoading(false);
            setIsSyncing(false);
        }
    }, []);

    useEffect(() => {
        fetchOperationalData();

        if (!user?.tenant_id) return;

        const subscriptionId = `operational-summary-${user.tenant_id}-global`;
        
        const setupRealtime = async () => {
            const filter = `tenant_id=eq.${user.tenant_id}`;
            await synergySyncManager.subscribe(
                subscriptionId,
                { table: '*', filter },
                () => {
                    console.log('[useOperationalSummary] Global real-time update detected');
                    fetchOperationalData();
                }
            );
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
