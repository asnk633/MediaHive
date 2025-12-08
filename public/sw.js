// public/sw.js
// Service Worker for PWA offline-first functionality

const CACHE_NAME = 'thaiba-garden-media-manager-v1';
const DATA_CACHE_NAME = 'thaiba-garden-media-manager-data-v1';

// Files to cache for offline use (app shell)
const FILES_TO_CACHE = [
  '/',
  '/tasks',
  '/kanban',
  '/login',
  '/_next/static/chunks/pages/_app.js',
  '/_next/static/chunks/pages/_error.js',
  '/_next/static/chunks/main.js',
  '/_next/static/chunks/webpack.js',
  '/_next/static/css/',
  '/_next/static/media/',
  // Add other critical assets here
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(FILES_TO_CACHE);
      })
  );
  
  // Activate the service worker immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim clients to make the service worker take control immediately
  return self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // For API requests, use network-first strategy with cache fallback
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DATA_CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache when offline
          return caches.match(request)
            .then((response) => {
              if (response) {
                return response;
              }
              
              // For task and kanban routes, return app shell for offline fallback
              if (url.pathname.startsWith('/tasks') || url.pathname.startsWith('/kanban')) {
                return caches.match('/');
              }
              
              return new Response('Network error happened', {
                status: 408,
                headers: { 'Content-Type': 'text/plain' }
              });
            });
        })
    );
    return;
  }
  
  // For static assets, use cache-first strategy
  if (
    request.destination === 'document' ||
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          // Return cached version if available
          if (response) {
            return response;
          }
          
          // Otherwise fetch from network
          return fetch(request)
            .then((response) => {
              // Cache the response for future use
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return response;
            })
            .catch((error) => {
              // For document requests, return app shell as fallback
              if (request.destination === 'document') {
                return caches.match('/');
              }
              throw error;
            });
        })
    );
    return;
  }
  
  // For all other requests, try network first, then cache
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Handle background sync for offline mutations
self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-mutations') {
    event.waitUntil(processOfflineMutations());
  }
});

// Process queued offline mutations
async function processOfflineMutations() {
  // This would be implemented to process the offline queue
  // For now, we'll just log that sync was triggered
  console.log('[Service Worker] Processing offline mutations');
  
  // In a real implementation, this would:
  // 1. Retrieve queued mutations from IndexedDB
  // 2. Send them to the server
  // 3. Update local data with server responses
  // 4. Clear processed mutations from the queue
}