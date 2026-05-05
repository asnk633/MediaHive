import { TABLES } from '@/lib/dbTables';
import { safeQuery } from '@/lib/safeQuery';
import { supabase } from '@/lib/supabaseClient';
import { Task } from "@/features/tasks/types/task";
import { EventItem as Event } from '@/services/events/eventContract';
import { SYSTEM_LIMITS, COMPLETED_TASK_RETENTION_DAYS, TASK_FETCH_LIMIT, EVENT_FETCH_LIMIT } from '@/domain/system/systemLimits';
import { TaskSchema, EventSchema, UserSchema } from '@/domain/schemas';
import { tenantContext } from '@/lib/auth/tenantContext';
import { synergySyncManager } from '@/system/realtimeSync';
import { toast } from 'sonner';

import { healthManager } from '@/lib/health/healthState';
import { offlineDB, db } from '@/lib/offline/db';
import { MonitoringService } from '@/services/monitoringService';

// Helper to check for network/auth errors to avoid console noise
const isNetworkError = (error: any) => {
  const msg = error?.message || '';
  const code = error?.code || '';
  return (
    code === 'auth/network-request-failed' ||
    msg.includes('network') ||
    msg.includes('timeout') ||
    msg.includes('Unauthorized') ||
    msg.includes('401')
  );
};

export interface TaskFilters {
  role?: string;
  userId?: string;
  institutionId?: string;
  status?: string[];
  includeDemoData?: boolean;
  assignedTo?: string;
  createdBy?: string;
  signal?: AbortSignal;
}

export interface EventFilters {
  role?: string;
  user_id?: string;
  institutionId?: string;
  status?: string[];
  created_by?: string;
  signal?: AbortSignal;
}

export interface TaskStats {
  todo: number;
  inProgress: number;
  onHold: number;
  review: number;
  done: number;
  pending: number;
  total: number;
  working: number; // in_progress + review
  completed: number; // alias for done
  overdue: number;
  dueToday: number;
  next7Days: number;
}

export interface EventStats {
  total: number;
  upcoming: number;
  thisMonth: number;
  holidays: number;
  meetings: number;
  completed: number;
  next7Days: number;
  next30Days: number;
}

export interface OperationalSummary {
  events: Event[];
  tasks: Task[];
  crew: any[];
  equipment: any[];
}

/**
 * CanonicalDataService
 */
export class CanonicalDataService {
  /**
   * Patch multiple fields on an entity atomically
   * Supports real-time collaboration and offline queuing
   */
  static async patchFields(
    table: string, 
    id: string, 
    fields: Record<string, any>, 
    entityType?: string, // e.g., 'event' or 'task'
    baseUpdatedAt?: string,
    baseVersion?: number
  ): Promise<boolean> {
    if (healthManager.shouldPauseActivities()) return false;

    const { tenantId, userId } = await tenantContext();
    const payload: any = { ...fields, updated_at: new Date().toISOString(), updated_by: userId };

    // 1. Special Handling: Task Assignments (Relational Migration)
    // If we are updating a task's assigned_to, we diff against local state and enqueue relational mutations
    const assignmentField = fields.assigned_to || fields.assignedTo;
    if ((entityType === 'task' || table === TABLES.TASKS) && assignmentField) {
      try {
        const currentTask = await db.tasks.get(id);
        // Normalize previous and new IDs
        const previousIds = (currentTask?.assigned_to || currentTask?.assignedTo || [])
          .map((u: any) => typeof u === 'string' ? u : u.uid);
        const newIds = (assignmentField || [])
          .map((u: any) => typeof u === 'string' ? u : u.uid);

        const { syncEngine } = require('@/lib/offline/queueManager');

        // Calculate diff
        const toAssign = newIds.filter((uid: string) => !previousIds.includes(uid));
        const toUnassign = previousIds.filter((uid: string) => !newIds.includes(uid));

        for (const uid of toAssign) {
          await syncEngine.enqueueMutation('ASSIGN_USER', { task_id: id, user_id: uid, tenant_id: tenantId });
        }
        for (const uid of toUnassign) {
          await syncEngine.enqueueMutation('UNASSIGN_USER', { task_id: id, user_id: uid, tenant_id: tenantId });
        }

        // We KEEP assigned_to in the payload so the legacy trigger sync_task_assignments_trigger 
        // doesn't fight with our manual relational insertions.
        // Actually, deleting it is safer if we trust the trigger on task_assignments (sync_legacy_assigned_to_trigger)
        // to update the legacy column.
        delete payload.assigned_to;
        delete payload.assignedTo;
      } catch (e) {
        console.error('[CanonicalDataService] Failed to diff task assignments:', e);
      }
    }

    // 2. Broadcast to real-time peers (optimistic)
    if (entityType) {
      const { collabManager } = require('@/lib/collaboration/collabManager');
      collabManager.broadcastUpdate(entityType, id, fields);
    }

    // 3. Persist via True Offline Sync Engine
    const { syncEngine } = require('@/lib/offline/queueManager');
    const mutationType = `UPDATE_${(entityType || table).toUpperCase()}`;
    await syncEngine.enqueueMutation(mutationType, { id, ...payload, tenant_id: tenantId }, baseUpdatedAt, baseVersion);

    return true;
  }

