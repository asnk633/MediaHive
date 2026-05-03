import { SystemEvent } from '@/features/events/types/systemEvent';
import { supabase } from '@/lib/supabaseClient';
import { TimestampLike } from '@/types/timestamp';
import { EventSchema } from '@/domain/schemas/event';
import { TABLES } from '@/lib/dbTables';
import { synergySyncManager } from '@/system/realtimeSync';

const COLLECTION = TABLES.EVENTS;

/**
 * Safely normalize date input to Date object
 * Handles both Date instances and Firestore-style timestamp objects
 */
function normalizeDate(
    input: Date | { seconds: number; nanoseconds: number } | string | number
): Date {
    if (input instanceof Date) return input;
    if (typeof input === 'string') {
        const match = input.match(/^(\d{4}-\d{2}-\d{2})/);
        if (match) {
            const [y, m, d] = match[1].split('-').map(Number);
            return new Date(y, m - 1, d);
        }
    }
    if (typeof input === 'string' || typeof input === 'number') return new Date(input);
    return new Date((input as any).seconds * 1000);
}

export const SystemEventService = {
    subscribeToSystemEvents: (callback: (events: SystemEvent[]) => void) => {
        let isCancelled = false;
        const subscriptionId = 'system_events_all';

        const setupRealtime = async () => {
            try {
                await synergySyncManager.subscribe(
                    subscriptionId,
                    {
                        table: COLLECTION,
                        filter: '', // No filter specified in original code, but we could add tenant filtering here if relevant
                    },
                    async () => {
                        try {
                            if (isCancelled) return;
                            const events = await SystemEventService.getAllSystemEvents();
                            callback(events);
                        } catch (e) {
                            console.error("Failed to update system events after realtime event", e);
                        }
                    }
                );
            } catch (err) {
                console.error('[Realtime][SystemEvents] Setup error:', err);
            }
        };

        setupRealtime();

        // Initial fetch
        SystemEventService.getAllSystemEvents().then(events => {
            if (!isCancelled) callback(events);
        });

        return () => {
            isCancelled = true;
            synergySyncManager.unsubscribe(subscriptionId);
        };
    },

    getAllSystemEvents: async (): Promise<SystemEvent[]> => {
        // First, try the original query for approved events
        const { data, error } = await supabase
            .from(COLLECTION)
            .select('*')
            .eq('approval_status', 'approved');

        if (error) {
            // If the first query fails, try to fetch all events without approval status filter
            console.warn("Failed to fetch approved system events, attempting fallback query:", error.message);
            const { data: fallbackData, error: fallbackError } = await supabase
                .from(COLLECTION)
                .select('*');

            if (fallbackError) {
                console.warn('Alternative query also failed:', fallbackError.message);
                return [];
            }

            const events = (fallbackData || []).map((item: any) => {
                const parsed = EventSchema.safeParse(item);
                if (!parsed.success) {
                    console.warn("[SystemEventService] DTO validation failed for event:", parsed.error);
                }
                return item as unknown as SystemEvent;
            });

            return events;
        }

        const events = (data || []).map((item: any) => {
            const parsed = EventSchema.safeParse(item);
            if (!parsed.success) {
                console.warn("[SystemEventService] DTO validation failed for event:", parsed.error);
            }
            return item as unknown as SystemEvent;
        });

        return events;
    },

    addSystemEvent: async (event: Omit<SystemEvent, 'id' | 'created_at' | 'created_by'>) => {
        try {
            const { data, error } = await supabase
                .from(COLLECTION)
                .insert([event])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Failed to add system event:', error);
            throw error;
        }
    },

    updateSystemEvent: async (id: string, updates: Partial<SystemEvent>) => {
        try {
            const { data, error } = await supabase
                .from(COLLECTION)
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Failed to update system event:', error);
            throw error;
        }
    },

    deleteSystemEvent: async (id: string) => {
        try {
            const { error } = await supabase
                .from(COLLECTION)
                .delete()
                .eq('id', id);

            if (error) throw error;
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

        if (!Array.isArray(events)) {
            console.warn("[SystemEventService] expandEventsForView received non-array:", events);
            return [];
        }

        events.forEach(event => {
            if (event.isRecurring && event.recurrence) {
                const { frequency, interval = 1, endDate, month, day, weekday } = event.recurrence;

                let cursor: Date;
                if (!event.date) {
                    cursor = new Date(viewYear, 0, 1);
                } else {
                    cursor = normalizeDate(event.date);
                }

                const refDate = new Date(cursor);
                cursor.setHours(0, 0, 0, 0);

                const endLimit = endDate ? new Date(endDate) : new Date(viewYear + 5, 11, 31);
                endLimit.setHours(23, 59, 59, 999);

                while (cursor <= endLimit && cursor <= endOfYear) {
                    if (cursor.getFullYear() === viewYear) {
                        const instanceDate = new Date(cursor);
                        instanceDate.setHours(refDate.getHours(), refDate.getMinutes(), refDate.getSeconds());

                        expanded.push({
                            ...event,
                            id: `${event.id}_${instanceDate.toISOString().split('T')[0]}`,
                            start_at: instanceDate.toISOString(),
                            end_at: instanceDate.toISOString(), // System events are often instant or have separate logic
                            date: instanceDate.toISOString() as TimestampLike,
                        });
                    } else if (cursor.getFullYear() > viewYear) {
                        if (cursor > endOfYear) break;
                    }

                    switch (frequency) {
                        case 'daily':
                            cursor.setDate(cursor.getDate() + interval);
                            break;
                        case 'weekly':
                            cursor.setDate(cursor.getDate() + (7 * interval));
                            break;
                        case 'monthly':
                            cursor.setMonth(cursor.getMonth() + interval);
                            if (day) {
                                // Simplified: if day is specified, we try to stick to it if possible (Date handles overflow)
                            }
                            break;
                        case 'yearly':
                            cursor.setFullYear(cursor.getFullYear() + interval);
                            break;
                    }
                }
            } else if (event.date) {
                // Non-recurring
                const d = normalizeDate(event.date);

                if (d.getFullYear() === viewYear) {
                    expanded.push(event);
                }
            }
        });

        return expanded;
    },

    createLeaveEvent: async (data: {
        userName: string;
        leaveType: string;
        startDate: Date;
        endDate: Date;
        userId: string;
        leaveRequestId: string;
    }): Promise<string> => {
        try {
            const { data: created, error } = await supabase
                .from(COLLECTION)
                .insert([{
                    title: `Leave: ${data.userName}`,
                    description: `Type: ${data.leaveType}`,
                    type: 'other',
                    start_at: data.startDate.toISOString(),
                    end_at: data.endDate.toISOString(),
                    is_all_day: true,
                    isRecurring: false,
                    status: 'active',
                    metadata: {
                        source: 'leave_request',
                        leaveRequestId: data.leaveRequestId,
                        userId: data.userId,
                    },
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;
            return created.id;
        } catch (error) {
            console.error('Failed to create leave event:', error);
            return 'stub-id';
        }
    },

    deleteLeaveEvent: async (event_id: string): Promise<void> => {
        try {
            const { error } = await supabase
                .from(COLLECTION)
                .delete()
                .eq('id', event_id);
            if (error) throw error;
        } catch (error) {
            console.error('Failed to delete leave event:', error);
        }
    }
};
