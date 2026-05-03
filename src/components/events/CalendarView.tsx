
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
import { motion } from 'framer-motion';

interface CalendarViewProps {
    currentDate: Date;
    onDateChange: (date: Date) => void;
    events: Event[];
    onDateClick: (date: Date) => void;
    onEventClick: (event: Event) => void;
}

export function CalendarView({ currentDate, onDateChange, events, onDateClick, onEventClick }: CalendarViewProps) {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart); // Default starts Sunday
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const nextMonth = () => onDateChange(addMonths(currentDate, 1));
    const prevMonth = () => onDateChange(subMonths(currentDate, 1));

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Optimization: Pre-calculate events by day key (yyyy-MM-dd)
    // This reduces complexity from O(Days * Events) to O(Events) + O(Days)
    const eventsByDay = React.useMemo(() => {
        const map: Record<string, Event[]> = {};
        events.forEach(event => {
            let date: Date;
            if ((event.date as any).seconds) {
                date = new Date((event.date as any).seconds * 1000);
            } else {
                date = new Date(event.date as any);
            }

            if (!isNaN(date.getTime())) {
                const key = format(date, 'yyyy-MM-dd');
                if (!map[key]) map[key] = [];
                map[key].push(event);
            }
        });
        return map;
    }, [events]);

    return (
        <div className="
            bg-glass
            backdrop-blur-xl
            rounded-2xl
            shadow-lg
            overflow-hidden
            text-foreground
        ">
            {/* Header */}
            <div className="flex items-center justify-between p-6">
                <h2 className="text-xl font-bold text-foreground tracking-wide">
                    {format(currentDate, 'MMMM yyyy')}
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={prevMonth}
                        aria-label="Previous month"
                        className="p-2 bg-glass backdrop-blur-sm hover:shadow-md rounded-full transition-all text-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={nextMonth}
                        aria-label="Next month"
                        className="p-2 bg-glass backdrop-blur-sm hover:shadow-md rounded-full transition-all text-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Grid Header */}
            <div className="grid grid-cols-7 bg-transparent">
                {
                    weekDays.map(day => (
                        <div key={day} className="py-4 text-center text-[10px] font-bold text-muted uppercase tracking-widest">
                            {day}
                        </div>
                    ))
                }
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7">
                {
                    days.map((day) => {
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isToday = isSameDay(day, new Date());
                        const isSelected = isSameDay(day, currentDate);
                        const dayKey = format(day, 'yyyy-MM-dd');
                        const dayEvents = eventsByDay[dayKey] || [];
                        const hasEvents = dayEvents.length > 0;

                        return (
                            <div
                                key={day.toString()}
                                onClick={() => onDateClick(day)}
                                className={`
                                group relative p-2 cursor-pointer transition-all duration-300 border-none outline-none
                                ${isCurrentMonth ? 'text-foreground hover:bg-glass hover:backdrop-blur-md hover:shadow-sm z-0 hover:z-10' : 'text-white/30 bg-black/5 dark:bg-black/20'}
                                ${isSelected ? 'bg-glass shadow-md z-10 ring-1 ring-primary/20' : ''}
                                ${isToday ? 'font-bold' : ''}
                                rounded-lg
                                m-1
                                min-h-[100px] sm:min-h-[120px]
                            `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`
                                    w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium transition-all
                                    ${isToday
                                            ? 'bg-primary text-primary-foreground shadow-md scale-110'
                                            : 'text-muted group-hover:text-foreground'
                                        }
                                `}>
                                        {format(day, 'd')}
                                    </span>
                                    {hasEvents && (
                                        <div className="flex gap-1 mt-1">
                                            {/* Mobile Dot Indicator (Replacing list on small screens if needed, but we keep list for now) */}
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]"></div>
                                        </div>
                                    )}
                                </div>

                                {/* Event Titles - Mobile Optimized */}
                                <div className="mt-2 space-y-1">
                                    {/* Visible on all screens now, but styled for touch on mobile? No, keeping hidden on very small screens might be better? 
                                       The original code had 'hidden sm:block'. 
                                       Constraint: "App feels native on mobile". 
                                       On phone, 7 cols is very narrow. Text won't fit. 
                                       Better to keep dots on mobile day view, and maybe show list below?
                                       Or just ensure if they ARE visible (larger phones/tablets), they are tappable.
                                       I will keep 'hidden sm:block' for textual events to avoid clutter/overflow, 
                                       but rely on the cell click (onDateClick) to open the day view/modal for mobile.
                                       I will just ensure the cell itself is touch-friendly.
                                    */}
                                    <div className="hidden sm:block">
                                        {dayEvents.slice(0, 2).map(ev => (
                                            <motion.div
                                                key={ev.id}
                                                layoutId={`event-card-${ev.id}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEventClick(ev);
                                                }}
                                                transition={{ duration: 0.2 }}
                                                className={`
                                            text-[10px] px-2 py-1.5 rounded-lg truncate w-full block mb-1.5 shadow-sm backdrop-blur-sm cursor-pointer
                                            ${(ev as any).is_system_event
                                                        ? 'bg-secondary/80 text-secondary-foreground border-l-2 border-secondary'
                                                        : 'bg-glass text-foreground hover:bg-surface/80 hover:shadow-md transition-all border-none relative overflow-hidden group'}
                                        `}
                                            >
                                                {!(ev as any).is_system_event && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/50 group-hover:bg-primary transition-colors" />}
                                                {(ev as any).is_system_event && <span className="mr-1">🏢</span>}
                                                {ev.title}
                                            </motion.div>
                                        ))}
                                        {dayEvents.length > 2 && (
                                            <div className="text-[10px] text-muted pl-1 font-medium">
                                                +{dayEvents.length - 2} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                }
            </div>
        </div>
    );
}
