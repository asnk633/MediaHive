import React from 'react';
import { Task } from '@/types/task';
import { Clock, ArrowUpRight } from 'lucide-react';
import { format, isAfter, isBefore, addHours } from 'date-fns';
import { useRouter } from 'next/navigation';
import { nativeNavigate } from '@/lib/utils';
import { normalizeDate } from '@/lib/dateUtils';

interface DueSoonWidgetProps {
    tasks: Task[];
    userRole: string;
}

export const DueSoonWidget = ({ tasks, userRole }: DueSoonWidgetProps) => {
    const router = useRouter();

    // Filter tasks due in the next 24 hours
    // Also filter out done tasks
    const dueSoonTasks = tasks.filter(task => {
        if (task.status === 'done' || !task.due_date) return false;

        const date = normalizeDate(task.due_date);
        if (!date) return false;

        const now = new Date();
        const twentyFourHoursLater = addHours(now, 24);

        return isAfter(date, now) && isBefore(date, twentyFourHoursLater);
    });

    if (dueSoonTasks.length === 0) return null;

    return (
        <div className="tier3-surface rounded-lg p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-soft">
                <div className="flex items-center gap-2">
                    <Clock size={16} className="text-accent-primary" />
                    <h3 className="text-sm font-semibold text-white">
                        Due Soon
                    </h3>
                </div>
                <span className="text-xs font-medium text-muted bg-surface px-2 py-0.5 rounded-sm">
                    {dueSoonTasks.length}
                </span>
            </div>

            <div className="space-y-3">
                {dueSoonTasks.map((task) => (
                    <div
                        key={task.id}
                        onClick={() => nativeNavigate(`/tasks?taskId=${task.id}`, router, 'DueSoonWidget:Detail')}
                        className="group flex flex-col gap-2 p-3 rounded-md hover:bg-surface cursor-pointer transition-colors border border-transparent hover:border-border-soft"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-text-primary group-hover:text-white truncate max-w-[200px]">
                                {task.title}
                            </span>
                            <span className="text-xs font-medium text-accent-primary">
                                {(() => {
                                    const d = normalizeDate(task.due_date);
                                    return d ? format(d, 'HH:mm') : '';
                                })()}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted">
                                Task
                            </span>
                            <ArrowUpRight size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </div>
                ))}
            </div>
        </div >
    );
};
