import { apiClient } from '@/lib/apiClient';
import { Task } from '@/types/task';
import { Event } from '@/types/event';
import { SmartRulesEngine } from '@/services/smartRulesEngine';
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
  userId?: string;
  institutionId?: string;
  includeDemoData?: boolean;
  status?: string[];
  assignedTo?: string;
  createdBy?: string;
}

export interface EventFilters {
  role?: string;
  userId?: string;
  institutionId?: string;
  includeDemoData?: boolean;
  status?: string[];
  createdBy?: string;
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
  upcoming: number;
  completed: number;
  next7Days: number;
  next30Days: number;
}

/**
 * CanonicalDataService
 * 
 * Centralized service for fetching and processing canonical data (tasks, events).
 * Applies role-based filtering, smart rules, and virtual cleanup.
 * 
 * CRITICAL: All data fetching goes through this service to ensure consistency.
 */
export class CanonicalDataService {
  /**
   * Get tasks with consistent filtering based on user role and filters
   */
  static async getTasks(filters: TaskFilters = {}): Promise<Task[]> {
    try {
      // Build query parameters from filters
      const queryParams = new URLSearchParams();
      if (filters.role) queryParams.append('role', filters.role);
      if (filters.userId) queryParams.append('userId', filters.userId);
      if (filters.institutionId) queryParams.append('institutionId', filters.institutionId);
      if (filters.includeDemoData !== undefined) queryParams.append('includeDemoData', String(filters.includeDemoData));
      if (filters.status) filters.status.forEach(status => queryParams.append('status', status));
      if (filters.assignedTo) queryParams.append('assignedTo', filters.assignedTo);
      if (filters.createdBy) queryParams.append('createdBy', filters.createdBy);

      // Default to TASK_FETCH_LIMIT to support client-side filtering compatibility (e.g. MyWorkflowWidget)
      // This is a safety cap to prevent O(N) reads while preserving UI functionality
      queryParams.append('limit', String(TASK_FETCH_LIMIT));

      const fetchStart = Date.now();
      console.log(`[BOOT][STEP] Fetching tasks for role: ${filters.role || 'unknown'}`);
      const data = await apiClient(`/api/tasks?${queryParams.toString()}`, {
        method: 'GET',
        silent: true
      });
      console.log(`[BOOT][DONE] Tasks fetched in ${Date.now() - fetchStart}ms`);

      const tasks = data.tasks || [];
      const total = data.total || tasks.length; // Backend should provide total
      const isCapped = tasks.length >= TASK_FETCH_LIMIT && total > tasks.length;

      // Apply Smart Rules to tasks and Filter (Virtual Cleanup)
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - COMPLETED_TASK_RETENTION_DAYS * 24 * 60 * 60 * 1000);

      const processedTasks = tasks
        .filter((task: Task) => {
          // 1. Exclude explicitly archived tasks
          if ((task as any).isArchived) return false;

          // 2. Virtual Cleanup: Exclude completed tasks older than 7 days
          //    (This ensures clean view even if cron hasn't run yet)
          if (task.status === 'done') {
            const dateVal = task.updatedAt || task.createdAt;
            const date = (dateVal as any)?.seconds ? new Date((dateVal as any)?.seconds * 1000) : new Date(dateVal as any);
            if (date < sevenDaysAgo) return false;
          }

          return true;
        })
        .map((task: Task) => ({
          ...task,
          smartMetadata: SmartRulesEngine.processTask(task)
        }));

      // CRITICAL: Attach metadata for UI disclosure
      (processedTasks as any).__meta = {
        total,
        isCapped,
        limit: TASK_FETCH_LIMIT
      };

      // DEGRADATION TELEMETRY: Log when system is not showing full truth
      if (isCapped) {
        console.warn(
          `[DEGRADATION] Tasks capped at ${TASK_FETCH_LIMIT} of ${total} total. ` +
          `Showing partial results. Filters: ${JSON.stringify(filters)}`
        );
      }

      return processedTasks;
    } catch (error: any) {
      if (!isNetworkError(error) && !error.message?.includes('Unauthorized')) {
        console.error('Error fetching tasks:', error);
      }
      return [];
    }
  }

  /**
   * Get task statistics with consistent filtering
   */
  static async getTaskStats(filters: TaskFilters = {}, options: { disableFallback?: boolean } = {}): Promise<TaskStats> {
    // Gate API stats behind dev mode flag
    const API_TASK_STATS_ENABLED = process.env.NEXT_PUBLIC_DEV_NO_API !== 'true';

    if (!API_TASK_STATS_ENABLED) {
      if (options.disableFallback) return this.getEmptyStats();
      const tasks = await this.getTasks(filters);
      return this.calculateStatsFromTasks(tasks);
    }

    try {
      // Build query parameters from filters
      const queryParams = new URLSearchParams();
      if (filters.role) queryParams.append('role', filters.role);
      if (filters.userId) queryParams.append('userId', filters.userId);
      if (filters.institutionId) queryParams.append('institutionId', filters.institutionId);
      if (filters.includeDemoData !== undefined) queryParams.append('includeDemoData', String(filters.includeDemoData));
      if (filters.status) filters.status.forEach(status => queryParams.append('status', status));

      const data = await apiClient(`/api/tasks/stats?${queryParams.toString()}`, {
        method: 'GET',
        silent: true
      });

      // If we got data, return it (calculating derived fields if missing)
      if (data && typeof data.todo === 'number') {
        // We could still augment if needed, but assuming API is authority
        return data as TaskStats;
      }

      // If API returned structure mismatch, fallback logic triggers
      throw new Error('Invalid Stats Data');

    } catch (error: any) {
      if (options.disableFallback) {
        console.warn('[CanonicalDataService] Stats API failed and fallback disabled.', error.message);
        return this.getEmptyStats();
      }

      if (error.message?.includes('Not Found') || error.message?.includes('404')) {
        console.warn('[CanonicalDataService] /api/tasks/stats missing, falling back to client-side aggregation');
        const tasks = await this.getTasks(filters);
        return this.calculateStatsFromTasks(tasks);
      }

      if (!isNetworkError(error) && !error.message?.includes('Unauthorized')) {
        console.error('Error fetching task stats:', error);
      }
      return this.getEmptyStats();
    }
  }

  private static getEmptyStats(): TaskStats {
    return {
      todo: 0,
      inProgress: 0,
      onHold: 0,
      review: 0,
      done: 0,
      pending: 0,
      total: 0,
      working: 0,
      completed: 0,
      overdue: 0,
      dueToday: 0,
      next7Days: 0
    };
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
        const due = (task.dueDate as any).seconds ? new Date((task.dueDate as any).seconds * 1000) : new Date(task.dueDate);

        // Overdue check
        if (due < now) stats.overdue++;

        // Due Today check
        if (due >= todayStart && due <= todayEnd) {
          stats.dueToday++;
        }

        // Next 7 Days check (from now until 7 days later)
        if (due >= now && due <= next7DaysEnd) {
          stats.next7Days++;
        }
      }
    });
    return stats;
  }

  /**
   * Get events with consistent filtering based on user role and filters
   */
  static async getEvents(filters: EventFilters = {}): Promise<Event[]> {
    try {
      // Build query parameters from filters
      const queryParams = new URLSearchParams();
      if (filters.role) queryParams.append('role', filters.role);
      if (filters.userId) queryParams.append('userId', filters.userId);
      if (filters.institutionId) queryParams.append('institutionId', filters.institutionId);
      if (filters.includeDemoData !== undefined) queryParams.append('includeDemoData', String(filters.includeDemoData));
      if (filters.status) filters.status.forEach(status => queryParams.append('status', status));
      if (filters.createdBy) queryParams.append('createdBy', filters.createdBy);

      // Limit to EVENT_FETCH_LIMIT recent events for safety
      queryParams.append('limit', String(EVENT_FETCH_LIMIT));

      const fetchStart = Date.now();
      console.log(`[BOOT][STEP] Fetching events for role: ${filters.role || 'unknown'}`);
      const data = await apiClient(`/api/events?${queryParams.toString()}`, {
        method: 'GET',
        silent: true
      });
      console.log(`[BOOT][DONE] Events fetched in ${Date.now() - fetchStart}ms`);

      const userEvents = data.events || [];
      const total = data.total || userEvents.length;
      const isCapped = userEvents.length >= EVENT_FETCH_LIMIT && total > userEvents.length;

      // Merge System Events logic (similar to EventService)
      try {
        const { SystemEventService } = await import('@/services/systemEventService');
        const currentYear = new Date().getFullYear();
        const allSystemEvents = await SystemEventService.getAllSystemEvents();
        const systemEvents = SystemEventService.expandEventsForView(
          allSystemEvents,
          currentYear
        );

        const formattedSystemEvents = systemEvents.map(se => ({
          ...se,
          isSystemEvent: true,
          startTime: se.date,
          endTime: se.date,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        })) as any[];

        const allEvents = [...userEvents, ...formattedSystemEvents];

        // Attach metadata for UI disclosure
        (allEvents as any).__meta = {
          total,
          isCapped,
          limit: EVENT_FETCH_LIMIT
        };

        // DEGRADATION TELEMETRY: Log when system is not showing full truth
        if (isCapped) {
          console.warn(
            `[DEGRADATION] Events capped at ${EVENT_FETCH_LIMIT} of ${total} total. ` +
            `Showing partial results. Filters: ${JSON.stringify(filters)}`
          );
        }

        return allEvents;
      } catch (err) {
        console.warn('Failed to load system events in CanonicalDataService:', err);
        return userEvents;
      }
    } catch (error: any) {
      if (!isNetworkError(error) && !error.message?.includes('Unauthorized')) {
        console.error('Error fetching events:', error);
      }
      return [];
    }
  }

  /**
   * Get event statistics with consistent filtering - matches the time-based logic used in reports
   */
  static async getEventStats(filters: EventFilters = {}): Promise<EventStats> {
    try {
      // Get events with role-based filtering first
      const events = await this.getEvents(filters);

      const now = new Date();
      const next7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const next30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Count events based on time ranges
      let upcoming = 0;
      let completed = 0;
      let next7Days = 0;
      let next30Days = 0;

      events.forEach(event => {
        if (!event.date) return;

        const eventDate = event.date ? new Date(event.date as any) : new Date();

        if (eventDate >= now) {
          upcoming++;

          // Check if within next 7/30 days
          if (eventDate <= next7) {
            next7Days++;
          }
          if (eventDate <= next30) {
            next30Days++;
          }
        } else {
          completed++;
        }
      });

      return {
        upcoming,
        completed,
        next7Days,
        next30Days
      };
    } catch (error: any) {
      if (!isNetworkError(error) && !error.message?.includes('Unauthorized')) {
        console.error('Error fetching event stats:', error);
      }
      return { upcoming: 0, completed: 0, next7Days: 0, next30Days: 0 };
    }
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
        if (!event.date) return false;

        const eventDate = event.date ? new Date(event.date as any) : new Date();
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
  static async getAdminConfidenceData(institutionId?: string) {
    try {
      // Get all tasks, events, media files, and users for the admin panel
      const [tasks, events, mediaFiles, users] = await Promise.all([
        this.getTasks({ institutionId }),
        this.getEvents({ institutionId }),
        this.getMediaFiles(institutionId),
        this.getUsers(institutionId)
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
  static async getMediaFiles(institutionId?: string) {
    // Gate API call behind dev mode flag
    if (process.env.NEXT_PUBLIC_DEV_NO_API === 'true') {
      return [];
    }
    return [];
  }

  /**
   * Get users for admin confidence panel
   */
  static async getUsers(institutionId?: string) {
    try {
      const queryParams = new URLSearchParams();
      if (institutionId) queryParams.append('institutionId', institutionId);

      const data = await apiClient(`/api/users?${queryParams.toString()}`, {
        method: 'GET',
        silent: true
      });

      return data.users || [];
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
}