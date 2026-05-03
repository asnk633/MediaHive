import { apiClient } from '@/lib/apiClient';
import { Task } from '@/types/task';
import { Event } from '@/types/event';
import { TASK_FETCH_LIMIT, EVENT_FETCH_LIMIT, COMPLETED_TASK_RETENTION_DAYS } from '@/config/systemLimits';

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
  user_id?: string;
  institution_id?: string;
  status?: string[];
  includeDemoData?: boolean;
  assigned_to?: string;
  created_by?: string;
  signal?: AbortSignal;
}

export interface EventFilters {
  role?: string;
  user_id?: string;
  institution_id?: string;
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
// ... TaskStats interface ... (unchanged)

/**
 * CanonicalDataService
 */
export class CanonicalDataService {
  /**
   * Get tasks with consistent filtering based on user role and filters
   */
  static async getTasks(filters: TaskFilters = {}): Promise<Task[]> {
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const fetchStart = Date.now();
      console.log(`[BOOT][STEP] Fetching tasks directly from Supabase for role: ${filters.role || 'unknown'}`);

      let query = supabase.from('tasks').select('*');

      if (filters.institution_id) {
        query = query.eq('institution_id', filters.institution_id);
      }
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters.created_by) {
        // Querying JSONB column 'created_by'
        query = query.eq('created_by->>uid', filters.created_by);
      }

      // Order and limit
      query = query.order('created_at', { ascending: false }).limit(TASK_FETCH_LIMIT + 1);

      if (filters.signal) {
        query = query.abortSignal(filters.signal);
      }

      const { data: rawTasks, error } = await query;

      if (error) {
        if (error.name === 'AbortError' || error.message?.includes('AbortError')) {
          console.log('[CanonicalDataService] Task fetch aborted');
          return [];
        }
        console.error('Supabase tasks fetch error:', error.message);
        throw error;
      }
      console.log(`[BOOT][DONE] Tasks fetched in ${Date.now() - fetchStart}ms`);

      const tasks = rawTasks || [];
      const isCapped = tasks.length > TASK_FETCH_LIMIT;
      if (isCapped) tasks.pop();

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - COMPLETED_TASK_RETENTION_DAYS * 24 * 60 * 60 * 1000);

      const processedTasks = tasks
        .filter((task: any) => {
          if (task.deleted || task.is_archived) return false;

          if (task.status === 'done') {
            const dateStr = task.updated_at || task.created_at;
            const date = dateStr ? new Date(dateStr) : null;
            if (date && date < sevenDaysAgo) return false;
          }
          return true;
        })
        .map((task: any) => ({
          ...task
        }));

      (processedTasks as any).__meta = {
        total: tasks.length,
        isCapped,
        limit: TASK_FETCH_LIMIT
      };

      if (isCapped) {
        console.warn(`[DEGRADATION] Tasks capped at ${TASK_FETCH_LIMIT}. Showing partial results.`);
      }

