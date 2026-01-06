import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, MapPin, Clock, MoreVertical, Repeat, ChevronDown, ChevronRight } from 'lucide-react';
import { Event } from '@/types/event';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

interface EventListViewProps {
    events: Event[];
    onEventClick: (event: Event) => void;
    showCurrentYearOnly?: boolean;
}

export function EventListView({ events, onEventClick, showCurrentYearOnly = false }: EventListViewProps) {
    const { user } = useAuth();
    const currentYear = new Date().getFullYear();

    // Expansion State
    const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({
        [currentYear]: true,
        [currentYear + 1]: true
    });

    const toggleYear = (year: number) => {
        setExpandedYears(prev => ({
            ...prev,
            [year]: !prev[year]
        }));
    };

    if (events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <Calendar className="text-gray-400" size={32} />
                </div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">No events yet</h3>
                <p className="text-[var(--color-text-secondary)]">Create an event to get started.</p>
            </div>
        );
    }

    // Filter & Grouping Logic
    const groupedEvents = events.reduce((acc, event) => {
        let date: Date;

        // Handle Firestore Timestamp vs ISO String
        if (event.date && typeof event.date === 'object' && 'seconds' in event.date) {
            date = new Date((event.date as any).seconds * 1000);
        } else if (typeof event.date === 'string') {
            date = new Date(event.date);
        } else {
            console.warn("Invalid date format for event", event);
            return acc; // Skip invalid events
        }

        if (isNaN(date.getTime())) return acc; // Skip invalid dates

        const year = date.getFullYear();

        // STRICT FILTERING RULES
        // 1. Hide Past Years
        if (year < currentYear) return acc;

        // 2. Hide Next Year if "This Year Only" is ON
        if (showCurrentYearOnly && year > currentYear) return acc;


        const month = date.toLocaleString('default', { month: 'long' });
        const monthIndex = date.getMonth(); // For sorting

        if (!acc[year]) acc[year] = { months: {} };
        if (!acc[year].months[monthIndex]) acc[year].months[monthIndex] = { name: month, events: [] };

        acc[year].months[monthIndex].events.push(event);
        return acc;
    }, {} as Record<number, { months: Record<number, { name: string, events: Event[] }> }>);

    // Sort Years
    const sortedYears = Object.keys(groupedEvents).map(Number).sort((a, b) => a - b);

    if (sortedYears.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-70">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                    <Calendar className="text-white/40" size={24} />
                </div>
                <p className="text-white/60">No upcoming events found for this period.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {sortedYears.map(year => {
                const yearGroup = groupedEvents[year];
                // Sort Months
                const sortedMonths = Object.keys(yearGroup.months).map(Number).sort((a, b) => a - b);
                const isExpanded = showCurrentYearOnly ? true : (expandedYears[year] ?? false); // Auto-expand if single year mode or expanded state

                return (
                    <div key={year} className="space-y-6">
                        {/* Year Header - Collapsible */}
                        <button
                            onClick={() => !showCurrentYearOnly && toggleYear(year)}
                            disabled={showCurrentYearOnly}
                            className={`
                                relative pl-6 pr-4 py-2 w-full flex items-center gap-4 text-left group
                                ${showCurrentYearOnly ? 'cursor-default' : 'cursor-pointer hover:bg-white/5 rounded-lg transition-colors'}
                            `}
                        >
                            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full transition-colors ${year === currentYear ? 'bg-gradient-to-b from-blue-500 to-blue-600' : 'bg-white/10 group-hover:bg-white/30'}`} />

                            <h2 className={`text-3xl font-bold tracking-tighter transition-colors ${year === currentYear ? 'text-white' : 'text-white/40 group-hover:text-white/70'}`}>
                                {year}
                            </h2>

                            {!showCurrentYearOnly && (
                                <div className="ml-auto flex items-center gap-3">
                                    <span className="bg-white/10 text-white/50 text-xs font-bold px-3 py-1 rounded-full border border-white/5">
                                        {Object.values(yearGroup.months).reduce((sum, m) => sum + m.events.length, 0)} Events
                                    </span>
                                    <div className="text-white/30 group-hover:text-white transition-colors">
                                        {isExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
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
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="overflow-hidden"
                                >
                                    <div className="pl-2 sm:pl-4 space-y-8 pb-4">
                                        {sortedMonths.map(monthIndex => {
                                            const { name: monthName, events: monthEvents } = yearGroup.months[monthIndex];

                                            // Split events
                                            const systemEvents = monthEvents.filter(e => e.isSystemEvent);
                                            const userEvents = monthEvents.filter(e => !e.isSystemEvent);

                                            return (
                                                <div key={`${year}-${monthIndex}`} className="space-y-4">
                                                    {/* Month Header */}
                                                    <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest pl-1">
                                                        {monthName}
                                                    </h3>

                                                    {/* User Events Section */}
                                                    {userEvents.length > 0 && (
                                                        <div className="space-y-4">
                                                            {userEvents.map((event) => (
                                                                <EventCard
                                                                    key={event.id}
                                                                    event={event}
                                                                    onEventClick={onEventClick}
                                                                    isAdmin={user?.role === 'admin'}
                                                                    user={user}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* System Events Section - Separated & Compact */}
                                                    {systemEvents.length > 0 && (
                                                        <div className="mt-6 space-y-2">
                                                            {userEvents.length > 0 && (
                                                                <div className="flex items-center gap-2 mb-3 mt-6 px-1">
                                                                    <div className="h-px flex-1 bg-white/10"></div>
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">System Events</span>
                                                                    <div className="h-px flex-1 bg-white/10"></div>
                                                                </div>
                                                            )}
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                {systemEvents.map((event) => (
                                                                    <SystemEventCard
                                                                        key={event.id}
                                                                        event={event}
                                                                        onEventClick={onEventClick}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
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

// --- Refactored Components ---

function EventCard({ event, onEventClick, isAdmin, user }: { event: Event, onEventClick: (e: Event) => void, isAdmin: boolean, user: any }) {
    let eventDate: Date;
    if (event.date && typeof event.date === 'object' && 'seconds' in event.date) {
        eventDate = new Date((event.date as any).seconds * 1000);
    } else {
        eventDate = new Date(event.date as any);
    }
    const isPending = event.status === 'pending';

    // Handle approval
    const handleApprove = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;
        try {
            const { EventService } = await import('@/services/events');
            await EventService.approveEvent(event.id, user.uid);
        } catch (err) {
            console.error("Failed to approve", err);
        }
    };

    return (
        <div
            onClick={() => onEventClick(event)}
            className={`
                flex flex-col sm:flex-row gap-5 p-5 
                rounded-[15px] 
                shadow-[5px_5px_20px_rgba(0,0,0,0.5)]
                hover:shadow-[5px_10px_30px_rgba(0,0,0,0.8)]
                hover:-translate-y-1
                transition-all duration-300 ease-in-out
                cursor-pointer group
                border
                relative
                overflow-hidden
                ${isPending ? 'bg-amber-900/20 border-amber-500/50' : 'bg-gradient-to-r from-[#141e30] to-[#243b55] border-white/5'}
            `}
        >
            {isPending && (
                <div className="absolute top-0 right-0 bg-amber-600 text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider text-white shadow-lg z-10">
                    Pending Approval
                </div>
            )}

            {/* Date Box */}
            <div className={`flex-shrink-0 flex sm:flex-col items-center justify-center gap-1 sm:gap-0 w-full sm:w-16 sm:h-16 ${isPending ? 'bg-amber-500/20 border-amber-500/30' : 'bg-white/10 border-[#ffffff1a]'} backdrop-blur-md rounded-xl text-white shadow-inner`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">{format(eventDate, 'MMM')}</span>
                <span className="text-xl font-bold font-[gill-sans-mt,sans-serif]">{format(eventDate, 'd')}</span>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold mb-1 truncate pr-8 font-[gill-sans-mt,sans-serif] tracking-wide text-white">
                        {event.title}
                    </h3>
                    <div className="flex gap-2">
                        {isPending && isAdmin && (
                            <button
                                onClick={handleApprove}
                                className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-md z-20"
                            >
                                Approve
                            </button>
                        )}
                        <button className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
                            <MoreVertical size={18} />
                        </button>
                    </div>
                </div>

                <p className="text-sm text-blue-100/70 mb-4 line-clamp-2 leading-relaxed">
                    {event.description || "No description provided."}
                </p>

                <div className="flex flex-wrap gap-3 text-xs font-medium text-white/60">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${isPending ? 'bg-amber-500/10 border-amber-500/20' : 'bg-black/20 border-white/5'}`}>
                        <Clock size={13} className={isPending ? "text-amber-400" : "text-blue-400"} />
                        {format(eventDate, 'h:mm a')}
                    </div>
                    {event.location && (
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${isPending ? 'bg-amber-500/10 border-amber-500/20' : 'bg-black/20 border-white/5'}`}>
                            <MapPin size={13} className={isPending ? "text-amber-400" : "text-red-400"} />
                            {event.location}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function SystemEventCard({ event, onEventClick }: { event: Event, onEventClick: (e: Event) => void }) {
    let eventDate: Date;
    if (event.date && typeof event.date === 'object' && 'seconds' in event.date) {
        eventDate = new Date((event.date as any).seconds * 1000);
    } else {
        eventDate = new Date(event.date as any);
    }

    const recFreq = (event as any).recurrence?.frequency || 'Annual';

    return (
        <div
            onClick={() => onEventClick(event)}
            className={`
                flex items-center gap-4 p-3 
                rounded-xl
                bg-[#0f172a]/80 border border-blue-900/30
                hover:bg-[#1e293b] hover:border-blue-500/30
                transition-all duration-200
                cursor-pointer group
            `}
        >
            {/* Compact Date */}
            <div className="flex-shrink-0 w-12 h-12 bg-blue-900/20 rounded-lg flex flex-col items-center justify-center border border-blue-500/10 group-hover:border-blue-500/30 transition-colors">
                <span className="text-[9px] font-bold text-blue-200 uppercase">{format(eventDate, 'MMM')}</span>
                <span className="text-base font-bold text-blue-100 leading-none">{format(eventDate, 'd')}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-blue-100 truncate">
                        {event.title}
                    </h3>
                    <div className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/20 uppercase tracking-wider">
                        {recFreq}
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-1 text-[10px] text-blue-200/50">
                    <div className="flex items-center gap-1">
                        <Clock size={10} />
                        {format(eventDate, 'h:mm a')}
                    </div>
                    {event.location && (
                        <div className="flex items-center gap-1 truncate max-w-[100px]">
                            <MapPin size={10} />
                            {event.location}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
