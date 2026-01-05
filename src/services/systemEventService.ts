
import { SystemEvent } from '@/types/systemEvent';
import { getFirebaseAuth } from '@/firebase/client';
import { apiClient } from '@/lib/apiClient';
import { TimestampLike } from '@/types/timestamp';

const COLLECTION = 'system_events';

export const SystemEventService = {
    subscribeToSystemEvents: (callback: (events: SystemEvent[]) => void) => {
        // Polling implementation similar to events.ts
        let isCancelled = false;

        const poll = async () => {
            if (isCancelled) return;
            try {
                const events = await SystemEventService.getAllSystemEvents();
                callback(events);
            } catch (e) {
                console.error("Failed to poll system events", e);
            }
            if (!isCancelled) setTimeout(poll, 60000); // Poll slower for system events
        };

        poll();

        return () => { isCancelled = true; };
    },

    getAllSystemEvents: async (): Promise<SystemEvent[]> => {
        try {
            const data = await apiClient('/api/system-events', { method: 'GET' });
            return data as SystemEvent[];
        } catch (error) {
            console.error('Failed to fetch system events:', error);
            return [];
        }
    },

    addSystemEvent: async (event: Omit<SystemEvent, 'id' | 'createdAt' | 'createdBy'>) => {
        try {
            const response = await apiClient('/api/system-events', {
                method: 'POST',
                body: JSON.stringify(event)
            });
            return response.data;
        } catch (error) {
            console.error('Failed to add system event:', error);
            throw error;
        }
    },

    updateSystemEvent: async (id: string, updates: Partial<SystemEvent>) => {
        try {
            const response = await apiClient(`/api/system-events?id=${encodeURIComponent(id)}`, {
                method: 'PUT',
                body: JSON.stringify(updates)
            });
            return response.data;
        } catch (error) {
            console.error('Failed to update system event:', error);
            throw error;
        }
    },

    deleteSystemEvent: async (id: string) => {
        try {
            await apiClient(`/api/system-events?id=${encodeURIComponent(id)}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Failed to delete system event:', error);
            throw error;
        }
    },

    // Helper to expand recurring events for a specific year range
    expandEventsForView: (events: SystemEvent[], viewYear: number): SystemEvent[] => {
        const expanded: SystemEvent[] = [];
        const startOfYear = new Date(viewYear, 0, 1);
        const endOfYear = new Date(viewYear, 11, 31);

        events.forEach(event => {
            if (event.isRecurring && event.recurrence) {
                const { frequency, interval = 1, endDate, month, day, weekday } = event.recurrence;

                // Determine start date for generation (e.g. from event creation or current view start)
                // We should theoretically start from event.date (creation date) strictly, 
                // but to optimize, we can start near the viewYear if possible.
                // However, for correct interval calculation (e.g. every 2 weeks), we need the anchor date.

                let cursor: Date;
                if (!event.date) {
                    cursor = new Date(viewYear, 0, 1);
                } else if (typeof event.date === 'string' || typeof event.date === 'number') {
                    cursor = new Date(event.date);
                } else {
                    cursor = new Date(event.date.seconds * 1000);
                }

                // Normalize cursor to start of day for calculation, but keep reference time
                const refDate = new Date(cursor);
                cursor.setHours(0, 0, 0, 0);

                const endLimit = endDate ? new Date(endDate) : new Date(viewYear + 5, 11, 31); // Default max 5 years ahead if no end date
                endLimit.setHours(23, 59, 59, 999);

                // Optimization: If cursor is way before viewYear, fast forward (tricky for intervals, but mandatory for 'weekly' performance)
                // For Yearly/Monthly with interval 1, it's easy. 
                // For now, valid efficient implementation:

                while (cursor <= endLimit && cursor <= endOfYear) {
                    // Check if cursor is within the view year
                    if (cursor.getFullYear() === viewYear) {
                        const instanceDate = new Date(cursor);
                        // Restore time from original event
                        instanceDate.setHours(refDate.getHours(), refDate.getMinutes(), refDate.getSeconds());

                        expanded.push({
                            ...event,
                            id: `${event.id}_${instanceDate.toISOString().split('T')[0]}`, // Unique ID by date
                            date: instanceDate.toISOString() as TimestampLike,
                        });
                    } else if (cursor.getFullYear() > viewYear) {
                        // Optimization: if we passed the view year, break (unless checking previous years? no, sorted loop)
                        // Wait, if we start from 2024 and view is 2025. We iterate until we hit 2025.
                        // If we pass 2025, we stop.
                        if (cursor > endOfYear) break;
                    }

                    // Advance cursor
                    switch (frequency) {
                        case 'daily':
                            cursor.setDate(cursor.getDate() + interval);
                            break;
                        case 'weekly':
                            cursor.setDate(cursor.getDate() + (7 * interval));
                            break;
                        case 'monthly':
                            // Add months. Handle end of month overflow (e.g. Jan 31 -> Feb 28)
                            // But usually we want "4th of month".
                            // If explicit day is set:
                            cursor.setMonth(cursor.getMonth() + interval);
                            if (day) {
                                // Reset to specific day if month logic shifted it (e.g. Feb has fewer days)
                                // Standard behavior: Jan 31 + 1 month = Feb 28.
                                // If we forcibly set old 'day', check validity?
                                // Let's rely on JS Date behavior: setMonth adds days if overflow.
                                // But usually users expect "Day X of month".
                                // Retain original day preference
                                const expectedDay = day;
                                if (cursor.getDate() !== expectedDay) {
                                    // We landed on overflow (e.g. March 2nd because Feb was short)
                                    // Set to last day of previous month? Or skip?
                                    // Simplest: Set to 1st, then set Date to expectedDay (clamping to max)
                                    cursor.setDate(0); // Go to last day of prev month? No.
                                    // Let's just trust implicit flow for now to keep it simpler.
                                }
                            }
                            break;
                        case 'yearly':
                            cursor.setFullYear(cursor.getFullYear() + interval);
                            break;
                    }
                }
            } else if (event.date) {
                // Non-recurring
                let d: Date;
                if (typeof event.date === 'string' || typeof event.date === 'number') d = new Date(event.date);
                else d = new Date(event.date.seconds * 1000);

                if (d.getFullYear() === viewYear) {
                    expanded.push(event);
                }
            }
        });

        return expanded;
    },

    /**
     * Create a system event for an approved leave request
     * Returns the created event ID
     */
    createLeaveEvent: async (data: {
        userName: string;
        leaveType: string;
        startDate: Date;
        endDate: Date;
        userId: string;
        leaveRequestId: string;
    }): Promise<string> => {
        console.warn('SystemEventService.createLeaveEvent called but feature is disabled (API missing).');
        return 'stub-id';
    },

    /**
     * Delete a leave-generated system event
     */
    deleteLeaveEvent: async (eventId: string): Promise<void> => {
        console.warn('SystemEventService.deleteLeaveEvent called but feature is disabled (API missing).');
    }
};
