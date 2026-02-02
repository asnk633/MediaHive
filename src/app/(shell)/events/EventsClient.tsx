'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContextProvider';
import { Event } from '@/types/event';
import { EventService } from '@/services/events';
import { CalendarView } from '@/components/events/CalendarView';
import { EventListView } from '@/components/events/EventListView';
import { EventDetailsModal } from '@/components/events/EventDetailsModal';
import { PageLayout } from '@/components/ui/layout/PageLayout';
import { PageHeader } from '@/components/ui/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, List } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { nativeNavigate } from '@/lib/utils';

export default function EventsClient() {
    const router = useRouter();
    const { user } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
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

    return (
        <PageLayout mode="plain">
            <PageHeader
                title="Events"
                description="View and manage institutional events"
                actions={
                    <div className="flex items-center gap-3">
                        <div className="flex bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-1">
                            <button
                                onClick={() => setViewMode('calendar')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'calendar'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                    }`}
                            >
                                <Calendar size={16} />
                                Calendar
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'list'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                    }`}
                            >
                                <List size={16} />
                                List
                            </button>
                        </div>
                        {canCreate && (
                            <Button onClick={() => nativeNavigate('/events/new', router, 'Events (New)')}>
                                <Plus size={16} />
                                New Event
                            </Button>
                        )}
                    </div>
                }
            />

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-[var(--text-secondary)]">Loading events...</div>
                </div>
            ) : (
                <>
                    {viewMode === 'calendar' ? (
                        <CalendarView
                            events={events}
                            currentDate={currentDate}
                            onDateChange={setCurrentDate}
                            onDateClick={(date) => console.log('Date clicked:', date)}
                            onEventClick={setSelectedEvent}
                        />
                    ) : (
                        <EventListView
                            events={events}
                            onEventClick={setSelectedEvent}
                        />
                    )}
                </>
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
