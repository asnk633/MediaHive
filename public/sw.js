// public/sw.js
// Service Worker for PWA offline-first functionality

const CACHE_NAME = 'thaiba-media-staging-v2';
const DATA_CACHE_NAME = 'thaiba-media-staging-data-v2';

// Silence logs in production
if (self.location.hostname !== 'localhost' && self.location.hostname !== '127.0.0.1') {
  console.log = () => { };
  console.warn = () => { };
  console.error = () => { };
}

// Files to cache for offline use (safe stable assets only)
// CRITICAL: Do NOT add /_next/* files here. They change every build.
const FILES_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icon.png',
  '/offline.html',
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install (v2)');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('[Service Worker] Caching app shell');
        // cache.addAll is atomic - if one fails, all fail. Use a loop for resilience.
        for (const url of FILES_TO_CACHE) {
          try {
            await cache.add(url);
          } catch (e) {
            console.warn('[Service Worker] Failed to cache:', url, e);
            // We ignore errors here so the SW still installs.
            // A missing icon is better than a broken app.
          }
        }
      })
  );

  // Activate the service worker immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate (v2)');

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

  // 0. DISABLE CACHING ON LOCALHOST (Fixes hydration mismatches)
  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    return; // Go straight to network
  }

  // 0.1. IGNORE NON-GET REQUESTS (POST, PUT, DELETE, HEAD)
  // The Cache API only supports GET requests.
  if (request.method !== 'GET') {
    return;
  }

  // 1. IGNORE Dynamic Next.js Chunks & HMR
  // These are heavy, change often, and cause "Failed to cache" errors
  if (
    url.pathname.includes('/_next/static/') ||
    url.pathname.includes('/_next/image') ||
    url.pathname.includes('webpack') ||
    request.url.includes('socket.io')
  ) {
    // Let the network handle it. Do not cache.
    return;
  }

  // 2. API Requests (Network First -> Cache Fallback)
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses (only 200 OK)
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DATA_CACHE_NAME)
              .then((cache) => {
                // Defensive put
                try {
                  cache.put(request, responseClone);
                } catch (e) {
                  // Ignore cache put failures
                }
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

              return new Response('Network error and no cache', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/plain' }
              });
            });
        })
    );
    return;
  }

  // 3. Static Assets (Cache First -> Network)
  if (
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
              // Cache valid responses
              if (response.status === 200 && response.type === 'basic') {
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    try {
                      cache.put(request, responseClone);
                    } catch (e) {
                      // Ignore
                    }
                  });
              }
              return response;
            })
            .catch((error) => {
              // For document requests, return app shell as fallback
              if (request.destination === 'document') {
                return caches.match('/')
                  .then(res => res || caches.match('/offline.html'));
              }
              // Don't throw, just fail gracefully
              return new Response('Offline', { status: 503, statusText: 'Offline' });
            });
        })
    );
    return;
  }

  // 4. Default: Network First, Cache Fallback
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