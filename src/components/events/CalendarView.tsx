import React from 'react';
import Link from 'next/link';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isWithinInterval,
    addMonths,
    subMonths,
    min,
    max
} from 'date-fns';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Event } from '@/features/events/types/event';
import { motion, AnimatePresence } from 'framer-motion';
import { EventPreviewCard } from '@/components/calendar/EventPreviewCard';
import { detectEventConflicts } from '@/features/events/utils/conflictDetection';
import { normalizeDate, getEventDays } from '@/features/events/utils/dateNormalization';
import { Portal } from '@/components/ui/portal';
import { cn } from '@/lib/utils';
import { EventHoverTooltip } from './EventHoverTooltip';

interface CalendarViewProps {
    currentDate: Date;
    onDateChange: (date: Date) => void;
    events: Event[];
    onDateClick: (date: Date) => void;
    onDateRangeSelect?: (start: Date, end: Date) => void;
    onEventClick: (event: Event) => void;
}

export function CalendarView({ currentDate, onDateChange, events, onDateClick, onDateRangeSelect, onEventClick }: CalendarViewProps) {
    const [hoveredDate, setHoveredDate] = React.useState<{ date: Date, events: Event[], anchorRect: DOMRect } | null>(null);
    const [hoveredEvent, setHoveredEvent] = React.useState<{ event: Event, anchorRect: DOMRect } | null>(null);
    const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    // Drag to Create State
    const [isDragging, setIsDragging] = React.useState(false);
    const [dragStart, setDragStart] = React.useState<Date | null>(null);
    const [dragEnd, setDragEnd] = React.useState<Date | null>(null);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart); // Default starts Sunday
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const nextMonth = () => onDateChange(addMonths(currentDate, 1));
    const prevMonth = () => onDateChange(subMonths(currentDate, 1));

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Global mouseup to stop dragging
    React.useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isDragging) {
                if (dragStart && dragEnd && !isSameDay(dragStart, dragEnd)) {
                    const finalStart = min([dragStart, dragEnd]);
                    const finalEnd = max([dragStart, dragEnd]);
                    onDateRangeSelect?.(finalStart, finalEnd);
                } else if (dragStart) {
                    onDateClick(dragStart);
                }
                setIsDragging(false);
                setDragStart(null);
                setDragEnd(null);
            }
        };

        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, [isDragging, dragStart, dragEnd, onDateRangeSelect, onDateClick]);

    // Optimization: Pre-calculate events by day key (yyyy-MM-dd)
    const eventsByDay = React.useMemo(() => {
        const map: Record<string, Event[]> = {};
        
        events.forEach(event => {
            const eventDays = getEventDays(event.start_at, event.end_at || event.start_at);
            
            eventDays.forEach(dayKey => {
                if (!map[dayKey]) map[dayKey] = [];
                map[dayKey].push(event);
            });
        });

        // Run conflict detection for each day
        Object.keys(map).forEach(key => {
            map[key] = detectEventConflicts(map[key]);
        });

        return map;
    }, [events]);

    return (
        <div className="
            event-surface
            rounded-2xl
            overflow-hidden
            text-white
            relative
            select-none
        ">
            {/* Hover Preview Card (via Portal) */}
            <AnimatePresence>
                {hoveredDate && !isDragging && !hoveredEvent && (
                    <Portal>
                        <EventPreviewCard
                            isVisible={true}
                            date={hoveredDate.date}
                            events={hoveredDate.events}
                            anchorRect={hoveredDate.anchorRect}
                        />
                    </Portal>
                )}
                {hoveredEvent && !isDragging && (
                    <Portal>
                        <EventHoverTooltip
                            isVisible={true}
                            event={hoveredEvent.event}
                            anchorRect={hoveredEvent.anchorRect}
                        />
                    </Portal>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-white/5">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-black tracking-tighter text-white">
                        {format(currentDate, 'MMMM')}
                        <span className="text-blue-500/50 ml-2">{format(currentDate, 'yyyy')}</span>
                    </h2>
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">Institutional Scheduler</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={prevMonth}
                        aria-label="Previous month"
                        className="calendar-nav-btn"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={nextMonth}
                        aria-label="Next month"
                        className="calendar-nav-btn"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Grid Header */}
            <div className="grid grid-cols-7 bg-white/[0.02] border-b border-white/5">
                {
                    weekDays.map(day => (
                        <div key={day} className="py-4 text-center text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">
                            {day}
                        </div>
                    ))
                }
            </div>

            {/* Days Grid */}
            <div className="flex flex-col gap-px bg-white/5">
                {
                    // Chunk days into weeks (7 days each)
                    Array.from({ length: Math.ceil(days.length / 7) }, (_, i) => days.slice(i * 7, i * 7 + 7)).map((week, weekIdx) => (
                        <div 
                            key={`week-${weekIdx}`} 
                            className="grid grid-cols-7 gap-px bg-transparent"
                        >
                            {week.map((day) => {
                                const isCurrentMonth = isSameMonth(day, monthStart);
                                const isToday = isSameDay(day, new Date());
                                const isSelected = isSameDay(day, currentDate);
                                 const dayKey = format(day, 'yyyy-MM-dd');
                                const dayEvents = eventsByDay[dayKey] || [];
                                const hasConflicts = dayEvents.some((e: any) => e.hasConflict);

                                // Drag selection logic
                                const isInDragRange = isDragging && dragStart && dragEnd && (
                                    isWithinInterval(day, {
                                        start: min([dragStart, dragEnd]),
                                        end: max([dragStart, dragEnd])
                                    })
                                );

                                return (
                                    <div
                                        key={day.toString()}
                                        onMouseDown={(e) => {
                                            if (e.button !== 0 || !window.matchMedia('(hover: hover)').matches) return;
                                            setIsDragging(true);
                                            setDragStart(day);
                                            setDragEnd(day);
                                        }}
                                        onMouseEnter={(e) => {
                                            if (isDragging) {
                                                setDragEnd(day);
                                             } else if (window.matchMedia('(hover: hover)').matches && dayEvents.length > 0) {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                                                hoverTimeoutRef.current = setTimeout(() => {
                                                    setHoveredDate({ 
                                                        date: day, 
                                                        events: dayEvents, 
                                                        anchorRect: rect 
                                                    });
                                                }, 80);
                                            }
                                        }}
                                        onMouseLeave={() => {
                                            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                                            if (!isDragging) setHoveredDate(null);
                                        }}
                                        className={cn(
                                            "group relative p-4 cursor-pointer transition-all duration-300 outline-none flex flex-col min-h-[130px] sm:min-h-[150px]",
                                            !isCurrentMonth ? "bg-black/40 text-white/10" : "bg-[#0a1426]/40 text-white/70 hover:bg-white/[0.04]",
                                            isToday && "bg-blue-500/10 ring-1 ring-inset ring-blue-500/20",
                                            isInDragRange && "bg-blue-500/20 ring-1 ring-inset ring-blue-500/40 z-10"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <span className={cn(
                                                "w-8 h-8 flex items-center justify-center rounded-xl text-sm font-bold transition-all",
                                                isToday ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-white/40 group-hover:text-white"
                                            )}>
                                                {format(day, 'd')}
                                            </span>

                                            {hasConflicts && (
                                                <div className="day-conflict-indicator" title="Scheduling conflict detected">
                                                    <AlertTriangle size={14} className="text-red-500/80 animate-pulse" />
                                                </div>
                                            )}
                                        </div>

                                         {/* Event Indicators Container */}
                                        <div className="flex-1 flex flex-col gap-1.5 z-20">
                                            {dayEvents.slice(0, 3).map((ev: any) => (
                                                <Link
                                                    href={`/events/${ev.id}`}
                                                    key={ev.id}
                                                    onMouseEnter={(e) => {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        setHoveredEvent({ event: ev, anchorRect: rect });
                                                        setHoveredDate(null);
                                                    }}
                                                    onMouseLeave={() => {
                                                        setHoveredEvent(null);
                                                    }}
                                                    className={cn(
                                                        "event-pill text-[10px] font-bold px-2 py-1 rounded-md truncate w-full cursor-pointer block",
                                                        ev.hasConflict && 'bg-red-500/20 text-red-100 border-red-500/40'
                                                    )}
                                                >
                                                    {ev.title}
                                                </Link>
                                            ))}
                                        </div>

                                        {dayEvents.length > 3 && (
                                            <div className="mt-2 text-[9px] font-black text-white/20 uppercase tracking-widest pl-1">
                                                +{dayEvents.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))
                }
            </div>
        </div>
    );
}
