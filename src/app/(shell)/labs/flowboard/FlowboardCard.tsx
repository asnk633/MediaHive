'use client';

import React, { useMemo } from 'react';
import { Task, SmartMetadata } from '@/features/tasks/types/task';
import { Clock, AlertCircle, MessageSquare, Paperclip, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { InventoryItem } from '@/types/inventory'; // Added this import

interface FlowboardCardProps {
    task: Task;
    smartData: SmartMetadata;
    onClick: (task: Task) => void;
}

export const FlowboardCard: React.FC<FlowboardCardProps> = ({ task, smartData, onClick }) => {
    const priorityColor = {
        urgent: 'bg-orange-500',
        high: 'bg-orange-500',
        medium: 'bg-blue-500',
        low: 'bg-slate-500'
    }[task.priority as string] || 'bg-slate-500';

    return (
        <div
            onClick={() => onClick(task)}
            className="group relative bg-surface border border-soft p-4 rounded-xl shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all cursor-pointer overflow-hidden"
        >
            {/* Priority Indicator */}
            <div className={`absolute top-0 right-0 w-1.5 h-full ${priorityColor}`} />

            <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                    <h4 className="text-sm font-semibold text-foreground leading-tight group-hover:text-blue-400 transition-colors">
                        {task.title}
                    </h4>
                </div>

                {task.description && (
                    <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                        {task.description}
                    </p>
                )}

                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3">
                        {task.dueDate && (
                            <div className={`flex items-center gap-1 text-[10px] ${task.isOverdue ? 'text-rose-400' : 'text-muted'}`}>
                                <Clock size={12} />
                                <span>{format(new Date(task.dueDate), 'MMM d')}</span>
                            </div>
                        )}
                        {task.priority === 'high' && (
                            <AlertCircle size={12} className="text-orange-500" />
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {task.status === 'done' && (
                            <CheckCircle2 size={14} className="text-emerald-500" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
