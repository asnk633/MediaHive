// src/lib/prefetch/tasks.ts
// Task prefetching utility for performance improvements

import { getQueryCache, setQueryCache, invalidateQueryCache } from '../cache/query-cache';

// Prefetch tasks for a user
export async function prefetchTasks(
  userId: number,
  institutionId: number,
  status?: string,
  priority?: string
): Promise<any[] | null> {
  try {
    // Generate cache key
    const cacheKey = 'tasks';
    const params = { userId, institutionId, status, priority };
    
    // Check cache first
    const cachedTasks = await getQueryCache<any[]>(cacheKey, params);
    if (cachedTasks) {
      return cachedTasks;
    }
    
    // Fetch tasks from API
    const queryParams = new URLSearchParams();
    queryParams.append('userId', userId.toString());
    queryParams.append('institutionId', institutionId.toString());
    
    if (status) {
      queryParams.append('status', status);
    }
    
    if (priority) {
      queryParams.append('priority', priority);
    }
    
    const response = await fetch(`/api/tasks?${queryParams.toString()}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch tasks');
    }
    
    const data = await response.json();
    const tasks = data.data || data.tasks || [];
    
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
    const response = await fetch(
      `/api/tasks/nearest?` +
      `userId=${userId}&` +
      `latitude=${userLocation.latitude}&` +
      `longitude=${userLocation.longitude}&` +
      `maxDistance=${maxDistanceKm}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch nearest campus tasks');
    }
    
    const data = await response.json();
    const tasks = data.data || data.tasks || [];
    
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
  institutionId: number,
  status?: string,
  priority?: string
): Promise<void> {
  const cacheKey = 'tasks';
  const params = { userId, institutionId, status, priority };
  
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