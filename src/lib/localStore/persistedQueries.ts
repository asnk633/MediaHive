// src/lib/localStore/persistedQueries.ts
// Module for caching API responses

import { localDB } from './localDB';

interface CachedQuery {
  key: string;
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class PersistedQueries {
  private static readonly STORE_NAME = 'queries';
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached: CachedQuery | undefined = await localDB.get<CachedQuery>(PersistedQueries.STORE_NAME, key);
      
      if (!cached) {
        return null;
      }
      
      // Check if cache is still valid
      if (Date.now() - cached.timestamp > cached.ttl) {
        // Cache expired, remove it
        await this.remove(key);
        return null;
      }
      
      return cached.data as T;
    } catch (error) {
      console.warn('Failed to get cached query:', error);
      return null;
    }
  }

  async set<T>(key: string, data: T, ttl: number = PersistedQueries.DEFAULT_TTL): Promise<void> {
    try {
      const cached: CachedQuery = {
        key,
        data,
        timestamp: Date.now(),
        ttl
      };
      
      await localDB.put(PersistedQueries.STORE_NAME, cached);
    } catch (error) {
      console.warn('Failed to cache query:', error);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await localDB.delete(PersistedQueries.STORE_NAME, key);
    } catch (error) {
      console.warn('Failed to remove cached query:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      await localDB.clear(PersistedQueries.STORE_NAME);
    } catch (error) {
      console.warn('Failed to clear query cache:', error);
    }
  }
}

// Export singleton instance
export const persistedQueries = new PersistedQueries();