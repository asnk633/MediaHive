'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Calendar, 
    CheckSquare, 
    Briefcase, 
    Plus, 
    Zap,
    RefreshCcw,
    LayoutDashboard
} from 'lucide-react';
import { cn, nativeNavigate } from '@/lib/utils';
import { CanonicalDataService, OperationalSummary } from '@/services/canonicalDataService';
import { synergySyncManager } from '@/system/realtimeSync';
import { TodayEventsCard } from './TodayEventsCard';
import { TodayTasksCard } from './TodayTasksCard';
import { CrewScheduleCard } from './CrewScheduleCard';
import { EquipmentUsageCard } from './EquipmentUsageCard';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContextProvider';

export const ProductionDashboard: React.FC = () => {
    const { user } = useAuth();
    const router = useRouter();
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
            console.error('[ProductionDashboard] Fetch error:', error);
            toast.error('Failed to sync operational data');
        } finally {
            setIsLoading(false);
            setIsSyncing(false);
        }
    }, []);

    useEffect(() => {
        fetchOperationalData();

        // Real-time synchronization
        if (!user?.institution_id) return;

        const subscriptionId = `production-dashboard-${user.institution_id}`;
        
        const setupRealtime = async () => {
            await synergySyncManager.subscribe(
                subscriptionId,
                { table: '*', filter: `tenant_id=eq.${user.tenant_id}` }, // Broad sync for today's view
                () => {
                    console.log('[ProductionDashboard] Real-time update detected');
                    fetchOperationalData();
                }
            );
        };

        setupRealtime();

        return () => {
            synergySyncManager.unsubscribe(subscriptionId);
        };
    }, [user?.institution_id, user?.tenant_id, fetchOperationalData]);

    const handleQuickAction = (route: string) => {
        nativeNavigate(route, router, 'ProductionDashboard (Quick Action)');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Dashboard Grid - Now 2-column for today's focus */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-full min-h-[400px]">
                    <TodayEventsCard 
                        events={data.events} 
                        tasks={data.tasks}
                        isLoading={isLoading} 
                        onViewEvent={(id) => nativeNavigate(`/calendar?id=${id}`, router, 'ProductionDashboard (View Event)')}
                    />
                </div>
                <div className="h-full min-h-[400px]">
                    <TodayTasksCard 
                        tasks={data.tasks} 
                        isLoading={isLoading} 
                        onViewTask={(id) => nativeNavigate(`/tasks?id=${id}`, router, 'ProductionDashboard (View Task)')}
                    />
                </div>
            </div>

            {/* Footer Summary */}
            <div className="p-4 rounded-[18px] bg-foreground/[0.02] border border-foreground/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Zap size={14} className="text-amber-400" />
                    <span className="text-[11px] font-bold text-foreground/80 uppercase tracking-widest">
                        Live monitoring active for {user?.name || user?.fullName || 'Production'}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-foreground/80 uppercase tracking-widest">Connected</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
