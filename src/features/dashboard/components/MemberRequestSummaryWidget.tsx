'use client';

import React, { useMemo } from 'react';
import { useDashboard } from '@/system/dashboard/DashboardProvider';
import { ReactiveCard } from '@/components/ui/ReactiveCard';
import { ClipboardList, Clock, Activity, CheckCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

import { NormalizedTask } from "@/lib/normalization";

export const MemberRequestSummaryWidget = ({ allowEmpty = true }: { allowEmpty?: boolean }) => {
    const { tasks, user } = useDashboard();
    
    const myStats = useMemo(() => {
        if (!tasks || !user) return null;

        const myTasks = (tasks as NormalizedTask[]).filter(t => {
            const creatorUid = typeof t.created_by === 'string' ? t.created_by : t.created_by?.uid;
            const isAssignee = (t as any).task_assignments?.some((ta: any) => ta.user_id === user.uid);
            return creatorUid === user.uid || t.assigned_by?.uid === user.uid || isAssignee;
        });

        const total = myTasks.length;
        if (total === 0 && !allowEmpty) return null;

        const todo = myTasks.filter(t => t.status === 'todo').length;
        const inProgress = myTasks.filter(t => t.status === 'in_progress').length;
        const review = myTasks.filter(t => t.status === 'review').length;
        const done = myTasks.filter(t => t.status === 'done').length;

        const progress = total > 0 ? Math.round((done / total) * 100) : 0;

        return { total, todo, inProgress, review, done, progress };
    }, [tasks, user]);

    if (!myStats) return null;

    const items: { label: string; value: number; icon: any; color: string; bg: string }[] = [
        { label: 'Pending', value: myStats.todo, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { label: 'In Progress', value: myStats.inProgress, icon: Activity, color: 'text-primary', bg: 'bg-primary/10' },
        { label: 'In Review', value: myStats.review, icon: Search, color: 'text-purple-400', bg: 'bg-purple-400/10' },
        { label: 'Completed', value: myStats.done, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    ];

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between">
                    <h2 className="text-xl font-bold tracking-tight text-foreground/90">My Requests</h2>
                    <span className="text-xs font-bold text-foreground/70 uppercase tracking-widest">Personal Summary</span>
                </div>
                <div className="flex items-center gap-2">
                    <ClipboardList size={14} className="text-primary" />
                    <span className="text-[13px] text-foreground opacity-75">{myStats.total} Total Requests</span>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                {items.map((item: any, idx: number) => (
                    <ReactiveCard 
                        key={idx} 
                        className="p-[18px] cursor-default glass-card rounded-[24px] flex flex-col items-center justify-center text-center transition-all h-full min-h-[110px]"
                    >
                        <div className={cn("mb-1.5 p-1.5 rounded-[12px] flex items-center justify-center", item.bg, item.color)}>
                            <item.icon size={16} />
                        </div>
                        <p className="text-[26px] font-semibold text-foreground/90 leading-none tracking-tight">
                            {item.value}
                        </p>
                        <p className="text-[10px] font-bold text-foreground/70 uppercase tracking-[0.05em] mt-1.5 shrink-0">
                            {item.label}
                        </p>
                    </ReactiveCard>
                ))}
            </div>

            {/* Overall Progress */}
            <ReactiveCard className="p-[18px] glass-card rounded-[24px] transition-all flex flex-col justify-center mt-4">
                <div className="flex justify-between items-end mb-[14px]">
                    <div>
                        <p className="text-sm font-medium text-foreground/85 mb-1">Request Progress</p>
                        <p className="text-sm font-medium text-foreground/80">
                            {myStats.done} of {myStats.total} requests fulfilled
                        </p>
                    </div>
                    <span className="text-2xl font-black tracking-tight text-primary">{Math.round(myStats.progress)}%</span>
                </div>
                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden shadow-inner">
                    <div
                        className="h-full bg-primary rounded-full relative"
                        style={{ width: `${myStats.progress}%` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </div>
                </div>
            </ReactiveCard>
        </div>
    );
};
