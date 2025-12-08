// src/lib/cache/query-cache.ts
// Query caching utility with cross-tab synchronization

import { setCache, getCache, deleteCache } from './indexeddb';

// Broadcast channel for cross-tab communication
const broadcastChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('query-cache') : null;

// Cache key prefix
const CACHE_PREFIX = 'query-cache:';

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Generate cache key
function generateCacheKey(queryKey: string, params?: Record<string, any>): string {
  const paramStr = params ? JSON.stringify(params) : '';
  return `${CACHE_PREFIX}${queryKey}:${paramStr}`;
}

// Set query result in cache
export async function setQueryCache<T>(
  queryKey: string,
  data: T,
  params?: Record<string, any>,
  ttl: number = 5 * 60 * 1000 // 5 minutes default
): Promise<void> {
  const cacheKey = generateCacheKey(queryKey, params);
  const cacheEntry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    ttl
  };
  
  // Store in IndexedDB
  await setCache(cacheKey, cacheEntry, ttl);
  
  // Broadcast to other tabs
  if (broadcastChannel) {
    broadcastChannel.postMessage({
      type: 'CACHE_SET',
      key: cacheKey,
      data: cacheEntry
    });
  }
}

// Get query result from cache
export async function getQueryCache<T>(
  queryKey: string,
  params?: Record<string, any>
): Promise<T | null> {
  const cacheKey = generateCacheKey(queryKey, params);
  const cacheEntry = await getCache<CacheEntry<T>>(cacheKey);
  
  if (!cacheEntry) {
    return null;
  }
  
  // Check if entry has expired
  if (Date.now() - cacheEntry.timestamp > cacheEntry.ttl) {
    // Delete expired entry
    await deleteCache(cacheKey);
    return null;
  }
  
  return cacheEntry.data;
}

// Invalidate query cache
export async function invalidateQueryCache(
  queryKey: string,
  params?: Record<string, any>
): Promise<void> {
  const cacheKey = generateCacheKey(queryKey, params);
  
  // Delete from IndexedDB
  await deleteCache(cacheKey);
  
  // Broadcast to other tabs
  if (broadcastChannel) {
    broadcastChannel.postMessage({
      type: 'CACHE_INVALIDATE',
      key: cacheKey
    });
  }
}

// Invalidate all cache for a query key
export async function invalidateAllQueryCache(queryKey: string): Promise<void> {
  // In a real implementation, you would delete all entries with the query key prefix
  // For now, we'll broadcast the invalidation
  if (broadcastChannel) {
    broadcastChannel.postMessage({
      type: 'CACHE_INVALIDATE_ALL',
      queryKey
    });
  }
}

// Listen for broadcast messages
if (broadcastChannel) {
  broadcastChannel.onmessage = async (event) => {
    const { type, key, data, queryKey } = event.data;
    
    switch (type) {
      case 'CACHE_SET':
        // Update local cache with broadcasted data
        await setCache(key, data, data.ttl);
        break;
        
      case 'CACHE_INVALIDATE':
        // Delete local cache entry
        await deleteCache(key);
        break;
        
      case 'CACHE_INVALIDATE_ALL':
        // Invalidate all entries for query key
        // In a real implementation, you would delete all entries with the query key prefix
        break;
    }
  };
}

// Periodically clean up expired cache entries
setInterval(async () => {
  // This would be implemented in the IndexedDB layer
}, 60 * 1000); // Every minute