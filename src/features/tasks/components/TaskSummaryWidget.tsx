'use client';

import React from 'react';
import { Task } from "@/features/tasks/types/task";
import { ReactiveCard } from '@/components/ui/ReactiveCard';
import { Clock, Activity, PauseCircle, CheckCircle, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskSummaryWidgetProps {
    tasks: Task[];
}

export const TaskSummaryWidget = ({ tasks }: TaskSummaryWidgetProps) => {
    const stats = [
        { 
            label: 'Total Tasks', 
            value: tasks.length, 
            icon: CheckSquare, 
            color: 'text-blue-400', 
            bg: 'bg-blue-400/10' 
        },
        { 
            label: 'Due Today', 
            value: tasks.filter(t => t.isDueToday).length, 
            icon: Clock, 
            color: 'text-amber-400', 
            bg: 'bg-amber-400/10' 
        },
        { 
            label: 'In Progress', 
            value: tasks.filter(t => t.status === 'in_progress').length, 
            icon: Activity, 
            color: 'text-indigo-400', 
            bg: 'bg-indigo-400/10' 
        },
        { 
            label: 'On Hold', 
            value: tasks.filter(t => t.status === 'on_hold').length, 
            icon: PauseCircle, 
            color: 'text-red-400', 
            bg: 'bg-red-400/10' 
        },
        { 
            label: 'Completed', 
            value: tasks.filter(t => t.status === 'done').length, 
            icon: CheckCircle, 
            color: 'text-emerald-400', 
            bg: 'bg-emerald-400/10' 
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            {stats.map((stat, idx) => (
                <ReactiveCard 
                    key={idx} 
                    className="p-5 cursor-default card-gradient-border card-hover-elevation backdrop-blur-xl rounded-[18px] flex flex-col items-center text-center bg-white/[0.01] shadow-sm group transition-all"
                >
                    <div className={cn("mb-1.5 p-1.5 rounded-[18px] flex items-center justify-center transition-transform group-hover:scale-105", stat.bg, stat.color)}>
                        <stat.icon size={16} />
                    </div>
                    <p className="text-[26px] font-semibold text-white/90 leading-none tracking-tight">
                        {stat.value}
                    </p>
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.05em] mt-1 shrink-0">
                        {stat.label}
                    </p>
                </ReactiveCard>
            ))}
        </div>
    );
};
