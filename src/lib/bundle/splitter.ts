// src/lib/bundle/splitter.ts
// Bundle splitting utility for heavy pages

// Dynamic import cache
const importCache = new Map<string, Promise<any>>();

// Load a module dynamically with caching
export async function loadModule<T>(modulePath: string): Promise<T> {
  // Check cache first
  if (importCache.has(modulePath)) {
    return importCache.get(modulePath)!;
  }
  
  // Create import promise and cache it
  const importPromise = import(modulePath) as Promise<T>;
  importCache.set(modulePath, importPromise);
  
  return importPromise;
}

// Preload modules during idle time
export function preloadModules(modulePaths: string[]): void {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      modulePaths.forEach(path => {
        if (!importCache.has(path)) {
          const importPromise = import(path);
          importCache.set(path, importPromise);
        }
      });
    });
  } else {
    // Fallback to setTimeout
    setTimeout(() => {
      modulePaths.forEach(path => {
        if (!importCache.has(path)) {
          const importPromise = import(path);
          importCache.set(path, importPromise);
        }
      });
    }, 100);
  }
}

// Priority levels for loading
export enum LoadPriority {
  IMMEDIATE = 'immediate',
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low'
}

// Load module with priority
export async function loadModuleWithPriority<T>(
  modulePath: string,
  priority: LoadPriority = LoadPriority.NORMAL
): Promise<T> {
  switch (priority) {
    case LoadPriority.IMMEDIATE:
      return loadModule<T>(modulePath);
      
    case LoadPriority.HIGH:
      return new Promise<T>(resolve => {
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(() => {
            resolve(loadModule<T>(modulePath));
          }, { timeout: 100 });
        } else {
          setTimeout(() => {
            resolve(loadModule<T>(modulePath));
          }, 0);
        }
      });
      
    case LoadPriority.NORMAL:
      return new Promise<T>(resolve => {
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(() => {
            resolve(loadModule<T>(modulePath));
          });
        } else {
          setTimeout(() => {
            resolve(loadModule<T>(modulePath));
          }, 10);
        }
      });
      
    case LoadPriority.LOW:
      return new Promise<T>(resolve => {
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(() => {
            resolve(loadModule<T>(modulePath));
          }, { timeout: 1000 });
        } else {
          setTimeout(() => {
            resolve(loadModule<T>(modulePath));
          }, 100);
        }
      });
      
    default:
      return loadModule<T>(modulePath);
  }
}

// Prefetch module during idle time
export function prefetchModule(modulePath: string): void {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      if (!importCache.has(modulePath)) {
        const importPromise = import(modulePath);
        importCache.set(modulePath, importPromise);
      }
    }, { timeout: 5000 });
  }
}

// Clear module cache
export function clearModuleCache(modulePath?: string): void {
  if (modulePath) {
    importCache.delete(modulePath);
  } else {
    importCache.clear();
  }
}

// Get cached module if available
export function getCachedModule<T>(modulePath: string): T | null {
  if (importCache.has(modulePath)) {
    // In a real implementation, you would need to await the promise
    // For now, we'll return null to indicate it's loading
    return null;
  }
  return null;
}