      return processedTasks as Task[];
    } catch (error: any) {
      if (!isNetworkError(error)) {
        console.error('Error fetching tasks:', error);
      }
      return [];
    }
  }

  // ... (getTaskStats unchanged) ...
  static async getTaskStats(filters: TaskFilters = {}, options: { disableFallback?: boolean } = {}): Promise<TaskStats> {
    const API_TASK_STATS_ENABLED = false;
    if (!API_TASK_STATS_ENABLED) {
      if (options.disableFallback) return this.getEmptyStats();
      // Only pass signal down to avoid aborting stats mid-computation if parent component unmounts
      const tasks = await this.getTasks(filters);
      return this.calculateStatsFromTasks(tasks);
    }
    // ... rest of API logic omitted for brevity as it's disabled ...
    return this.getEmptyStats();
  }

  // ... (getEmptyStats unchanged) ...
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

      if (task.status !== 'done' && task.due_date) {
        const due = new Date(task.due_date);

        if (due < now) stats.overdue++;
        if (due >= todayStart && due <= todayEnd) stats.dueToday++;
        if (due >= now && due <= next7DaysEnd) stats.next7Days++;
      }
    });
    return stats;
  }

  static async getEvents(filters: EventFilters = {}): Promise<Event[]> {
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const fetchStart = Date.now();
      console.log(`[BOOT][STEP] Fetching events directly from Supabase for role: ${filters.role || 'unknown'}`);

      let query = supabase.from('events').select('*');

      if (filters.institution_id) {
        query = query.eq('institution_id', filters.institution_id);
      }
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters.created_by) {
        query = query.eq('created_by->>uid', filters.created_by);
      }

      // Order and limit
      query = query.order('start_at', { ascending: false }).limit(EVENT_FETCH_LIMIT + 1);

      if (filters.signal) {
        query = query.abortSignal(filters.signal);
      }

      const { data: rawEvents, error } = await query;

      if (error) {
        if (error.name === 'AbortError' || error.message?.includes('AbortError')) {
          console.log('[CanonicalDataService] Event fetch aborted');
          return [];
        }
        console.error('Supabase events fetch error:', error.message);
        throw error;
      }
      console.log(`[BOOT][DONE] Events fetched in ${Date.now() - fetchStart}ms`);

      const userEvents = rawEvents || [];
      const isCapped = userEvents.length > EVENT_FETCH_LIMIT;
      if (isCapped) userEvents.pop();

      try {
        if (typeof window !== 'undefined') return userEvents;

        const { SystemEventService } = await import('@/services/systemEventService');
        const currentYear = new Date().getFullYear();
        const allSystemEvents = await SystemEventService.getAllSystemEvents();
        const systemEvents = SystemEventService.expandEventsForView(allSystemEvents, currentYear);

        const formattedSystemEvents = systemEvents.map(se => ({
          ...se,
          is_system_event: true,
          start_time: se.date, // system events might still use date, keep as is
          end_time: se.date,
        })) as any[];

        const allEvents = [...userEvents, ...formattedSystemEvents];
        (allEvents as any).__meta = { total: userEvents.length, isCapped, limit: EVENT_FETCH_LIMIT };
        return allEvents as Event[];
      } catch (err) {
        return userEvents as Event[];
      }
    } catch (error: any) {
      return [];
    }
  }

  // ... (getEventStats unchanged in logic, but relies on Event properties) ...
  static async getEventStats(filters: EventFilters = {}): Promise<EventStats> {
    const events = await this.getEvents(filters);
    const now = new Date();
    const next7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const next30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const thisMonth = now.getMonth();

    let upcoming = 0; let completed = 0; let next7Days = 0; let next30Days = 0;
    let thisMonthCount = 0; let holidays = 0; let meetings = 0;

    events.forEach(event => {
      if (!event.start_at) return;
      const eventDate = new Date(event.start_at as any);

      // status field on event type: pending | approved | rejected
      if (event.status === 'approved') completed++; // Assuming approved events are 'completed' for stats?
      if ((event.type as any) === 'holiday') holidays++; // Logic depends on actual holiday type mapping
      // meetings: event.type can be 'meeting'
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

  /**
   * Get filtered events with consistent time-based logic for list views
   */
  static async getFilteredEventsForList(filters: EventFilters = {}): Promise<Event[]> {
    try {
      const events = await this.getEvents(filters);

      // Apply time-based filtering for list views (to match stats logic)
      const now = new Date();

      // For list views, we typically want to show upcoming events
      const filteredEvents = events.filter(event => {
        if (!event.start_at) return false;

        const eventDate = event.start_at ? new Date(event.start_at as any) : new Date();
        return eventDate >= now; // Only show upcoming events in list view
      });

      return filteredEvents;
    } catch (error) {
      if (!isNetworkError(error)) {
        console.error('Error fetching filtered events for list:', error);
      }
      return [];
    }
  }

  /**
   * Get all related data for admin confidence panel
   */
  static async getAdminConfidenceData(institution_id?: string) {
    try {
      // Get all tasks, events, media files, and users for the admin panel
      const [tasks, events, mediaFiles, users] = await Promise.all([
        this.getTasks({ institution_id: institution_id }),
        this.getEvents({ institution_id: institution_id }),
        this.getMediaFiles(institution_id),
        this.getUsers(institution_id)
      ]);

      return { tasks, events, mediaFiles, users };
      return { tasks, events, mediaFiles, users };
    } catch (error: any) {
      if (error.message?.includes('Forbidden') || error.message?.includes('403')) {
        // Expected for non-admins, return partial data or empty
        // console.warn('Admin confidence data suppressed due to permissions');
        return { tasks: [], events: [], mediaFiles: [], users: [] };
      }
      if (!isNetworkError(error)) {
        console.error('Error fetching admin confidence data:', error);
      }
      return { tasks: [], events: [], mediaFiles: [], users: [] };
    }
  }

  /**
   * Get media files for admin confidence panel
   */
  static async getMediaFiles(institution_id?: string) {
    // Gate API call behind dev mode flag
    if (process.env.NEXT_PUBLIC_DEV_NO_API === 'true') {
      return [];
    }
    return [];
  }

  /**
   * Get users for admin confidence panel
   */
  static async getUsers(institution_id?: string) {
    try {
      const queryParams = new URLSearchParams();
      if (institution_id) queryParams.append('institution_id', institution_id);

      const data = await apiClient(`/api/users?${queryParams.toString()}`, {
        method: 'GET',
        silent: true
      });

      return data.users || [];
    } catch (error: any) {
      if (error.message?.includes('Forbidden') || error.message?.includes('403')) {
        // console.warn('User list suppressed due to permissions');
        return [];
      }
      if (!isNetworkError(error) && !error.message?.includes('Unauthorized')) {
        console.error('Error fetching users:', error);
      }
      return [];
    }
  }

  /**
   * Stub for legacy real-time subscription.
   * Real-time sync disabled pending Supabase migration.
   */
  static subscribeToTasks(
    filters: TaskFilters,
    onNext: (tasks: Task[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    console.warn('[CanonicalDataService] Real-time sync disabled');
    return () => { };
  }
}
