const CACHE_NAME = 'volleyball-app-v1';

// Install service worker
self.addEventListener('install', event => {
  console.log('Service Worker installing');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate service worker
self.addEventListener('activate', event => {
  console.log('Service Worker activating');
  // Claim control of all pages immediately
  event.waitUntil(self.clients.claim());
});

// Fetch event - handle offline requests
self.addEventListener('fetch', event => {
  // Only handle same-origin requests (your app files)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Try to fetch from network
            return fetch(event.request)
              .then(response => {
                // Cache successful responses
                if (response.ok) {
                  cache.put(event.request, response.clone());
                }
                return response;
              })
              .catch(() => {
                // If it's a page request and we're offline, return the cached index
                if (event.request.destination === 'document') {
                  return cache.match('/') || cache.match('/index.html');
                }
                throw new Error('Offline and no cached version available');
              });
          });
      })
  );
});
