'use client';

import React from 'react';
import { Calendar, Users, Briefcase, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactiveCard } from '@/components/ui/ReactiveCard';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

import Link from 'next/link';

interface TodayEventsCardProps {
    events: any[];
    tasks?: any[];
    isLoading: boolean;
    onViewEvent: (id: string) => void;
}

export const TodayEventsCard: React.FC<TodayEventsCardProps> = ({ events, tasks = [], isLoading, onViewEvent }) => {
    return (
        <ReactiveCard className="dashboard-card-primary card-hover-elevation h-full flex flex-col pt-6">
            <div className="flex items-baseline justify-between dashboard-card-header-spacing px-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                        <Calendar size={18} />
                    </div>
                    <h3 className="text-sm font-medium text-white/85">Today's Events</h3>
                </div>
                {!isLoading && events.length > 0 && (
                    <span className="text-[10px] font-bold text-white/50 bg-white/5 px-2 py-1 rounded-full uppercase tracking-widest">
                        {events.length} {events.length === 1 ? 'Event' : 'Events'}
                    </span>
                )}
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar max-h-[320px]">
                {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="p-4 rounded-[18px] bg-white/[0.02] border border-white/5 space-y-3">
                            <Skeleton className="h-5 w-3/4 bg-white/10" />
                            <Skeleton className="h-4 w-1/2 bg-white/5" />
                        </div>
                    ))
                ) : events.length > 0 ? (
                    events.map((event) => (
                        <Link 
                            href={`/events/${event.id}`}
                            key={event.id}
                            className="group p-4 mx-4 rounded-[18px] bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-blue-500/30 transition-all cursor-pointer block no-underline"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="text-sm font-semibold text-white/90 group-hover:text-blue-400 transition-colors">
                                    {event.title}
                                </h4>
                                <ExternalLink size={12} className="text-white/10 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all" />
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4 mb-3">
                                <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                                    <Clock size={12} />
                                    <span>
                                        {event.start_at ? format(new Date(event.start_at), 'HH:mm') : '--:--'} – 
                                        {event.end_at ? format(new Date(event.end_at), 'HH:mm') : '--:--'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                                    <Users size={12} />
                                    <span>{event.crew?.length || 0} Crew</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                                    <Briefcase size={12} />
                                    <span>{event.equipment?.length || 0} Eq.</span>
                                </div>
                            </div>
                            
                            {/* Task Progress Bar */}
                            {(() => {
                                const eventTasks = tasks.filter(t => t.event_id === event.id);
                                const total = eventTasks.length;

                                if (total === 0) {
                                    return (
                                        <div className="mt-3 pt-3 border-t border-white/5">
                                            <p className="text-[10px] text-white/50 italic">No tasks linked to this event</p>
                                        </div>
                                    );
                                }

                                const completed = eventTasks.filter(t => t.status === 'done').length;
                                const progress = Math.round((completed / total) * 100);
                                
                                return (
                                    <div className="mt-3 pt-3 border-t border-white/5">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[10px] text-white/50 font-medium">
                                                Tasks: <span className="text-white/80 font-bold">{completed} / {total}</span> completed
                                            </span>
                                            <span className="text-[10px] text-white/80 font-bold">{progress}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                                            <div 
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-1000",
                                                    progress === 100 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                                )}
                                                style={{ width: `${progress}%` }} 
                                            />
                                        </div>
                                    </div>
                                );
                            })()}
                        </Link>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Calendar size={32} className="text-white/5 mb-3" />
                        <p className="text-xs text-white/50 font-medium">No events scheduled for today.</p>
                    </div>
                )}
            </div>
        </ReactiveCard>
    );
};

const Clock = ({ size, className }: { size: number, className?: string }) => (
    <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);
