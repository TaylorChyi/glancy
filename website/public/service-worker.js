const ICON_CACHE_VERSION = "v1";
const ICON_CACHE_NAME = `icon-cache-${ICON_CACHE_VERSION}`;

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.destination !== "image") {
    return;
  }

  event.respondWith(handleIconRequest(event, request));
});

async function handleIconRequest(event, request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await fetch(request);
  const responseForCache = networkResponse.clone();

  const cacheWrite = (async () => {
    try {
      const cache = await caches.open(ICON_CACHE_NAME);
      await cache.put(request, responseForCache);
    } catch (error) {
      console.warn("Failed to cache icon response", error);
    }
  })();

  event.waitUntil(cacheWrite);

  return networkResponse;
}
