import { getFirebaseAuth } from '@/firebase/client';
import { apiClient } from '@/lib/apiClient';
import { Task } from '@/types/task';
import { Event } from '@/types/event';
import { User } from '@/types/user';
import { SmartRulesEngine } from './smartRulesEngine';

// Helper to check for network/auth errors to avoid console noise
const isNetworkError = (error: any) => {
  const msg = error?.message || '';
  const code = error?.code || '';
  return (
    code === 'auth/network-request-failed' ||
    msg.includes('offline') ||
    msg.includes('network') ||
    msg.includes('Connection failed')
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

      // Default to 100 to support client-side filtering compatibility (e.g. MyWorkflowWidget)
      // This is a safety cap to prevent O(N) reads while preserving UI functionality
      queryParams.append('limit', '100');

      const data = await apiClient(`/api/tasks?${queryParams.toString()}`, {
        method: 'GET',
        silent: true
      });

      const tasks = data.tasks || [];

      // Apply Smart Rules to tasks and Filter (Virtual Cleanup)
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      return tasks
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
  static async getTaskStats(filters: TaskFilters = {}): Promise<TaskStats> {
    // TEMP: Disable API call for launch stability to prevent 404s
    const API_TASK_STATS_ENABLED = false;

    if (!API_TASK_STATS_ENABLED) {
      // console.warn('[CanonicalDataService] /api/tasks/stats disabled, using client-side aggregation');
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

      // Augment API stats with client-side robust calculation if needed, 
      // or if the API doesn't return the new fields yet.
      // Ideally API returns it, but for safety in this refactor we can re-calculate from tasks if we fetched them, 
      // but here we only fetched stats. 
      // Safe Fallback: If any key field is missing, we might want to fetch tasks. 
      // For now, let's assume if API doesn't give it, we treat it as 0 unless we fetch tasks.
      // Actually, simplest path for this Refactor: Just always use client-side aggregation for now to ensure 100% accuracy with new requirements without touching API code.
      // Reverting to client-side aggregation for immediate stability on new "dueToday" requirement.
      const tasks = await this.getTasks(filters);
      return this.calculateStatsFromTasks(tasks);

    } catch (error: any) {
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

  private static calculateStatsFromTasks(tasks: Task[]): TaskStats {
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

      // Limit to 100 recent events for safety
      queryParams.append('limit', '100');

      const data = await apiClient(`/api/events?${queryParams.toString()}`, {
        method: 'GET',
        silent: true
      });

      const userEvents = data.events || [];

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

        return [...userEvents, ...formattedSystemEvents];
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
    // TEMP: API disabled for launch stability
    // console.warn('[CanonicalDataService] getMediaFiles disabled (no API)');
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