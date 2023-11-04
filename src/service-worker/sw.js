import './app.js';

// Tell the service worker to start using immediately
self.skipWaiting();

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
