import React, { useState } from 'react';
import { Task } from '@/types/task';
import { TaskItem } from '@/components/home/TaskItem';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Clock, CheckSquare, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { nativeNavigate } from '@/lib/utils';
import { HomeTaskRow } from '@/components/home/HomeTaskRow';
import { format, isSameDay, differenceInDays } from 'date-fns';
import { useItemNavigation } from '@/hooks/useItemNavigation';
import { TaskService } from '@/services/tasks'; // For completion action

interface MyFocusWidgetProps {
    tasks: Task[];
    userId: string;
    error?: string | null;
    onRetry?: () => void;
    todayOnly?: boolean;
    maxItems?: number;
}

export const MyFocusWidget = ({ tasks, userId, error, onRetry, todayOnly, maxItems }: MyFocusWidgetProps) => {
    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(false);
    const now = new Date();
    const next48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // 29.2.4 — SORTING & FILTERING
    const filteredTasks = tasks.filter(task => {
        if (task.status === 'done' && !isSameDay(task.completedAt ? (task.completedAt as any).seconds ? new Date((task.completedAt as any).seconds * 1000) : new Date(task.completedAt) : now, now)) {
            return false; // Only show tasks completed TODAY if done
        }

        const isAssigned = Array.isArray(task.assignedTo) &&
            task.assignedTo.some(a => (typeof a === 'string' ? a === userId : a.uid === userId));
        if (!isAssigned) return false;

        if (todayOnly) {
            if (!task.dueDate) return false;
            const dueDate = (task.dueDate as any).seconds ? new Date((task.dueDate as any).seconds * 1000) : new Date(task.dueDate);
            const isToday = isSameDay(dueDate, now);
            const isOverdue = dueDate < now;

            // Suppress tomorrow if today has items
            if (!isToday && !isOverdue) return false;

            return true;
        }

        return true;
    });

    const sortedTasks = [...filteredTasks].sort((a, b) => {
        const getDue = (t: Task) => t.dueDate ? (t.dueDate as any).seconds ? (t.dueDate as any).seconds * 1000 : new Date(t.dueDate).getTime() : 0;
        const aDue = getDue(a);
        const bDue = getDue(b);
        const aOverdue = aDue < now.getTime() && a.status !== 'done';
        const bOverdue = bDue < now.getTime() && b.status !== 'done';

        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;

        if (a.status === 'in_progress' && b.status !== 'in_progress' && !aOverdue && !bOverdue) return -1;
        if (a.status !== 'in_progress' && b.status === 'in_progress' && !aOverdue && !bOverdue) return 1;

        return aDue - bDue;
    });

    const displayTasks = sortedTasks.slice(0, maxItems || sortedTasks.length);

    // Phase 36-B: Keyboard Logic for Home
    const { activeId } = useItemNavigation({
        items: displayTasks,
        getItemId: (t) => t.id,
        onSelect: (t) => nativeNavigate(`/tasks?id=${t.id}&returnTo=home`, router, 'MyFocus:Row'),
        onComplete: async (t) => {
            // Quick complete from Home
            await TaskService.updateTask(t.id, { status: 'done' });
        }
    });

    const getTimeContext = (date: any): string => {
        if (!date) return "";
        try {
            const dateObj = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
            const now = new Date();

            if (isSameDay(dateObj, now)) {
                return `Due today at ${format(dateObj, 'h:mm a')}`;
            }

            if (dateObj < now) {
                const days = differenceInDays(now, dateObj);
                return `Overdue by ${days === 0 ? 'today' : `${days} ${days === 1 ? 'day' : 'days'}`}`;
            }

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            if (isSameDay(dateObj, tomorrow)) {
                return `Scheduled for tomorrow`;
            }

            return `Due ${format(dateObj, 'MMM d')}`;
        } catch (e) {
            return "";
        }
    };



    if (error) {
        return (
            <div className="p-8 rounded-lg border border-red-500/20 bg-red-500/5 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20">
                    <AlertCircle size={18} />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-white">Focus Unavailable</h3>
                    <p className="text-xs text-text-muted mt-1 mb-3">
                        We couldn't load your focus items.
                    </p>
                    <button
                        onClick={onRetry}
                        className="px-3 py-1.5 text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded border border-red-500/20 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (displayTasks.length === 0) {
        return (
            <div className="p-12 rounded-lg border border-border-subtle bg-canvas/50 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full border-2 border-border-subtle flex items-center justify-center text-text-secondary">
                    <CheckSquare size={20} />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-white">No tasks scheduled for now</h3>
                    <p className="text-sm text-text-secondary mt-1">
                        Today's schedule is clear.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden glass-card rounded-2xl border border-white/5">
            <div className="divide-y divide-white/5">
                {displayTasks.map((task, index) => (
                    <HomeTaskRow
                        key={task.id}
                        task={task}
                        timeContext={getTimeContext(task.dueDate)}
                        isFirst={index === 0}
                        isActive={activeId === task.id}
                        onClick={() => nativeNavigate(`/tasks?id=${task.id}&returnTo=home`, router, 'MyFocus:Row')}
                        onComplete={async () => {
                            await TaskService.updateTask(task.id, { status: 'done' });
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
