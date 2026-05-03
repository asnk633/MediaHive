'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContextProvider';
import { useClientData } from '@/app/(shell)/ClientDataContext';
import { Event } from '@/types/event';
import { EventService } from '@/services/events';
import { CalendarView } from '@/components/events/CalendarView';
import { EventListView } from '@/components/events/EventListView';
import { TimelineView } from '@/components/events/TimelineView';
import { EventDetailsModal } from '@/components/events/EventDetailsModal';
import { PageLayout } from '@/components/ui/layout/PageLayout';
import { PageHeader } from '@/components/ui/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, Calendar as CalendarIcon, List, LayoutList, GripVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { nativeNavigate, cn } from '@/lib/utils'; // Added cn import

export default function EventsClient() {
    const router = useRouter();
    const { user } = useAuth();
    const { tasks } = useClientData(); // Get tasks for Timeline
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'month' | 'timeline' | 'list'>('month');
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        if (!user) return;

        setLoading(true);
        const unsubscribe = EventService.subscribeToEvents((data) => {
            setEvents(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const canCreate = user?.role === 'admin' || user?.role === 'team';

    // Map Event[] to EventLite[] for TimelineView
    const timelineEvents = useMemo(() => {
        return events.map(e => {
            let dateObj: Date;
            if ((e.date as any).seconds) {
                dateObj = new Date((e.date as any).seconds * 1000);
            } else {
                dateObj = new Date(e.date as any);
            }

            return {
                id: e.id,
                title: e.title,
                start_time: !isNaN(dateObj.getTime()) ? dateObj.toISOString() : new Date().toISOString(),
                end_time: null,
                location: e.location,
                description: e.description,
                is_system_event: e.is_system_event
            };
        });
    }, [events]);

    return (
        <PageLayout mode="plain">
            <PageHeader
                title="Events"
                description="View and manage institutional events"
                actions={
                    <div className="flex items-center gap-3">
                        <div className="flex bg-white/[0.03] border border-white/10 rounded-xl p-1 backdrop-blur-md">
                            <button
                                onClick={() => setViewMode('month')}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all",
                                    viewMode === 'month'
                                        ? "bg-blue-500/10 text-blue-400 shadow-sm border border-blue-500/20"
                                        : "text-white/60 hover:text-white/90"
                                )}
                            >
                                <CalendarIcon size={14} />
                                Month
                            </button>
                            <button
                                onClick={() => setViewMode('timeline')}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all",
                                    viewMode === 'timeline'
                                        ? "bg-blue-500/10 text-blue-400 shadow-sm border border-blue-500/20"
                                        : "text-white/60 hover:text-white/90"
                                )}
                            >
                                <LayoutList size={14} />
                                Timeline
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all",
                                    viewMode === 'list'
                                        ? "bg-blue-500/10 text-blue-400 shadow-sm border border-blue-500/20"
                                        : "text-white/60 hover:text-white/90"
                                )}
                            >
                                <List size={14} />
                                List
                            </button>
                        </div>
                        {canCreate && (
                            <Button
                                onClick={() => nativeNavigate('/events/new', router, 'Events (New)')}
                                className="bg-blue-600 hover:bg-blue-500 text-white border-none shadow-lg hover:shadow-blue-500/20"
                            >
                                <Plus size={16} className="mr-2" />
                                New Event
                            </Button>
                        )}
                    </div>
                }
            />

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-white/30 animate-pulse font-mono text-xs">SYNCING EVENTS...</div>
                </div>
            ) : (
                <div className="mt-6">
                    {viewMode === 'month' && (
                        <CalendarView
                            events={events}
                            currentDate={currentDate}
                            onDateChange={setCurrentDate}
                            onDateClick={(date) => {
                                setCurrentDate(date);
                                // Optional: switch to timeline/list on day click? Or just select date.
                                // For now, just setting current date.
                            }}
                            onEventClick={setSelectedEvent}
                        />
                    )}

                    {viewMode === 'timeline' && (
                        <TimelineView
                            events={timelineEvents}
                            tasks={tasks}
                            loading={loading}
                            onCreateEvent={() => nativeNavigate('/events/new', router, 'Events (New)')}
                            filter="all" // Default to showing all. Could add filter toggle if needed.
                        />
                    )}

                    {viewMode === 'list' && (
                        <EventListView
                            events={events}
                            onEventClick={setSelectedEvent}
                        />
                    )}
                </div>
            )}

            {selectedEvent && (
                <EventDetailsModal
                    isOpen={true}
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    onEdit={() => {
                        nativeNavigate(`/events/edit?id=${selectedEvent.id}`, router, 'Events (Edit)');
                        setSelectedEvent(null);
                    }}
                />
            )}
        </PageLayout>
    );
}
