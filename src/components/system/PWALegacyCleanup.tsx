"use client";

import { useEffect } from 'react';

export function PWALegacyCleanup() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Proactively unregister legacy service workers to prevent cached page hijack
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister().then((success) => {
              if (success) console.log('[PWA] Unregistered legacy service worker');
            });
          }
        }).catch(err => console.error('[PWA] Error unregistering service workers:', err));
      }

      // 2. Clear all cache storage keys
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => {
            caches.delete(key).then(() => {
              console.log('[Cache] Purged cache key:', key);
            });
          });
        }).catch(err => console.error('[Cache] Error clearing cache storage:', err));
      }
    }
  }, []);

  return null;
}
