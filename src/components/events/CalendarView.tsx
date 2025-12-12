
import React from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Event } from '@/types/event';

interface CalendarViewProps {
    currentDate: Date;
    onDateChange: (date: Date) => void;
    events: Event[];
    onDateClick: (date: Date) => void;
}

export function CalendarView({ currentDate, onDateChange, events, onDateClick }: CalendarViewProps) {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart); // Default starts Sunday
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const nextMonth = () => onDateChange(addMonths(currentDate, 1));
    const prevMonth = () => onDateChange(subMonths(currentDate, 1));

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="bg-white dark:bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                    {format(currentDate, 'MMMM yyyy')}
                </h2>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-[var(--color-bg-subtle)] rounded-full transition-colors text-[var(--color-text-secondary)]">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-[var(--color-bg-subtle)] rounded-full transition-colors text-[var(--color-text-secondary)]">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Grid Header */}
            <div className="grid grid-cols-7 bg-[var(--color-bg-subtle)] border-b border-[var(--color-border)]">
                {weekDays.map(day => (
                    <div key={day} className="py-2 text-center text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7">
                {days.map((day, dayIdx) => {
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isToday = isSameDay(day, new Date());

                    // Check for events on this day
                    const dayEvents = events.filter(e =>
                        isSameDay(new Date(e.date.seconds * 1000), day)
                    );
                    const hasEvents = dayEvents.length > 0;

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => onDateClick(day)}
                            className={`
                min-h-[80px] sm:min-h-[100px] border-b border-r border-[var(--color-border)] relative p-2 cursor-pointer transition-colors
                ${!isCurrentMonth ? 'bg-[var(--color-bg-subtle)]/50 text-gray-300 dark:text-gray-700' : 'bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-subtle)]'}
                ${isToday ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
              `}
                        >
                            <div className="flex justify-between items-start">
                                <span className={`
                    text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                    ${isToday
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'text-[var(--color-text-primary)]'}
                  `}>
                                    {format(day, 'd')}
                                </span>
                                {hasEvents && (
                                    <div className="flex gap-1 mt-1">
                                        {/* Simple dots for mobile/compact */}
                                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                    </div>
                                )}
                            </div>

                            {/* Event Titles (Desktop only or if space permits) */}
                            <div className="mt-1 space-y-1 hidden sm:block">
                                {dayEvents.slice(0, 2).map(ev => (
                                    <div key={ev.id} className="text-[10px] truncate px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
                                        {ev.title}
                                    </div>
                                ))}
                                {dayEvents.length > 2 && (
                                    <div className="text-[10px] text-[var(--color-text-secondary)] pl-1">
                                        +{dayEvents.length - 2} more
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
