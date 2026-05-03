'use client';

import React from 'react';
import { useDashboard } from '@/system/dashboard/DashboardProvider';
import { ReactiveCard } from '@/components/ui/ReactiveCard';
import { Clock, Activity, PauseCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SystemStatusWidget = () => {
    const { metrics } = useDashboard();
    
    if (!metrics) return null;

    const stats = [
        { label: 'Due Today', value: metrics.dueToday || 0, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10' },
        { label: 'In Progress', value: metrics.inProgress || 0, icon: Activity, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { label: 'On Hold', value: metrics.blocked || 0, icon: PauseCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
        { label: 'Completed', value: metrics.completedToday || 0, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    ];

    const totalToday = (metrics.dueToday || 0) + (metrics.completedToday || 0);
    const completionPercent = totalToday > 0 
        ? Math.round(((metrics.completedToday || 0) / totalToday) * 100) 
        : 0;

    const totalTasks = (metrics.dueToday || 0) + (metrics.inProgress || 0) + (metrics.blocked || 0) + (metrics.completedToday || 0);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between">
                    <h2 className="text-xl font-bold tracking-tight text-white/90">System Status</h2>
                    <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Team Today</span>
                </div>
                <span className="text-[13px] text-white opacity-75">{totalTasks} Total Tasks</span>
            </div>

            {/* Team Today Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                {stats.map((stat, idx) => (
                    <ReactiveCard 
                        key={idx} 
                        className="p-[18px] cursor-default dashboard-card-primary card-hover-elevation flex flex-col items-center justify-center text-center transition-all h-full min-h-[110px]"
                    >
                        <div className={cn("mb-1.5 p-1.5 rounded-[12px] flex items-center justify-center", stat.bg, stat.color)}>
                            <stat.icon size={16} />
                        </div>
                        <p className="text-[26px] font-semibold text-white/90 leading-none tracking-tight">
                            {stat.value}
                        </p>
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.05em] mt-1.5 shrink-0">
                            {stat.label}
                        </p>
                    </ReactiveCard>
                ))}
            </div>

            {/* Completion Progress Bar */}
            <ReactiveCard className="p-[18px] dashboard-card-primary card-hover-elevation transition-all flex flex-col justify-center">
                <div className="flex justify-between items-end mb-[14px]">
                    <div>
                        <p className="text-sm font-medium text-white/85 mb-1">Today's Completion</p>
                        <p className="text-sm font-medium text-white/60">
                            {metrics.completedToday || 0} of {totalToday} tasks completed
                        </p>
                    </div>
                    <span className="text-2xl font-black tracking-tighter text-emerald-400">{completionPercent}%</span>
                </div>
                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-1000 ease-out" 
                        style={{ width: `${completionPercent}%` }}
                    />
                </div>
            </ReactiveCard>
        </div>
    );
};
