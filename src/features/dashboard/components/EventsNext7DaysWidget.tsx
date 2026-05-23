import React, { useMemo } from 'react';
import { format, addDays, isAfter, isBefore, startOfDay, endOfDay, isToday } from 'date-fns';
import { Calendar, MapPin, Clock, ChevronRight } from 'lucide-react';
import { EventItem as Event } from '@/services/events/eventContract';
import { useRouter } from 'next/navigation';
import { nativeNavigate, cn } from '@/lib/utils';
import { normalizeDate } from '@/lib/dateUtils';
import { ReactiveCard } from '@/components/ui/ReactiveCard';

import { useDashboard } from '@/system/dashboard/DashboardProvider';

/**
 * EventsNext7DaysWidget (2026 Refresh)
 * Focuses on high-accountability event cards with date badges and type-specific identity.
 */
export const EventsNext7DaysWidget = ({ loading = false }: { loading?: boolean }) => {
    const { events } = useDashboard();
    const router = useRouter();


    const upcomingEvents = useMemo(() => {
        // Truth Pass: Use dashboardMetrics.next7DayEvents directly.
        // It is already filtered and sorted.
        return events.slice(0, 6);
    }, [events]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-40 rounded-[18px] bg-foreground/[0.02] border border-foreground/5 animate-pulse" />
                ))}
            </div>
        );
    }

    if (upcomingEvents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-foreground/10 rounded-[18px] bg-foreground/[0.02] animate-in fade-in duration-700">
                <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center mb-4 text-foreground/80">
                    <Calendar size={24} />
                </div>
                <h3 className="text-sm font-bold text-foreground/80 uppercase tracking-widest">No upcoming events scheduled</h3>
                <p className="text-[10px] text-foreground/80 mt-1">Add an event to keep your team aligned.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px]">
            {upcomingEvents.map(event => {
                const eventDate = normalizeDate(event.date);
                if (!eventDate) return null;

                const isSystem = event.is_system_event;
                const isInstitution = event.on_behalf_of?.type === 'institution';

                return (
                    <ReactiveCard
                        key={event.id}
                        onClick={() => nativeNavigate(`/events/${event.id}`, router, 'EventsNext7Days:Detail')}
                        className="flex flex-col justify-between p-5 card-gradient-border backdrop-blur-xl rounded-[18px] shadow-[0_10px_30px_rgba(0,0,0,0.25)] active:scale-[0.98] text-left transition-all hover:-translate-y-[2px]"
                    >
                        {/* Status Accent (Subtle Glow) - Match 3px accent style */}
                        <div className={cn(
                            "absolute top-0 left-0 w-full h-[3px] opacity-20 group-hover:opacity-100 transition-opacity duration-500",
                            isSystem ? "bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]" :
                                isInstitution ? "bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]" :
                                    "bg-foreground/10"
                        )} />

                        {/* Top Section: Date & Badge Row */}
                        <div className="flex justify-between items-start mb-[14px] ml-[-28px] w-[calc(100%+28px)]">
                            <div className={cn(
                                "flex flex-col items-center justify-center w-12 h-12 rounded-xl border transition-all duration-300",
                                isToday(eventDate)
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                                    : "bg-foreground/5 text-blue-400 border-foreground/10 group-hover:border-blue-500/30 group-hover:bg-blue-500/5"
                            )}>
                                <span className="text-[10px] font-black uppercase leading-none opacity-50 tracking-tighter">
                                    {format(eventDate, 'MMM')}
                                </span>
                                <span className="text-xl font-bold leading-none mt-1">
                                    {format(eventDate, 'd')}
                                </span>
                            </div>

                            <div className="flex flex-col items-end gap-1.5 relative right-[28px]">
                                {isSystem && (
                                    <span className="text-[9px] font-bold text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm">
                                        System Event
                                    </span>
                                )}
                                {isInstitution && (
                                    <span className="text-[9px] font-bold text-purple-400 bg-purple-400/10 border border-purple-400/20 px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm">
                                        Institution
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Middle Section: Identity & Location */}
                        <div className="space-y-1.5 mb-6 ml-[-28px] w-[calc(100%+28px)]">
                            <h4 className="text-sm font-bold text-foreground/80 group-hover:text-foreground transition-all duration-300 line-clamp-2 leading-snug">
                                {event.title}
                            </h4>
                            <div className="flex items-center gap-1.5 text-xs text-foreground/70 group-hover:text-foreground/70 transition-colors bg-foreground/[0.02] w-fit px-2 py-0.5 rounded-lg border border-foreground/5">
                                <MapPin size={10} className="shrink-0 text-blue-400/50" />
                                <span className="truncate max-w-[150px]">{event.location || 'Meeting Room'}</span>
                            </div>
                        </div>

                        {/* Bottom Section: Timing & Mini-Action */}
                        <div className="flex items-center justify-between pt-4 border-t border-foreground/5">
                            <div className="flex items-center gap-2 text-[10px] font-black text-foreground/80 group-hover:text-foreground/80 uppercase tracking-[0.15em] transition-colors">
                                <Clock size={10} className="text-blue-500/40 group-hover:text-blue-500/60" />
                                <span>{format(eventDate, 'h:mm a')}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[9px] font-bold text-blue-400/60 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                DETAILS <ChevronRight size={10} />
                            </div>
                        </div>
                    </ReactiveCard>
                );
            })}
        </div>
    );
};
