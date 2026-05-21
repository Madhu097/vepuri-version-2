const CACHE_NAME = 'vepuri-full-page-cache-v1';

// Core assets to cache immediately on installation (precaching)
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './about-vepuri.html',
  './journey.html',
  './vepuri-farms.html',
  './brands.html',
  './product.html',
  './b2b-expertise.html',
  './index.css',
  './about-pages.css',
  './farms.css',
  './brands.css',
  './product.css',
  './nav-shared.css',
  './footer-shared.css',
  './typography-shared.css',
  './index.js',
  './product.js',
  './font-loader.js',
  './nav-pages.js',
  './products-config.js',
  './performance-boost.js',
  './assets/newlogo.png',
  './assets/website%20tab%20icon.png'
];

// Install Event - Precache the core application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching core assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Stale-While-Revalidate caching strategy
self.addEventListener('fetch', (event) => {
  // Only handle local GET requests (skip chrome extensions, API requests, external analytics, etc.)
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Bypass cache for large video files to avoid bloating cache storage
  if (event.request.url.includes('/assets/video/')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchedResponse = fetch(event.request)
          .then((networkResponse) => {
            // Keep a clone and save it to the cache if status is OK
            if (networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((error) => {
            console.warn('[Service Worker] Fetch failed, serving cached fallback if available:', error);
          });

        // Return cached version immediately if we have it, otherwise wait for network fetch
        return cachedResponse || fetchedResponse;
      });
    })
  );
});
