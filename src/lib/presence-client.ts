// src/lib/presence-client.ts
// Client-side utilities for presence updates

/**
 * Schedule presence updates using requestIdleCallback
 * 
 * @param callback Function to call when idle
 */
export function schedulePresenceUpdate(callback: () => void) {
  // Check if Background Sync API is available
  if ('serviceWorker' in navigator && 'sync' in (navigator as any).serviceWorker) {
    // Defer to Background Sync API
    console.log('Using Background Sync API for presence updates');
    return;
  }
  
  // Fallback to requestIdleCallback
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback, { timeout: 2000 });
  } else {
    // Fallback to setTimeout for older browsers
    setTimeout(callback, 0);
  }
}