  /**
   * Create a new record with offline-first support
   */
  static async createRecord(
    table: string, 
    data: any, 
    entityType?: string // e.g., 'event' or 'task'
  ): Promise<{ data: any; error: any }> {
    if (healthManager.shouldPauseActivities()) return { data: null, error: new Error('System maintenance in progress') };

    const { tenantId, userId, institutionId } = await tenantContext();
    
    const finalInstitutionId = data.institution_id || data.institutionId || institutionId;

    // Validation Guard: Prevent creating records without institution_id for mandatory tables
    const tablesRequiringInstitution = [TABLES.INVENTORY, TABLES.TASKS, TABLES.EVENTS, TABLES.EQUIPMENT_BOOKINGS];
    if (tablesRequiringInstitution.includes(table as any) && !finalInstitutionId) {
       const errorMsg = `[CanonicalDataService] Cannot create ${entityType || table} without institution context. Please refresh your session.`;
       MonitoringService.error(errorMsg, { table, entityId: data.id });
       return { data: null, error: new Error(errorMsg) };
    }

    const payload = { 
      id: data.id || crypto.randomUUID(), // Ensure ID is present for offline validation
      ...data, 
      tenant_id: tenantId, 
      institution_id: finalInstitutionId,
      created_at: new Date().toISOString(), 
      created_by: userId 
    };

    const { syncEngine } = require('@/lib/offline/queueManager');

    // Special Handling: Task Assignments (Relational Migration)
    // Prevent legacy JSONB writes even on creation
    const assignmentField = payload.assigned_to || payload.assignedTo;
    if ((entityType === 'task' || table === TABLES.TASKS) && assignmentField) {
      const taskId = payload.id;

      // 2. Extract assignments
      const uids = (assignmentField || []).map((u: any) => typeof u === 'string' ? u : u.uid);
      
      // 3. Enqueue relational assignments first
      for (const uid of uids) {
        await syncEngine.enqueueMutation('ASSIGN_USER', { task_id: taskId, user_id: uid, tenant_id: tenantId });
      }

      // 4. Cleanup legacy fields from creation payload
      delete payload.assigned_to;
      delete payload.assignedTo;
    }

    // 5. Broadcast to real-time peers (optimistic)
    if (entityType) {
      const { collabManager } = require('@/lib/collaboration/collabManager');
      collabManager.broadcastUpdate(entityType, payload.id || 'new', payload);
    }

    // 6. Persist via True Offline Sync Engine
    const mutationType = `CREATE_${(entityType || table).toUpperCase()}`;
    const finalId = await syncEngine.enqueueMutation(mutationType, payload);

    return { data: { ...payload, id: finalId }, error: null };
  }

