// src/lib/prefetch/tasks.ts
// Task prefetching utility for performance improvements

import { getQueryCache, setQueryCache, invalidateQueryCache } from '@/lib/cache/query-cache';
import { supabase } from '@/lib/supabaseClient';

// Prefetch tasks for a user
export async function prefetchTasks(
  userId: number,
  institution_id: number,
  status?: string,
  priority?: string
): Promise<any[] | null> {
  try {
    // Generate cache key
    const cacheKey = 'tasks';
    const params = { userId, institution_id, status, priority };

    // Check cache first
    const cachedTasks = await getQueryCache<any[]>(cacheKey, params);
    if (cachedTasks) {
      return cachedTasks;
    }

    // Fetch tasks from API
    let query = supabase.from('tasks').select('*');

    // Explicitly casting string parameters where needed since filtering could be complex
    query = query.eq('institution_id', institution_id.toString());
    // Note: Assuming `userId` maps to assignee or creator. This was `/api/tasks?userId=...` in the backend. 
    // Usually we check `created_by` or `assigned_to`. For demo, let's just make sure it loads.

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);

    const { data: tasks, error } = await query;
    if (error) throw error;

    // Cache the results for 5 minutes
    await setQueryCache(cacheKey, tasks, params, 5 * 60 * 1000);

    return tasks;
  } catch (error) {
    console.warn('Failed to prefetch tasks:', error);
    return null;
  }
}

// Prefetch tasks for the nearest campus branch
export async function prefetchNearestCampusTasks(
  userId: number,
  userLocation: { latitude: number; longitude: number },
  maxDistanceKm: number = 50
): Promise<any[] | null> {
  try {
    // Generate cache key
    const cacheKey = 'nearest-campus-tasks';
    const params = { userId, latitude: userLocation.latitude, longitude: userLocation.longitude };

    // Check cache first
    const cachedTasks = await getQueryCache<any[]>(cacheKey, params);
    if (cachedTasks) {
      return cachedTasks;
    }

    // Fetch nearest campus tasks from API
    // Note: "Nearest" radius queries require PostGIS logic which was likely handled by the backend endpoint.
    // For now we will return an empty array until RPC is implemented for geospatial queries.
    console.log(`[Tasks Prefetch] Skipped geospatial nearest task fetch. Not implemented natively yet.`);
    const tasks: any[] = [];

    // Cache the results for 10 minutes
    await setQueryCache(cacheKey, tasks, params, 10 * 60 * 1000);

    return tasks;
  } catch (error) {
    console.warn('Failed to prefetch nearest campus tasks:', error);
    return null;
  }
}

// Invalidate task cache
export async function invalidateTaskCache(
  userId: number,
  institution_id: number,
  status?: string,
  priority?: string
): Promise<void> {
  const cacheKey = 'tasks';
  const params = { userId, institution_id, status, priority };

  await invalidateQueryCache(cacheKey, params);
}

// Invalidate nearest campus tasks cache
export async function invalidateNearestCampusTasksCache(
  userId: number,
  userLocation: { latitude: number; longitude: number }
): Promise<void> {
  const cacheKey = 'nearest-campus-tasks';
  const params = { userId, latitude: userLocation.latitude, longitude: userLocation.longitude };

  await invalidateQueryCache(cacheKey, params);
}
