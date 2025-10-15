/**
 * 背景：
 *  - 早期以 sw.js 缩写命名的 Service Worker 入口放置在 public 根目录，导致职责不清晰且缓存策略难以演进。
 * 目的：
 *  - 提供图标等静态资源的离线缓存策略，并以语义化命名明确 Service Worker 的作用域与职责。
 * 关键决策与取舍：
 *  - 仍保留在 public 根目录以确保作用域覆盖整站；若迁移至子目录需额外配置 scope，增加部署复杂度。
 *  - 通过常量化缓存命名与版本号，便于未来扩展多策略时演进为策略模式。
 * 影响范围：
 *  - 浏览器 Service Worker 注册逻辑、静态资源缓存行为。
 * 演进与TODO：
 *  - 后续可引入 Workbox 或自定义策略集合，以策略模式支持多类型资源的缓存治理。
 */

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
