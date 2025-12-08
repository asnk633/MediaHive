export function isOnline() { 
  return typeof navigator !== 'undefined' ? navigator.onLine : true; 
}

// Listen for online/offline events
export function addNetworkListener(callback: (online: boolean) => void) {
  if (typeof window !== 'undefined') {
    const handler = () => callback(navigator.onLine);
    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);
    return () => {
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', handler);
    };
  }
  return () => {};
}