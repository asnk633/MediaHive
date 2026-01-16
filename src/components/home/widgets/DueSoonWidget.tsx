import React from 'react';
import { Task } from '@/types/task';
import { Clock, AlertTriangle } from 'lucide-react';
import { format, isAfter, isBefore, addHours, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';

interface DueSoonWidgetProps {
    tasks: Task[];
    userRole: string;
}

export const DueSoonWidget = ({ tasks, userRole }: DueSoonWidgetProps) => {
    const router = useRouter();

    // Filter tasks due in the next 24 hours
    // Also filter out done tasks
    const dueSoonTasks = tasks.filter(task => {
        if (task.status === 'done' || !task.dueDate) return false;

        // Handle Firestore Timestamp or Date object
        let date: Date;
        if ((task.dueDate as any).seconds) {
            date = new Date((task.dueDate as any).seconds * 1000);
        } else {
            date = new Date(task.dueDate);
        }

        const now = new Date();
        const twentyFourHoursLater = addHours(now, 24);

        return isAfter(date, now) && isBefore(date, twentyFourHoursLater);
    });

    if (dueSoonTasks.length === 0) return null;

    return (
        <div className="bg-surface backdrop-blur-md rounded-2xl p-5 shadow-xl animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-400" />
                    Due Soon
                </h3>
                <span className="text-xs font-mono text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full border border-amber-400/20">
                    {dueSoonTasks.length} Urgent
                </span>
            </div>

            <div className="space-y-3">
                {dueSoonTasks.slice(0, 3).map(task => (
                    <div
                        key={task.id}
                        onClick={() => router.push(`/tasks/view?id=${task.id}`)}
                        className="group bg-glass hover:bg-surface shadow-sm hover:shadow-md rounded-xl p-3 cursor-pointer transition-all duration-300"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-200 group-hover:text-amber-200 truncate transition-colors">
                                    {task.title}
                                </h4>
                                <p className="text-xs text-amber-400/80 mt-1 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Due {format(new Date((task.dueDate as any).seconds * 1000), 'h:mm a')}
                                </p>
                            </div>
                            {task.priority === 'high' && (
                                <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
