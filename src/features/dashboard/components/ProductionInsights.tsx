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
        totalInventory?: number;
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
        const totalInventory = data.totalInventory || 0; 
        const utilization = totalInventory > 0 ? Math.round((uniqueItems / totalInventory) * 100) : 0;
        return { used: uniqueItems, utilization, total: totalInventory };
    }, [data.events, data.totalInventory]);

    // Reliability Score (On-time Task Completion)
    const reliabilityScore = useMemo(() => {
        const total = data.tasks.length;
        if (total === 0) return { score: 100.0, label: "Perfect", color: "text-emerald-400" };
        
        const overdue = data.tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()).length;
        const score = Math.round(((total - overdue) / total) * 1000) / 10;
        
        let label = "Excellent";
        let color = "text-emerald-400";
        if (score < 80) { label = "Warning"; color = "text-amber-400"; }
        if (score < 60) { label = "Critical"; color = "text-red-400"; }
        
        return { score: score.toFixed(1), label, color };
    }, [data.tasks]);

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
                    <div key={i} className="h-48 rounded-[18px] bg-foreground/[0.02] border border-foreground/5 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ReactiveCard className="glass-card rounded-[24px] transition-all pt-6">
                    <div className="flex items-baseline gap-3 dashboard-card-header-spacing px-6">
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                            <Gauge size={18} />
                        </div>
                        <h3 className="text-sm font-medium text-foreground/85">Storage & Logic</h3>
                    </div>
                    
                    <div className="space-y-4 mx-6 mb-6">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-3xl font-black text-foreground">{equipMetrics.utilization}%</p>
                                <p className="text-[10px] text-foreground/70 font-bold uppercase tracking-widest">Inventory Load</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-foreground/80">{equipMetrics.used}</p>
                                <p className="text-[9px] text-foreground/80 font-bold uppercase tracking-widest">Items Active</p>
                            </div>
                        </div>
                        <div className="h-2 bg-foreground/5 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                style={{ width: `${equipMetrics.utilization}%` }}
                            />
                        </div>
                    </div>
                </ReactiveCard>

                <ReactiveCard className="glass-card rounded-[24px] transition-all pt-6">
                    <div className="flex items-baseline gap-3 dashboard-card-header-spacing px-6">
                        <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
                            <ShieldAlert size={18} />
                        </div>
                        <h3 className="text-sm font-medium text-foreground/85">System Blockers</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mx-6 mb-6">
                        <div className="p-4 rounded-xl bg-foreground/[0.02] border border-foreground/5">
                            <p className="text-2xl font-black text-red-400">{resourceHealth.blocked}</p>
                            <p className="text-[9px] text-foreground/70 font-black uppercase tracking-widest">On Hold</p>
                        </div>
                        <div className="p-4 rounded-xl bg-foreground/[0.02] border border-foreground/5">
                            <p className="text-2xl font-black text-amber-400">{resourceHealth.critical}</p>
                            <p className="text-[9px] text-foreground/70 font-black uppercase tracking-widest">High Priority</p>
                        </div>
                    </div>
                </ReactiveCard>

                <ReactiveCard className="glass-card rounded-[24px] transition-all pt-6">
                    <div className="flex items-baseline gap-3 dashboard-card-header-spacing px-6">
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                            <Cpu size={18} />
                        </div>
                        <h3 className="text-sm font-medium text-foreground/85">Reliability Score</h3>
                    </div>
                    
                    <div className="flex items-center justify-between mx-6 mb-6">
                        <div>
                            <p className="text-4xl font-black text-foreground tracking-tighter">{reliabilityScore.score}</p>
                            <p className={cn("text-[10px] font-black uppercase tracking-widest mt-1", reliabilityScore.color)}>
                                {reliabilityScore.label}
                            </p>
                        </div>
                        <div className="w-16 h-16 rounded-full border-4 border-foreground/10 border-t-blue-500 flex items-center justify-center relative mr-1.5">
                             <div className="text-[10px] font-bold text-foreground/80">SYS</div>
                        </div>
                    </div>
                </ReactiveCard>
            </div>
        </div>
    );
};
