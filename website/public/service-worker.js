const ICON_CACHE_VERSION = "v1";
const ICON_CACHE_NAME = `icon-cache-${ICON_CACHE_VERSION}`;

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.destination !== "image") {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        const clonedResponse = networkResponse.clone();
        caches.open(ICON_CACHE_NAME).then((cache) => {
          cache.put(request, clonedResponse);
        });

        return networkResponse;
      });
    }),
  );
});
