const CACHE_NAME = 'emosense-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // We don't strictly need to cache anything to be installable in Chrome
      // but caching the main page is good practice.
      return cache.addAll(['/emo-detect.html']);
    }).catch(() => {}) // Ignore if fetch fails
  );
});

self.addEventListener('fetch', (event) => {
  // Simple pass-through fetch with a fallback to cache
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
