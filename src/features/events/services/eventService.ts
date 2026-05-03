import type { Event, EventCrewAssignment, EventEquipmentReservation } from '@/features/events/types/event';
import type { MediaTask as Task } from '@/services/tasks/taskContract';
import { CanonicalDataService } from '@/services/canonicalDataService';
import { SystemEventService } from './systemEventService';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { tenantContext } from '@/lib/auth/tenantContext';
import { TABLES } from '@/lib/dbTables';
import { safeQuery } from '@/lib/safeQuery';

import { offlineDB } from '@/lib/offline/db';

const COLLECTION = TABLES.EVENTS;

export const EventService = {
    async getEvents(institutionId?: string): Promise<Event[]> {
        try {
            const { tenantId } = await tenantContext();

            let query = supabase
                .from(COLLECTION)
                .select(`
                    *,
                    crew:${TABLES.EVENT_CREW}(
                        *,
                        profile:${TABLES.USERS}(id, full_name, avatar_url)
                    ),
                    equipment:${TABLES.EVENT_EQUIPMENT}(
                        *,
                        inventory:${TABLES.INVENTORY}(id, name, image_url)
                    )
                `)
                .eq('tenant_id', tenantId);

            if (institutionId) {
                query = query.eq('institution_id', institutionId);
            }

            const { data, error } = await safeQuery(() => query
                .order('start_at', { ascending: true })
            );

            if (error) throw error;

            // Update Cache
            if (data) {
                const cacheKey = institutionId ? `events:${institutionId}` : 'events';
                await offlineDB.setCache(cacheKey, data);
            }

            return (data as any[]) || [];
        } catch (e) {
            const cacheKey = institutionId ? `events:${institutionId}` : 'events';
            console.warn("[EventService] Falling back to cache:", e);
            const cached = await offlineDB.getCache<any[]>(cacheKey);
            return cached || [];
        }
    },

    subscribeToEvents: (callback: (events: Event[]) => void, institutionId?: string) => {
        let isCancelled = false;
        let pollInterval: NodeJS.Timeout | null = null;
        let windowCleanup: (() => void) | null = null;

        const pollEvents = async () => {
            if (isCancelled) return;

            try {
                const { tenantId } = await tenantContext();

                let query = supabase
                    .from(COLLECTION)
                    .select('*')
                    .eq('tenant_id', tenantId);

                if (institutionId) {
                    query = query.eq('institution_id', institutionId);
                }

                const { data: rawEvents, error } = await safeQuery(() => query
                    .order('start_at', { ascending: true })
                );

                if (error) throw error;

                const userEvents = ((rawEvents as any[]) || []).map((event: any) => ({
                    ...event,
                    // Legacy mappings for backward compatibility if any
                    startTime: event.start_at,
                    endTime: event.end_at,
                    // Normalize created_at to Timestamp schema for compatibility with any components still using it
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

                const rawCombined = [
                    ...userEvents,
                    ...systemEvents.map(se => ({
                        ...se,
                        is_system_event: true,
                        start_at: se.date,
                        end_at: se.date,
                    }))
                ];

                const uniqueEventsMap = new Map();
                rawCombined.forEach((evt: any) => {
                    if (!evt.id || evt.id === "") {
                        evt.id = `fallback-${evt.title}-${evt.start_at || evt.date}`;
                    }

                    if (!uniqueEventsMap.has(evt.id)) {
                        uniqueEventsMap.set(evt.id, evt);
                    }
                });

                const combined = Array.from(uniqueEventsMap.values());
                
                // Update Cache
                const cacheKey = institutionId ? `events:${institutionId}` : 'events';
                await offlineDB.setCache(cacheKey, combined);
                
                callback(combined);
            } catch (error) {
                const cacheKey = institutionId ? `events:${institutionId}` : 'events';
                console.warn('Event polling failed, using cache:', error);
                if (!isCancelled) {
                    const cached = await offlineDB.getCache<any[]>(cacheKey);
                    callback(cached || []);
                }
            }

            if (!isCancelled) {
                pollInterval = setTimeout(pollEvents, 30000);
            }
        };

        pollEvents();

        if (typeof window !== 'undefined') {
            const handleStorage = async () => {
                const cacheKey = institutionId ? `events:${institutionId}` : 'events';
                const cached = await offlineDB.getCache<any[]>(cacheKey);
                callback(cached || []);
            };
            window.addEventListener('event-update', handleStorage);

            const handleFocus = () => {
                if (!isCancelled) pollEvents();
            };
            window.addEventListener('focus', handleFocus);

            windowCleanup = () => {
                window.removeEventListener('event-update', handleStorage);
                window.removeEventListener('focus', handleFocus);
            };
        }

        return () => {
            isCancelled = true;
            if (pollInterval) clearTimeout(pollInterval);
            if (windowCleanup) {
                windowCleanup();
            }
        };
    },

    addEvent: async (
        event: any, 
        crew?: Partial<EventCrewAssignment>[], 
        equipment?: Partial<EventEquipmentReservation>[],
        autoGenerateTasks: boolean = true
    ) => {
        try {
            const { tenantId, userId } = await tenantContext();

            // 1. Sanitize Event Payload
            const { 
                title, description, start_at, end_at, is_all_day, location,
                media_coverage, on_behalf_of, organizer, institution_id, department_id 
            } = event;

            const cleanedEvent: any = {
                title,
                description,
                start_at,
                end_at,
                is_all_day,
                location,
                media_coverage,
                on_behalf_of,
                organizer,
                tenant_id: tenantId,
                created_by: userId
            };

            if (institution_id) cleanedEvent.institution_id = institution_id;
            if (department_id && !isNaN(Number(department_id))) {
                cleanedEvent.department_id = Number(department_id);
            }

            // USE SYNC ENGINE FOR PRIMARY EVENT
            const { data: eventData, error: eventError } = await CanonicalDataService.createRecord(COLLECTION, cleanedEvent, 'event');

            if (eventError) throw eventError;
            const data = eventData as any;

            // 2. Crew/Equipment (NOTE: These are still direct Supabase calls and will fail if offline)
            // TODO: Migrate these to the Sync Engine as well
            if (crew && crew.length > 0) {
                const crewToInsert = crew.map(c => ({
                    event_id: data.id,
                    user_id: c.user_id,
                    role: c.role,
                    tenant_id: tenantId
                }));
                await safeQuery(() => supabase.from(TABLES.EVENT_CREW).insert(crewToInsert));
            }

            if (equipment && equipment.length > 0) {
                const equipToInsert = equipment.map(e => ({
                    event_id: data.id,
                    inventory_id: e.inventory_id,
                    reserved_from: e.reserved_from,
                    reserved_to: e.reserved_to,
                    tenant_id: tenantId
                }));
                await safeQuery(() => supabase.from(TABLES.EVENT_EQUIPMENT).insert(equipToInsert));
            }

            return data;
        } catch (err) {
            console.error("Saving event failed:", err);
            throw err;
        }
    },

    deleteEvent: async (id: string) => {
        const success = await CanonicalDataService.patchFields(COLLECTION, id, { deleted: true }, 'event');
        if (!success) throw new Error('Failed to enqueue event deletion');
    },

    updateEvent: async (id: string, updates: Partial<Event> & { crew?: Partial<EventCrewAssignment>[], equipment?: Partial<EventEquipmentReservation>[] }, currentUserUid: string) => {
        try {
            const { tenantId } = await tenantContext();
            const { crew, equipment, ...eventUpdates } = updates;
            const baseUpdatedAt = (updates as any).updated_at;

            const success = await CanonicalDataService.patchFields(COLLECTION, id, eventUpdates, 'event', baseUpdatedAt);
            if (!success) throw new Error('Failed to enqueue event update');

            // Crew/Equipment updates (NOTE: Direct Supabase calls)
            if (crew) {
                await safeQuery(() => supabase.from(TABLES.EVENT_CREW).delete().eq('event_id', id));
                if (crew.length > 0) {
                    await safeQuery(() => supabase.from(TABLES.EVENT_CREW).insert(
                        crew.map(c => ({ event_id: id, user_id: c.user_id, role: c.role, tenant_id: tenantId }))
                    ));
                }
            }

            if (equipment) {
                await safeQuery(() => supabase.from(TABLES.EVENT_EQUIPMENT).delete().eq('event_id', id));
                if (equipment.length > 0) {
                    await safeQuery(() => supabase.from(TABLES.EVENT_EQUIPMENT).insert(
                        equipment.map(e => ({ 
                            event_id: id, 
                            inventory_id: e.inventory_id, 
                            reserved_from: e.reserved_from, 
                            reserved_to: e.reserved_to, 
                            tenant_id: tenantId 
                        }))
                    ));
                }
            }

            return { id, ...eventUpdates };
        } catch (err) {
            console.error("Error updating event:", err);
            throw err;
        }
    },

    async checkEquipmentConflicts(inventoryId: string, start: string, end: string, excludeEventId?: string): Promise<any[]> {
        const { tenantId } = await tenantContext();
        let query = supabase
            .from(TABLES.EVENT_EQUIPMENT)
            .select(`*, event:${TABLES.EVENTS}(title)`)
            .eq('inventory_id', inventoryId)
            .eq('tenant_id', tenantId)
            .lt('reserved_from', end)
            .gt('reserved_to', start);

        if (excludeEventId) {
            query = query.neq('event_id', excludeEventId);
        }

        const { data, error } = await safeQuery(() => query);
        if (error) {
            console.error("Conflict check failed", error);
            return [];
        }
        return (data as any[]) || [];
    }
};
