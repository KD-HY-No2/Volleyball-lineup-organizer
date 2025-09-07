const CACHE_NAME = 'volleyball-app-v1';

// Install service worker
self.addEventListener('install', event => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

// Activate service worker
self.addEventListener('activate', event => {
  console.log('Service Worker activating');
  event.waitUntil(self.clients.claim());
});

// Fetch event - handle offline requests
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Only handle requests for this origin
  if (url.origin !== location.origin) {
    return;
  }
  
  event.respondWith(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              console.log('Serving from cache:', event.request.url);
              return cachedResponse;
            }
            
            // Try to fetch from network
            return fetch(event.request)
              .then(response => {
                // Cache successful responses
                if (response && response.ok) {
                  console.log('Caching:', event.request.url);
                  cache.put(event.request, response.clone());
                }
                return response;
              })
              .catch(error => {
                console.log('Network failed for:', event.request.url);
                
                // If it's a navigation request and we're offline
                if (event.request.mode === 'navigate') {
                  // Try to return cached index.html or any cached HTML file
                  return cache.match('./index.html')
                    .then(cached => {
                      if (cached) return cached;
                      return cache.match('./');
                    })
                    .then(cached => {
                      if (cached) return cached;
                      // Fallback offline page
                      return new Response(
                        '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>Volleyball App</h1><p>You are offline. Please check your internet connection.</p></body></html>',
                        { headers: { 'Content-Type': 'text/html' } }
                      );
                    });
                }
                
                throw error;
              });
          });
      })
  );
});
