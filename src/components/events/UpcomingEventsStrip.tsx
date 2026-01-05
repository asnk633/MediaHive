import React, { useMemo } from 'react';
import { format, addDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { Clock, Repeat, ArrowRight, CalendarDays, PartyPopper } from 'lucide-react';
import { Event } from '@/types/event';
import { useRouter } from 'next/navigation';

interface UpcomingEventsStripProps {
    events: Event[];
    onEventClick: (event: Event) => void;
}

export function UpcomingEventsStrip({ events, onEventClick }: UpcomingEventsStripProps) {
    const router = useRouter();

    // Helper to extract Date object safely
    const getDate = (d: any): Date => {
        if (!d) return new Date();
        if (d.toDate && typeof d.toDate === 'function') return d.toDate();
        if (d.seconds) return new Date(d.seconds * 1000);
        return new Date(d);
    };

    // Filter logic: Next 7 days
    const { upcomingEvents, hasMore } = useMemo(() => {
        const today = startOfDay(new Date());
        const sevenDaysFromNow = endOfDay(addDays(today, 7));

        const filtered = events
            .filter(event => {
                const eventDate = getDate(event.date);
                // Must be >= today AND <= 7 days out
                return (isAfter(eventDate, today) || eventDate.getTime() === today.getTime()) &&
                    isBefore(eventDate, sevenDaysFromNow);
            })
            .sort((a, b) => getDate(a.date).getTime() - getDate(b.date).getTime());

        return {
            upcomingEvents: filtered.slice(0, 5),
            hasMore: filtered.length > 5
        };
    }, [events]);

    if (upcomingEvents.length === 0) {
        return (
            <div className="w-full mb-8">
                <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                    Events in next 7 days
                </h3>
                <div className="w-full bg-white/5 border border-white/10 rounded-xl p-6 text-center flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 mb-1">
                        <PartyPopper size={20} />
                    </div>
                    <p className="text-sm text-white/50 font-medium">No events in the next 7 days</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full mb-8">
            <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                Events in next 7 days
            </h3>

            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {upcomingEvents.map(event => {
                    const eventDate = getDate(event.date);
                    const isSystem = event.isSystemEvent;

                    // Logic to see if date is today
                    const isToday = new Date().toDateString() === eventDate.toDateString();

                    return (
                        <div
                            key={event.id}
                            onClick={() => onEventClick(event)}
                            className={`
                                flex-shrink-0 w-44 sm:w-52 p-4 rounded-xl 
                                border cursor-pointer snap-start relative overflow-hidden
                                transition-all hover:-translate-y-1 active:scale-95
                                flex flex-col justify-between min-h-[120px]
                                ${isSystem
                                    ? 'bg-gradient-to-br from-blue-900/40 to-slate-900/60 border-blue-500/30'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }
                            `}
                        >
                            {/* Accent Line */}
                            <div className={`absolute top-0 left-0 w-full h-1 ${isSystem ? 'bg-blue-500' : 'bg-white/20'}`} />

                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={`
                                        flex flex-col items-center justify-center w-10 h-10 rounded-lg border 
                                        ${isToday
                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                            : isSystem
                                                ? 'bg-blue-500/20 text-blue-200 border-blue-500/30'
                                                : 'bg-white/10 text-white/70 border-white/10'
                                        }
                                    `}>
                                        <span className="text-[9px] font-bold uppercase leading-none opacity-80">
                                            {format(eventDate, 'MMM')}
                                        </span>
                                        <span className="text-sm font-bold leading-none mt-0.5">
                                            {format(eventDate, 'd')}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">
                                            {format(eventDate, 'EEE')}
                                        </span>
                                        {isSystem && (
                                            <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded-full mt-1 w-fit">
                                                System
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug mb-2" title={event.title}>
                                    {event.title}
                                </h4>
                                <div className="flex items-center gap-2 text-[11px] text-white/50">
                                    <Clock size={12} />
                                    <span>{format(eventDate, 'h:mm a')}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* View All Card (conditionally shown if filtered > 5 or just as a permanent "More" option) 
                    Requirement says: "If more exist: Show 'View all events' link".
                    I'll render it as a card at the end strictly if hasMore is true, or maybe always for quick nav? 
                    "If more exist" implies logic.
                */}
                {hasMore && (
                    <div
                        onClick={() => router.push('/events')}
                        className="
                            flex-shrink-0 w-32 p-4 rounded-xl 
                            border border-white/5 bg-white/5 
                            cursor-pointer snap-start
                            transition-all hover:bg-white/10 hover:border-white/20
                            flex flex-col items-center justify-center gap-2 text-white/60 hover:text-white
                        "
                    >
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                            <ArrowRight size={20} />
                        </div>
                        <span className="text-xs font-bold">View all events</span>
                    </div>
                )}
            </div>
        </div>
    );
}
