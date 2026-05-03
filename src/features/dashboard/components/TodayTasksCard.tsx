'use client';

import React from 'react';
import { CheckSquare, User, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactiveCard } from '@/components/ui/ReactiveCard';
import { Skeleton } from '@/components/ui/skeleton';

interface TodayTasksCardProps {
    tasks: any[];
    isLoading: boolean;
    onViewTask: (id: string) => void;
}

export const TodayTasksCard: React.FC<TodayTasksCardProps> = ({ tasks, isLoading, onViewTask }) => {
    const getPriorityColor = (p: string) => {
        switch (p?.toLowerCase()) {
            case 'urgent': return 'bg-red-500/20 text-red-500 border-red-500/30';
            case 'high': return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
            case 'medium': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
            case 'low': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
            default: return 'bg-white/5 text-white/40 border-white/10';
        }
    };

    const getStatusColor = (s: string) => {
        switch (s?.toLowerCase()) {
            case 'completed': 
            case 'done': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'in_progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'review': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'blocked': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-white/5 text-white/40 border-white/10';
        }
    };

    const getStatusLabel = (s: string) => s.replace('_', ' ').toUpperCase();

    return (
        <ReactiveCard className="dashboard-card-primary card-hover-elevation h-full flex flex-col pt-6">
            <div className="flex items-baseline justify-between dashboard-card-header-spacing px-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <CheckSquare size={18} />
                    </div>
                    <h3 className="text-sm font-medium text-white/85">Today's Tasks</h3>
                </div>
                {!isLoading && (
                    <span className="text-[10px] font-bold text-white/50 bg-white/5 px-2 py-1 rounded-full uppercase tracking-widest">
                        {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'}
                    </span>
                )}
            </div>


            <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar max-h-[320px]">
                {isLoading ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="p-3 rounded-[18px] bg-white/[0.02] border border-white/5 flex gap-3 items-center">
                            <Skeleton className="h-4 w-4 rounded bg-white/10" />
                            <Skeleton className="h-4 flex-1 bg-white/5" />
                        </div>
                    ))
                ) : tasks.length > 0 ? (
                    tasks.map((task) => (
                        <div 
                            key={task.id}
                            onClick={() => onViewTask(task.id)}
                            className="group py-3 px-[14px] mx-4 rounded-[18px] bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-emerald-500/30 transition-all cursor-pointer flex items-center justify-between gap-4"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={cn(
                                    "w-2 h-2 rounded-full shrink-0",
                                    task.status === 'done' ? "bg-emerald-500" : task.status === 'in_progress' ? "bg-blue-500" : "bg-white/20"
                                )} />
                                <div className="min-w-0 ml-1.5">
                                    <p className="text-sm font-medium text-white/90 truncate group-hover:text-emerald-400 transition-colors">
                                        {task.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <div className="flex items-center gap-1 text-[9px] text-white/50 font-bold uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                            <User size={10} className="text-white/50" />
                                            <span className="truncate max-w-[80px]">
                                                {task.assigned_to?.[0]?.name || 'Unassigned'}
                                            </span>
                                        </div>
                                        {task.priority && (
                                            <div className={cn(
                                                "text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider whitespace-nowrap",
                                                getPriorityColor(task.priority)
                                            )}>
                                                {task.priority}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className={cn(
                                "text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider whitespace-nowrap mr-2 mt-1",
                                getStatusColor(task.status)
                            )}>
                                {getStatusLabel(task.status)}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <CheckSquare size={32} className="text-white/5 mb-3" />
                        <p className="text-xs text-white/50 font-medium">No active tasks for today.</p>
                    </div>
                )}
            </div>
        </ReactiveCard>
    );
};
