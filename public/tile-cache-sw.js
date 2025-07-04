// Google Maps Tile Cache Service Worker
const CACHE_NAME = 'google-maps-tile-cache-v2';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Intercept network requests
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Check if it's a Google Maps tile request
    if (url.hostname.includes('googleapis.com') &&
      (url.pathname.includes('/maps/vt') ||
        url.pathname.includes('/maps/api/js') ||
        url.pathname.includes('/maps/api/staticmap'))) {

        event.respondWith(handleMapRequest(event.request));
    }
});

async function handleMapRequest(request) {
    const cache = await caches.open(CACHE_NAME);

    try {
        // Check if the request is in cache
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
            // Check if cached response has expired
            const cachedTime = cachedResponse.headers.get('sw-cached-time');
            if (cachedTime) {
                const cacheAge = Date.now() - parseInt(cachedTime);
                if (cacheAge < CACHE_DURATION) {
                    return cachedResponse;
                }
            }
        }

        // Make network request
        const networkResponse = await fetch(request);

        // Only cache successful responses
        if (networkResponse && networkResponse.status === 200) {
            // Clone the response before modifying
            const responseToCache = networkResponse.clone();

            // Create a new response with custom headers
            const modifiedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: {
                    ...Object.fromEntries(responseToCache.headers.entries()),
                    'sw-cached-time': Date.now().toString()
                }
            });

            // Cache the modified response
            cache.put(request, modifiedResponse.clone());
        }

        return networkResponse;

    } catch (error) {
        console.warn('Network request failed:', error);

        // If network fails, try to return cached response even if expired
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // If no cached response, return a basic error response
        return new Response('Network error occurred', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: {
                'Content-Type': 'text/plain'
            }
        });
    }
}

// Clean up old cache entries periodically
self.addEventListener('activate', (event) => {
    event.waitUntil(cleanupCache());
});

async function cleanupCache() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();

        const cleanupPromises = keys.map(async (request) => {
            try {
                const response = await cache.match(request);
                if (!response) return;

                const cachedTime = response.headers.get('sw-cached-time');
                if (cachedTime) {
                    const cacheAge = Date.now() - parseInt(cachedTime);

                    // Remove expired entries
                    if (cacheAge > CACHE_DURATION) {
                        await cache.delete(request);
                        console.log('Deleted expired cache entry:', request.url);
                    }
                }
            } catch (error) {
                console.warn('Error cleaning cache entry:', error);
                // Delete problematic entries
                await cache.delete(request);
            }
        });

        await Promise.all(cleanupPromises);

        // Also clean up old cache versions
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name =>
          name.startsWith('google-maps-tile-cache-') && name !== CACHE_NAME
        );

        await Promise.all(
          oldCaches.map(cacheName => caches.delete(cacheName))
        );

    } catch (error) {
        console.error('Error during cache cleanup:', error);
    }
}

// Install event - skip waiting and take control immediately
self.addEventListener('install', (event) => {
    self.skipWaiting();
    console.log('Google Maps tile cache service worker installed (v2)');
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
    event.waitUntil(
      clients.claim().then(() => {
          console.log('Google Maps tile cache service worker activated and claimed clients');
          return cleanupCache();
      })
    );
});

// Handle errors
self.addEventListener('error', (event) => {
    console.error('Service worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Service worker unhandled rejection:', event.reason);
    event.preventDefault();
});
