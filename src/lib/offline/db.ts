import Dexie, { Table } from 'dexie';

export interface QueuedMutation {
  id: string; // uuid
  type: string;
  payload: any;
  status: 'pending' | 'processing' | 'failed' | 'conflict';
  retries: number;
  createdAt: string; // ISO String
  baseUpdatedAt?: string; // The updated_at value on the server when the mutation was created
  baseVersion?: number; // The version value on the server when the mutation was created
}

export class MediaHiveDB extends Dexie {
  tasks!: Table<any>;
  events!: Table<any>;
  inventory!: Table<any>;
  profiles!: Table<any>; // For offline user lookups
  cache!: Table<{ key: string; value: any; expiresAt?: number }>;
  queue!: Table<QueuedMutation>;

  constructor() {
    super('mediahive_db');
    
    // Define tables and indexes
    this.version(1).stores({
      tasks: 'id, updated_at, institution_id',
      events: 'id, updated_at, institution_id',
      inventory: 'id, type',
      queue: 'id, status, createdAt',
    });

    this.version(3).stores({
      tasks: 'id, updated_at, institution_id, tenant_id',
      events: 'id, updated_at, institution_id, tenant_id',
      inventory: 'id, type',
      profiles: 'id, email, full_name',
      cache: 'key, expiresAt',
      queue: 'id, [status+type], status, createdAt, type', // Added composite index for compaction
    });
  }

  /**
   * Migrate data from legacy localStorage and old IDB
   */
  async migrateFromLegacy() {
    try {
      console.log('[OfflineDB] Checking for legacy data to migrate...');
      
      // ... (Migration logic preserved)
      const oldDBName = 'mediahive_offline';
      const request = indexedDB.open(oldDBName);
      
      request.onsuccess = async (event: any) => {
        const oldDB = event.target.result;
        if (oldDB.objectStoreNames.contains('mutation_queue')) {
          const tx = oldDB.transaction('mutation_queue', 'readonly');
          const store = tx.objectStore('mutation_queue');
          const cursorRequest = store.openCursor();
          
          cursorRequest.onsuccess = async (e: any) => {
            const cursor = e.target.result;
            if (cursor) {
              const mutation = cursor.value;
              const exists = await this.queue.get(mutation.id);
              if (!exists) {
                await this.queue.add(mutation);
              }
              cursor.continue();
            }
          };
        }
      };

      // Migrate from localStorage
      const legacyKeys = ['mediahive_tasks', 'mediahive_events', 'mediahive_inventory', 'currentUser'];
      for (const key of legacyKeys) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (key === 'currentUser') {
              await this.profiles.put(parsed);
            } else if (key.includes('tasks')) {
              await this.tasks.bulkPut(parsed);
            } else if (key.includes('events')) {
              await this.events.bulkPut(parsed);
            }
            localStorage.removeItem(key);
            console.log(`[OfflineDB] Migrated ${key} from localStorage`);
          } catch (e) {}
        }
      }
    } catch (error) {
      console.error('[OfflineDB] Migration failed:', error);
    }
  }
}

export const db = new MediaHiveDB();

const cacheChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('mediahive_cache_sync') : null;
const MY_TAB_ID = typeof window !== 'undefined' ? (sessionStorage.getItem('mediahive_tab_id') || Math.random().toString(36).substring(2, 11)) : 'server';
if (typeof window !== 'undefined') sessionStorage.setItem('mediahive_tab_id', MY_TAB_ID);

// Maintain the OfflineDB wrapper for backward compatibility and specialized methods
class OfflineDBWrapper {
  constructor() {
    if (cacheChannel) {
      cacheChannel.onmessage = (event) => {
        // PREVENT FEEDBACK LOOP: Ignore messages from this tab
        if (event.data.source === MY_TAB_ID) return;

        if (event.data.type === 'CACHE_INVALIDATED') {
          console.log(`[OfflineDB] Cache invalidated from another tab (${event.data.source}): ${event.data.key}`);
          // Emit a local event that hooks can listen to
          window.dispatchEvent(new CustomEvent('cache-invalidated', { detail: { key: event.data.key } }));
        }
      };
    }

    // Periodic cleanup (every 1 hour)
    if (typeof window !== 'undefined') {
      setInterval(() => this.purgeExpiredCache(), 3600000);
    }
  }

  /**
   * Remove expired cache items and old records to keep IDB lean
   */
  async purgeExpiredCache() {
    const now = Date.now();
    try {
      // 1. Explicitly expired items
      const expiredCount = await db.cache.where('expiresAt').below(now).delete();
      
      // 2. Default TTL cleanup (e.g. items older than 24h that don't have explicit expiresAt)
      // This is a bit complex in Dexie without an index on createdAt for tasks/events, 
      // but for generic cache we can add it or just rely on expiresAt.
      
      if (expiredCount > 0) {
        console.log(`[OfflineDB] Purged ${expiredCount} expired items from cache.`);
      }
    } catch (err) {
      console.warn('[OfflineDB] Cache purge failed:', err);
    }
  }