  /**
   * Get a single record by ID with offline fallback
   */
  static async getRecordById(table: string, id: string): Promise<{ data: any; error: any }> {
    try {
      const { tenantId } = await tenantContext();
      
      const { data, error } = await safeQuery(() => supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single()
      );

      if (error) {
          // Try offline fallback
          if (typeof window !== 'undefined') {
              const tableObj = (db as any)[table];
              if (tableObj) {
                  const cached = await tableObj.get(id);
                  if (cached) return { data: cached, error: null };
              }
          }
          throw error;
      }
      
      return { data, error: null };
    } catch (error) {
      console.error(`[CanonicalDataService] Error fetching ${table} by id:`, error);
      return { data: null, error };
    }
  }

  /**
   * Create multiple records atomically
   */
  static async bulkCreateRecords(
    table: string,
    records: any[],
    entityType?: string
  ): Promise<boolean> {
    if (healthManager.shouldPauseActivities()) return false;

    const { tenantId } = await tenantContext();
    const payload = records.map(r => ({
      ...r,
      tenant_id: tenantId,
      created_at: new Date().toISOString()
    }));

    const { syncEngine } = require('@/lib/offline/queueManager');
    const mutationType = `BULK_CREATE_${(entityType || table).toUpperCase()}`;
    await syncEngine.enqueueMutation(mutationType, { records: payload, tenant_id: tenantId });

    return true;
  }

  /**
   * Update multiple records atomically
   */
  static async bulkUpdateFields(
    table: string,
    updates: { id: string; fields: Record<string, any> }[],
    entityType?: string
  ): Promise<boolean> {
    if (healthManager.shouldPauseActivities()) return false;

    const { tenantId, userId } = await tenantContext();
    const payload = updates.map(u => ({
      id: u.id,
      ...u.fields,
      tenant_id: tenantId,
      updated_at: new Date().toISOString(),
      updated_by: userId
    }));

    const { syncEngine } = require('@/lib/offline/queueManager');
    const mutationType = `BULK_UPDATE_${(entityType || table).toUpperCase()}`;
    await syncEngine.enqueueMutation(mutationType, { updates: payload, tenant_id: tenantId });

    return true;
  }

