// src/lib/cache/indexeddb.ts
// IndexedDB caching layer for performance improvements

// Database configuration
const DB_NAME = 'ThaibaGardenMediaManager';
const DB_VERSION = 1;
const STORE_NAME = 'cache';

// Open IndexedDB connection
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('expiresAt', 'expiresAt', { unique: false });
      }
    };
  });
}

// Cache item interface
interface CacheItem {
  key: string;
  value: any;
  expiresAt?: number; // Timestamp in milliseconds
}

// Set item in cache
export async function setCache(key: string, value: any, ttl?: number): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const cacheItem: CacheItem = {
      key,
      value,
      expiresAt: ttl ? Date.now() + ttl : undefined
    };
    
    store.put(cacheItem);
  } catch (error) {
    console.warn('Failed to set cache item:', error);
  }
}

// Get item from cache
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.get(key);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result as CacheItem | undefined;
        
        if (!result) {
          resolve(null);
          return;
        }
        
        // Check if item has expired
        if (result.expiresAt && result.expiresAt < Date.now()) {
          // Delete expired item
          const deleteTransaction = db.transaction(STORE_NAME, 'readwrite');
          const deleteStore = deleteTransaction.objectStore(STORE_NAME);
          deleteStore.delete(key);
          resolve(null);
          return;
        }
        
        resolve(result.value as T);
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to get cache item:', error);
    return null;
  }
}

// Delete item from cache
export async function deleteCache(key: string): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    store.delete(key);
  } catch (error) {
    console.warn('Failed to delete cache item:', error);
  }
}

// Clear expired items from cache
export async function clearExpiredCache(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('expiresAt');
    
    // Get all expired items
    const request = index.getAllKeys(IDBKeyRange.upperBound(Date.now()));
    
    request.onsuccess = () => {
      const keys = request.result as string[];
      keys.forEach(key => {
        store.delete(key);
      });
    };
  } catch (error) {
    console.warn('Failed to clear expired cache items:', error);
  }
}

// Clear all cache
export async function clearAllCache(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    store.clear();
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
}
