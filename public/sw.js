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
  '/manifest.webmanifest',
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
// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 0. DISABLE CACHING ON LOCALHOST
  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    return;
  }

  // 1. SAFETY FIRST: IGNORE SENSITIVE & DYNAMIC ROUTES (Network Only)
  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/login') ||
    url.pathname.startsWith('/logout') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.includes('/_next/') ||
    request.url.includes('socket.io')
  ) {
    return;
  }

  // 2. STATIC ASSETS (Cache First -> Network)
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(request).then((networkResponse) => {
            if (networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                try { cache.put(request, responseClone); } catch (e) { }
              });
            }
            return networkResponse;
          });
        })
    );
    return;
  }

  // 3. NAVIGATION REQUESTS (Network First -> Offline Fallback)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match('/offline.html');
        })
    );
    return;
  }

  return;
});

// Handle background sync for offline mutations
self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-mutations') {
    event.waitUntil(processOfflineMutations());
  }
});

// Process queued offline mutations
async function processOfflineMutations() {
  console.log('[Service Worker] Processing offline mutations');
}