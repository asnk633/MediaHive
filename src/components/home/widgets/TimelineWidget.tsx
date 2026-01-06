import React from 'react';
import { Task } from '@/types/task';
import { Event } from '@/types/event';
import { format, isToday, isTomorrow, addDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Calendar, CheckSquare, Clock } from 'lucide-react';

interface TimelineWidgetProps {
    tasks: Task[];
    events: Event[];
}

export const TimelineWidget = ({ tasks, events }: TimelineWidgetProps) => {
    const now = new Date();
    const next7DaysEnd = addDays(now, 7);

    // Filter items
    const isPastToday = (date: Date) => isToday(date) && date < now;
    const isFutureToday = (date: Date) => isToday(date) && date >= now;

    // 1. Process Items
    const todayItems: any[] = [];
    const upcomingItems: any[] = [];

    // Process Tasks
    tasks.forEach(task => {
        if (!task.dueDate || task.status === 'done') return;
        const date = (task.dueDate as any).seconds ? new Date((task.dueDate as any).seconds * 1000) : new Date(task.dueDate);

        const item = { type: 'task', data: task, date };

        if (isToday(date)) todayItems.push(item);
        else if (date > now && date <= next7DaysEnd) upcomingItems.push(item);
    });

    // Process Events
    events.forEach(event => {
        if (!event.date) return;
        const date = (event.date as any).seconds ? new Date((event.date as any).seconds * 1000) : (event.date as any).toDate ? (event.date as any).toDate() : new Date(event.date as any);

        const item = { type: 'event', data: event, date };

        if (isToday(date)) todayItems.push(item);
        // We do NOT add events to upcomingItems anymore, to avoid duplication with the top "Coming Up" strip.
        // else if (date > now && date <= next7DaysEnd) upcomingItems.push(item);
    });

    // Sort Items
    const sortFn = (a: any, b: any) => a.date.getTime() - b.date.getTime();
    todayItems.sort(sortFn);
    upcomingItems.sort(sortFn);

    const renderItem = (item: any) => {
        const isTask = item.type === 'task';
        const isPast = item.date < new Date();
        return (
            <div key={`${item.type}-${item.data.id}`} className={`flex gap-4 p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/5 hover:bg-white/10 transition-colors ${isPast ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                {/* Icon Column */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${isTask ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-purple-500/20 text-purple-400 border-purple-500/30'}`}>
                    {isTask ? <CheckSquare size={18} /> : <Calendar size={18} />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isPast ? 'text-gray-400 line-through' : 'text-gray-200'}`}>
                        {isTask ? item.data.title : item.data.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock size={10} />
                            {isTask ? 'Due at ' : ''}
                            {format(item.date, 'p')}
                        </p>
                        {!isTask && item.data.location && (
                            <span className="text-xs text-gray-500">
                                @ {item.data.location}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (todayItems.length === 0 && upcomingItems.length === 0) return null;

    return (
        <div className="space-y-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2">
                Timeline
            </h3>

            {/* Today Section */}
            <div>
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                    Today
                </h4>
                <div className="space-y-3 pl-3 border-l border-[#ffffff1a] ml-0.5">
                    {(() => {
                        const pastToday = todayItems.filter(item => isPastToday(item.date));
                        const futureToday = todayItems.filter(item => isFutureToday(item.date));
                        const showDivider = pastToday.length > 0 && futureToday.length > 0;

                        if (todayItems.length === 0) {
                            return <p className="text-xs text-gray-500 italic py-2">No tasks scheduled for today.</p>;
                        }

                        return (
                            <>
                                {pastToday.map(renderItem)}
                                {showDivider && (
                                    <div className="flex items-center gap-2 py-2 -ml-3">
                                        <div className="h-px bg-red-500/20 flex-1" />
                                        <span className="text-[10px] font-bold text-red-500/50 uppercase tracking-widest bg-[#0f172a] px-2 rounded-full border border-red-500/10">NOW</span>
                                        <div className="h-px bg-red-500/20 flex-1" />
                                    </div>
                                )}
                                {futureToday.map(renderItem)}
                            </>
                        );
                    })()}
                </div>
            </div>

            {/* Upcoming Section */}
            {upcomingItems.length > 0 && (
                <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 mt-6">
                        Next 7 Days
                    </h4>
                    <div className="space-y-3 pl-3 border-l border-[#ffffff1a] ml-0.5">
                        {upcomingItems.map(renderItem)}
                    </div>
                </div>
            )}
        </div>
    );
};
