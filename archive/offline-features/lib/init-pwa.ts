// src/lib/init-pwa.ts
// Initialize PWA functionality

import { initOfflineSync } from './offline-sync';

// Initialize offline sync functionality
export function initPWA() {
  // Initialize offline sync
  initOfflineSync();
  
  // Register service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    });
  }
  
  console.log('[PWA] Initialized');
}
