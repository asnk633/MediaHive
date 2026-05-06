'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContextProvider';
import { useWorkspace } from '@/system/workspace/WorkspaceProvider';
import { useClientData } from '@/app/(shell)/ClientDataContext';
import { Event } from '@/features/events/types/event'; // Keep Event import as it's used
import { Task } from "@/features/tasks/types/task"; // Added MediaTask as Task
import { EventService } from '@/features/events/services/eventService';
import { CalendarView } from '@/components/events/CalendarView';
import { EventListView } from '@/components/events/EventListView';
import { TimelineView } from '@/components/events/TimelineView';
import { WeekTimelineView } from '@/components/events/WeekTimelineView';
import { EventDetailsModal } from '@/components/events/EventDetailsModal';
import { PageLayout } from '@/components/ui/layout/PageLayout';
import { PageHeader } from '@/components/ui/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, CalendarDays, GitBranch, List, Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';
import { nativeNavigate, cn } from '@/lib/utils'; // Added cn import

import { usePermissions } from '@/hooks/usePermissions';

export default function EventsClient() {
    const router = useRouter();
    const { user } = useAuth();
    const { currentWorkspaceId } = useWorkspace();
    const { tasks } = useClientData(); // Get tasks for Timeline
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'timeline' | 'list'>('month');
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const { role } = usePermissions();

    useEffect(() => {
        if (!user) return;
        setEvents([]); // Clear events on workspace change
        setLoading(true);
        const unsubscribe = EventService.subscribeToEvents((data) => {
            setEvents(data);
            setLoading(false);
        }, currentWorkspaceId || undefined);

        return () => unsubscribe();
    }, [user, currentWorkspaceId]);

    const canCreate = ['admin', 'manager', 'member', 'team'].includes(role);

    // Map Event[] to EventLite[] for TimelineView
    const timelineEvents = useMemo(() => {
        return events.map(e => ({
            id: e.id,
            title: e.title,
            start_at: e.start_at,
            start_time: e.start_at,
            end_at: e.end_at,
            end_time: e.end_at,
            is_all_day: e.is_all_day,
            location: e.location,
            description: e.description,
            is_system_event: e.is_system_event
        }));
    }, [events]);

    return (
        <PageLayout mode="plain" className="events-bg min-h-screen">
            <PageHeader
                title={<span className="page-title-events">Events</span>}
                description="View and manage institutional events"
                actions={
                    <div className="flex items-center gap-3">
                        <TooltipProvider>
                            <div className="flex bg-white/[0.04] border border-white/10 rounded-2xl p-1.5 backdrop-blur-md shadow-2xl">
                                {(['month', 'week', 'timeline', 'list'] as const).map((mode) => {
                                    const { icon: Icon, label, tooltip } = {
                                        month: { icon: CalendarIcon, label: 'Month', tooltip: 'Monthly overview' },
                                        week: { icon: CalendarDays, label: 'Week', tooltip: 'Weekly schedule' },
                                        timeline: { icon: GitBranch, label: 'Timeline', tooltip: 'Chronological events' },
                                        list: { icon: List, label: 'List', tooltip: 'Event list' }
                                    }[mode];

                                    return (
                                        <Tooltip key={mode}>
                                            <TooltipTrigger asChild>
                                                <button
                                                    onClick={() => setViewMode(mode)}
                                                    className={cn(
                                                        "nav-button-events px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-150 flex items-center",
                                                        viewMode === mode ? "nav-button-events-active" : "text-white/40 hover:text-white/70"
                                                    )}
                                                >
                                                    <Icon 
                                                        size={16} 
                                                        className={cn(
                                                            "mr-[6px] transition-all duration-150",
                                                            viewMode === mode ? "opacity-100 text-[#3b82f6]" : "opacity-60"
                                                        )} 
                                                    />
                                                    {label}
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom" sideOffset={8}>
                                                {tooltip}
                                            </TooltipContent>
                                        </Tooltip>
                                    );
                                })}
                            </div>
                        </TooltipProvider>
                        {canCreate && (
                            <Button
                                onClick={() => nativeNavigate('/events/new', router, 'Events (New)')}
                                className="bg-blue-600 hover:bg-blue-500 text-white border-none shadow-lg hover:shadow-blue-500/20 px-6 h-[46px] rounded-xl font-bold"
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
                                const isoDate = date.toISOString();
                                nativeNavigate(`/events/new?start_at=${isoDate}`, router, `CalendarCell:${isoDate}`);
                            }}
                            onDateRangeSelect={(start, end) => {
                                const startIso = start.toISOString();
                                const endIso = end.toISOString();
                                nativeNavigate(`/events/new?start_at=${startIso}&end_at=${endIso}`, router, `CalendarRange:${startIso}-${endIso}`);
                            }}
                            onEventClick={(event: any) => router.push(`/events/${event.id}`)}
                        />
                    )}

                    {viewMode === 'week' && (
                        <WeekTimelineView
                            events={events}
                            currentDate={currentDate}
                            onDateChange={setCurrentDate}
                            onEventClick={(event: any) => router.push(`/events/${event.id}`)}
                            onEventUpdate={async (id, updates) => {
                                try {
                                    await EventService.updateEvent(id, updates, user?.uid || '', undefined, undefined);
                                    // Subscription will handle the update in state
                                } catch (error) {
                                    console.error("Failed to update event via week timeline", error);
                                }
                            }}
                            onCreateEvent={(date, startTime, endTime) => {
                                // For week view, we might have specific times. Map them to start_at.
                                const isoDate = date.toISOString();
                                nativeNavigate(`/events/new?start_at=${isoDate}`, router, 'WeekTimeline:NewEvent');
                            }}
                            onRangeSelect={(start, end) => {
                                const startIso = start.toISOString();
                                const endIso = end.toISOString();
                                nativeNavigate(`/events/new?start_at=${startIso}&end_at=${endIso}`, router, `WeekTimeline:RangeSelect`);
                            }}
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
                            onEventClick={(event: any) => router.push(`/events/${event.id}`)}
                        />
                    )}
                </div>
            )}

            {/* Modal removed from here as it's now handled by parallel routing and standalone pages */}
        </PageLayout>
    );
}
