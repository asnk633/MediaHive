import type { Event, EventCrewAssignment, EventEquipmentReservation } from '@/features/events/types/event';
import type { Task } from "@/features/tasks/types/task";
import { RecurrenceService } from './recurrenceService';
import { CanonicalDataService } from '@/services/canonicalDataService';
import { SystemEventService } from './systemEventService';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { tenantContext } from '@/lib/auth/tenantContext';
import { TABLES } from '@/lib/dbTables';
import { safeQuery } from '@/lib/safeQuery';
import { normalizeEvents } from '@/lib/normalization';

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
                .eq('tenant_id', tenantId)
                .eq('deleted', false);

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

            const rawEvents = (data as any[]) || [];
            
            // Expand recurring events
            const currentYear = new Date().getFullYear();
            return RecurrenceService.expandEvents(rawEvents, new Date(currentYear, 0, 1), new Date(currentYear, 11, 31));
        } catch (e) {
            const cacheKey = institutionId ? `events:${institutionId}` : 'events';
            console.warn("[EventService] Falling back to cache:", e);
            const cached = await offlineDB.getCache<any[]>(cacheKey);
            const rawEvents = cached || [];
            const currentYear = new Date().getFullYear();
            return RecurrenceService.expandEvents(rawEvents, new Date(currentYear, 0, 1), new Date(currentYear, 11, 31));
        }
    },

    async getEventById(id: string): Promise<Event | null> {
        try {
            const { tenantId } = await tenantContext();

            // Handle Virtual IDs for recurring instances (e.g. seriesId_timestamp)
            let searchId = id;
            let virtualTimestamp: number | null = null;
            
            if (id.includes('_')) {
                const parts = id.split('_');
                // Ensure it's a valid virtual ID format (UUID_Timestamp)
                if (parts.length === 2 && !isNaN(Number(parts[1]))) {
                    searchId = parts[0];
                    virtualTimestamp = parseInt(parts[1]);
                }
            }

            // Final safety check for UUID format
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchId);
            if (!isUuid) {
                console.warn(`[EventService] Invalid UUID format for ID: ${searchId}`);
                return null;
            }

            const { data, error } = await safeQuery(() => supabase
                .from(COLLECTION)
                .select(`
                    *,
                    creator:profiles!events_created_by_fkey(id, full_name, avatar_url),
                    crew:event_crew(
                        *,
                        profile:${TABLES.USERS}(id, full_name, avatar_url)
                    ),
                    equipment:${TABLES.EVENT_EQUIPMENT}(
                        *,
                        inventory:${TABLES.INVENTORY}(id, name, image_url)
                    )
                `)
                .eq('id', searchId)
                .eq('tenant_id', tenantId)
                .eq('deleted', false)
                .single()
            );

            if (error) {
                // Return null on NOT_FOUND, otherwise re-throw to be caught by the service catch block
                if (error.code === 'PGRST116') return null;
                throw error;
            }
            
            if (!data) return null;
            
            // Map the flat data to the expected Event structure
            const rawEvent = data as any;
            const mappedEvent = {
                ...rawEvent,
                created_by: rawEvent.creator ? {
                    uid: rawEvent.creator.id,
                    name: rawEvent.creator.full_name,
                    role: (rawEvent as any).created_by_role // Fallback if exists
                } : {
                    uid: rawEvent.created_by,
                    name: "Unknown User"
                }
            };

            // Normalize dates and structure
            const normalized = normalizeEvents([mappedEvent])[0];

            if (virtualTimestamp && (normalized as any).is_recurring) {
                // Re-expand to find this specific instance
                const instanceDate = new Date(virtualTimestamp);
                const expansionStart = new Date(instanceDate.getFullYear(), instanceDate.getMonth(), instanceDate.getDate());
                const expansionEnd = new Date(expansionStart.getTime() + 24 * 60 * 60 * 1000);
                
                const expanded = RecurrenceService.expandEvents([normalized as any], expansionStart, expansionEnd);
                return expanded.find(e => e.id === id) || null;
            }

            return normalized;
        } catch (e: any) {
            console.error(`[EventService] getEventById failed for ID: ${id}`);
            console.error(`Error details: ${e?.message || 'No message'} (${e?.code || 'No code'})`);
            if (e?.details) console.error(`Details: ${e.details}`);
            if (e?.hint) console.error(`Hint: ${e.hint}`);
            
            // Fallback: Check cache
            const cacheKey = 'events'; // Simplified for now
            const cached = await offlineDB.getCache<any[]>(cacheKey);
            return cached?.find(e => e.id === id) || null;
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
                    .eq('tenant_id', tenantId)
                    .eq('deleted', false);

                if (institutionId) {
                    query = query.eq('institution_id', institutionId);
                }

                const { data: rawEvents, error } = await safeQuery(() => query
                    .order('start_at', { ascending: true })
                );

                if (error) throw error;


                // 2. Expand Recurring User Events
                const currentYear = new Date().getFullYear();
                const expansionStart = new Date(currentYear, 0, 1);
                const expansionEnd = new Date(currentYear + 1, 11, 31);
                
                const userEvents = RecurrenceService.expandEvents((rawEvents as any[]) || [], expansionStart, expansionEnd);

                // 3. Combine with system events
                const allSystemEvents = await SystemEventService.getAllSystemEvents();
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

                const normalized = normalizeEvents(Array.from(uniqueEventsMap.values()));
                
                // Update Cache
                const cacheKey = institutionId ? `events:${institutionId}` : 'events';
                await offlineDB.setCache(cacheKey, normalized);
                
                callback(normalized);
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
                is_recurring: event.is_recurring,
                recurrence_rule: event.recurrence_rule,
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

    deleteInstance: async (seriesId: string, instanceDate: string | Date) => {
        // To delete a single instance, we create an exception record with deleted: true
        const { tenantId, institutionId } = await tenantContext();
        
        // We need the series data to ensure the exception has the right context
        const { data: series, error } = await supabase.from(TABLES.EVENTS).select('*').eq('id', seriesId).single();
        if (error || !series) throw new Error('Parent series not found');

        const exceptionRecord = {
            title: series.title,
            description: series.description,
            type: (series as any).type,
            location: series.location,
            is_recurring: false,
            recurrence_rule: null,
            parent_event_id: seriesId,
            recurrence_exception_date: typeof instanceDate === 'string' ? instanceDate : instanceDate.toISOString(),
            start_at: typeof instanceDate === 'string' ? instanceDate : instanceDate.toISOString(),
            end_at: typeof instanceDate === 'string' ? instanceDate : instanceDate.toISOString(), // End date is typically the same day for a tombstone
            deleted: true,
            tenant_id: tenantId,
            institution_id: institutionId,
            approval_status: series.approval_status,
            status: series.status
        };

        const success = await CanonicalDataService.createRecord(COLLECTION, exceptionRecord, 'event');
        if (!success) throw new Error('Failed to create recurrence exception');
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

    async checkEquipmentConflicts(inventoryId: string, start: string | Date, end: string | Date, excludeEventId?: string): Promise<any[]> {
        const { tenantId } = await tenantContext();
        
        // 1. Fetch relevant equipment reservations for this item
        // We fetch all non-deleted events that have a reservation for this item.
        // For performance, we could filter by date, but recurring events might have a first instance in the past.
        const { data: allReservations, error } = await safeQuery(() => 
            supabase
                .from(TABLES.EVENT_EQUIPMENT)
                .select(`
                    *,
                    event:${TABLES.EVENTS}(
                        id, title, is_recurring, recurrence_rule, start_at, end_at, deleted
                    )
                `)
                .eq('inventory_id', inventoryId)
                .eq('tenant_id', tenantId)
        );

        if (error) {
            console.error("Conflict check failed", error);
            return [];
        }

        const queryStart = new Date(start);
        const queryEnd = new Date(end);
        const conflicts: any[] = [];

        (allReservations as any[] || []).forEach(res => {
            const event = res.event;
            if (!event || event.deleted) return;
            
            // Allow excluding a specific series (when editing)
            if (excludeEventId && event.id === excludeEventId) return;

            if (event.is_recurring && event.recurrence_rule) {
                // Expand recurring event for the query range
                const instances = RecurrenceService.expandEvents([event], queryStart, queryEnd);
                
                // For each instance, check if the reservation (relative to instance start) overlaps
                instances.forEach(instance => {
                    // Equipment reservation time is relative to the original event start
                    const originalEventStart = new Date(event.start_at).getTime();
                    const resStartOffset = new Date(res.reserved_from).getTime() - originalEventStart;
                    const resEndOffset = new Date(res.reserved_to).getTime() - originalEventStart;

                    const instanceStart = new Date(instance.start_at).getTime();
                    const instResStart = new Date(instanceStart + resStartOffset);
                    const instResEnd = new Date(instanceStart + resEndOffset);

                    if (instResStart < queryEnd && instResEnd > queryStart) {
                        conflicts.push({
                            ...res,
                            reserved_from: instResStart.toISOString(),
                            reserved_to: instResEnd.toISOString(),
                            instance_id: instance.id,
                            is_recurring_conflict: true
                        });
                    }
                });
            } else {
                // Simple overlap check for static events
                const resStart = new Date(res.reserved_from);
                const resEnd = new Date(res.reserved_to);
                if (resStart < queryEnd && resEnd > queryStart) {
                    conflicts.push(res);
                }
            }
        });

        return conflicts;
    }
};