  // Mutation Queue
  async enqueue(mutation: QueuedMutation) {
    return await db.queue.put(mutation);
  }

  async getPending(limit?: number): Promise<QueuedMutation[]> {
    const query = db.queue.where('status').equals('pending');
    if (limit) {
      return await query.limit(limit).sortBy('createdAt');
    }
    return await query.sortBy('createdAt');
  }

  async resetProcessing() {
    return await db.queue.where('status').equals('processing').modify({ status: 'pending' });
  }

  async updateStatus(id: string, status: QueuedMutation['status'], error?: any) {
    const mutation = await db.queue.get(id);
    if (!mutation) return;
    
    const updates: any = { status };
    if (status === 'failed') {
      updates.retries = (mutation.retries || 0) + 1;
    }
    
    return await db.queue.update(id, updates);
  }

  async delete(id: string) {
    return await db.queue.delete(id);
  }

  async getAll(): Promise<QueuedMutation[]> {
    return await db.queue.toArray();
  }

  // Generic Cache Methods (New IDB Tables)
  async setCache(key: string, value: any, ttl?: number) {
    // 1. Table-specific caching for performance
    if (key.includes('tasks') && Array.isArray(value)) {
      await db.tasks.bulkPut(value);
    } else if (key.includes('events') && Array.isArray(value)) {
      await db.events.bulkPut(value);
    } else if (key.includes('inventory') && Array.isArray(value)) {
      await db.inventory.bulkPut(value);
    } else {
      // 2. Generic key-value cache with expiration
      const cacheItem = {
        key,
        value,
        expiresAt: ttl ? Date.now() + ttl : Date.now() + (24 * 60 * 60 * 1000) // Default 24h
      };
      await db.cache.put(cacheItem);
    }

    // Broadcast invalidation with source tagging
    if (cacheChannel) {
      cacheChannel.postMessage({ 
        type: 'CACHE_INVALIDATED', 
        key,
        source: MY_TAB_ID 
      });
    }
  }

  async getCache<T = any>(key: string): Promise<T | null> {
    // 1. Table-specific lookups
    if (key.includes('tasks')) return await db.tasks.toArray() as any;
    if (key.includes('events')) return await db.events.toArray() as any;
    if (key.includes('inventory')) return await db.inventory.toArray() as any;
    
    // 2. Generic cache lookup
    const item = await db.cache.get(key);
    if (!item) return null;
    
    // Auto-cleanup expired items
    if (item.expiresAt && item.expiresAt < Date.now()) {
      await db.cache.delete(key);
      return null;
    }
    
    return item.value as T;
  }

  async deleteCache(key: string) {
    await db.cache.delete(key);
    if (cacheChannel) {
      cacheChannel.postMessage({ 
        type: 'CACHE_INVALIDATED', 
        key,
        source: MY_TAB_ID 
      });
    }
  }

  /**
   * Specifically for updating a single record in the cache (e.g. after conflict resolution)
   */
  async updateEntityCache(table: 'tasks' | 'events' | 'inventory', id: string, data: any) {
    const tableObj = (db as any)[table];
    if (tableObj) {
      await tableObj.update(id, data);
      if (cacheChannel) {
        cacheChannel.postMessage({ 
          type: 'CACHE_INVALIDATED', 
          key: table,
          source: MY_TAB_ID 
        });
      }
    }
  }

  // Profile Cache (Crucial for offline identity)
  async saveProfile(profile: any) {
    if (!profile?.id) return;
    return await db.profiles.put(profile);
  }

  async getProfile(id: string) {
    return await db.profiles.get(id);
  }

  async getCurrentProfile() {
    return await db.profiles.toCollection().first();
  }

  /**
   * Deep Purge: Wipes everything in IndexedDB to resolve "ghost data" issues.
   * This is the last resort for sync engine or data integrity panics.
   */
  async purgeAllData() {
    console.warn('[OfflineDB] 🧨 Initiating Total Data Purge...');
    try {
      // 1. Clear all tables
      await Promise.all([
        db.tasks.clear(),
        db.events.clear(),
        db.inventory.clear(),
        db.profiles.clear(),
        db.cache.clear(),
        db.queue.clear()
      ]);
      
      console.log('[OfflineDB] ✅ Database cleared successfully.');
      
      // 2. Clear sync-related localStorage
      const syncKeys = [
        'mediahive_sync_lock',
        'mediahive_last_telemetry',
        'mediahive_sync_pending_count',
        'mediahive_last_sync_at'
      ];
      syncKeys.forEach(k => localStorage.removeItem(k));
      
      return true;
    } catch (err) {
      console.error('[OfflineDB] ❌ Purge failed:', err);
      return false;
    }
  }
}

export const offlineDB = new OfflineDBWrapper();

// Initialize migration on load
if (typeof window !== 'undefined') {
  db.migrateFromLegacy();
  offlineDB.purgeExpiredCache();
}
