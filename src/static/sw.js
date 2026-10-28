const CACHE_NAME = 'iago-lanches-2-app-v5';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = event.request.url || '';
  // Nunca intercepta ntfy.sh (SSE / Poll), API Facity, tiles do Google Maps ou POSTs
  if (
    event.request.method !== 'GET' ||
    !url.startsWith(self.location.origin) ||
    url.includes('ntfy.sh') ||
    url.includes('facity.com.br') ||
    url.includes('google.com')
  ) {
    return;
  }
  event.respondWith(
    fetch(event.request, { cache: 'no-store' }).catch(() => caches.match(event.request))
  );
});
