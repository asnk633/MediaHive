import { SystemEvent } from '@/types/systemEvent';
import { supabase } from '@/lib/supabaseClient';
import { TimestampLike } from '@/types/timestamp';

const COLLECTION = 'system_events';

export const SystemEventService = {
    subscribeToSystemEvents: (callback: (events: SystemEvent[]) => void) => {
        // Use Supabase Realtime for system events
        const channel = supabase
            .channel('system_events_all')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: COLLECTION
                },
                async () => {
                    try {
                        const events = await SystemEventService.getAllSystemEvents();
                        callback(events);
                    } catch (e) {
                        console.error("Failed to update system events after realtime event", e);
                    }
                }
            )
            .subscribe();

        // Initial fetch
        SystemEventService.getAllSystemEvents().then(callback);

        return () => {
            supabase.removeChannel(channel);
        };
    },

    getAllSystemEvents: async (): Promise<SystemEvent[]> => {
        try {
            const { data, error } = await supabase
                .from(COLLECTION)
                .select('*')
                .eq('status', 'active');

            if (error) throw error;
            return (data || []) as unknown as SystemEvent[];
        } catch (error) {
            console.error('Failed to fetch system events:', error);
            return [];
        }
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
                } else if (typeof event.date === 'string' || typeof event.date === 'number') {
                    cursor = new Date(event.date);
                } else {
                    cursor = new Date(event.date.seconds * 1000);
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
                    date: data.startDate.toISOString(),
                    isRecurring: false,
                    status: 'active',
                    metadata: {
                        source: 'leave_request',
                        leaveRequestId: data.leaveRequestId,
                        userId: data.userId,
                        endDate: data.endDate.toISOString()
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
