"use client";

import React, { useState, useEffect } from "react";
import { Plus, LayoutGrid, List } from "lucide-react";
import { CalendarView } from "@/components/events/CalendarView";
import { EventListView } from "@/components/events/EventListView";
import { CreateEventModal } from "@/components/library/organisms/CreateEventModal";
import { EventService } from "@/services/events";
import { Event } from "@/types/event";

export default function EventsPage() {
    const [view, setView] = useState<'calendar' | 'list'>('calendar');
    const [events, setEvents] = useState<Event[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [initialModalDate, setInitialModalDate] = useState<Date | undefined>(undefined);

    useEffect(() => {
        const unsubscribe = EventService.subscribeToEvents(setEvents);
        return () => unsubscribe();
    }, []);

    const handleDateClick = (date: Date) => {
        setInitialModalDate(date);
        setIsModalOpen(true);
    };

    const handleCreateClick = () => {
        setInitialModalDate(new Date());
        setIsModalOpen(true);
    };

    return (
        <div className="flex flex-col min-h-screen app-body-padding px-4 pb-28 pt-8 md:max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Events</h1>
                    <p className="text-[var(--color-text-secondary)] mt-1">Schedule and manage your timeline.</p>
                </div>

                {/* View Switcher */}
                <div className="flex items-center p-1 bg-[var(--color-bg-subtle)] rounded-xl border border-[var(--color-border)] self-start sm:self-auto">
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

            {/* Content */}
            <div className="flex-1">
                {view === 'calendar' ? (
                    <CalendarView
                        currentDate={selectedDate}
                        onDateChange={setSelectedDate}
                        events={events}
                        onDateClick={handleDateClick}
                    />
                ) : (
                    <EventListView
                        events={events}
                        onEventClick={(e) => console.log("View Event", e)}
                    />
                )}
            </div>

            {/* Modal */}
            <CreateEventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialDate={initialModalDate}
            />
        </div>
    );
}
