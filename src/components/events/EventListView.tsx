
import React from 'react';
import { format } from 'date-fns';
import { Calendar, MapPin, Clock, MoreVertical } from 'lucide-react';
import { Event } from '@/types/event';

interface EventListViewProps {
    events: Event[];
    onEventClick: (event: Event) => void;
}

export function EventListView({ events, onEventClick }: EventListViewProps) {
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

    return (
        <div className="space-y-4">
            {events.map((event) => {
                const eventDate = new Date(event.date.seconds * 1000);
                return (
                    <div
                        key={event.id}
                        onClick={() => onEventClick(event)}
                        className="flex flex-col sm:flex-row gap-4 p-5 bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-all cursor-pointer group"
                    >
                        {/* Date Box */}
                        <div className="flex-shrink-0 flex sm:flex-col items-center justify-center gap-2 sm:gap-0 w-full sm:w-16 sm:h-16 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                            <span className="text-xs font-bold uppercase tracking-wide">{format(eventDate, 'MMM')}</span>
                            <span className="text-xl font-bold">{format(eventDate, 'd')}</span>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-1 truncate pr-8">
                                    {event.title}
                                </h3>
                                <button className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                                    <MoreVertical size={18} />
                                </button>
                            </div>

                            <p className="text-sm text-[var(--color-text-secondary)] mb-3 line-clamp-2">
                                {event.description || "No description provided."}
                            </p>

                            <div className="flex flex-wrap gap-4 text-xs font-medium text-[var(--color-text-secondary)]">
                                <div className="flex items-center gap-1.5">
                                    <Clock size={14} />
                                    {format(eventDate, 'h:mm a')}
                                </div>
                                {event.location && (
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={14} />
                                        {event.location}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
