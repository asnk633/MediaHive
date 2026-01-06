
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

    return (
        <div className="
            bg-gradient-to-r from-[#141e30] to-[#243b55]
            rounded-[15px]
            shadow-[5px_10px_50px_rgba(0,0,0,0.7),-5px_0px_250px_rgba(0,0,0,0.7)]
            overflow-hidden
            text-white
        ">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#ffffff1a]">
                <h2 className="text-xl font-bold text-white tracking-wide font-[gill-sans-mt,sans-serif]">
                    {format(currentDate, 'MMMM yyyy')}
                </h2>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Grid Header */}
            <div className="grid grid-cols-7 bg-white/5 border-b border-[#ffffff1a]">
                {weekDays.map(day => (
                    <div key={day} className="py-3 text-center text-[10px] font-bold text-white/50 uppercase tracking-widest">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7">
                {days.map((day) => {
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isToday = isSameDay(day, new Date());

                    // Check for events on this day
                    const dayEvents = events.filter(e => {
                        const seconds = (e.date as any).seconds || (e.date as any)._seconds;
                        if (seconds) return isSameDay(new Date(seconds * 1000), day);
                        // Fallback for JS Date objects if they slip in
                        return isSameDay(new Date((e.date as any)), day);
                    });
                    const hasEvents = dayEvents.length > 0;

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => onDateClick(day)}
                            className={`
                                min-h-[100px] border-b border-r border-[#ffffff1a] relative p-2 cursor-pointer transition-all duration-200
                                ${!isCurrentMonth ? 'bg-white/[0.02] text-white/20' : 'hover:bg-white/10 text-white/90'}
                                ${isToday ? 'bg-indigo-500/20 shadow-inner' : ''}
                            `}
                        >
                            <div className="flex justify-between items-start">
                                <span className={`
                                    text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                                    ${isToday
                                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40'
                                        : 'text-white/80'}
                                `}>
                                    {format(day, 'd')}
                                </span>
                                {hasEvents && (
                                    <div className="flex gap-1 mt-1">
                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]"></div>
                                    </div>
                                )}
                            </div>

                            {/* Event Titles */}
                            <div className="mt-2 space-y-1 hidden sm:block">
                                {dayEvents.slice(0, 2).map(ev => (
                                    <motion.div
                                        key={ev.id}
                                        layoutId={`event-card-${ev.id}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEventClick(ev);
                                        }}
                                        className={`
                                            text-[10px] truncate px-2 py-0.5 rounded-[4px] border font-medium backdrop-blur-sm transition-colors
                                            ${(ev as any).isSystemEvent
                                                ? 'bg-transparent border border-[#ffffff1a] text-white/40 hover:bg-white/5 hover:text-white/60' // Faded System Event
                                                : 'bg-blue-600/40 border-blue-500/50 text-white shadow-sm hover:bg-blue-600/60 font-bold'} // Highlighted User Event
                                        `}
                                    >
                                        {(ev as any).isSystemEvent && <span className="mr-1">🏢</span>}
                                        {ev.title}
                                    </motion.div>
                                ))}
                                {dayEvents.length > 2 && (
                                    <div className="text-[10px] text-white/40 pl-1 font-medium">
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
