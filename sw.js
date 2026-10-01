const CACHE = 'jso-offline-v30';
const CORE = ['./index.html', './style.css', './app.js', './clients.js', './quote_catalog.js', './report.js', './materials.js', './pdf-lib.min.js'];
const EXTRA = ['./', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE);
    await Promise.all(EXTRA.map(url => cache.add(url).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await Promise.all((await caches.keys()).filter(key => key.startsWith('jso-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone()).catch(() => {});
      return response;
    } catch (error) {
      return (await cache.match(request, {ignoreSearch: true})) ||
        (request.mode === 'navigate' ? await cache.match('./index.html') : undefined) ||
        Response.error();
    }
  })());
});
