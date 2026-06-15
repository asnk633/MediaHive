'use client';

import React from 'react';
import { Task } from "@/features/tasks/types/task";
import { ReactiveCard } from '@/components/ui/ReactiveCard';
import { Clock, Activity, PauseCircle, CheckCircle, CheckSquare, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskSummaryWidgetProps {
    tasks: Task[];
}

export const TaskSummaryWidget = ({ tasks }: TaskSummaryWidgetProps) => {
    const stats = [
        { 
            label: 'Total', 
            value: tasks.length, 
            icon: CheckSquare, 
            color: 'text-primary', 
            bg: 'bg-primary/10',
            colSpan: 'col-span-2 lg:col-span-1'
        },
        { 
            label: 'To Do', 
            value: tasks.filter(t => t.status === 'todo').length, 
            icon: ListTodo, 
            color: 'text-blue-400', 
            bg: 'bg-blue-400/10',
            colSpan: 'col-span-2 lg:col-span-2'
        },
        { 
            label: 'Due Today', 
            value: tasks.filter(t => t.isDueToday !== undefined && t.isDueToday).length, 
            icon: Clock, 
            color: 'text-amber-400', 
            bg: 'bg-amber-400/10',
            colSpan: 'col-span-2 lg:col-span-2'
        },
        { 
            label: 'In Progress', 
            value: tasks.filter(t => t.status === 'in_progress').length, 
            icon: Activity, 
            color: 'text-yellow-400', 
            bg: 'bg-yellow-400/10',
            colSpan: 'col-span-2 lg:col-span-2'
        },
        { 
            label: 'On Hold', 
            value: tasks.filter(t => t.status === 'on_hold').length, 
            icon: PauseCircle, 
            color: 'text-red-400', 
            bg: 'bg-red-400/10',
            colSpan: 'col-span-2 lg:col-span-2'
        },
        { 
            label: 'Done', 
            value: tasks.filter(t => t.status === 'done').length, 
            icon: CheckCircle, 
            color: 'text-emerald-400', 
            bg: 'bg-emerald-400/10',
            colSpan: 'col-span-2 lg:col-span-1'
        },
    ];

    return (
        <div className="grid grid-cols-4 lg:grid-cols-10 gap-3 md:gap-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            {stats.map((stat, idx) => (
                <ReactiveCard 
                    key={idx} 
                    className={cn(
                        "p-4 md:p-5 cursor-default glass-liquid rounded-[20px] md:rounded-[24px] flex flex-col items-center justify-center text-center shadow-sm group transition-all",
                        stat.colSpan
                    )}
                >
                    <div className={cn("mb-1.5 p-1.5 rounded-[16px] md:rounded-[18px] flex items-center justify-center transition-transform group-hover:scale-105", stat.bg, stat.color)}>
                        <stat.icon size={16} />
                    </div>
                    <p className="text-[22px] md:text-[26px] font-semibold text-foreground/90 leading-none tracking-tight">
                        {stat.value}
                    </p>
                    <p className="text-[9px] md:text-[10px] font-bold text-foreground/70 uppercase tracking-[0.05em] mt-1 shrink-0 whitespace-nowrap">
                        {stat.label}
                    </p>
                </ReactiveCard>
            ))}
        </div>
    );
};