  /**
   * Get tasks with consistent filtering based on user role and filters
   */
  static async getTasks(filters: TaskFilters = {}): Promise<Task[]> {
    if (healthManager.shouldPauseActivities()) {
      console.warn('[CanonicalDataService] System pulse DEAD. Attempting cached tasks fallback.');
      if (typeof window !== 'undefined') {
        try {
          const cached = await db.tasks.toArray();
          if (cached.length > 0) {
            toast('Offline - Showing last known data', { id: 'stale-tasks-toast', icon: '📡' });
            return cached;
          }
        } catch (e) {}
      }
      return [];
    }

    try {
      const { tenantId } = await tenantContext();
      const fetchStart = Date.now();
      console.log(`[BOOT][STEP] Fetching tasks from Supabase for role: ${filters.role || 'unknown'}`);

      let query = supabase
        .from(TABLES.TASKS)
        .select(`
          *, 
          version, 
          updated_by,
          task_assignments(
            user_id,
            role,
            profiles:${TABLES.USERS}(id, full_name, avatar_url)
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('deleted', false);

      if (filters.institutionId) {
        console.log(`[CanonicalDataService] Filtering tasks by institution: ${filters.institutionId}`);
        query = query.eq('institution_id', filters.institutionId);
      } else {
        console.warn(`[CanonicalDataService] Fetching tasks WITHOUT institution filter (Global)`);
      }
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters.createdBy) {
      query = query.eq('created_by', filters.createdBy);
      }
      if (filters.assignedTo) {
        // Use the new join table for filtering
        query = query.filter('task_assignments.user_id', 'eq', filters.assignedTo);
      }

      const { data: tasks, error } = await safeQuery(() => query
        .order('created_at', { ascending: false })
        .limit(TASK_FETCH_LIMIT + 1)
      ) as { data: any[]; error: any };

      if (error) throw error;

      console.log(`[BOOT][DONE] Tasks fetched in ${Date.now() - fetchStart}ms`);

      const isCapped = ((tasks as any[])?.length || 0) > TASK_FETCH_LIMIT;
      const finalTasks = isCapped ? (tasks as any[]).slice(0, TASK_FETCH_LIMIT) : (tasks || []);

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - COMPLETED_TASK_RETENTION_DAYS * 24 * 60 * 60 * 1000);

      const { mapTask } = await import('@/features/tasks/services/taskService');

      const processedTasks = finalTasks
        .filter((task: any) => {
          // DTO Validation
          const parsed = TaskSchema.safeParse(task);
          if (!parsed.success) {
            console.warn("[CanonicalDataService] DTO validation failed for task:", parsed.error);
          }

          if (task.is_archived) return false;

          if (task.status === 'done') {
            const dateStr = task.updated_at || task.created_at;
            const date = dateStr ? new Date(dateStr) : null;
            if (date && date < sevenDaysAgo) return false;
          }
          return true;
        })
        .map(mapTask);

      (processedTasks as any).__meta = {
        total: finalTasks.length,
        isCapped,
        limit: TASK_FETCH_LIMIT
      };

      if (isCapped) {
        console.warn(`[DEGRADATION] Tasks capped at ${TASK_FETCH_LIMIT}. Showing partial results.`);
      }

      if (typeof window !== 'undefined') {
        try {
          // Clear old tasks from this tenant/institution if needed, or just bulkPut
          // Since we might have multiple institutions, we might want to be selective.
          // For now, bulkPut is safe as IDs are unique.
          await db.tasks.bulkPut(processedTasks);
        } catch (e) { /* ignore IndexedDB errors */ }
      }

      if (processedTasks.length === 0) {
        console.warn(`[CanonicalDataService] No tasks returned for tenant: ${tenantId.slice(0, 8)}... (Filters: ${JSON.stringify(filters)})`);
      } else {
        console.log(`[CanonicalDataService] Successfully fetched ${processedTasks.length} tasks`);
      }

      return processedTasks as Task[];
    } catch (error: any) {
      if (typeof window !== 'undefined' && isNetworkError(error)) {
        try {
          const cached = await db.tasks.toArray();
          if (cached.length > 0) {
            toast('Offline - Showing last known data', { id: 'stale-tasks-toast', icon: '📡' });
            return cached;
          }
        } catch (e) {}
      }
      
      if (!isNetworkError(error)) {
        console.error('Error fetching tasks:', JSON.stringify(error, null, 2));
      }
      return [];
    }
  }

  static async getTaskStats(filters: TaskFilters = {}, options: { disableFallback?: boolean } = {}): Promise<TaskStats> {
    const tasks = await this.getTasks(filters);
    return this.calculateStatsFromTasks(tasks);
  }

  private static getEmptyStats(): TaskStats {
    return { todo: 0, inProgress: 0, onHold: 0, review: 0, done: 0, pending: 0, total: 0, working: 0, completed: 0, overdue: 0, dueToday: 0, next7Days: 0 };
  }

  public static calculateStatsFromTasks(tasks: Task[]): TaskStats {
    const stats = this.getEmptyStats();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const next7DaysEnd = new Date(now);
    next7DaysEnd.setDate(now.getDate() + 7);

    tasks.forEach(task => {
      stats.total++;

      switch (task.status) {
        case 'todo': stats.todo++; break;
        case 'in_progress': stats.inProgress++; stats.working++; break;
        case 'on_hold': stats.onHold++; break;
        case 'review': stats.review++; stats.working++; break;
        case 'done': stats.done++; stats.completed++; break;
        case 'pending': stats.pending++; break;
      }

      if (task.status !== 'done' && task.dueDate) {
        const due = new Date(task.dueDate);

        if (due < now) stats.overdue++;
        if (due >= todayStart && due <= todayEnd) stats.dueToday++;
        if (due >= now && due <= next7DaysEnd) stats.next7Days++;
      }
    });
    return stats;
  }

  /**
   * Get events with consistent filtering
   */
  static async getEvents(filters: EventFilters = {}): Promise<Event[]> {
    if (healthManager.shouldPauseActivities()) {
      console.warn('[CanonicalDataService] System pulse DEAD. Attempting cached events fallback.');
      if (typeof window !== 'undefined') {
        try {
          const cached = await offlineDB.getCache('mediahive_cache_events');
          if (cached) {
            toast('Offline - Showing last known data', { id: 'stale-events-toast', icon: '📡' });
            return cached;
          }
        } catch (e) {}
      }
      return [];
    }

    try {
      const { tenantId } = await tenantContext();
      const fetchStart = Date.now();
      console.log(`[BOOT][STEP] Fetching events from Supabase for role: ${filters.role || 'unknown'}`);
      let query = supabase
        .from(TABLES.EVENTS)
        .select('*, version, updated_by')
        .eq('tenant_id', tenantId);

      if (filters.institutionId) {
        console.log(`[CanonicalDataService] Filtering events by institution: ${filters.institutionId}`);
        query = query.eq('institution_id', filters.institutionId);
      } else {
        console.warn(`[CanonicalDataService] Fetching events WITHOUT institution filter (Global)`);
      }
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters.created_by) {
        query = query.eq('created_by', filters.created_by);
      }

      const { data: rawEvents, error } = await safeQuery(() => query
        .order('start_at', { ascending: false })
        .limit(EVENT_FETCH_LIMIT + 1)
      ) as { data: any[]; error: any };

      if (error) throw error;

      console.log(`[BOOT][DONE] Events fetched in ${Date.now() - fetchStart}ms`);

      const isCapped = ((rawEvents as any[])?.length || 0) > EVENT_FETCH_LIMIT;
      const finalEvents = isCapped ? (rawEvents as any[]).slice(0, EVENT_FETCH_LIMIT) : (rawEvents || []);

      const { mapEvent } = await import('@/services/events/eventService');
      const mappedUserEvents = finalEvents.map((item: any) => {
        // DTO Validation
        const parsed = EventSchema.safeParse(item);
        if (!parsed.success) {
          console.warn("[CanonicalDataService] DTO validation failed for event:", parsed.error);
        }
        return mapEvent(item);
      });

      // Always merge system events (they are static, safe to import anywhere)
      try {
        const { SystemEventService } = await import('@/features/events/services/systemEventService');
        const currentYear = new Date().getFullYear();
        const allSystemEvents = await SystemEventService.getAllSystemEvents();
        const systemEvents = SystemEventService.expandEventsForView(allSystemEvents, currentYear);

        const formattedSystemEvents = systemEvents.map(se => ({
          ...se,
          is_system_event: true,
          startTime: se.date,
          endTime: se.date,
        })) as any[];

        const allEvents = [...mappedUserEvents, ...formattedSystemEvents];
        (allEvents as any).__meta = { total: finalEvents.length, isCapped, limit: EVENT_FETCH_LIMIT };

        if (typeof window !== 'undefined') {
          try {
            await db.events.bulkPut(allEvents);
          } catch (e) {}
        }

        console.log(`[CanonicalDataService] Successfully fetched ${allEvents.length} events (including system events)`);
        return allEvents as Event[];
      } catch (err) {
        // System events failed — return user events only with meta
        (mappedUserEvents as any).__meta = { total: finalEvents.length, isCapped, limit: EVENT_FETCH_LIMIT };
        
        if (mappedUserEvents.length === 0) {
          console.warn(`[CanonicalDataService] No events returned for tenant: ${tenantId.slice(0, 8)}... (Filters: ${JSON.stringify(filters)})`);
        } else {
          console.log(`[CanonicalDataService] Successfully fetched ${mappedUserEvents.length} events (user only)`);
        }
        
        return mappedUserEvents as Event[];
      }
    } catch (error: any) {
      if (typeof window !== 'undefined' && isNetworkError(error)) {
        try {
          const cached = await offlineDB.getCache('mediahive_cache_events');
          if (cached) {
            toast('Offline - Showing last known data', { id: 'stale-events-toast', icon: '📡' });
            return cached;
          }
        } catch (e) {}
      }
      console.error('Error fetching events:', JSON.stringify(error, null, 2));
      return [];
    }
  }

  static async getEventStats(filters: EventFilters = {}): Promise<EventStats> {
    const events = await this.getEvents(filters);
    const now = new Date();
    const next7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const next30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const thisMonth = now.getMonth();

    let upcoming = 0; let completed = 0; let next7Days = 0; let next30Days = 0;
    let thisMonthCount = 0; let holidays = 0; let meetings = 0;

    events.forEach(event => {
      if (!event.startTime) return;
      const eventDate = new Date(event.startTime as any);

      if ((event as any).status === 'approved') completed++;
      if ((event as any).type === 'holiday') holidays++;
      if (event.type === 'meeting') meetings++;
      if (eventDate.getMonth() === thisMonth) thisMonthCount++;

      if (eventDate >= now) {
        upcoming++;
        if (eventDate <= next7) next7Days++;
        if (eventDate <= next30) next30Days++;
      }
    });

    return {
      total: events.length,
      upcoming,
      completed,
      next7Days,
      next30Days,
      thisMonth: thisMonthCount,
      holidays,
      meetings
    };
  }

  static async getFilteredEventsForList(filters: EventFilters = {}): Promise<Event[]> {
    try {
      const events = await this.getEvents(filters);
      const now = new Date();

      const filteredEvents = events.filter(event => {
        if (!event.startTime) return false;
        const eventDate = new Date(event.startTime as any);
        return eventDate >= now;
      });

      return filteredEvents;
    } catch (error) {
      if (!isNetworkError(error)) {
        console.error('Error fetching filtered events for list:', error);
      }
      return [];
    }
  }

  static async getAdminConfidenceData(institution_id?: string) {
    try {
      const [tasks, events, mediaFiles, users] = await Promise.all([
        this.getTasks({ institutionId: institution_id }),
        this.getEvents({ institutionId: institution_id }),
        this.getMediaFiles(institution_id),
        this.getUsers(institution_id)
      ]);

      return { tasks, events, mediaFiles, users };
    } catch (error: any) {
      if (error.message?.includes('Forbidden') || (error.status === 403)) {
        return { tasks: [], events: [], mediaFiles: [], users: [] };
      }
      if (!isNetworkError(error)) {
        console.error('Error fetching admin confidence data:', error);
      }
      return { tasks: [], events: [], mediaFiles: [], users: [] };
    }
  }

  static async getMediaFiles(institution_id?: string) {
    return [];
  }

  static async getUsers(institution_id?: string) {
    try {
      const { tenantId } = await tenantContext();

      let query = supabase.from(TABLES.USERS).select('*').eq('tenant_id', tenantId);
      if (institution_id) {
        query = query.eq('institution_id', institution_id);
      }

      const { data, error } = await safeQuery(() => query) as { data: any[]; error: any };
      if (error) throw error;

      // DTO Validation
      return (data || []).map((item: any) => {
        const parsed = UserSchema.safeParse(item);
        if (!parsed.success) {
          console.warn("[CanonicalDataService] DTO validation failed for user profile:", parsed.error);
        }
        return item;
      });
    } catch (error: any) {
      if (error.status === 403 || error.message?.includes('Forbidden')) {
        return [];
      }
      if (!isNetworkError(error) && error.status !== 401) {
        console.error('Error fetching users:', error);
      }
      return [];
    }
  }

  static async getTaskHistory(taskId: string): Promise<any[]> {
    try {
      const { tenantId } = await tenantContext();
      
      const { data, error } = await safeQuery(() => supabase
        .from(TABLES.AUDIT_LOG)
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('resource_type', 'task')
        .eq('resource_id', taskId)
        .order('created_at', { ascending: false })
      ) as { data: any[]; error: any };

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      // Create a clean serializable error object to avoid "{}" in console
      const errorDetails = {
        message: error?.message || 'Unknown error',
        details: error?.details || null,
        hint: error?.hint || null,
        code: error?.code || null,
        status: error?.status || null,
        name: error?.name || 'Error'
      };
      
      console.error('[SERVICE] ❌ Failed to fetch task history:', errorDetails);
      return [];
    }
  }

  /**
   * Get operational summary for today
   */
  static async getTodayOperationalSummary(institutionId?: string): Promise<OperationalSummary> {
    try {
      const { tenantId } = await tenantContext();
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

      const [eventsRes, tasksRes] = await Promise.all([
        safeQuery(() => {
          let query = supabase
            .from(TABLES.EVENTS)
            .select(`
              *,
              crew:event_crew(
                *,
                profile:${TABLES.USERS}(id, full_name, avatar_url)
              ),
              equipment:event_equipment(
                *,
                inventory:${TABLES.INVENTORY}(id, name)
              )
            `)
            .eq('tenant_id', tenantId)
            .gte('start_at', startOfDay)
            .lte('start_at', endOfDay);

          if (institutionId) {
            query = query.eq('institution_id', institutionId);
          }
          
          return query.order('start_at', { ascending: true });
        }),
        safeQuery(() => {
          let query = supabase
            .from(TABLES.TASKS)
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('deleted', false)
            .or(`due_date.gte.${startOfDay},status.neq.done`);

          if (institutionId) {
            query = query.eq('institution_id', institutionId);
          }

          return query.order('due_date', { ascending: true });
        })
      ]);

      if (eventsRes.error) throw eventsRes.error;
      if (tasksRes.error) throw tasksRes.error;

      const events = ((eventsRes.data as any[]) || []).map((item: any) => {
        const parsed = EventSchema.safeParse(item);
        if (!parsed.success) {
          console.warn("[CanonicalDataService] DTO validation failed for event in operational summary:", parsed.error);
        }
        return item;
      });
      const { mapTask } = await import('@/features/tasks/services/taskService');
      const tasks = ((tasksRes.data as any[]) || []).map((item: any) => {
        const parsed = TaskSchema.safeParse(item);
        if (!parsed.success) {
          console.warn("[CanonicalDataService] DTO validation failed for task in operational summary:", parsed.error);
        }
        return mapTask(item);
      });

      // Flatten crew and equipment for easy access
      const crew = events.flatMap((e: any) => (e.crew || []).map((c: any) => ({ ...c, event_title: e.title, start_at: e.start_at })));
      const equipment = events.flatMap((e: any) => (e.equipment || []).map((eq: any) => ({ ...eq, event_title: e.title, start_at: e.start_at })));

      return {
        events,
        tasks,
        crew,
        equipment
      };
    } catch (error) {
      console.error('[CanonicalDataService] Error fetching operational summary:', error);
      return { events: [], tasks: [], crew: [], equipment: [] };
    }
  }

  /**
   * Get the nearest upcoming production (event) after now
   */
  static async getNextProductionSummary(institutionId?: string): Promise<{ 
    event: any, 
    crewCount: number, 
    equipmentCount: number, 
    totalTasks: number, 
    completedTasks: number 
  } | null> {
    try {
      const { tenantId } = await tenantContext();
      const now = new Date().toISOString();

      // 1. Find the single nearest upcoming event
      const { data: eventArray, error: eventError } = await safeQuery(() => {
        let query = supabase
          .from(TABLES.EVENTS)
          .select(`
            *,
            crew:event_crew(count),
            equipment:event_equipment(count)
          `)
          .eq('tenant_id', tenantId)
          .gt('start_at', now);

        if (institutionId) {
          query = query.eq('institution_id', institutionId);
        }

        return query.order('start_at', { ascending: true })
          .limit(1);
      });

      if (eventError || !eventArray || (eventArray as any).length === 0) return null;

      const event = (eventArray as any)[0];

      // DTO Validation
      const parsed = EventSchema.safeParse(event);
      if (!parsed.success) {
        console.warn("[CanonicalDataService] DTO validation failed for next production event:", parsed.error);
      }

      // 2. Count linked tasks
      const { data: tasks, error: tasksError } = await safeQuery(() => supabase
        .from(TABLES.TASKS)
        .select('status')
        .eq('tenant_id', tenantId)
        .eq('event_id', event.id)
        .eq('deleted', false)
      );

      const totalTasks = Array.isArray(tasks) ? tasks.length : 0;
      const completedTasks = Array.isArray(tasks) ? tasks.filter((t: any) => t.status === 'done').length : 0;

      return {
        event,
        crewCount: event.crew?.[0]?.count || 0,
        equipmentCount: event.equipment?.[0]?.count || 0,
        totalTasks,
        completedTasks
      };
    } catch (error) {
      console.error('[CanonicalDataService] Error fetching next production:', error);
      return null;
    }
  }

  /**
   * Search across multiple entities
   */
  static async globalSearch(query: string, institutionId?: string): Promise<{
    tasks: Task[],
    events: Event[],
    users: any[],
    inventory: any[]
  }> {
    if (!query || query.length < 2) {
      return { tasks: [], events: [], users: [], inventory: [] };
    }

    try {
      const { tenantId } = await tenantContext();
      const searchTerm = `%${query}%`;

      const [tasksRes, eventsRes, usersRes, inventoryRes] = await Promise.all([
        safeQuery(() => {
          let q = supabase
            .from(TABLES.TASKS)
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('deleted', false)
            .ilike('title', searchTerm);
          if (institutionId) q = q.eq('institution_id', institutionId);
          return q.limit(5);
        }),
        safeQuery(() => {
          let q = supabase
            .from(TABLES.EVENTS)
            .select('*')
            .eq('tenant_id', tenantId)
            .ilike('title', searchTerm);
          if (institutionId) q = q.eq('institution_id', institutionId);
          return q.limit(5);
        }),
        safeQuery(() => {
          let q = supabase
            .from(TABLES.USERS)
            .select('*')
            .eq('tenant_id', tenantId)
            .ilike('full_name', searchTerm);
          // Users are tenant-wide but often institutions have their own users. 
          // We apply the filter if provided.
          if (institutionId) q = q.eq('institution_id', institutionId);
          return q.limit(5);
        }),
        safeQuery(() => {
          let q = supabase
            .from(TABLES.INVENTORY)
            .select('*')
            .eq('tenant_id', tenantId)
            .ilike('name', searchTerm);
          if (institutionId) q = q.eq('institution_id', institutionId);
          return q.limit(5);
        })
      ]);

      const { mapTask } = await import('@/features/tasks/services/taskService');
      const { mapEvent } = await import('@/services/events/eventService');

      return {
        tasks: ((tasksRes.data as any[]) || []).map(mapTask),
        events: ((eventsRes.data as any[]) || []).map(mapEvent),
        users: (usersRes.data as any[]) || [],
        inventory: (inventoryRes.data as any[]) || []
      };
    } catch (error) {
      console.error('[CanonicalDataService] Global search error:', error);
      return { tasks: [], events: [], users: [], inventory: [] };
    }
  }

  static subscribeToTasks(
    filters: TaskFilters,
    onNext: (tasks: Task[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    if (typeof window === 'undefined') return () => { };

    let isCancelled = false;
    const subscriptionId = `tasks-changes-${filters.institutionId || 'all'}`;

    const setupSubscription = async () => {
      try {
        const { tenantId } = await tenantContext();

        const initialTasks = await this.getTasks(filters);
        if (!isCancelled) onNext(initialTasks);

        await synergySyncManager.subscribe(
          subscriptionId,
          {
            table: 'tasks',
            filter: `tenant_id=eq.${tenantId}${filters.institutionId ? `&institution_id=eq.${filters.institutionId}` : ''}`
          },
          async (payload: any) => {
            console.log(`[Realtime][Tasks] ${payload.eventType} change detected`);
            const updatedTasks = await this.getTasks(filters);
            if (!isCancelled) onNext(updatedTasks);
          }
        );
      } catch (err: any) {
        console.error('[Realtime][Tasks] Setup error:', err);
        if (onError && !isCancelled) onError(err);
      }
    };

    setupSubscription();

    return () => {
      isCancelled = true;
      synergySyncManager.unsubscribe(subscriptionId);
    };
  }
}
