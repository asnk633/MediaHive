// src/lib/cache/index.ts
// Simple in-memory cache for server-side use

const MAX_CACHE_SIZE = 1000; // Maximum number of items in cache
const CLEANUP_INTERVAL = 30 * 1000; // Every 30 seconds (more frequent cleanup)
const CLEANUP_PERCENTAGE = 0.2; // Remove 20% of items when cache is full (more aggressive)

// Add LRU tracking
interface CacheItem<T> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
  size: number; // Track item size for better memory management
}

class MemoryCache {
  private cache: Map<string, CacheItem<any>> = new Map();
  private totalSize: number = 0;
  private maxSize: number = 50 * 1024 * 1024; // 50MB limit

  constructor() {
    // Periodically clean up expired cache entries
    setInterval(() => {
      this.clearExpired();
    }, CLEANUP_INTERVAL);
  }

  // Get item from cache
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if item has expired
    if (Date.now() > item.expiresAt) {
      this.delete(key);
      return null;
    }

    // Update last accessed time for LRU
    item.lastAccessed = Date.now();
    return item.value as T;
  }

  // Set item in cache
  set<T>(key: string, value: T, ttlSeconds: number = 60): void {
    const now = Date.now();
    const expiresAt = now + ttlSeconds * 1000;
    
    // Estimate item size (simplified)
    const size = this.estimateSize(value);
    
    // If adding this item would exceed max size, evict items first
    while (this.totalSize + size > this.maxSize && this.cache.size > 0) {
      this.evictLRU();
    }
    
    // If cache is at max size, remove least recently used items
    if (this.cache.size >= MAX_CACHE_SIZE) {
      this.evictLRU();
    }
    
    // Remove existing item if it exists to update size tracking
    if (this.cache.has(key)) {
      const existingItem = this.cache.get(key)!;
      this.totalSize -= existingItem.size;
    }
    
    const item: CacheItem<T> = { 
      value, 
      expiresAt, 
      lastAccessed: now,
      size
    };
    
    this.cache.set(key, item);
    this.totalSize += size;
  }

  // Delete item from cache
  delete(key: string): void {
    const item = this.cache.get(key);
    if (item) {
      this.totalSize -= item.size;
      this.cache.delete(key);
    }
  }

  // Invalidate all items with a prefix
  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.delete(key);
      }
    }
  }

  // Clear expired items
  clearExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.delete(key);
      }
    }
  }

  // Evict least recently used items
  private evictLRU(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    const itemsToEvict = Math.ceil(entries.length * CLEANUP_PERCENTAGE);
    for (let i = 0; i < itemsToEvict; i++) {
      this.delete(entries[i][0]);
    }
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.totalSize = 0;
  }

  // Get cache size
  size(): number {
    return this.cache.size;
  }

  // Get total memory usage
  memoryUsage(): number {
    return this.totalSize;
  }

  // Estimate object size in bytes (simplified)
  private estimateSize(obj: any): number {
    if (obj === null || obj === undefined) return 0;
    
    switch (typeof obj) {
      case 'boolean':
        return 4;
      case 'number':
        return 8;
      case 'string':
        return obj.length * 2; // UTF-16
      case 'object':
        if (Array.isArray(obj)) {
          return obj.reduce((sum, item) => sum + this.estimateSize(item), 0);
        }
        return Object.keys(obj).reduce((sum, key) => {
          return sum + this.estimateSize(key) + this.estimateSize(obj[key]);
        }, 0);
      default:
        return 0;
    }
  }
}

// Export singleton instance
export const cache = new MemoryCache();
