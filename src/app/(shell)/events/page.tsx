"use client";

import React, { useState, useEffect, Suspense } from "react";
import { LayoutGrid, List } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarView } from "@/components/events/CalendarView";
import { EventListView } from "@/components/events/EventListView";
import { CreateEventModal } from "@/components/library/organisms/CreateEventModal";
import { Event } from "@/types/event";
import { useAuth } from "@/contexts/AuthContext";
import { CanonicalDataService } from "@/services/canonicalDataService";
import { EventService } from "@/services/events";
import { EventDetailsModal } from "@/components/events/EventDetailsModal";
import { EventEditModal } from "@/components/events/EventEditModal";
import { UpcomingEventsStrip } from "@/components/events/UpcomingEventsStrip";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";

export default function EventsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-zinc-500">Loading Events...</div>}>
            <EventsContent />
        </Suspense>
    );
}

function EventsContent() {
    const [view, setView] = useState<'calendar' | 'list'>('calendar');
    const [events, setEvents] = useState<Event[]>([]);
    const [showCurrentYearOnly, setShowCurrentYearOnly] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();

    // UI States
    // Sync modal state with URL
    const openCreateModal = () => {
        const params = new URLSearchParams(searchParams);
        params.set('action', 'create');
        router.push(`?${params.toString()}`);
    };

    const closeCreateModal = () => {
        const params = new URLSearchParams(searchParams);
        params.delete('action');
        router.push(`?${params.toString()}`);
    };

    const isModalOpen = searchParams.get('action') === 'create';
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [initialModalDate, setInitialModalDate] = useState<Date | undefined>(undefined);

    // Expansion & Editing state
    const [expandedEvent, setExpandedEvent] = useState<Event | null>(null);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);

    const eventIdParam = searchParams.get('id');

    useEffect(() => {
        if (!user) {
            // console.log("EventsPage: No user, skipping subscription");
            return;
        }

        // console.log("EventsPage: Subscribing to events for user:", user.uid);
        const unsubscribe = EventService.subscribeToEvents((allEvents) => {
            // Client-side filtering to match CanonicalDataService logic
            let filtered = allEvents;

            // 1. Role-based filtering
            if (user.role === 'team' || user.role === 'guest') {
                filtered = filtered.filter(event =>
                    (event as any).isSystemEvent ||
                    event.status === 'approved' ||
                    (event.createdBy && (typeof event.createdBy === 'string'
                        ? event.createdBy === user.uid
                        : event.createdBy.uid === user.uid))
                );
            }

            setEvents(filtered);
        });

        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, [user]);

    // Handle deep-linked event from URL
    useEffect(() => {
        if (eventIdParam && events.length > 0 && !expandedEvent) {
            const event = events.find(e => e.id === eventIdParam);
            if (event) {
                setExpandedEvent(event);
            }
        }
    }, [eventIdParam, events, expandedEvent]);

    const handleDateClick = (date: Date) => {
        setInitialModalDate(date);
        openCreateModal();
    };

    return (
        <PageLayout mode="plain">
            <PageHeader
                title="Events"
                description="Schedule and manage your timeline."
                actions={
                    <div className="flex items-center gap-4 self-start sm:self-auto">
                        {/* Year Toggle */}
                        {view === 'list' && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-[#ffffff1a] rounded-xl">
                                <Label htmlFor="year-toggle" className="text-sm font-medium text-white/70 whitespace-nowrap">This Year Only</Label>
                                <Switch
                                    id="year-toggle"
                                    checked={showCurrentYearOnly}
                                    onCheckedChange={setShowCurrentYearOnly}
                                />
                            </div>
                        )}

                        {/* View Switcher */}
                        <div className="flex items-center p-1 bg-[var(--color-bg-subtle)] rounded-xl border border-[var(--color-border)]">
                            <button
                                onClick={() => setView('calendar')}
                                className={`p-2 rounded-lg transition-all ${view === 'calendar' ? 'bg-white dark:bg-[#10111a] text-blue-600 shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
                            >
                                <LayoutGrid size={20} />
                            </button>
                            <button
                                onClick={() => setView('list')}
                                className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white dark:bg-[#10111a] text-blue-600 shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
                            >
                                <List size={20} />
                            </button>
                        </div>
                    </div>
                }
            />

            {/* Content */}
            <div className="flex-1">
                {events.length > 0 && (
                    <UpcomingEventsStrip
                        events={events}
                        onEventClick={(e) => setExpandedEvent(e)}
                    />
                )}

                {view === 'calendar' ? (
                    <CalendarView
                        currentDate={selectedDate}
                        onDateChange={setSelectedDate}
                        events={events}
                        onDateClick={handleDateClick}
                        onEventClick={(e) => setExpandedEvent(e)}
                    />
                ) : (
                    <EventListView
                        events={events}
                        onEventClick={(e) => setExpandedEvent(e)}
                        showCurrentYearOnly={showCurrentYearOnly}
                    />
                )}
            </div>

            {/* Event Modals */}
            <EventDetailsModal
                event={expandedEvent}
                isOpen={!!expandedEvent}
                onClose={() => setExpandedEvent(null)}
                onEdit={() => {
                    setEditingEvent(expandedEvent);
                    setExpandedEvent(null);
                }}
                onDelete={(id) => {
                    setEvents(prev => prev.filter(e => e.id !== id));
                    setExpandedEvent(null);
                }}
            />

            {editingEvent && (
                <EventEditModal
                    event={editingEvent}
                    isOpen={!!editingEvent}
                    onClose={() => setEditingEvent(null)}
                />
            )}

            {/* Modal */}
            <CreateEventModal
                isOpen={isModalOpen}
                onClose={closeCreateModal}
                initialDate={initialModalDate}
            />
        </PageLayout>
    );
}
