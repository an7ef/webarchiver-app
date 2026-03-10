const CACHE_NAME = 'webarchive-v1';
const ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Handle share target (GET share)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  if (url.pathname === '/share') {
    const sharedUrl = url.searchParams.get('url') || url.searchParams.get('text') || '';
    const title = url.searchParams.get('title') || '';

    e.respondWith(
      (async () => {
        const clients = await self.clients.matchAll({ type: 'window' });
        for (const client of clients) {
          client.postMessage({ type: 'SHARED_URL', url: sharedUrl, title });
          client.focus();
        }
        // Redirect to home with params
        return Response.redirect(`/?shared=${encodeURIComponent(sharedUrl)}&title=${encodeURIComponent(title)}`, 303);
      })()
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
