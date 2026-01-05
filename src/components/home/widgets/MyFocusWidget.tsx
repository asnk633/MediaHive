import React, { useState } from 'react';
import { Task } from '@/types/task';
import { TaskItem } from '@/components/home/TaskItem';
import { format, formatDistanceToNow } from 'date-fns';
import { AlertCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MyFocusWidgetProps {
    tasks: Task[];
    userId: string;
}

export const MyFocusWidget = ({ tasks, userId }: MyFocusWidgetProps) => {
    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(false);
    const now = new Date();
    const next48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Filter: Urgent / Due Soon
    const urgentTasks = tasks.filter(task => { // Restore filter start
        if (task.status === 'done') return false;

        // Must be assigned to me
        const isAssigned = Array.isArray(task.assignedTo) &&
            task.assignedTo.some(a => (typeof a === 'string' ? a === userId : a.uid === userId));
        if (!isAssigned) return false;

        // Check Priority
        const isUrgentPriority = task.priority === 'high' || task.priority === 'urgent';

        // Check Due Date
        let isDueSoon = false;
        if (task.dueDate) {
            const dateVal = (task.dueDate as any).seconds ? new Date((task.dueDate as any).seconds * 1000) : new Date(task.dueDate);
            isDueSoon = dateVal <= next48h;
        }

        return isUrgentPriority || isDueSoon;
    }); // Removed slice(0, 3) to handle expansion manually

    const displayUrgent = isExpanded ? urgentTasks : urgentTasks.slice(0, 2);
    const hiddenCount = urgentTasks.length - displayUrgent.length;

    // Filter: My Tasks (Assigned to me, NOT in urgent list to avoid duplication if desired, 
    // but typically "My Tasks" lists everything. 
    // User constraints said "My Focus" has a "My Tasks" subsection.
    // Let's exclude urgent ones from the "My Tasks" list specifically to avoid redundancy in the same widget view).

    const urgentIds = new Set(urgentTasks.map(t => t.id));

    const myTasks = tasks.filter(task => { // Restore filter start
        if (task.status === 'done') return false;
        if (urgentIds.has(task.id)) return false;

        const isAssigned = Array.isArray(task.assignedTo) &&
            task.assignedTo.some(a => (typeof a === 'string' ? a === userId : a.uid === userId));

        return isAssigned;
    }).slice(0, 5);

    const formatTaskDate = (date: any): string => {
        if (!date) return "";
        try {
            const dateObj = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
            const relative = formatDistanceToNow(dateObj, { addSuffix: true });
            return relative.replace('less than a minute', 'now');
        } catch (e) {
            return "";
        }
    };

    if (urgentTasks.length === 0 && myTasks.length === 0) return null;

    return (
        <div className="space-y-6">
            {/* SUBSECTION 2.1: Due Soon / Urgent */}
            {urgentTasks.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                        <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest">
                            Due Soon / Urgent
                        </h3>
                    </div>

                    <div className="space-y-3">
                        {displayUrgent.map(task => (
                            <div key={task.id} className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20 rounded-2xl transition-all duration-300 hover:border-red-500/40">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 border border-red-500/30">
                                        <AlertCircle size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white group-hover:text-red-100 transition-colors">
                                            {task.title}
                                        </p>
                                        <p className="text-xs text-red-300/70 mt-0.5 flex items-center gap-1">
                                            <Clock size={10} />
                                            {formatTaskDate(task.dueDate)}
                                            <span className="w-1 h-1 rounded-full bg-red-500/50 mx-1" />
                                            {task.priority?.toUpperCase()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {(hiddenCount > 0 || isExpanded && urgentTasks.length > 2) && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="w-full py-2 text-xs font-medium text-red-400 hover:text-red-300 transition-colors flex items-center justify-center gap-2 border-t border-red-500/10 mt-2"
                            >
                                {isExpanded ? 'Show Less' : `+${hiddenCount} more urgent tasks`}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* SUBSECTION 2.2: My Tasks */}
            {myTasks.length > 0 && (
                <div className="space-y-3">
                    <div className="flex justify-between items-end mb-2">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-1">
                            My Tasks
                        </h3>
                        <button
                            onClick={() => router.push('/tasks')}
                            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            See All
                        </button>
                    </div>

                    <div className="space-y-3">
                        {myTasks.map(task => (
                            <TaskItem
                                key={task.id}
                                title={task.title}
                                date={formatTaskDate(task.dueDate)}
                                isCompleted={false}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
