const CACHE_NAME = 'icon-cache-v1';

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) {
          return cached;
        }
        return fetch(request).then(resp => {
          const respClone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, respClone));
          return resp;
        });
      })
    );
  }
});
