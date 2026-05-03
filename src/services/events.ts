import type { Event } from '@/types/event';
import type { Task } from '@/types/task';
import { SystemEventService } from './systemEventService';

import { TimestampLike } from '@/types/timestamp';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';

const LOCAL_STORAGE_KEY = 'mediahive_offline_events';

// In-Memory fallback
let memoryEvents: Event[] = [];
import { supabase } from '@/lib/supabaseClient';

// API helper function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const url = `/api/events${endpoint}`;
    return apiClient(url, options);
};

const saveToLocal = (events: Event[], dispatchEvent: boolean = true) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(events));
        if (dispatchEvent) {
            window.dispatchEvent(new CustomEvent('event-update'));
        }
    }
    memoryEvents = events;
};

const loadFromLocal = (): Event[] => {
    if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                return parsed.map((t: any) => ({
                    ...t,
                    date: t.date?.seconds ? t.date : { seconds: new Date(t.date).getTime() / 1000, nanoseconds: 0 },
                    created_at: t.created_at?.seconds ? t.created_at : { seconds: Date.now() / 1000, nanoseconds: 0 }
                }));
            } catch (e) { console.error(e); }
        }
    }
    return [];
};

export const EventService = {
    subscribeToEvents: (callback: (events: Event[]) => void) => {
        let isCancelled = false;
        let pollInterval: NodeJS.Timeout | null = null;
        let windowCleanup: (() => void) | null = null;

        const pollEvents = async () => {
            if (isCancelled) return;

            try {
                const data = await apiClient('/api/events', {
                    method: 'GET'
                });

                // Process events data
                const rawEvents = Array.isArray(data) ? data : (data.events || []);
                const userEvents = rawEvents.map((event: any) => ({
                    id: event.id,
                    ...event,
                    startTime: event.start_time,
                    endTime: event.end_time,
                    // Normalize date to Timestamp schema to satisfy UI components
                    date: typeof event.date === 'string'
                        ? { seconds: Math.floor(new Date(event.date).getTime() / 1000), nanoseconds: 0 }
                        : event.date,
                    // Normalize created_at to Timestamp schema
                    created_at: typeof event.created_at === 'string'
                        ? { seconds: Math.floor(new Date(event.created_at).getTime() / 1000), nanoseconds: 0 }
                        : event.created_at,
                }));

                // Combine with system events
                const currentYear = new Date().getFullYear();
                const allSystemEvents = await SystemEventService.getAllSystemEvents();
                // Expand for Current Year AND Next Year to ensure visibility
                const systemEventsCurrent = SystemEventService.expandEventsForView(allSystemEvents, currentYear);
                const systemEventsNext = SystemEventService.expandEventsForView(allSystemEvents, currentYear + 1);

                const systemEvents = [...systemEventsCurrent, ...systemEventsNext];

                // We cast SystemEvent to Event (they are compatible enough for display, but may need type assertion)
                const combined = [
                    ...userEvents,
                    ...systemEvents.map(se => ({
                        ...se,
                        // Add UI specific flags or map types if strictly needed
                        is_system_event: true, // Custom flag to be handled in UI
                        start_time: se.date, // Map date to start_time for calendar if needed
                        end_time: se.date,
                    }))
                ];

                callback(combined);
            } catch (error) {
                console.warn('Event polling failed:', error);
                // Fallback to local storage if API fails
                if (!isCancelled) callback(loadFromLocal());
            }

            // Continue polling every 30 seconds
            if (!isCancelled) {
                pollInterval = setTimeout(pollEvents, 30000);
            }
        };

        // Start polling immediately
        pollEvents();

        if (typeof window !== 'undefined') {
            const handleStorage = () => callback(loadFromLocal());
            window.addEventListener('event-update', handleStorage);

            // Task 84: Silent Refresh on Focus
            const handleFocus = () => {
                if (!isCancelled) pollEvents();
            };
            window.addEventListener('focus', handleFocus);

            windowCleanup = () => {
                window.removeEventListener('event-update', handleStorage);
                window.removeEventListener('focus', handleFocus);
            };
        }

        // Return a cleanup function that actually works
        return () => {
            isCancelled = true;
            if (pollInterval) clearTimeout(pollInterval);
            if (windowCleanup) {
                windowCleanup();
            }
        };
    },

    addEvent: async (event: Omit<Event, 'id' | 'created_at'>) => {
        try {
            const response = await apiRequest('', {
                method: 'POST',
                body: JSON.stringify(event),
            });

            const { id: event_id } = response.data;

            if (event.media_coverage && event.media_coverage.length > 0) {
                // Ensure date is string for Task API
                let dateStr: string;
                if (event.date && typeof (event.date as any).toDate === 'function') {
                    dateStr = (event.date as any).toDate().toISOString();
                } else if (event.date instanceof Date) {
                    dateStr = event.date.toISOString();
                } else {
                    dateStr = new Date(event.date as any).toISOString();
                }

                const mediaTask = {
                    title: `Media: ${event.title}`,
                    description: `Media coverage request for event: ${event.title}\n\n${event.description}`,
                    status: 'todo' as const,
                    priority: 'medium' as const, // Default for media requests
                    department: event.department || 'General',
                    due_date: dateStr as any, // Task type likely expects string or Date, ensuring string ISO
                    assigned_to: [],
                    assigned_by: { uid: event.created_by.uid, name: event.created_by.name, role: event.created_by.role || 'user' },
                    created_by: { uid: event.created_by.uid, name: event.created_by.name, role: event.created_by.role || 'user' },
                    event_id,
                    files: [],
                    rated_at: null
                };

                await supabase.from('tasks').insert([mediaTask]);
            }

            return response.data;
        } catch (err) {
            console.warn("Saving event locally:", err);
            const current = loadFromLocal();
            const newEvent: Event = {
                id: 'local_' + Date.now(),
                ...event,
                status: 'pending',
                created_at: new Date().toISOString(),
                date: event.date
            };
            saveToLocal([newEvent, ...current]);
            throw err;
        }
    },

    approveEvent: async (event_id: string, approverUid: string) => {
        try {
            const response = await apiRequest(`/${encodeURIComponent(event_id)}/approve`, {
                method: 'POST',
                body: JSON.stringify({ action: 'approve' }),
            });

            return response.data;
        } catch (e) {
            console.error("Failed to approve event:", e);
            throw e;
        }
    },

    getEvent: async (id: string): Promise<Event | null> => {
        try {
            const data = await apiClient(`/api/events/${id}`, {
                method: 'GET'
            });

            const event = data.event;
            if (!event) return null;

            return {
                id: event.id,
                ...event,
                start_time: event.start_time,
                end_time: event.end_time,
                date: event.date,
                created_at: event.created_at,
            } as unknown as Event;
        } catch (e) {
            console.error("Error fetching event", e);
            const local = loadFromLocal();
            return local.find(t => t.id === id) || null;
        }
    },

    deleteEvent: async (id: string) => {
        try {
            await apiClient(`/api/events?id=${encodeURIComponent(id)}`, {
                method: 'DELETE'
            });
        } catch (err: any) {
            console.error("Event delete failed:", err);
            toast.error("Failed to delete event: " + (err.message || "Unknown error"));
            throw err;
        }
    },

    updateEvent: async (id: string, updates: Partial<Event>, currentUserUid: string) => {
        try {
            const response = await apiRequest(`?id=${encodeURIComponent(id)}`, {
                method: 'PUT',
                body: JSON.stringify(updates),
            });

            return response.data;
        } catch (err) {
            console.error("Error updating event:", err);
            throw err;
        }
    }
};
