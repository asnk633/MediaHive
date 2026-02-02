import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { TaskStats } from '@/services/canonicalDataService';
import { cn } from '@/lib/utils';

interface GuestTaskOverviewWidgetProps {
    stats: TaskStats | null;
}

export function GuestTaskOverviewWidget({ stats }: GuestTaskOverviewWidgetProps) {
    // Safe default to 0 if stats are missing (loading or error)
    const inProgress = stats?.inProgress || 0;
    const dueToday = stats?.dueToday || 0;
    const next7Days = stats?.next7Days || 0;

    // Today's Workload = In Progress + Due Today
    const todaysWorkload = inProgress + dueToday;
    const next7DaysLoad = next7Days;

    // Department Status Logic
    const activeTasksCount = (stats?.inProgress || 0) + (stats?.pending || 0) + (stats?.review || 0);
    let statusText = "Normal Operations";
    let statusColor = "text-green-400 bg-green-500/10 border-green-500/20";

    if (activeTasksCount > 15) {
        statusText = "Critical Load";
        statusColor = "text-red-400 bg-red-500/10 border-red-500/20";
    } else if (activeTasksCount > 5) {
        statusText = "High Volume";
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14 select-none anim-fade-in-up delay-200">
            {/* Card 1: Workload Analysis */}
            <div className="bg-bg-panel border border-border-strong rounded-sm p-8 lg:p-10 relative overflow-hidden shadow-strong ambient-texture">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                <div className="flex flex-col h-full relative z-10">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="h-1 w-3 bg-accent-primary rounded-full" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted opacity-30">Analytical Vectors</h4>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                        <div className="flex items-baseline gap-5 mb-4">
                            <span className="text-5xl font-black text-text-primary tracking-tighter shadow-soft">{activeTasksCount}</span>
                            <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] opacity-40">Active Protocols</span>
                        </div>
                        <div className={cn(
                            "text-[10px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-xs border w-fit mt-6 transition-all shadow-soft",
                            statusText === "High Volume" ? "text-accent-danger bg-accent-danger/5 border-accent-danger/20" : "text-accent-success bg-accent-success/5 border-accent-success/20"
                        )}>
                            {statusText}
                        </div>
                    </div>
                </div>
            </div>

            {/* Card 2: Temporal Projections */}
            <div className="bg-bg-panel border border-border-strong rounded-sm p-8 lg:p-10 shadow-strong ambient-texture relative">
                <div className="flex items-center gap-3 mb-10">
                    <div className="h-1 w-3 bg-accent-primary/20 rounded-full" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted opacity-30">Temporal Queue</h4>
                </div>

                <div className="space-y-8">
                    <div className="flex items-center justify-between border-b border-border-soft pb-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] opacity-40">Imminent (24h)</span>
                            <span className="text-[9px] font-bold text-accent-warning uppercase tracking-widest px-2 py-0.5 bg-accent-warning/5 border border-accent-warning/10 rounded-xs w-fit">High Priority</span>
                        </div>
                        <span className="text-2xl font-black text-text-primary tracking-tighter">{dueToday}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] opacity-40">Projected (7d)</span>
                        <div className="flex items-center gap-4">
                            <Activity size={12} className="text-accent-primary/40" />
                            <span className="text-2xl font-black text-accent-primary tracking-tighter">{next7Days}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
