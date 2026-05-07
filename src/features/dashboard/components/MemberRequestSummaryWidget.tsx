'use client';

import React, { useMemo } from 'react';
import { useDashboard } from '@/system/dashboard/DashboardProvider';
import { ReactiveCard } from '@/components/ui/ReactiveCard';
import { ClipboardList, Clock, Activity, CheckCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

import { NormalizedTask } from "@/lib/normalization";

export const MemberRequestSummaryWidget = () => {
    const { tasks, user } = useDashboard();
    
    const myStats = useMemo(() => {
        if (!tasks || !user) return null;

        const myTasks = (tasks as NormalizedTask[]).filter(t => {
            const creatorUid = typeof t.created_by === 'string' ? t.created_by : t.created_by?.uid;
            return creatorUid === user.uid || t.assigned_by?.uid === user.uid;
        });

        const total = myTasks.length;
        const todo = myTasks.filter(t => t.status === 'todo').length;
        const inProgress = myTasks.filter(t => t.status === 'in_progress').length;
        const review = myTasks.filter(t => t.status === 'review').length;
        const done = myTasks.filter(t => t.status === 'done' || t.status === 'completed').length;

        const progress = total > 0 ? Math.round((done / total) * 100) : 0;

        return { total, todo, inProgress, review, done, progress };
    }, [tasks, user]);

    if (!myStats) return null;

    const items: { label: string; value: number; icon: any; color: string; bg: string }[] = [
        { label: 'Pending', value: myStats.todo, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10' },
        { label: 'In Progress', value: myStats.inProgress, icon: Activity, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { label: 'In Review', value: myStats.review, icon: Search, color: 'text-purple-400', bg: 'bg-purple-400/10' },
        { label: 'Completed', value: myStats.done, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    ];

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between">
                    <h2 className="text-xl font-bold tracking-tight text-white/90">My Requests</h2>
                    <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Personal Summary</span>
                </div>
                <div className="flex items-center gap-2">
                    <ClipboardList size={14} className="text-blue-400" />
                    <span className="text-[13px] text-white opacity-75">{myStats.total} Total Requests</span>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                {items.map((item: any, idx: number) => (
                    <ReactiveCard 
                        key={idx} 
                        className="p-[18px] cursor-default dashboard-card-primary card-hover-elevation flex flex-col items-center justify-center text-center transition-all h-full min-h-[110px]"
                    >
                        <div className={cn("mb-1.5 p-1.5 rounded-[12px] flex items-center justify-center", item.bg, item.color)}>
                            <item.icon size={16} />
                        </div>
                        <p className="text-[26px] font-semibold text-white/90 leading-none tracking-tight">
                            {item.value}
                        </p>
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.05em] mt-1.5 shrink-0">
                            {item.label}
                        </p>
                    </ReactiveCard>
                ))}
            </div>

            {/* Overall Progress */}
            <ReactiveCard className="p-[18px] dashboard-card-primary card-hover-elevation transition-all flex flex-col justify-center">
                <div className="flex justify-between items-end mb-[14px]">
                    <div>
                        <p className="text-sm font-medium text-white/85 mb-1">Request Progress</p>
                        <p className="text-sm font-medium text-white/60">
                            {myStats.done} of {myStats.total} requests fulfilled
                        </p>
                    </div>
                    <span className="text-2xl font-black tracking-tighter text-blue-400">{myStats.progress}%</span>
                </div>
                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-1000 ease-out" 
                        style={{ width: `${myStats.progress}%` }}
                    />
                </div>
            </ReactiveCard>
        </div>
    );
};
