// @ts-nocheck
import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Event } from '@/features/events/types/event';
import { AnimatePresence, motion } from 'framer-motion';
import { normalizeDate, getEventDays } from '@/features/events/utils/dateNormalization';
import { EventCard } from '@/components/event/EventCard';
import { cn } from '@/lib/utils';

interface EventListViewProps {
    events: Event[];
    onEventClick: (event: Event) => void;
    showCurrentYearOnly?: boolean;
}

export function EventListView({ events, onEventClick, showCurrentYearOnly = false }: EventListViewProps) {
    const currentYear = new Date().getFullYear();

    // Expansion State
    const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({
        [currentYear]: true,
    });

    const toggleYear = (year: number) => {
        setExpandedYears(prev => ({
            ...prev,
            [year]: !prev[year]
        }));
    };

    if (events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center event-surface">
                <div className="w-16 h-16 bg-foreground/5 rounded-full flex items-center justify-center mb-4">
                    <Calendar className="text-foreground/80" size={32} />
                </div>
                <h3 className="text-lg font-bold text-foreground">Agenda is clear</h3>
                <p className="text-foreground/80 text-sm">Create an event to get started.</p>
            </div>
        );
    }

    // Filter & Grouping Logic
    const groupedEvents = [...events]
        .sort((a, b) => {
            const aStart = normalizeDate(a.start_at)?.getTime() || 0;
            const bStart = normalizeDate(b.start_at)?.getTime() || 0;
            return aStart - bStart;
        })
        .reduce((acc, event) => {
            const eventDays = getEventDays(event.start_at, event.end_at || event.start_at);
        
        eventDays.forEach(dayKey => {
            const date = new Date(dayKey);
            const year = date.getFullYear();

            // STRICT FILTERING RULES
            if (year < currentYear) return;
            if (showCurrentYearOnly && year > currentYear) return;

            const month = date.toLocaleString('default', { month: 'long' });
            const monthIndex = date.getMonth();

            if (!acc[year]) acc[year] = { months: {} };
            if (!acc[year].months[monthIndex]) acc[year].months[monthIndex] = { name: month, events: [] };

            acc[year].months[monthIndex].events.push(event);
        });
        
        return acc;
    }, {} as Record<number, { months: Record<number, { name: string, events: Event[] }> }>);

    // Sort Years
    const sortedYears = Object.keys(groupedEvents).map(Number).sort((a, b) => a - b);

    if (sortedYears.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center event-surface opacity-70">
                <div className="w-12 h-12 bg-foreground/5 rounded-full flex items-center justify-center mb-3">
                    <Calendar className="text-foreground/80" size={24} />
                </div>
                <p className="text-foreground/80 text-sm">No upcoming events found for this period.</p>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {sortedYears.map(year => {
                const yearGroup = groupedEvents[year];
                // Sort Months
                const sortedMonths = Object.keys(yearGroup.months).map(Number).sort((a, b) => a - b);
                const isExpanded = showCurrentYearOnly ? true : (expandedYears[year] ?? false); // Auto-expand if single year mode or expanded state

                return (
                    <div key={year} className="space-y-8">
                        {/* Year Header */}
                        <button
                            onClick={() => !showCurrentYearOnly && toggleYear(year)}
                            disabled={showCurrentYearOnly}
                            className={cn(
                                "relative w-full flex items-center gap-6 text-left group transition-all",
                                showCurrentYearOnly ? 'cursor-default' : 'cursor-pointer'
                            )}
                        >
                            <h2 className={cn(
                                "text-5xl font-black tracking-tighter transition-all",
                                year === currentYear ? 'text-foreground' : 'text-foreground/80 group-hover:text-foreground/80'
                            )}>
                                {year}
                            </h2>

                            <div className="h-px flex-1 bg-foreground/5" />

                            {!showCurrentYearOnly && (
                                <div className="flex items-center gap-4">
                                    <span className="bg-foreground/5 text-foreground/80 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-foreground/5">
                                        {Object.values(yearGroup.months).reduce((sum, m) => sum + m.events.length, 0)} Events
                                    </span>
                                    <div className="text-foreground/80 group-hover:text-foreground transition-colors">
                                        {isExpanded ? <ChevronDown size={28} /> : <ChevronRight size={28} />}
                                    </div>
                                </div>
                            )}
                        </button>

                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.4, ease: "circOut" }}
                                    className="overflow-hidden"
                                >
                                    <div className="space-y-10 pb-8">
                                        {sortedMonths.map(monthIndex => {
                                            const { name: monthName, events: monthEvents } = yearGroup.months[monthIndex];

                                            return (
                                                <div key={`${year}-${monthIndex}`} className="space-y-6">
                                                    {/* Month Header */}
                                                    <div className="flex items-center gap-4">
                                                        <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] whitespace-nowrap">
                                                            {monthName}
                                                        </h3>
                                                        <div className="h-px w-8 bg-primary/20" />
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                        {monthEvents.map((event, idx) => (
                                                            <div key={`${event.id}-${idx}`} className="transition-all duration-200 hover:translate-x-1">
                                                                <EventCard
                                                                    event={event}
                                                                    href={`/events/${event.id}`}
                                                                    className="glass-liquid !p-4 rounded-[20px] border-l-4 border-l-primary/40 hover:border-l-primary transition-all duration-300 shadow-md hover:shadow-primary/10"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
}
