import React from 'react';
import { Task } from '@/features/tasks/types/task';
import { Event } from '@/features/events/types/event';
import { format, isToday, isTomorrow, addDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Calendar, CheckSquare, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { nativeNavigate } from '@/lib/utils';

interface TimelineWidgetProps {
    tasks: Task[];
    events: Event[];
}

export const TimelineWidget = ({ tasks, events }: TimelineWidgetProps) => {
    const now = new Date();

    // 1. Process Items (Strictly Today only for Dashboard Truthfulness)
    const nowItems: any[] = []; // Past or current hour today
    const upcomingItems: any[] = []; // Future today

    // Process Tasks
    tasks.forEach(task => {
        if (!task.due_date || task.status === 'done') return;
        const date = (task.due_date as any).seconds ? new Date((task.due_date as any).seconds * 1000) : new Date(task.due_date);

        if (isToday(date)) {
            const item = { type: 'task', data: task, date };
            if (date <= now) nowItems.push(item);
            else upcomingItems.push(item);
        }
    });

    // Process Events
    events.forEach(event => {
        if (!event.date) return;
        const date = (event.date as any).seconds ? new Date((event.date as any).seconds * 1000) : (event.date as any).toDate ? (event.date as any).toDate() : new Date(event.date as any);

        if (isToday(date)) {
            const item = { type: 'event', data: event, date };
            if (date <= now) nowItems.push(item);
            else upcomingItems.push(item);
        }
    });

    // Sort Items
    const sortFn = (a: any, b: any) => a.date.getTime() - b.date.getTime();
    nowItems.sort(sortFn);
    upcomingItems.sort(sortFn);

    const router = useRouter();

    const renderItem = (item: any) => {
        const isTask = item.type === 'task';
        const isPast = item.date < new Date();
        const href = isTask
            ? `/tasks?id=${item.data.id}&returnTo=home`
            : `/calendar`; // TODO: Deep link to event when supported

        return (
            <div
                key={`${item.type}-${item.data.id}`}
                onClick={() => nativeNavigate(href, router, `Timeline:${item.type}`)}
                className={`flex gap-4 p-3 rounded-lg hover:bg-surface/50 transition-colors cursor-pointer ${isPast ? 'opacity-50 grayscale-[0.5]' : ''}`}
            >
                {/* Icon Column */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-border-subtle ${isTask ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                    {isTask ? <CheckSquare size={18} /> : <Calendar size={18} />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isPast ? 'text-text-muted line-through' : 'text-foreground'}`}>
                        {isTask ? item.data.title : item.data.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-text-secondary flex items-center gap-1">
                            <Clock size={10} />
                            {isTask ? 'Due at ' : ''}
                            {format(item.date, 'p')}
                        </p>
                        {!isTask && item.data.location && (
                            <span className="text-xs text-text-secondary">
                                @ {item.data.location}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    };


    if (nowItems.length === 0 && upcomingItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-border-subtle rounded-xl bg-surface/30">
                <Calendar size={24} className="text-text-muted mb-3 opacity-50" />
                <p className="text-sm text-text-muted font-medium">No tasks scheduled for now</p>
                <p className="text-[10px] text-text-muted/60 mt-1 uppercase tracking-wider italic">Today is clear</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* NOW SECTION */}
            {nowItems.length > 0 && (
                <div>
                    <h4 className="text-[10px] font-bold text-accent-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse shadow-[0_0_8px_rgba(var(--accent-primary-rgb),0.8)]" />
                        Now
                    </h4>
                    <div className="space-y-2 pl-3 border-l border-border-soft ml-0.5">
                        {nowItems.map(renderItem)}
                    </div>
                </div>
            )}

            {/* UPCOMING SECTION */}
            {upcomingItems.length > 0 && (
                <div className={nowItems.length > 0 ? "pt-4" : ""}>
                    <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-text-muted/30" />
                        Upcoming
                    </h4>
                    <div className="space-y-2 pl-3 border-l border-border-soft ml-0.5">
                        {upcomingItems.map(renderItem)}
                    </div>
                </div>
            )}
        </div>
    );
};
