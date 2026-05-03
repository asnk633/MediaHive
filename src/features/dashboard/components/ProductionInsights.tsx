'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Wrench, ShieldAlert, Cpu, Database, ArrowRight, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactiveCard } from '@/components/ui/ReactiveCard';

interface ProductionInsightsProps {
    data: {
        events: any[];
        tasks: any[];
    };
    isLoading?: boolean;
}

/**
 * ProductionInsights
 * Focused on Resource Health and Strategic Analytics.
 * Handles Equipment Utilization, System Alerts, and Resource Capacity.
 */
export const ProductionInsights: React.FC<ProductionInsightsProps> = ({ data, isLoading }) => {
    const router = useRouter();

    // Equipment Utilization (Strategic Summary)
    const equipMetrics = useMemo(() => {
        const allEquipItems = data.events.flatMap(e => e.equipment || []);
        const uniqueItems = new Set(allEquipItems.map((i: any) => i.id || i.name)).size;
        const totalInventory = 120; // Mock total cap for percentage
        const utilization = Math.round((uniqueItems / totalInventory) * 100);
        return { used: uniqueItems, utilization };
    }, [data.events]);

    // Resource Health (Status of tasks/events)
    const resourceHealth = useMemo(() => {
        const blocked = data.tasks.filter(t => t.status === 'on_hold').length;
        const critical = data.events.filter(e => e.priority === 'High' || e.priority === 'Critical').length;
        return { blocked, critical };
    }, [data.tasks, data.events]);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-48 rounded-[18px] bg-white/[0.02] border border-white/5 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ReactiveCard className="dashboard-card-secondary transition-all pt-6">
                    <div className="flex items-baseline gap-3 dashboard-card-header-spacing px-6">
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                            <Gauge size={18} />
                        </div>
                        <h3 className="text-sm font-medium text-white/85">Storage & Logic</h3>
                    </div>
                    
                    <div className="space-y-4 mx-6 mb-6">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-3xl font-black text-white">{equipMetrics.utilization}%</p>
                                <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Inventory Load</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-white/60">{equipMetrics.used}</p>
                                <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">Items Active</p>
                            </div>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                style={{ width: `${equipMetrics.utilization}%` }}
                            />
                        </div>
                    </div>
                </ReactiveCard>

                <ReactiveCard className="dashboard-card-secondary transition-all pt-6">
                    <div className="flex items-baseline gap-3 dashboard-card-header-spacing px-6">
                        <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
                            <ShieldAlert size={18} />
                        </div>
                        <h3 className="text-sm font-medium text-white/85">System Blockers</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mx-6 mb-6">
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                            <p className="text-2xl font-black text-red-400">{resourceHealth.blocked}</p>
                            <p className="text-[9px] text-white/50 font-black uppercase tracking-widest">On Hold</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                            <p className="text-2xl font-black text-amber-400">{resourceHealth.critical}</p>
                            <p className="text-[9px] text-white/50 font-black uppercase tracking-widest">High Priority</p>
                        </div>
                    </div>
                </ReactiveCard>

                <ReactiveCard className="dashboard-card-secondary transition-all pt-6">
                    <div className="flex items-baseline gap-3 dashboard-card-header-spacing px-6">
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                            <Cpu size={18} />
                        </div>
                        <h3 className="text-sm font-medium text-white/85">Reliability Score</h3>
                    </div>
                    
                    <div className="flex items-center justify-between mx-6 mb-6">
                        <div>
                            <p className="text-4xl font-black text-white tracking-tighter">94.2</p>
                            <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mt-1">Excellent +4%</p>
                        </div>
                        <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-blue-500 flex items-center justify-center relative mr-1.5">
                             <div className="text-[10px] font-bold text-white/40">SYS</div>
                        </div>
                    </div>
                </ReactiveCard>
            </div>
        </div>
    );
};
