import React, { useState } from 'react';
import { Task } from "@/features/tasks/types/task";
import { TaskItem } from '@/features/tasks/components/TaskItem';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Clock, CheckSquare, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { nativeNavigate } from '@/lib/utils';
import { HomeTaskRow } from '@/features/tasks/components/HomeTaskRow';
import { format, isSameDay, differenceInDays } from 'date-fns';
import { useItemNavigation } from '@/hooks/useItemNavigation';
import { TaskService as taskService } from '@/services/tasks';
import { ErrorFallback } from '@/components/ui/ErrorFallback';

import { useDashboard } from '@/system/dashboard/DashboardProvider';

export const MyFocusWidget = () => {
    const { tasks, user, error, refresh, mutate } = useDashboard();
    const onRetry = refresh;
    const onTaskMutate = mutate;
    const userId = user?.uid || '';
    const todayOnly = true;
    const maxItems = 6;

    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(false);
    const now = new Date();
    const next48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // 29.2.4 — SORTING & FILTERING
    const filteredTasks = tasks.filter(task => {
        if (task.status === 'done' && !isSameDay(task.completed_at ? new Date(task.completed_at) : now, now)) {
            return false; // Only show tasks completed TODAY if done
        }

        const isAssigned = Array.isArray(task.assignedTo) &&
            task.assignedTo.some(a => a.uid === userId);
        if (!isAssigned) return false;

        if (todayOnly) {
            if (!task.due_date) return false;
            const due_date = new Date(task.due_date);
            const isTodayToday = isSameDay(due_date, now);
            const isOverdue = due_date < now;

            // Suppress tomorrow if today has items
            if (!isTodayToday && !isOverdue) return false;

            return true;
        }

        return true;
    });

    const sortedTasks = [...filteredTasks].sort((a, b) => {
        const getDue = (t: any) => t.due_date ? new Date(t.due_date).getTime() : 0;
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
            const updates = { status: 'done' as any, completed_at: new Date().toISOString() as any };
            if (onTaskMutate) {
                await onTaskMutate(
                    [t.id],
                    updates,
                    async () => { await taskService.updateTaskStatus(t.id, 'done'); },
                    { serializableOp: { type: 'updateTask', args: [t.id, { status: 'done' }] } }
                );
            } else {
                await taskService.updateTaskStatus(t.id, 'done');
            }
        }
    });

    const getTimeContext = (date: any): string => {
        if (!date) return "";
        try {
            const dateObj = new Date(date);
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
            <ErrorFallback
                message="Focus Unavailable"
                onRetry={onRetry}
                className="p-8"
            />
        );
    }

    if (displayTasks.length === 0) {
        return (
            <div className="p-12 rounded-lg border border-border-subtle bg-canvas/50 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full border-2 border-border-subtle flex items-center justify-center text-text-secondary">
                    <CheckSquare size={20} />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-foreground">No tasks scheduled for now</h3>
                    <p className="text-sm text-text-secondary mt-1">
                        Today's schedule is clear.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden glass-card rounded-[16px] border border-foreground/5">
            <div className="divide-y divide-white/5">
                {displayTasks.map((task, index) => (
                    <HomeTaskRow
                        key={task.id}
                        task={task}
                        timeContext={getTimeContext(task.due_date)}
                        isFirst={index === 0}
                        isActive={activeId === task.id}
                        onClick={() => nativeNavigate(`/tasks?id=${task.id}&returnTo=home`, router, 'MyFocus:Row')}
                        onComplete={async () => {
                            const updates = { status: 'done' as any, completed_at: new Date().toISOString() as any };
                            if (onTaskMutate) {
                                await onTaskMutate(
                                    [task.id],
                                    updates,
                                    async () => { await taskService.updateTaskStatus(task.id, 'done'); },
                                    { serializableOp: { type: 'updateTask', args: [task.id, { status: 'done' }] } }
                                );
                            } else {
                                await taskService.updateTaskStatus(task.id, 'done');
                            }
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
