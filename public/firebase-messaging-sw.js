// Firebase Cloud Messaging Background Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Parse Firebase configuration dynamically from the registration query string
const params = new URL(self.location).searchParams;
const apiKey = params.get('apiKey');
const authDomain = params.get('authDomain');
const projectId = params.get('projectId');
const storageBucket = params.get('storageBucket');
const messagingSenderId = params.get('messagingSenderId');
const appId = params.get('appId');

if (apiKey && projectId) {
  firebase.initializeApp({
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId
  });

  const messaging = firebase.messaging();

  // Listen for push notifications in the background
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    if (payload.notification) {
      const notificationTitle = payload.notification.title || 'MediaHive';
      const notificationOptions = {
        body: payload.notification.body || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: payload.collapseKey || undefined,
        data: payload.data,
        actions: [
          { action: 'open', title: 'Open App' }
        ]
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    }
  });
} else {
  console.warn('[firebase-messaging-sw.js] Missing initialization parameters in registration URL.');
}

// Handle notification click events (redirect user to the dashboard or deep-link route)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const payloadData = event.notification.data || {};
  const targetRoute = payloadData.route || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus().then(() => {
            if ('navigate' in client) {
              return client.navigate(targetRoute);
            }
          });
        }
      }
      
      // Otherwise open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetRoute);
      }
    })
  );
});
